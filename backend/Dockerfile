FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files and install
COPY pyproject.toml poetry.lock* ./
RUN uv pip compile pyproject.toml -o requirements.txt && \
    uv pip install --system -r requirements.txt

# Copy source code
COPY src/ ./src/

# Set working dir to app source
WORKDIR /app/src

ENV PYTHONUNBUFFERED=1

# Launch with gunicorn and reload
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--reload", "--workers", "1"]
