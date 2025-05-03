# app.py
import os
import uuid
import json
import datetime
import asyncio
from collections import defaultdict
from dotenv import load_dotenv
import os

import openai
import jsonlines
from flask import Flask, request, stream_with_context, Response, jsonify

load_dotenv()

MODEL = "gpt-4.1"
DATA_FILE = "chatlog.jsonl"

SYSTEM_PROMPT = (
    "Pretend you're a lawyer who giving advice about eviction notices in Oregon. "
    "Please give shorter answers. Please only ask one question at a time so that the user isn't confused. "
    "If the user is being evicted for non-payment of rent and they are too poor to pay the rent and you have confirmed "
    "in various ways that the notice is valid and there is a valid court hearing date, then tell them to call Oregon Law Center at 5131234567. "
    "Start off by asking me \"What are you here for?\""
)

CACHE = defaultdict(list)

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

def _ensure_context(session_id):
    if not CACHE[session_id]:
        CACHE[session_id].append({"role": "system", "content": SYSTEM_PROMPT})
        CACHE[session_id].append({"role": "assistant", "content": "What are you here for?"})
    else: 
        print("Found an already cached session:", session_id)

@app.post("/query")
def chat():
    data = request.json
    session_id = data.get("session_id") or str(uuid.uuid4())
    user_msg = data["message"]
    print("user_msg:", user_msg)
    _ensure_context(session_id)
    CACHE[session_id].append({"role": "user", "content": user_msg})

    def generate():
        print("CACHE[session_id]:", CACHE[session_id])
        resp = openai.chat.completions.create(
            model=MODEL,
            messages=CACHE[session_id],
            stream=True
        )
        assistant_chunks = []
        print("resp", resp)
        for chunk in resp:
            token = chunk.choices[0].delta.content or ""
            assistant_chunks.append(token)
            yield token

        assistant_msg = "".join(assistant_chunks)
        CACHE[session_id].append({"role": "assistant", "content": assistant_msg})
        _append_training_example(session_id, user_msg, assistant_msg)



    return Response(stream_with_context(generate()), mimetype="text/plain")

@app.get("/history/<session_id>")
def history(session_id):
    return jsonify(CACHE.get(session_id, []))

@app.post("/retrain")
def retrain():
    asyncio.create_task(_run_pipeline())
    return {"status": "started"}, 202

async def _run_pipeline():
    import subprocess
    job = subprocess.check_output(
        [
            "openai", "fine_tunes.create",
            "-t", DATA_FILE,
            "-m", MODEL,
            "--suffix", "law_chat"
        ]
    ).decode()
    job_id = json.loads(job)["id"]
    subprocess.run(["openai", "fine_tunes.follow", "-i", job_id])
    subprocess.run([
        "oaiexperiment", "run",
        "-e", "oregon_call_eval",
        "-m", job_id
    ])

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)