import uuid
import datetime
import os
from collections import defaultdict
from dotenv import load_dotenv

from openai import OpenAI
import jsonlines
from flask import Flask, request, stream_with_context, Response, jsonify

load_dotenv(override=True)
MODEL = "gpt-4o"
DATA_FILE = "chatlog.jsonl"
FEEDBACK_FILE = "feedback.jsonl"

# Ensure feedback directory exists
os.makedirs(os.path.dirname(FEEDBACK_FILE) if os.path.dirname(FEEDBACK_FILE) else ".", exist_ok=True)

# Prompt iteration idea
# If the user starts off by saying something unclear, start off by asking me \"What are you here for?\"

SYSTEM_PROMPT = (
    "Pretend you're a lawyer who giving advice about eviction notices in Oregon. "
    "Please give shorter answers. Please only ask one question at a time so that the user isn't confused. "
    "If the user is being evicted for non-payment of rent and they are too poor to pay the rent and you have confirmed "
    "in various ways that the notice is valid and there is a valid court hearing date, then tell them to call Oregon Law Center at 5131234567. "
)

# Initialize OpenAI client
client = OpenAI()

CACHE = defaultdict(list)
MESSAGE_CACHE = {}  # Store message content by session_id and message_id

app = Flask(__name__)


def _append_training_example(session_id, user_msg, assistant_msg):
    with jsonlines.open(DATA_FILE, mode="a") as f:
        f.write({
            "messages": [
                {"role": "user", "content": user_msg},
                {"role": "assistant", "content": assistant_msg}
            ],
            "metadata": {
                "session_id": session_id,
                "ts": datetime.datetime.utcnow().isoformat()
            }
        })


@app.post("/api/query")
def chat():
    data = request.json
    session_id = data.get("session_id") or str(uuid.uuid4())
    user_msg = data["message"]
    message_id = data.get("message_id") or str(uuid.uuid4())
    
    # Initialize new sessions with system prompt
    if not CACHE[session_id]:
        CACHE[session_id].append({"role": "system", "content": SYSTEM_PROMPT})
    
    # Format messages for the new Responses API
    input_messages = []
    
    # Add system prompt
    if CACHE[session_id] and CACHE[session_id][0]["role"] == "system":
        input_messages.append({
            "role": "system",
            "content": CACHE[session_id][0]["content"]
        })
    
    # Add conversation history (excluding system prompt)
    for msg in CACHE[session_id][1:]:
        input_messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    # Add current user message
    input_messages.append({
        "role": "user",
        "content": user_msg
    })
    
    # Update our cache with the user message
    CACHE[session_id].append({"role": "user", "content": user_msg})
    
    # Store user message in MESSAGE_CACHE with message_id
    if session_id not in MESSAGE_CACHE:
        MESSAGE_CACHE[session_id] = {}
    MESSAGE_CACHE[session_id][message_id] = {"role": "user", "content": user_msg}

    def generate():
        try:
            # Use the new Responses API with streaming
            response_stream = client.responses.create(
                model=MODEL,
                input=input_messages,
                # reasoning={"effort": "high"},
                stream=True
            )

            assistant_chunks = []
            for chunk in response_stream:
                if hasattr(chunk, 'text'):
                    token = chunk.text or ""
                    assistant_chunks.append(token)
                    yield token

            # Join the complete response
            assistant_msg = "".join(assistant_chunks)
            CACHE[session_id].append({"role": "assistant", "content": assistant_msg})

            # Generate a response message ID and store in cache
            response_id = str(uuid.uuid4())
            MESSAGE_CACHE[session_id][response_id] = {"role": "assistant", "content": assistant_msg}

            # Add this as a training example
            _append_training_example(session_id, user_msg, assistant_msg)
            
        except Exception as e:
            print(f"Error generating response: {e}")
            yield f"Error: {str(e)}"

    return Response(stream_with_context(generate()), mimetype="text/plain")


@app.post("/api/feedback")
def submit_feedback():
    """
    Endpoint for submitting feedback on responses with better alternatives.
    This feedback will be used in fine-tuning to improve the model.
    """
    data = request.json
    session_id = data.get("session_id")
    better_response = data.get("better_response")
    
    if not all([session_id, better_response]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Get the full conversation history for this session if it exists
    conversation_messages = []
    if session_id in CACHE:
        conversation_messages = CACHE[session_id]
    
    # If we don't have history, fall back to a basic version
    if not conversation_messages:
        # Store the feedback as a basic training example with the better response
        with jsonlines.open(FEEDBACK_FILE, mode="a") as f:
            f.write({
                "messages": [
                    {"role": "user", "content": "Unknown user message"},
                    {"role": "assistant", "content": better_response}
                ],
                "metadata": {
                    "session_id": session_id,
                    "feedback_type": "user_correction",
                    "ts": datetime.datetime.utcnow().isoformat()
                }
            })
        return jsonify({"status": "success"}), 200
    
    # Clone the conversation history to avoid modifying the cache
    training_messages = []
    for msg in conversation_messages:
        training_messages.append({"role": msg["role"], "content": msg["content"]})
    
    # Find the last assistant message and replace it with the better response
    for i in range(len(training_messages) - 1, -1, -1):
        if training_messages[i]["role"] == "assistant":
            training_messages[i]["content"] = better_response
            break
    
    # Store the feedback as a training example with the full conversation context
    with jsonlines.open(FEEDBACK_FILE, mode="a") as f:
        f.write({
            "messages": training_messages,
            "metadata": {
                "session_id": session_id,
                "feedback_type": "user_correction",
                "ts": datetime.datetime.utcnow().isoformat()
            }
        })
    
    return jsonify({"status": "success"}), 200


@app.get("/api/history/<session_id>")
def history(session_id):
    return jsonify(CACHE.get(session_id, []))


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
