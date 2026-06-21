# ─── NeuroLex Backend (Django + DRF + RAG) ───────────────────────────────────
FROM python:3.10-slim-bookworm

# Prevent Python from writing .pyc files & buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# ─── System dependencies ─────────────────────────────────────────────────────
# tesseract-ocr  → image OCR (pytesseract)
# poppler-utils  → PDF → image conversion (pdf2image)
# libmagic1      → file type detection (python-magic)
# build-essential→ fallback for any package needing compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    libmagic1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ─── Non-root user ───────────────────────────────────────────────────────────
RUN useradd --create-home --uid 1000 app
WORKDIR /app

# ─── Python dependencies ─────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt \
    && pip install gunicorn==23.0.0 \
    && pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_md-3.7.1/en_core_web_md-3.7.1-py3-none-any.whl

# ─── Application code ─────────────────────────────────────────────────────────
COPY . .

# Normalize the entrypoint for cross-platform safety:
# - strip any CRLF line endings (Windows clones) so the Linux shebang works
# - guarantee the executable bit (Windows git drops it)
RUN sed -i 's/\r$//' /app/entrypoint.sh \
    && chmod +x /app/entrypoint.sh

# Create volume mount dirs owned by `app` so named volumes inherit
# the correct (non-root) ownership on first creation.
RUN mkdir -p /app/db /app/media \
    && chown -R app:app /app /home/app

USER app

EXPOSE 8000

# Invoke through `sh` so it runs even if the exec bit is somehow lost
ENTRYPOINT ["sh", "/app/entrypoint.sh"]
