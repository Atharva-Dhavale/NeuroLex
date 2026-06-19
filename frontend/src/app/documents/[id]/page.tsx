'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import StructuredTermSheet from '@/components/StructuredTermSheet';
import ValidationResults from '@/components/ValidationResults';
import { termSheetService } from '@/services/api';
import { 
  FiCheckCircle, FiClock, FiAlertCircle, FiArrowLeft, 
  FiDownload, FiFileText, FiActivity
} from 'react-icons/fi';
import { TermSheetDocument, TermSheetData, ValidationResult, ValidationDetails } from '@/types';
import { logger } from '@/utils/logger';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  // Add ref for validation results section
  const validationResultsRef = useRef<HTMLDivElement>(null);
  
  const [document, setDocument] = useState<TermSheetDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const [structuredData, setStructuredData] = useState<TermSheetData | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);

  // Scroll to validation results when they're available
  useEffect(() => {
    if (validationResults && !isValidating && validationResultsRef.current) {
      // Use a slight delay to ensure the component has rendered
      setTimeout(() => {
        validationResultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 500);
    }
  }, [validationResults, isValidating]);

  useEffect(() => {
    async function fetchDocument() {
      if (!documentId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        logger.info(`Fetching document: ${documentId}`);
        const result = await termSheetService.getDocument(documentId);
        
        if (result.error) {
          setError(result.error);
          logger.error(`Error fetching document: ${result.error}`);
        } else if (result.data) {
          setDocument(result.data);
          logger.info(`Document fetched successfully: ${result.data.title}`);
          
          // Check if document is already processed
          if (result.data.status === 'processed' || result.data.status === 'validated') {
            logger.info("Document already processed, checking for structured data");
            
            // Log the actual structured data to see what's available
            logger.debug("Raw structured data:", JSON.stringify(result.data.structured_data));
            
            if (result.data.structured_data) {
              // Make sure we're getting proper structured data
              setStructuredData(result.data.structured_data);
              logger.info("Structured data found in document");
            }
            
            if (result.data.validation_results) {
              setValidationResults(result.data.validation_results);
              logger.info("Validation results found in document");
            }
          } else if (result.data.status === 'uploaded' || result.data.status === 'extracted') {
            // Automatically process document if it's uploaded but not processed
            logger.info("Document not processed yet, initiating processing");
            // Use setTimeout to ensure state is set before processing starts
            setTimeout(() => handleProcessDocument(), 100);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to fetch document: ${errorMessage}`);
        logger.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const handleProcessDocument = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      logger.info("Starting document processing for:", documentId);
      const result = await termSheetService.processDocument(documentId);
      
      logger.debug("Process response:", JSON.stringify(result));
      
      if (result.error) {
        setError(result.error);
        logger.error("Processing error from API:", result.error);
        
        // If we have partial data even with an error, we can still use it
        if (result.data && result.data.structured_data) {
          logger.info("Got partial structured data despite error");
          setStructuredData(result.data.structured_data);
        }
      } else if (result.data) {
        logger.info("Processing successful, updating structured data");
        
        // Check if the structured data is directly in the response or nested
        const extractedData = result.data.structured_data || result.data;
        logger.debug("Extracted structured data:", JSON.stringify(extractedData));
        
        // Update the structured data
        setStructuredData(extractedData);
        
        // Reload the document to get the updated status
        const docResult = await termSheetService.getDocument(documentId);
        if (docResult.data) {
          setDocument(docResult.data);
        }
      }
      
      if (result.warning) {
        logger.warn("Processing warning:", result.warning);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`An error occurred while processing the document: ${errorMessage}`);
      logger.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidateTermSheet = async () => {
    if (!document || !structuredData) return;
    
    setIsValidating(true);
    setError(null);
    
    try {
      logger.info("Starting term sheet validation for:", documentId);
      const result = await termSheetService.validateDocument(documentId);
      
      logger.debug("Validation response:", JSON.stringify(result));
      
      if (result.error) {
        setError(result.error);
        logger.error("Validation error from API:", result.error);
      } else if (result.data) {
        // The API response structure might contain nested validation_results field
        // or the validation data might be directly in the response
        const responseData = result.data as any;
        // Get validation data with fallback
        const validationData = responseData.validation_results || responseData;
        
        logger.debug("Raw validation data:", JSON.stringify(validationData));
        
        // Create a properly structured ValidationResult object
        const formattedValidation: ValidationResult = {
          id: responseData.id,
          document_id: documentId,
          validated_at: new Date().toISOString(),
          status: validationData.overall_status || 'uncertain',
          explanation: validationData.explanation || "No explanation provided",
          recommendations: validationData.recommendations || [],
          issues: validationData.issues || [],
          validation_details: {
            overall_status: validationData.overall_status || 'uncertain',
            explanation: validationData.explanation || "No explanation provided",
            recommendations: validationData.recommendations || [],
            issues: validationData.issues || [],
            rag_metadata: validationData.rag_metadata
          }
        };
        
        logger.info("Formatted validation result:", JSON.stringify(formattedValidation));
        setValidationResults(formattedValidation);
        logger.info("Validation successful");
        
        // Reload the document to get the updated status
        const docResult = await termSheetService.getDocument(documentId);
        if (docResult.data) {
          setDocument(docResult.data);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`An error occurred while validating the term sheet: ${errorMessage}`);
      logger.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  // Get status badge based on document status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1.5 text-green-500" />
            Processed
          </span>
        );
      case 'validated':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <FiCheckCircle className="mr-1.5 text-blue-500" />
            Validated
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1.5 text-yellow-500" />
            Processing
          </span>
        );
      case 'failed':
      case 'error':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <FiAlertCircle className="mr-1.5 text-red-500" />
            Failed
          </span>
        );
      case 'uploaded':
      case 'extracted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <FiFileText className="mr-1.5 text-gray-500" />
            Ready for Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <FiClock className="mr-1.5 text-gray-500" />
            Pending
          </span>
        );
    }
  };

  const renderActionButtons = () => {
    if (!document) return null;
    
    if (document.status === 'uploaded' || document.status === 'extracted' || document.status === 'error') {
      return (
        <Button
          variant="primary"
          onClick={handleProcessDocument}
          isLoading={isProcessing}
          disabled={isProcessing}
        >
          <FiActivity className="mr-1.5" />
          Process Document
        </Button>
      );
    }
    
    if (document.status === 'processed' && !validationResults) {
      return (
        <Button
          variant="primary"
          onClick={handleValidateTermSheet}
          isLoading={isValidating}
          disabled={isValidating || !structuredData}
        >
          <FiCheckCircle className="mr-1.5" />
          Validate Term Sheet
        </Button>
      );
    }
    
    return null;
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Render error state
  if (error && !isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/documents')}
            className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <FiArrowLeft className="mr-1" />
            Back to Term Sheets
          </button>
          
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start">
            <FiAlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium">Error Loading Document</h3>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-40 animate-pulse mb-8"></div>
          <div className="space-y-8">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/documents')}
            className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <FiArrowLeft className="mr-1" />
            Back to Term Sheets
          </button>
          
          {document ? (
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
                <div className="mt-2 flex items-center space-x-4">
                  {getStatusBadge(document.status)}
                  <span className="text-sm text-gray-500">
                    Uploaded {formatDate(document.uploaded_at || document.created_at)}
                  </span>
                </div>
              </div>
              <div>
                {renderActionButtons()}
              </div>
            </div>
          ) : (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-md transform transition-all duration-300 ease-in-out">
            <p className="flex items-center">
              <FiAlertCircle className="h-5 w-5 mr-2 text-red-500" />
              {error}
            </p>
          </div>
        )}
        
        {/* Processing status */}
        {isProcessing && (
          <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-md transform transition-all duration-300 ease-in-out">
            <div className="flex items-center">
              <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-blue-800">Processing your document...</p>
            </div>
          </div>
        )}
        
        {/* Display structured data if available or processing */}
        {document && (
          <div className="space-y-8">
            {/* Show structured term sheet data when available or loading */}
            {structuredData ? (
              <StructuredTermSheet data={structuredData} isLoading={isProcessing} />
            ) : document.status === 'processing' ? (
              <StructuredTermSheet 
                data={{} as any} 
                isLoading={true} 
                showDownloadButton={false} 
              />
            ) : document.status === 'error' ? (
              <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 transition-shadow duration-300 hover:shadow-md">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <FiFileText className="mr-2 h-5 w-5 text-blue-500" />
                    Structured Term Sheet Data
                  </h3>
                </div>
                <div className="px-4 py-10 sm:p-6 text-center">
                  <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Error</h3>
                  <p className="text-gray-500 mb-4">
                    An error occurred while processing this term sheet. Please try processing again.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleProcessDocument}
                    isLoading={isProcessing}
                    disabled={isProcessing}
                  >
                    Try Processing Again
                  </Button>
                </div>
              </div>
            ) : null}
            
            {/* Show validation results when available */}
            {validationResults && (
              <div ref={validationResultsRef} className="scroll-mt-8 transition-opacity duration-500 ease-in-out">
                <ValidationResults 
                  results={validationResults} 
                  isLoading={isValidating} 
                  fileName={document?.title || `document-${documentId}`} 
                  showDownloadButton={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
} 