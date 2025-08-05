import pytest
import vertexai
from tenantfirstaid.chat import (
    ChatManager,
    DEFAULT_INSTRUCTIONS,
    OREGON_LAW_CENTER_PHONE_NUMBER,
)
from flask import Flask
from tenantfirstaid.chat import ChatView
from tenantfirstaid.session import TenantSession, TenantSessionData, InitSessionView
from vertexai.generative_models import (
    GenerativeModel,
    Tool,
)
from typing import Dict


@pytest.fixture
def mock_vertexai(mocker):
    mock_vertexai_init = mocker.Mock(spec=vertexai)
    mocker.patch("tenantfirstaid.chat.vertexai.init", return_value=mock_vertexai_init)
    return mock_vertexai_init


@pytest.fixture
def mock_vertexai_generative_model(mocker):
    mock_model = mocker.Mock(spec=GenerativeModel)
    mocker.patch("tenantfirstaid.chat.GenerativeModel", return_value=mock_model)
    return mock_model


@pytest.fixture
def chat_manager(mocker, mock_vertexai, mock_vertexai_generative_model):
    return ChatManager()


def test_prepare_developer_instructions_includes_city_state(chat_manager):
    city = "Portland"
    state = "or"
    instructions = chat_manager.prepare_developer_instructions(city, state)
    assert f"The user is in {city} {state.upper()}." in instructions


def test_default_instructions_contains_oregon_law_center_phone():
    assert OREGON_LAW_CENTER_PHONE_NUMBER in DEFAULT_INSTRUCTIONS


def test_default_instructions_contains_citation_links():
    assert "https://oregon.public.law/statutes" in DEFAULT_INSTRUCTIONS
    assert 'target="_blank"' in DEFAULT_INSTRUCTIONS


@pytest.fixture
def mock_valkey_ping_nop(mocker, monkeypatch):
    """Mock the Valkey class with the db_con.ping() method."""

    monkeypatch.setenv("DB_HOST", "8.8.8.8")
    monkeypatch.setenv("DB_PORT", "8888")
    monkeypatch.setenv("DB_PASSWORD", "test_password")
    monkeypatch.setenv("DB_USE_SSL", "false")

    mock_valkey_client = mocker.Mock()
    mocker.patch("tenantfirstaid.session.Valkey", return_value=mock_valkey_client)
    mock_valkey_client.ping = ()
    return mock_valkey_client


@pytest.fixture
def mock_valkey(mock_valkey_ping_nop, mocker):
    _data: Dict[str, str] = {}

    mock_valkey_ping_nop.set = mocker.Mock(
        side_effect=lambda key, value: _data.update({key: value})
    )

    mock_valkey_ping_nop.get = mocker.Mock(side_effect=lambda key: _data[key])

    return mock_valkey_ping_nop


@pytest.fixture
def app(mock_valkey):
    app = Flask(__name__)
    app.testing = True  # propagate exceptions to the test client
    app.secret_key = "test_secret_key"  # Set a secret key for session management

    return app


def test_chat_view_dispatch_request_streams_response(
    app, mocker, mock_vertexai_generative_model, mock_valkey
):
    """Test that sends a message to the API, mocks vertexai response, and validates output."""

    # Mock the entire RAG module components to avoid actual RAG retrieval
    mock_rag_resource = mocker.Mock()
    mock_rag_store = mocker.Mock()
    mock_retrieval = mocker.Mock()
    mock_rag_tool = mocker.Mock(spec=Tool)

    mocker.patch("tenantfirstaid.chat.rag.RagResource", return_value=mock_rag_resource)
    mocker.patch("tenantfirstaid.chat.rag.VertexRagStore", return_value=mock_rag_store)
    mocker.patch("tenantfirstaid.chat.rag.Retrieval", return_value=mock_retrieval)
    mocker.patch("tenantfirstaid.chat.Tool.from_retrieval", return_value=mock_rag_tool)

    tenant_session = TenantSession()

    app.add_url_rule(
        "/api/init",
        view_func=InitSessionView.as_view("init", tenant_session),
        methods=["POST"],
    )

    app.add_url_rule(
        "/api/query",
        view_func=ChatView.as_view("chat", tenant_session),
        methods=["POST"],
    )

    test_data_obj = TenantSessionData(
        city="Portland",
        state="or",
        messages=[],
    )

    # Initialize the session
    with app.test_request_context("/api/init", method="POST", json=test_data_obj):
        init_response = app.full_dispatch_request()
        assert init_response.status_code == 200
        session_id = init_response.json["session_id"]

    # Mock the GenerativeModel's generate_content method
    mock_response_text = "This is a mocked response about tenant rights in Oregon. You should contact <a href='https://oregon.public.law/statutes/ORS_90.427' target='_blank'>ORS 90.427</a> for more information."

    # Create a mock response object that mimics the streaming response
    mock_candidate = mocker.Mock()
    mock_candidate.content.parts = [mocker.Mock()]
    mock_candidate.content.parts[0].text = mock_response_text

    mock_event = mocker.Mock()
    mock_event.candidates = [mock_candidate]

    # Mock the generate_content method to return our mock response as a stream
    mock_vertexai_generative_model.generate_content.return_value = iter([mock_event])

    # Send a message to the chat API
    test_message = "What are my rights as a tenant in Portland?"

    with app.test_request_context(
        "/api/query", method="POST", json={"message": test_message}
    ) as chat_ctx:
        chat_ctx.session["session_id"] = session_id

        # Execute the request
        chat_response = chat_ctx.app.full_dispatch_request()

        # Verify the response
        assert chat_response.status_code == 200
        assert chat_response.mimetype == "text/plain"

        # Get the response data by consuming the stream
        response_data = "".join(
            chunk.decode("utf-8") if isinstance(chunk, bytes) else chunk
            for chunk in chat_response.response
        )
        assert response_data == mock_response_text

        # Verify that generate_content was called with correct parameters
        mock_vertexai_generative_model.generate_content.assert_called_once()
        call_args = mock_vertexai_generative_model.generate_content.call_args

        # Check that the user message was included in the call
        contents = call_args[1]["contents"]  # keyword arguments
        assert len(contents) == 1
        assert contents[0]["role"] == "user"
        assert contents[0]["parts"][0]["text"] == test_message

        # Check that streaming was enabled
        assert call_args[1]["stream"] is True

        # Verify the session was updated with both user and assistant messages
        updated_session = tenant_session.get()
        assert len(updated_session["messages"]) == 2
        assert updated_session["messages"][0]["role"] == "user"
        assert updated_session["messages"][0]["content"] == test_message
        assert updated_session["messages"][1]["role"] == "model"
        assert updated_session["messages"][1]["content"] == mock_response_text
