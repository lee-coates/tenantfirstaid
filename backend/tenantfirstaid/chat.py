import uuid
import datetime

from openai import OpenAI
import simplejson as json
import jsonlines
from flask import request, stream_with_context, Response
from flask.views import View
import os

import tiktoken
from .shared import SYSTEM_PROMPT, DATA_DIR


class ChatView(View):
    MODEL = "o3"
    DATA_FILE = DATA_DIR / "chatlog.jsonl"

    MAX_TOKENS = os.getenv("MAX_TOKENS")

    client = OpenAI()

    def __init__(self, session):
        self.session = session

    # Prompt iteration idea
    # If the user starts off by saying something unclear, start off by asking me \"What are you here for?\"

    def dispatch_request(self):
        data = request.json
        session_id = data.get("session_id") or str(uuid.uuid4())
        user_msg = data["message"]

        current_session = self.session.get(session_id)

        # Format messages for the new Responses API
        input_messages = []

        # Add conversation history (excluding system prompt)
        for msg in current_session[0:]:
            input_messages.append({"role": msg["role"], "content": msg["content"]})

        # Add current user message
        input_messages.append({"role": "user", "content": user_msg})

        # Update our cache with the user message
        current_session.append({"role": "user", "content": user_msg})

        def generate():
            try:
                # Use the new Responses API with streaming
                response_stream = self.client.responses.create(
                    model=self.MODEL,
                    input=input_messages,
                    instructions=SYSTEM_PROMPT["prompt"],
                    reasoning={"effort": "high"},
                    stream=True,
                )

                assistant_chunks = []
                for chunk in response_stream:
                    if hasattr(chunk, "text"):
                        token = chunk.text or ""
                        assistant_chunks.append(token)
                        yield token

                # Join the complete response
                assistant_msg = "".join(assistant_chunks)
                print("assistant_msg", assistant_msg)

                # Add this as a training example
                self._append_training_example(session_id, user_msg, assistant_msg)
                current_session.append({"role": "assistant", "content": assistant_msg})

            except Exception as e:
                error_msg = f"Error generating response: {e}"
                print(error_msg)
                current_session.append({"role": "assistant", "content": error_msg})
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
