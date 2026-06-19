import axios from 'axios';
import { 
  TermSheetDocument, 
  ExtractedTermSheet,
  ValidationResult,
  ApiResponse 
} from '@/types';
import { logger } from '@/utils/logger';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
const ENDPOINTS = {
  DOCUMENTS: 'documents/',
  DOCUMENT: (id: string) => `documents/${id}/`,
  PROCESS_DOCUMENT: (id: string) => `documents/${id}/process/`,
  VALIDATE_DOCUMENT: (id: string) => `documents/${id}/validate/`,
  DELETE_ALL_DOCUMENTS: 'documents/delete_all/',
  EXTRACTED_DATA_DETAIL: (id: string) => `extracted_data/${id}/`,
  VALIDATION_DETAIL: (id: string) => `validations/${id}/`,
};

// Handle API errors
const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    // Handle Axios errors
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error || error.message;

    if (status === 404) {
      return 'Resource not found';
    } else if (status === 400) {
      return `Bad request: ${errorMessage}`;
    } else if (status === 500) {
      return 'Server error. Please try again later.';
    } else {
      return errorMessage || 'An error occurred while communicating with the server';
    }
  }
  
  // Handle non-Axios errors
  return error.message || 'An unknown error occurred';
};

// API service
export const termSheetService = {
  // Get all documents
  getDocuments: async (): Promise<ApiResponse<TermSheetDocument[]>> => {
    try {
      logger.info('Fetching all documents');
      const response = await apiClient.get(ENDPOINTS.DOCUMENTS);
      return { data: response.data };
    } catch (error) {
      logger.error('Error fetching documents:', error);
      return { error: handleApiError(error) };
    }
  },

  // Get a document by ID
  getDocument: async (id: string): Promise<ApiResponse<TermSheetDocument>> => {
    try {
      logger.info(`Fetching document with ID: ${id}`);
      const response = await apiClient.get(ENDPOINTS.DOCUMENT(id));
      return { data: response.data };
    } catch (error) {
      logger.error(`Error fetching document ${id}:`, error);
      return { error: handleApiError(error) };
    }
  },

  // Upload a new document with file
  uploadDocument: async (formData: FormData): Promise<ApiResponse<TermSheetDocument>> => {
    try {
      logger.info(`Uploading document: ${formData.get('title')}`);
      const response = await apiClient.post(ENDPOINTS.DOCUMENTS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      logger.info(`Document uploaded successfully, ID: ${response.data.id}`);
      return { data: response.data };
    } catch (error) {
      logger.error('Error uploading document:', error);
      return { error: handleApiError(error) };
    }
  },

  // Upload a document with pre-extracted text
  uploadDocumentWithText: async (data: {
    title: string;
    file_type?: string;
    extracted_text: string;
  }): Promise<ApiResponse<TermSheetDocument>> => {
    try {
      // Validate data before sending
      if (!data.title || data.title.trim().length === 0) {
        logger.error('Upload failed: Title is required');
        return { error: "Title is required" };
      }
      
      if (!data.extracted_text) {
        logger.error('Upload failed: Extracted text is missing');
        return { error: "Extracted text is required" };
      }
      
      if (data.extracted_text.trim().length === 0) {
        logger.error('Upload failed: Extracted text is empty');
        return { error: "Extracted text cannot be empty" };
      }
      
      // Create a clean copy of the data to send
      const payload = {
        title: data.title.trim(),
        file_type: data.file_type || 'txt',
        extracted_text: data.extracted_text.trim()
      };
      
      // Log the request (but don't log the full text for privacy/performance)
      logger.info(`Uploading document with extracted text: "${payload.title}" (${payload.extracted_text.length} chars)`);
      
      // Make the API call
      const response = await apiClient.post(ENDPOINTS.DOCUMENTS, payload);
      
      logger.info(`Document uploaded successfully with extracted text, ID: ${response.data.id}`);
      return { data: response.data };
    } catch (error) {
      logger.error('Error uploading document with extracted text:', error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data;
        
        logger.error(`API error (${statusCode}): ${JSON.stringify(responseData)}`);
        
        // Try to extract detailed error information
        if (responseData && responseData.error) {
          return { error: responseData.error };
        }
      }
      
      return { error: handleApiError(error) };
    }
  },

  // Process a document to extract structured data
  processDocument: async (id: string): Promise<ApiResponse<ExtractedTermSheet>> => {
    try {
      logger.info(`Processing document: ${id}`);
      
      const response = await apiClient.post(ENDPOINTS.PROCESS_DOCUMENT(id));
      
      logger.info(`Document processed successfully, ID: ${id}`);
      
      // Handle warnings that might be present even with 200 status
      if (response.data.warning) {
        logger.warn(`Document processed with warning: ${response.data.warning}`);
        return { 
          data: response.data,
          warning: response.data.warning 
        };
      }
      
      return { data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error || error.message;
        const structuredData = error.response?.data?.structured_data;
        
        logger.error(`Document processing failed (${statusCode}): ${errorMessage}`);
        
        // For 422 errors, we might have partial structured data
        if (statusCode === 422 && structuredData) {
          logger.warn("Returning partial structured data despite processing error");
          return {
            error: errorMessage,
            data: { structured_data: structuredData }
          };
        }
        
        // For 500 errors that include structured data
        if (statusCode === 500 && structuredData) {
          logger.warn("Server error but returning available structured data");
          return {
            error: errorMessage,
            data: { structured_data: structuredData }
          };
        }
        
        // For all other errors, return proper error
        return { error: errorMessage || 'Document processing failed' };
      } else {
        logger.error(`Document processing failed with unknown error: ${String(error)}`);
        return { error: `Processing failed: ${String(error)}` };
      }
    }
  },

  // Validate a document's term sheet data
  validateDocument: async (id: string): Promise<ApiResponse<ValidationResult>> => {
    try {
      logger.info(`Validating document: ${id}`);
      const response = await apiClient.post(ENDPOINTS.VALIDATE_DOCUMENT(id));
      logger.info(`Document validated successfully, ID: ${id}`);
      return { data: response.data };
    } catch (error) {
      logger.error(`Error validating document ${id}:`, error);
      return { error: handleApiError(error) };
    }
  },

  // Get extracted data
  getExtractedData: async (id: string): Promise<ApiResponse<ExtractedTermSheet>> => {
    try {
      const response = await apiClient.get(ENDPOINTS.EXTRACTED_DATA_DETAIL(id));
      return { data: response.data };
    } catch (error) {
      return { error: handleApiError(error) };
    }
  },

  // Get validation result
  getValidationResult: async (id: string): Promise<ApiResponse<ValidationResult>> => {
    try {
      const response = await apiClient.get(ENDPOINTS.VALIDATION_DETAIL(id));
      return { data: response.data };
    } catch (error) {
      return { error: handleApiError(error) };
    }
  },

  // Delete all documents (clear history)
  deleteAllDocuments: async (): Promise<ApiResponse<{ success: boolean }>> => {
    try {
      logger.info('Deleting all documents (clearing history)');
      await apiClient.delete(ENDPOINTS.DELETE_ALL_DOCUMENTS);
      logger.info('All documents deleted successfully');
      return { data: { success: true } };
    } catch (error) {
      logger.error('Error deleting all documents:', error);
      return { error: handleApiError(error) };
    }
  },

  // Delete a specific document by ID
  deleteDocument: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    try {
      logger.info(`Deleting document with ID: ${id}`);
      await apiClient.delete(ENDPOINTS.DOCUMENT(id));
      logger.info(`Document ${id} deleted successfully`);
      return { data: { success: true } };
    } catch (error) {
      logger.error(`Error deleting document ${id}:`, error);
      return { error: handleApiError(error) };
    }
  },
};

export default termSheetService; 