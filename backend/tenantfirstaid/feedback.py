from flask import request
from flask_mail import Message
from werkzeug.utils import secure_filename
import os


def send_feedback(mail):
    feedback = request.form.get("feedback")
    file = request.files.get("transcript")

    if not file:
        return "No file provided", 400

    filename = secure_filename(file.filename)
    filepath = os.path.join("/tmp", filename)
    file.save(filepath)

    with open(filepath, "r", encoding="utf-8") as f:
        html_content = f.read()

    msg = Message(
        subject="Feedback with Transcript",
        sender=os.getenv("MAIL_USERNAME"),
        recipients=["michael@qiu-qiulaw.com"],
        body=f"User feedback:\n\n{feedback}",
    )
    msg.attach(
        filename="transcript.html",
        content_type="text/html",
        data=html_content.encode("utf-8"),
    )

    mail.send(msg)
    os.remove(filepath)

    return "Email sent", 200
