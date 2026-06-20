# ─── NeuroLex Backend (Django + DRF + RAG) ───────────────────────────────────
FROM python:3.10-slim-bookworm

# Prevent Python from writing .pyc files & buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/home/app/.cache/huggingface

# ─── System dependencies ─────────────────────────────────────────────────────
# tesseract-ocr  → image OCR (pytesseract)
# poppler-utils  → PDF → image conversion (pdf2image)
# libmagic1      → file type detection (python-magic)
# libgomp1       → OpenMP runtime required by torch / faiss
# build-essential→ fallback for any package needing compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    libmagic1 \
    libgomp1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ─── Non-root user ───────────────────────────────────────────────────────────
RUN useradd --create-home --uid 1000 app
WORKDIR /app

# ─── Python dependencies ─────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt \
    && pip install gunicorn==23.0.0

# ─── Application code ─────────────────────────────────────────────────────────
COPY . .

# Pre-download the SentenceTransformer model so the first request is fast.
# Also create the volume mount dirs owned by `app` so named volumes inherit
# the correct (non-root) ownership on first creation.
RUN mkdir -p /app/db /app/media \
    && python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')" \
    && chown -R app:app /app /home/app/.cache

USER app

EXPOSE 8000

COPY --chown=app:app entrypoint.sh /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
