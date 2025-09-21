# NeuroLex: Term Sheet Analyzer

A full-stack application for analyzing and validating term sheets using AI.

## Project Overview

NeuroLex is a comprehensive tool designed to streamline the process of reviewing investment term sheets. It leverages AI to extract, analyze, and validate key information from term sheet documents, providing structured data and validation insights to help users make informed decisions.

## Architecture

The application follows a client-server architecture:

- **Frontend**: Next.js React application with TypeScript
- **Backend**: Django REST API with Python
- **AI Integration**: Google's Gemini AI for text processing and RAG for validation

## Key Features

- Document upload and text extraction from multiple file formats (PDF, DOCX, images, TXT)
- Client-side text extraction to improve performance
- Structured data extraction from term sheets
- Term sheet validation against industry standards
- Clear visualization of extracted data and validation results
- Complete document management workflow
- **API Documentation**: Comprehensive documentation for integrating with the NeuroLex API

## Workflow

1. **Document Upload**:
   - Users upload term sheet documents or provide extracted text directly
   - Frontend extracts text from documents using various libraries (PDF.js, mammoth, Tesseract.js)
   - Text is sent to the backend for processing

2. **Text Processing**:
   - Backend extracts structured data from the term sheet text using Gemini AI
   - Key fields like company name, valuation, investment amount, etc. are identified
   - Data is structured in a standardized JSON format

3. **Data Validation**:
   - Structured term sheet data is validated using RAG (Retrieval-Augmented Generation)
   - AI compares terms against industry standards and best practices
   - Potential issues and recommendations are identified

4. **Results Presentation**:
   - Structured data is displayed in an organized, user-friendly format
   - Validation results highlight areas of concern and provide recommendations
   - Users can navigate between documents and process multiple term sheets

## Technical Components

### Frontend

- **Document Upload**: Handles file uploads with drag-and-drop functionality
- **Text Extraction**: Client-side libraries extract text from various file formats
- **API Service**: Communicates with the backend for document processing and validation
- **UI Components**: Visualizes structured data and validation results
- **Error Handling**: Robust error handling for various failure scenarios

### Backend

- **REST API**: Django-based API for document management and processing
- **Text Extraction**: Multiple extraction methods for different file types
- **AI Integration**: Google Gemini API for text processing and analysis
- **Validation Engine**: RAG-based system for term sheet validation
- **Error Management**: Comprehensive error handling and logging

## API Documentation

NeuroLex provides a comprehensive API for integrating with your own applications. The API documentation is available at `/api-docs` in the application and includes:

- **Endpoints**: Detailed information on all available API endpoints
- **Authentication**: Instructions for authenticating with the API
- **Request Examples**: Sample requests for each endpoint with curl commands
- **Response Examples**: Sample responses for each endpoint
- **Error Codes**: Comprehensive list of error codes and their meanings

### Available Endpoints

- **Documents API**: Upload, list, get, and delete term sheets
- **Extraction API**: Extract structured data from term sheets
- **Validation API**: Validate term sheets against industry standards
- **Export API**: Export term sheet data in various formats

### API Authentication

All API requests require an API key in the Authorization header. API keys can be generated from the NeuroLex dashboard.

```bash
curl -X GET https://api.neurolex.ai/api/documents \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Key Files and Their Functions

### Frontend

- **FileUpload.tsx**: Reusable file upload component with validation
- **TermSheetUploadForm.tsx**: Main form for uploading and processing term sheets
- **textExtraction.ts**: Utilities for extracting text from various file formats
- **api.ts**: API service for communication with the backend
- **StructuredTermSheet.tsx**: Component for displaying structured term sheet data
- **ValidationResults.tsx**: Component for displaying validation results
- **api-docs/page.tsx**: Interactive API documentation page

### Backend

- **services.py**: Core services for text extraction and processing
- **views.py**: API endpoints and request handling
- **rag_service.py**: Retrieval-Augmented Generation for term sheet validation

## Data Flow

1. User uploads a document or provides text
2. Frontend extracts text if a document is uploaded
3. Text is sent to the backend via the API
4. Backend processes text to extract structured data
5. Structured data is validated against industry standards
6. Results are returned to the frontend for display
7. User can validate the term sheet to get detailed recommendations

## Installation and Setup

### Prerequisites

- Node.js and npm for the frontend
- Python 3.12+ for the backend
- Django and Django REST Framework
- Google Gemini API key

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Environment Variables

Frontend:
- `NEXT_PUBLIC_API_URL`: Backend API URL

Backend:
- `GEMINI_API_KEY`: Google Gemini API key
- `SECRET_KEY`: Django secret key

## Error Handling

The application implements comprehensive error handling:

- Client-side extraction failures are gracefully handled
- Server-side processing errors return structured partial data when possible
- Validation issues are clearly communicated with specific recommendations
- Network errors are managed with appropriate feedback

## UI Design

NeuroLex features a minimalistic, professional UI design:

- **Color Scheme**: Indigo and slate color palette for a professional fintech appearance
- **Typography**: Clean, readable typography with proper hierarchy
- **Components**: Consistent styling across all UI components
- **Responsive Design**: Fully responsive on all device sizes
- **Interactive Elements**: Subtle animations and transitions for a polished feel

## Conclusion

NeuroLex provides a streamlined workflow for processing and validating term sheets, leveraging modern AI techniques to extract insights and identify potential issues. The architecture ensures a smooth user experience while handling complex document processing tasks efficiently. The comprehensive API documentation makes it easy to integrate with existing systems. 