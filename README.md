# NeuroLex: Term Sheet Analyzer

A full-stack application for analyzing and validating financial trading term sheets using AI.

## Project Overview

NeuroLex is a comprehensive tool designed to streamline the process of reviewing trading term sheets. It leverages a Large Language Model to extract, analyze, and validate key information from term sheet documents, providing structured data and validation insights to help users make informed decisions.

## Architecture

The application follows a client-server architecture:

- **Frontend**: Next.js 15 + React 19 application with TypeScript
- **Backend**: Django 4.2 REST API (DRF) with Python 3.10
- **AI Integration**: OpenRouter LLM (`openai/gpt-oss-120b:free`) for text processing, plus FAISS + SentenceTransformers RAG for validation
- **Database**: MongoDB Atlas for all application data (SQLite is used only for Django's internal auth/sessions/admin tables)

## Key Features

- Document upload and text extraction from multiple file formats (PDF, DOCX, images, TXT, Excel)
- Client-side text extraction to improve performance
- AI-powered structured data extraction (14 trading fields)
- RAG-based term sheet validation against a reference dataset
- Clear visualization of extracted data and validation results
- Downloadable PDF validation reports
- Cloud persistence via MongoDB Atlas
- Complete document management workflow

## Workflow

1. **Document Upload**
   - Users upload term sheet documents or provide extracted text directly
   - The frontend extracts text using PDF.js, Mammoth, Tesseract.js, and SheetJS
   - Text is sent to the backend and stored in MongoDB Atlas

2. **Text Processing**
   - The backend sends the text to the OpenRouter LLM with a structured prompt
   - 14 trading fields (trade_id, strike_price, option_type, etc.) are identified
   - Data is structured in standardized JSON and stored on the document record

3. **Data Validation**
   - Structured data is validated using RAG (Retrieval-Augmented Generation)
   - FAISS finds the most similar reference term sheet; a smart field-by-field comparison runs
   - The LLM produces a final judgment with issues and recommendations

4. **Results Presentation**
   - Structured data is displayed in an organized, user-friendly format
   - Validation results highlight concerns and provide recommendations
   - Users can download a PDF report

## Technical Components

### Frontend

- **Document Upload**: Drag-and-drop file uploads with validation
- **Text Extraction**: Client-side libraries extract text from various formats
- **API Service**: Axios-based `termSheetService` for backend communication
- **UI Components**: Visualizes structured data and validation results
- **Error Handling**: Robust handling for extraction, processing, and network failures

### Backend

- **REST API**: Django + DRF class-based `APIView`s for document management
- **Data Layer**: `api/mongodb.py` — a pymongo service module that is the single gateway to MongoDB Atlas
- **LLM Client**: `api/llm_client.py` — a single function wrapping the OpenRouter chat completions API
- **Text Extraction**: PyMuPDF, PDFPlumber, python-docx, and Pytesseract (server-side fallback)
- **Validation Engine**: `api/rag_service.py` — FAISS + SentenceTransformers + LLM judgment
- **Error Management**: Comprehensive error handling and logging

## API Endpoints

Base URL: `http://localhost:8000/api/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/documents/` | List all documents |
| `POST` | `/documents/` | Create a document (file or pre-extracted text) |
| `DELETE` | `/documents/` | Delete all documents |
| `DELETE` | `/documents/delete_all/` | Delete all documents (explicit) |
| `GET` | `/documents/{id}/` | Get a document by ID |
| `DELETE` | `/documents/{id}/` | Delete a document |
| `POST` | `/documents/{id}/process/` | Extract structured data via the LLM |
| `POST` | `/documents/{id}/validate/` | Validate the term sheet via RAG + LLM |

> Document IDs are MongoDB `ObjectId` strings. Interactive API docs are available at `/api-docs` in the running app.

## Key Files and Their Functions

### Frontend

- **FileUpload.tsx**: Reusable file upload component with validation
- **TermSheetUploadForm.tsx**: Main form for uploading and processing term sheets
- **TermSheetAnalyzer.tsx**: Self-contained upload → process → validate workflow component
- **textExtraction.ts**: Client-side text extraction for various file formats
- **api.ts**: API service for communication with the backend
- **StructuredTermSheet.tsx**: Displays structured term sheet data
- **ValidationResults.tsx**: Displays validation results
- **api-docs/page.tsx**: Interactive API documentation page

### Backend

- **mongodb.py**: MongoDB Atlas data access layer (pymongo)
- **llm_client.py**: OpenRouter LLM client
- **services.py**: Text extraction and structured-data processing
- **views.py**: API endpoints (class-based `APIView`s)
- **rag_service.py**: Retrieval-Augmented Generation for term sheet validation
- **urls.py**: API route definitions

## Data Flow

1. User uploads a document or provides text
2. Frontend extracts text (if a document is uploaded)
3. Text is sent to the backend and stored in MongoDB Atlas
4. Backend processes the text with the LLM to extract structured data
5. Structured data is validated against the reference dataset (RAG + LLM)
6. Results are returned to the frontend for display
7. User can download a PDF validation report

## Installation and Setup

### Prerequisites

- Node.js ≥ 18 and npm
- Python 3.10 (Django 4.2 requires ≥ 3.10)
- An OpenRouter API key
- A MongoDB Atlas connection string (database named `NeuroLex`)

### Backend Setup

```bash
cd backend
python3.10 -m pip install -r requirements.txt
python3.10 manage.py migrate        # SQLite internals only
python3.10 manage.py runserver      # http://localhost:8000
```

Or use the convenience script from the repo root: `./start_backend.sh`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev                         # http://localhost:3000
```

Or use: `./start_frontend.sh`

## Environment Variables

The backend reads `backend/.env` automatically (via `python-dotenv`). This file is gitignored — do not commit secrets.

Backend (`backend/.env`):
- `OPENROUTER_API_KEY` — OpenRouter API key
- `OPENROUTER_MODEL` — model id (default `openai/gpt-oss-120b:free`)
- `MONGO_URI` — MongoDB Atlas connection string
- `DJANGO_SECRET_KEY` — Django secret key
- `DEBUG` — `True` / `False`

Frontend:
- `NEXT_PUBLIC_API_URL` — backend API URL (default `http://localhost:8000/api`)

## Error Handling

- Client-side extraction failures are gracefully handled; users can paste text manually
- Server-side processing errors return structured partial data when possible
- LLM/API errors (including free-tier rate limits) surface as clear messages rather than crashes
- Validation issues are clearly communicated with specific recommendations
- Network errors are managed with appropriate feedback

## UI Design

NeuroLex features a minimalistic, professional UI:

- **Color Scheme**: Indigo and slate palette for a professional fintech appearance
- **Typography**: Clean, readable hierarchy
- **Components**: Consistent styling across all UI components
- **Responsive Design**: Works across device sizes
- **Interactive Elements**: Subtle animations and transitions

## Conclusion

NeuroLex provides a streamlined workflow for processing and validating trading term sheets, combining an OpenRouter-hosted LLM with a FAISS-based RAG pipeline and MongoDB Atlas persistence. The architecture keeps AI access and data access cleanly separated, making it straightforward to swap models or extend the data layer.

For full technical details, see [DOCUMENTATION.md](./DOCUMENTATION.md).
