import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  error?: string | null;
  selectedFile?: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  onError, 
  accept = ".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt",
  maxSize = 10, // default max 10MB
  error,
  selectedFile
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    handleFiles(files);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    const maxSizeBytes = maxSize * 1024 * 1024; // Convert MB to bytes

    // Check file size
    if (file.size > maxSizeBytes) {
      const errorMsg = `File is too large. Maximum size is ${maxSize}MB.`;
      if (onError) onError(errorMsg);
      return;
    }

    // Check file type if accept is specified
    if (accept && accept.trim() !== '') {
      const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          // Check file extension
          return type === fileExtension;
        } else {
          // Check mime type
          return file.type.toLowerCase().includes(type);
        }
      });

      if (!isAccepted) {
        const errorMsg = `Invalid file type. Please upload one of these types: ${accept}`;
        if (onError) onError(errorMsg);
        return;
      }
    }

    onFileSelect(file);
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full transition-all duration-300 ease-in-out">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={accept}
        className="hidden"
        data-testid="file-input"
      />

      <div
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-300 border-dashed hover:border-blue-400 hover:bg-blue-50'
          } 
          rounded-md cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.01]`}
        onClick={handleButtonClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="drop-zone"
      >
        <div className="space-y-3 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 transition-all duration-300 ease-in-out group-hover:text-blue-500"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex flex-col items-center text-sm text-black">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              <span>Upload a file</span>
            </label>
            <p className="pl-1 text-black mt-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-600 transition-colors duration-200">
            PDF, DOCX, Images, or TXT file (max. {maxSize}MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded border-l-4 border-red-500 transition-all duration-300 ease-in-out">
          {error}
        </div>
      )}
      
      {selectedFile && (
        <div className="mt-2 text-sm flex items-center bg-gray-50 px-3 py-2 rounded border border-gray-200 transition-all duration-300 ease-in-out animate-fade-in">
          <span className="inline-block mr-2 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </span>
          <span className="text-black">Selected file: <span className="font-medium">{selectedFile.name}</span></span>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 