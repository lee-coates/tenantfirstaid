from xhtml2pdf import pisa
from io import BytesIO
from flask import request
from flask_mail import Message
import os


def convert_html_to_pdf(html_content):
    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)
    if pisa_status.err:
        return None
    return pdf_buffer.getvalue()


def send_feedback(mail):
    feedback = request.form.get("feedback")
    file = request.files.get("transcript")

    if not file:
        return "No file provided", 400

    html_content = file.read().decode("utf-8")
    pdf_data = convert_html_to_pdf(html_content)
    if pdf_data is None:
        return "PDF conversion failed", 500

    msg = Message(
        subject="Feedback with Transcript",
        sender=os.getenv("MAIL_USERNAME"),
        recipients=["michael@qiu-qiulaw.com"],
        body=f"User feedback:\n\n{feedback}",
    )
    msg.attach(
        filename="transcript.pdf",
        content_type="application/pdf",
        data=pdf_data,
    )

    mail.send(msg)

    return "Email sent", 200
