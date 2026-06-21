<div align="center">

# 🧠 NeuroLex

### AI-Powered Financial Term Sheet Analyzer & Validator

*Turn unstructured trading term sheets into structured, validated data in seconds.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Django](https://img.shields.io/badge/Django-4.2-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.10-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 📋 Overview

**NeuroLex** is a full-stack, AI-powered platform that automates the analysis and validation of **financial trading term sheets**. It ingests documents in any common format (PDF, DOCX, images, Excel, plain text), extracts **14 standardized trading fields** using a Large Language Model, and validates the result against a reference dataset using a **Retrieval-Augmented Generation (RAG)** pipeline.

The system replaces a slow, error-prone manual review process with a fast, consistent, and auditable workflow — complete with a downloadable PDF validation report.

> **Why it matters:** Manually cross-checking term sheets against reference records is tedious and mistake-prone. NeuroLex performs field-by-field comparison with numeric tolerance, date normalization, and trading-domain synonym matching, then has an LLM produce a human-readable verdict.

---

## ✨ Key Features

- 📄 **Multi-Format Ingestion** — PDF, DOCX, images (OCR), Excel, and plain text.
- ⚡ **Client-Side Text Extraction** — PDF.js, Mammoth, and Tesseract.js extract text in the browser, offloading heavy work from the server.
- 🤖 **AI-Powered Extraction** — An OpenRouter-hosted LLM converts unstructured text into structured JSON with a 5-strategy parsing fallback for robustness.
- 🔍 **RAG-Based Validation** — FAISS vector search + spaCy word vectors find the most similar reference term sheet; a smart comparator checks each field; the LLM delivers the final judgment.
- 🎯 **Domain-Aware Matching** — Numeric tolerance (±1%), date normalization, and trading synonyms (Call/C, Buy/Long, NYSE/"New York Stock Exchange").
- 📊 **Rich Results UI** — Status badges, severity-sorted issues, field-by-field RAG comparison, and recommendations.
- 📥 **PDF Reporting** — One-click professional validation reports via jsPDF.
- ☁️ **Cloud Persistence** — All document and validation data stored in MongoDB Atlas.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend — Next.js 15 + React 19            │
│   Pages · Components · Axios API client · Client-side OCR     │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST (HTTP/JSON)
┌───────────────────────────▼─────────────────────────────────┐
│               Backend — Django 4.2 + DRF (APIView)           │
│                                                              │
│   views.py ──► services.py ──► llm_client.py ──► OpenRouter   │
│       │             │                                        │
│       │             └──► rag_service.py ──► FAISS + MiniLM    │
│       │                                                      │
│       └──► mongodb.py (pymongo) ──► MongoDB Atlas             │
└──────────────────────────────────────────────────────────────┘
```

**Design highlights**

- **Separation of concerns:** a dedicated data layer (`mongodb.py`) and a provider-agnostic LLM layer (`llm_client.py`) keep AI access and persistence cleanly isolated and swappable.
- **MongoDB-first storage:** each document is a single self-contained record holding raw text, structured data, and validation results. SQLite is retained only for Django's internal tables.
- **Stateful pipeline:** documents flow through `extracted → processed → validated`.

📖 For a deep technical dive (component breakdown, sequence diagrams, data models), see **[DOCUMENTATION.md](./DOCUMENTATION.md)**.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, TailwindCSS 4, Axios |
| **Client Extraction** | PDF.js, Mammoth, Tesseract.js, SheetJS, jsPDF |
| **Backend** | Django 4.2, Django REST Framework, Python 3.10 |
| **AI / LLM** | OpenRouter (`openai/gpt-oss-120b`) |
| **RAG** | FAISS (vector search) + spaCy (`en_core_web_md`, 300-dim GloVe vectors) |
| **Server Extraction** | PyMuPDF, PDFPlumber, python-docx, Pytesseract |
| **Database** | MongoDB Atlas (pymongo) |
| **DevOps** | python-dotenv, django-cors-headers |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** (Django 4.2 requires ≥ 3.10)
- **Node.js 18+** and npm
- A free **[OpenRouter API key](https://openrouter.ai/keys)**
- A free **[MongoDB Atlas](https://www.mongodb.com/atlas)** cluster (with a database named `NeuroLex`)

### 1. Clone

```bash
git clone https://github.com/Atharva-Dhavale/NeuroLex.git
cd NeuroLex
```

### 2. Backend

```bash
cd backend

# Configure environment
cp .env.example .env
# → edit .env and add your OPENROUTER_API_KEY and MONGO_URI

# Install dependencies
python3.10 -m pip install -r requirements.txt

# Download the spaCy language model (required for RAG embeddings)
python3.10 -m pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_md-3.7.1/en_core_web_md-3.7.1-py3-none-any.whl

# Apply Django internal migrations (SQLite: auth/sessions/admin)
python3.10 manage.py migrate

# Run the API (http://localhost:8000)
python3.10 manage.py runserver 8000
```

### 3. Frontend

```bash
cd frontend

# (optional) configure API URL
cp .env.example .env.local

npm install
npm run dev          # http://localhost:3000
```

> 💡 Convenience scripts are provided at the repo root: `./start_backend.sh` and `./start_frontend.sh`.

Open **http://localhost:3000**, upload a term sheet, and watch it get extracted and validated.

---

## 🐳 Run with Docker

The entire stack is containerized (MongoDB runs on Atlas, so no DB container is needed).

```bash
# 1. Configure backend secrets
cp backend/.env.example backend/.env
# → edit backend/.env with your OPENROUTER_API_KEY and MONGO_URI

# 2. Build and start both services
docker compose up --build
```

- Frontend → **http://localhost:3000**
- Backend API → **http://localhost:8000/api**

The backend image downloads the spaCy `en_core_web_md` model at build time and runs under Gunicorn; the frontend is built as an optimized Next.js standalone server. To run in the background use `docker compose up -d --build`, and stop with `docker compose down`.

To point the frontend at a non-local backend, set the build arg:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com/api docker compose up --build
```

### Cross-platform notes (macOS & Windows)

The Docker setup is **host-agnostic** — the containers run their own Linux Python and Node, so it does not matter whether your host uses `python3` (macOS/Linux) or `python` (Windows). The same commands work everywhere:

- **macOS (Apple Silicon / Intel):** Docker automatically builds native `arm64`/`amd64` images. No changes needed.
- **Windows:** Install **Docker Desktop with the WSL 2 backend**, then run `docker compose up --build` from PowerShell or WSL. Line endings and the entrypoint executable bit are normalized automatically (via `.gitattributes` and the Dockerfile), so the build is not affected by Windows' CRLF defaults.

> Because the app is fully containerized, Docker is the recommended way to run NeuroLex on any OS without installing Python, Node, or system libraries (tesseract, poppler) locally.

---

## 🔌 API Reference

Base URL: `http://localhost:8000/api/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/documents/` | List all documents |
| `POST` | `/documents/` | Create a document (file or pre-extracted text) |
| `DELETE` | `/documents/` | Delete all documents |
| `GET` | `/documents/{id}/` | Get a document by ID |
| `DELETE` | `/documents/{id}/` | Delete a document |
| `POST` | `/documents/{id}/process/` | Extract structured data (LLM) |
| `POST` | `/documents/{id}/validate/` | Validate the term sheet (RAG + LLM) |

**Example — full pipeline:**

```bash
# Create
curl -X POST http://localhost:8000/api/documents/ \
  -H "Content-Type: application/json" \
  -d '{"title":"FX Test","file_type":"txt","extracted_text":"Trade ID: FX20240620 ..."}'

# Process (extract 14 fields)
curl -X POST http://localhost:8000/api/documents/<id>/process/

# Validate (RAG + LLM judgment)
curl -X POST http://localhost:8000/api/documents/<id>/validate/
```

An interactive API docs page is available at `/api-docs` in the running app.

---

## 📁 Project Structure

```
NeuroLex/
├── backend/
│   ├── documents/              # Django app: document processing & validation
│   │   ├── repository.py       # MongoDB Atlas data-access layer (pymongo)
│   │   ├── llm_client.py       # OpenRouter LLM client
│   │   ├── services.py         # Text extraction + structured-data processing
│   │   ├── rag_service.py      # FAISS + spaCy word-vector RAG validation
│   │   ├── views.py            # REST API (class-based APIViews)
│   │   └── urls.py             # API routes
│   ├── config/                 # Django project config (settings, urls, wsgi, asgi)
│   ├── data/                   # Reference CSV datasets (RAG corpus)
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── app/                # Next.js App Router pages
│       ├── components/         # React components (+ layout/, ui/)
│       ├── services/           # Axios API client
│       ├── utils/              # Client-side text extraction
│       ├── config/             # API endpoint configuration
│       └── types/              # TypeScript definitions
├── docker-compose.yml
├── DOCUMENTATION.md            # Full technical documentation
├── CONTRIBUTING.md
└── LICENSE
```

---

## 🗺️ Roadmap

- [ ] User authentication & per-user document workspaces
- [ ] Batch upload and bulk validation
- [ ] Configurable reference datasets per asset class
- [ ] Dockerized deployment (compose for backend + frontend)
- [ ] Automated test suite (pytest + Jest) and CI

---

## 🤝 Contributing

Contributions are welcome! Please read **[CONTRIBUTING.md](./CONTRIBUTING.md)** for setup and PR guidelines.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## 👤 Author

**Atharva Dhavale**
[GitHub](https://github.com/Atharva-Dhavale)

---

<div align="center">
<sub>Built with Next.js, Django, MongoDB Atlas, FAISS, and OpenRouter.</sub>
</div>
