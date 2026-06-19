'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFile, FiX, FiAlertTriangle, FiCheck, FiLoader } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { termSheetService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { extractTextFromFile } from '@/utils/textExtraction';
import { logger } from '@/utils/logger';

const TermSheetUploadForm: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<number | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [manualTextInput, setManualTextInput] = useState('');
  const [isExtractingText, setIsExtractingText] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      if (!title) {
        setTitle(acceptedFiles[0].name.split('.')[0]);
      }
      setError(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const removeFile = () => {
    setFile(null);
    setExtractionProgress(null);
  };

  const extractText = async () => {
    if (!file) {
      logger.error('Extraction attempted but no file is selected');
      return null;
    }
    
    try {
      setExtractionProgress(10);
      setIsExtractingText(true);
      logger.info(`Starting text extraction for ${file.name}`);
      
      const text = await extractTextFromFile(file);
      
      if (!text) {
        logger.error('Text extraction returned null or undefined');
        throw new Error('Text extraction failed - nothing was returned');
      }
      
      if (text.trim().length < 10) {
        logger.error(`Text extraction returned too little text: "${text}"`);
        throw new Error('Could not extract meaningful text from the file');
      }
      
      setExtractionProgress(100);
      logger.info(`Text extracted successfully, length: ${text.length}`);
      
      logger.debug(`Extracted text sample: "${text.substring(0, 100)}..."`);
      
      return text;
    } catch (err) {
      logger.error('Text extraction error:', err);
      throw err;
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a title for this term sheet');
      return;
    }
    
    if (!file && !extractedText && !manualTextInput.trim()) {
      setError('Please upload a file or provide text input');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);
    setExtractionProgress(0);
    
    let textToSubmit = '';
    
    if (manualTextInput.trim()) {
      textToSubmit = manualTextInput.trim();
    }
    
    if (extractedText && extractedText.trim()) {
      textToSubmit = textToSubmit 
        ? `${textToSubmit}\n\n--- EXTRACTED TEXT ---\n\n${extractedText.trim()}`
        : extractedText.trim();
    }
    
    try {
      if (file && !extractedText) {
        logger.info(`Extracting text from file: ${file.name} (${file.type}), size: ${file.size} bytes`);
        try {
          setExtractionProgress(10);
          const extractedContent = await extractText();
          setExtractionProgress(100);
          
          if (extractedContent && extractedContent.trim().length > 10) {
            logger.info(`Text extracted successfully, length: ${extractedContent.length} chars`);
            
            if (textToSubmit) {
              textToSubmit = `${textToSubmit}\n\n--- EXTRACTED TEXT ---\n\n${extractedContent.trim()}`;
            } else {
              textToSubmit = extractedContent.trim();
            }
            
            setExtractedText(extractedContent);
          } else {
            logger.error('Text extraction failed: extracted text is empty or too short');
            setError('Failed to extract meaningful text from the file. The file may be corrupted or empty.');
            setIsUploading(false);
            return;
          }
        } catch (err) {
          const extractErr = err as Error;
          logger.error('Text extraction error:', extractErr);
          setError(`Text extraction failed: ${extractErr.message}`);
          setIsUploading(false);
          return;
        }
      }
      
      if (!textToSubmit || textToSubmit.length === 0) {
        const errorMsg = 'No text available for upload. Please upload a file or provide text manually.';
        logger.error(errorMsg);
        setError(errorMsg);
        setIsUploading(false);
        return;
      }
      
      logger.info(`Ready to upload document: ${title.trim()}`);
      logger.info(`Text to upload: ${textToSubmit.length} characters`);
      
      const fileExt = file ? file.name.split('.').pop()?.toLowerCase() || 'txt' : 'txt';
      
      logger.debug(`Sending data to API: title=${title.trim()}, file_type=${fileExt}, text_length=${textToSubmit.length}`);
      
      const result = await termSheetService.uploadDocumentWithText({
        title: title.trim(),
        file_type: fileExt,
        extracted_text: textToSubmit
      });
      
      if (result.error) {
        logger.error('Upload failed:', result.error);
        setError(result.error);
      } else if (result.data) {
        logger.info('Upload successful, document ID:', result.data.id);
        setUploadSuccess(true);
        
        setTimeout(() => {
          if (result.data && result.data.id) {
            router.push(`/documents/${result.data.id}`);
          }
        }, 1000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Upload error:', errorMessage);
      setError(`An error occurred: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviewExtraction = async () => {
    if (!file) {
      setError('Please upload a file first');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setExtractionProgress(0);
    
    try {
      const text = await extractText();
      setExtractedText(text);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Text extraction preview error:', errorMessage);
      setError(`Text extraction failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const renderExtractedTextPreview = () => {
    if (!extractedText) return null;
    
    return (
      <div className="mt-4 p-4 border rounded-md bg-gray-50 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-black">Extracted Text Preview</h4>
          <button
            type="button"
            onClick={() => setExtractedText(null)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            Clear
          </button>
        </div>
        <div className="bg-white p-3 rounded-md border max-h-40 overflow-y-auto">
          <pre className="text-xs text-black whitespace-pre-wrap">{
            extractedText.length > 500 
              ? `${extractedText.substring(0, 500)}... (${extractedText.length - 500} more characters)`
              : extractedText
          }</pre>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium">{extractedText.length}</span> characters extracted
        </div>
      </div>
    );
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualTextInput(e.target.value);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto transition-all duration-300 ease-in-out hover:shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Term Sheet</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 p-2 border"
            placeholder="Enter document title"
          />
        </div>
        
        <div className="transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Upload File</h3>
          <div
            {...getRootProps()}
            className={`cursor-pointer border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 transition-all duration-200 ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <input {...getInputProps()} />
            <FiUploadCloud className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-600 mb-1">Drag & drop a file here, or click to select</p>
            <p className="text-xs text-gray-500">
              Supports PDF, DOCX, Images, and more (Max 10MB)
            </p>
          </div>
          
          {file && (
            <div className="mt-3 p-3 border rounded flex items-center bg-gray-50 transition-all duration-300 ease-in-out">
              <FiFile className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm text-gray-700 flex-grow">{file.name}</span>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handlePreviewExtraction}
                  disabled={isUploading || isExtractingText}
                  className="text-xs mr-2 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50"
                >
                  {isExtractingText ? (
                    <span className="flex items-center">
                      <FiLoader className="animate-spin mr-1" /> Extracting...
                    </span>
                  ) : (
                    'Extract Text'
                  )}
                </button>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-500 transition-colors duration-200"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          
          {extractionProgress !== null && extractionProgress > 0 && extractionProgress < 100 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${extractionProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Extracting text: {extractionProgress}%</p>
            </div>
          )}
          
          {renderExtractedTextPreview()}
        </div>
        
        <div className="transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Enter Text</h3>
          <textarea
            value={manualTextInput}
            onChange={handleTextInputChange}
            className="w-full h-40 p-3 border rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
            placeholder="Enter or paste term sheet text here..."
          ></textarea>
          <p className="mt-1 text-xs text-gray-500">
            {manualTextInput.length} characters entered
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded animate-fade-in transition-all duration-300 ease-in-out">
            <div className="flex items-center">
              <FiAlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {uploadSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded animate-fade-in transition-all duration-300 ease-in-out">
            <div className="flex items-center">
              <FiCheck className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm text-green-700">Upload successful! Redirecting...</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isUploading}
            className="transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <FiLoader className="animate-spin mr-2" />
                Uploading...
              </span>
            ) : (
              "Upload Term Sheet"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TermSheetUploadForm; 