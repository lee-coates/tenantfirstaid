import uuid
import datetime

from openai import OpenAI
import jsonlines
from flask import request, stream_with_context, Response
from flask.views import View
import os

from .shared import DEFAULT_INSTRUCTIONS, DATA_DIR

DATA_FILE = DATA_DIR / "chatlog.jsonl"

API_KEY = os.getenv("OPENAI_API_KEY", os.getenv("GITHUB_API_KEY"))
BASE_URL = os.getenv("MODEL_ENDPOINT", "https://api.openai.com/v1")
MODEL = os.getenv("MODEL_NAME", "o3")
MODEL_REASONING_EFFORT = os.getenv("MODEL_REASONING_EFFORT", "medium")


class ChatView(View):
    DATA_FILE = DATA_DIR / "chatlog.jsonl"

    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL,
    )

    def __init__(self, session):
        self.session = session

        self.VECTOR_STORE_ID = os.getenv("VECTOR_STORE_ID")
        NUM_FILE_SEARCH_RESULTS = os.getenv("NUM_FILE_SEARCH_RESULTS", 10)
        self.openai_tools_file_search = {
            "type": "file_search",
            "vector_store_ids": [self.VECTOR_STORE_ID],
            "max_num_results": NUM_FILE_SEARCH_RESULTS,
            "filters": {
                "type": "and",
                "filters": [],
            },
        }

    # Prompt iteration idea
    # If the user starts off by saying something unclear, start off by asking me \"What are you here for?\"

    def dispatch_request(self):
        data = request.json
        session_id = data.get("session_id") or str(uuid.uuid4())
        user_msg = data["message"]

        current_session = self.session.get(session_id)
        print(current_session)

        # Format messages for the new Responses API
        input_messages = []

        # Add conversation history (excluding system prompt)
        for msg in current_session["messages"][0:]:
            input_messages.append({"role": msg["role"], "content": msg["content"]})

        # Add current user message
        input_messages.append({"role": "user", "content": user_msg})

        # Update our cache with the user message
        current_session["messages"].append({"role": "user", "content": user_msg})

        # Add city and state filters if they are set
        instructions = DEFAULT_INSTRUCTIONS

        if current_session["city"] != "":
            self.openai_tools_file_search["filters"]["filters"].append(
                {"type": "eq", "key": "city", "value": current_session["city"]}
            )
            instructions += f" The user is in {current_session['city']}."

        if current_session["state"] != "":
            self.openai_tools_file_search["filters"]["filters"].append(
                {"type": "eq", "key": "state", "value": current_session["state"]}
            )
            instructions += f" The user is in the state of {current_session['state']}."

        def generate():
            try:
                # Use the new Responses API with streaming
                response_stream = self.client.responses.create(
                    model=MODEL,
                    input=input_messages,
                    instructions=instructions,
                    reasoning={"effort": MODEL_REASONING_EFFORT},
                    stream=True,
                    include=["file_search_call.results"],
                    tools=[self.openai_tools_file_search]
                    if self.VECTOR_STORE_ID
                    else None,
                )

                assistant_chunks = []
                for chunk in response_stream:
                    print(chunk)
                    if hasattr(chunk, "delta"):
                        token = chunk.delta or ""
                        assistant_chunks.append(token)
                        yield token

                # Join the complete response
                assistant_msg = "".join(assistant_chunks)
                # print("assistant_msg", assistant_msg)

                # Add this as a training example
                self._append_training_example(session_id, user_msg, assistant_msg)
                current_session["messages"].append(
                    {"role": "assistant", "content": assistant_msg}
                )

            except Exception as e:
                error_msg = f"Error generating response: {e}"
                print(error_msg)
                current_session["messages"].append(
                    {"role": "assistant", "content": error_msg}
                )
                yield f"Error: {str(e)}"

            finally:
                self.session.set(session_id, current_session)

        return Response(
            stream_with_context(generate()),
            mimetype="text/plain",
        )

    def _append_training_example(self, session_id, user_msg, assistant_msg):
        # Ensure the parent directory exists
        self.DATA_FILE.parent.mkdir(exist_ok=True)

        with jsonlines.open(self.DATA_FILE, mode="a") as f:
            f.write(
                {
                    "messages": [
                        {"role": "user", "content": user_msg},
                        {"role": "assistant", "content": assistant_msg},
                    ],
                    "metadata": {
                        "session_id": session_id,
                        "ts": datetime.datetime.utcnow().isoformat(),
                    },
                }
            )
