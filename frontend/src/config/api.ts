// API configuration for the application
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  // Term Sheet Documents
  DOCUMENTS: `${API_BASE_URL}/documents/`,
  DOCUMENT_DETAIL: (id: string) => `${API_BASE_URL}/documents/${id}/`,
  PROCESS_DOCUMENT: (id: string) => `${API_BASE_URL}/documents/${id}/process/`,
  VALIDATE_DOCUMENT: (id: string) => `${API_BASE_URL}/documents/${id}/validate/`,
  
  // Extracted Data
  EXTRACTED_DATA: `${API_BASE_URL}/extracted-data/`,
  EXTRACTED_DATA_DETAIL: (id: string) => `${API_BASE_URL}/extracted-data/${id}/`,
  
  // Validation Results
  VALIDATIONS: `${API_BASE_URL}/validations/`,
  VALIDATION_DETAIL: (id: string) => `${API_BASE_URL}/validations/${id}/`,
};

export default API_ENDPOINTS; 