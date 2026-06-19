'use client';

import React, { useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/FileUpload';
import { termSheetService } from '@/services/api';
import { logger } from '@/utils/logger';

interface TermSheetAnalyzerProps {
  onValidationComplete?: (results: any) => void;
}

const TermSheetAnalyzer: React.FC<TermSheetAnalyzerProps> = ({ onValidationComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [canValidate, setCanValidate] = useState(false);

  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setUploadError(null);
    setUploadStatus(null);

    try {
      // Extract text client-side first
      const { extractTextFromFile } = await import('@/utils/textExtraction');
      const extractedText = await extractTextFromFile(file);

      const result = await termSheetService.uploadDocumentWithText({
        title: file.name.split('.')[0],
        file_type: file.name.split('.').pop()?.toLowerCase() || 'txt',
        extracted_text: extractedText,
      });

      if (result.error) {
        setUploadError(result.error);
        setUploadStatus('error');
      } else if (result.data) {
        setDocumentId(result.data.id?.toString() || null);

        // Process the document
        const processResult = await termSheetService.processDocument(result.data.id!.toString());
        if (processResult.error) {
          setUploadError(processResult.error);
          setUploadStatus('error');
        } else {
          setUploadStatus('processed');
          setCanValidate(true);
          logger.info('Document processed successfully');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
      setUploadStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!documentId) return;
    setIsValidating(true);

    try {
      const result = await termSheetService.validateDocument(documentId);
      if (result.error) {
        setUploadError(result.error);
      } else if (result.data && onValidationComplete) {
        onValidationComplete(result.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const handleReset = () => {
    setIsLoading(false);
    setIsValidating(false);
    setUploadError(null);
    setUploadStatus(null);
    setDocumentId(null);
    setCanValidate(false);
  };

  return (
    <div className="flex-1 overflow-auto bg-white shadow rounded-lg">
      <div className="border-b border-gray-200">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base font-medium leading-6 text-black">Term Sheet Analyzer</h3>
          <p className="mt-1 max-w-2xl text-sm text-black">
            Upload a term sheet to extract and validate key information
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="px-4 py-5 sm:p-6">
        <FileUpload onFileSelect={handleFileSelected} error={uploadError} />

        {uploadError && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{uploadError}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Area */}
      {uploadStatus && (
        <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-black mb-2">Status</h4>
          <div className="flex items-center">
            <div className="mr-3">
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              ) : (
                <>
                  {uploadStatus === 'processed' && <FiCheckCircle className="h-5 w-5 text-green-500" />}
                  {uploadStatus === 'error' && <FiAlertCircle className="h-5 w-5 text-red-500" />}
                  {uploadStatus === 'uploaded' && <FiClock className="h-5 w-5 text-yellow-500" />}
                </>
              )}
            </div>
            <span className="text-sm text-black">
              {isLoading && 'Processing...'}
              {!isLoading && uploadStatus === 'processed' && 'Term sheet processed successfully!'}
              {!isLoading && uploadStatus === 'error' && 'Error processing term sheet.'}
              {!isLoading && uploadStatus === 'uploaded' && 'Term sheet uploaded, ready for processing.'}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between">
          <Button
            onClick={handleValidate}
            disabled={!canValidate || isLoading}
            variant="primary"
          >
            {isValidating ? (
              <>
                <div className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Validating...
              </>
            ) : (
              <>Validate Term Sheet</>
            )}
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            disabled={isLoading || isValidating}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermSheetAnalyzer;
