'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ValidationResult, 
  ValidationIssue, 
  IssueCategoryResult,
  ComparisonResult,
  ValidationDetails,
  RagMetadata
} from '@/types';
import { 
  FiAlertCircle, 
  FiCheck, 
  FiHelpCircle, 
  FiDownload, 
  FiChevronDown, 
  FiChevronUp, 
  FiX,
  FiInfo,
  FiAlertTriangle,
  FiDatabase
} from 'react-icons/fi';
import { generateValidationReport } from './ValidationReport';

interface ValidationResultsProps {
  results: ValidationResult;
  showDownloadButton?: boolean;
  isLoading?: boolean;
  fileName: string;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ 
  results, 
  showDownloadButton = true,
  isLoading = false,
  fileName
}) => {
  const [showRagDetails, setShowRagDetails] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  // Status badge colors - refined for a more professional look
  const statusConfig = {
    valid: {
      icon: <FiCheck className="h-5 w-5" />,
      color: 'bg-emerald-100 text-emerald-800',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-200'
    },
    invalid: {
      icon: <FiAlertCircle className="h-5 w-5" />,
      color: 'bg-rose-100 text-rose-800',
      iconColor: 'text-rose-500',
      borderColor: 'border-rose-200'
    },
    uncertain: {
      icon: <FiHelpCircle className="h-5 w-5" />,
      color: 'bg-amber-100 text-amber-800',
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-200'
    },
    error: {
      icon: <FiX className="h-5 w-5" />,
      color: 'bg-rose-100 text-rose-800',
      iconColor: 'text-rose-500',
      borderColor: 'border-rose-200'
    }
  };

  // Severity styles
  const severityStyles = {
    high: 'bg-rose-100 text-rose-800 border-rose-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-sky-100 text-sky-800 border-sky-200'
  };

  // Error state
  if (!results) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-lg">
        <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-slate-900 flex items-center">
            <FiAlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Term Sheet Validation Error
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="bg-rose-50 border border-rose-200 rounded-md p-4 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-rose-800">No validation results available</h3>
                <div className="mt-2 text-sm text-rose-700">
                  <p>No validation data was returned from the server.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get status with fallbacks (either from ValidationResult or ValidationDetails)
  const validationStatus = typeof results?.status === 'string' 
    ? results.status 
    : results?.validation_details?.overall_status || 'uncertain';
  
  const status = validationStatus || 'uncertain';
  const statusDetails = statusConfig[status] || statusConfig.uncertain;
  
  // Access rag_metadata from nested validation_details with fallback
  const ragMetadata = results?.validation_details?.rag_metadata || null;

  const handleDownload = () => {
    const jsonString = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation_results_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    try {
      generateValidationReport({ validationResult: results, fileName });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      // Optionally add error handling UI here
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 animate-pulse">
        <div className="px-4 py-5 sm:px-6 bg-slate-50">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
        <div className="px-4 py-8 sm:px-6">
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-8 bg-slate-200 rounded w-2/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={resultsRef} className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 transition-all duration-300 ease-in-out hover:shadow-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-slate-50 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-slate-900 flex items-center">
          <FiInfo className="mr-2 h-5 w-5 text-indigo-500" />
          Term Sheet Validation Results
        </h3>
        <div className="flex gap-2">
          {/* {showDownloadButton && (
            // <button
            //   onClick={handleDownload}
            //   className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow"
            // >
            //   <FiDownload className="mr-1.5 h-4 w-4" />
            //   Download Results
            // </button>
          )} */}
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md text-sm leading-4 font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow"
          >
            <FiDownload className="mr-1.5 h-4 w-4" />
            Download PDF Report
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        {/* Overall Status Badge */}
        <div className="mb-6 transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border shadow-sm ${statusDetails.color} ${statusDetails.borderColor}`}>
            <span className={`mr-2 ${statusDetails.iconColor}`}>
              {statusDetails.icon}
            </span>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>
        
        {/* Summary */}
        <div className="mb-6 transition-all duration-300 ease-in-out transform hover:shadow">
          <h4 className="text-base font-medium text-slate-800 mb-2 flex items-center">
            <span className="mr-2 p-1 bg-indigo-100 rounded-full">
              <FiInfo className="h-4 w-4 text-indigo-500" />
            </span>
            Summary
          </h4>
          <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-slate-700 leading-relaxed">{results?.explanation || "No explanation available"}</p>
          </div>
        </div>

        {/* Recommendations (if available) */}
        {results?.recommendations && (
          <div className="mb-6 transition-all duration-300 ease-in-out transform hover:shadow">
            <button 
              className="w-full text-left"
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              <h4 className="text-base font-medium text-slate-800 mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-2 p-1 bg-emerald-100 rounded-full">
                    <FiCheck className="h-4 w-4 text-emerald-500" />
                  </span>
                  Recommendations
                </span>
                <span>
                  {showRecommendations ? (
                    <FiChevronUp className="h-5 w-5 text-slate-500" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 text-slate-500" />
                  )}
                </span>
              </h4>
            </button>
            {showRecommendations && (
              <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 shadow-sm animate-fade-in">
                {Array.isArray(results.recommendations) ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {results.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-slate-700">{rec}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-700 leading-relaxed">{results.recommendations}</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* RAG Metadata (if available) */}
        {ragMetadata && (
          <div className="mb-6 transition-all duration-300 ease-in-out">
            <button
              onClick={() => setShowRagDetails(!showRagDetails)}
              className="text-base font-medium text-slate-800 mb-2 flex items-center w-full justify-between hover:text-indigo-600 transition-colors duration-200"
            >
              <span className="flex items-center">
                <span className="mr-2 p-1 bg-indigo-100 rounded-full">
                  <FiDatabase className="h-4 w-4 text-indigo-500" />
                </span>
                RAG Analysis Details
              </span>
              <span>
                {showRagDetails ? (
                  <FiChevronUp className="h-5 w-5 text-slate-500" />
                ) : (
                  <FiChevronDown className="h-5 w-5 text-slate-500" />
                )}
              </span>
            </button>
            
            {showRagDetails && (
              <div className="p-4 border border-gray-200 rounded-lg bg-slate-50 shadow-sm animate-fade-in">
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-800 mb-2">Reference Document: <span className="text-slate-700">{ragMetadata.reference_sheet_id}</span></p>
                  <p className="text-sm text-slate-800 mb-2">Similarity Score</p>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                          {(ragMetadata.similarity_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${ragMetadata.similarity_score * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500 ease-in-out"></div>
                    </div>
                  </div>
                </div>
                
                {/* Field Comparison Table */}
                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-slate-100">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Field</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Extracted Value</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Reference Value</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {ragMetadata.comparison_summary.map((comparison, index) => (
                        <tr 
                          key={index} 
                          className={`transition-colors duration-150 ease-in-out hover:bg-slate-50 ${comparison.is_matched ? '' : 'bg-rose-50 bg-opacity-30'}`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{comparison.field}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                            {comparison.extracted_value !== null ? String(comparison.extracted_value) : <span className="text-slate-400 italic">Not specified</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                            {comparison.reference_value !== null ? String(comparison.reference_value) : <span className="text-slate-400 italic">Not specified</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                            {comparison.is_matched ? (
                              <FiCheck className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <FiAlertCircle className="h-5 w-5 text-rose-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Issues List */}
        {results.issues && results.issues.length > 0 && (
          <div className="transition-all duration-300 ease-in-out">
            <h4 className="text-base font-medium text-slate-800 mb-2 flex items-center">
              <span className="mr-2 p-1 bg-rose-100 rounded-full">
                <FiAlertCircle className="h-4 w-4 text-rose-500" />
              </span>
              Validation Issues
            </h4>
            <div className="space-y-3">
              {results.issues.map((issue: ValidationIssue, index: number) => (
                <div key={index} className="bg-slate-50 border border-gray-200 rounded-lg p-4 shadow-sm transition-all duration-200 ease-in-out hover:shadow">
                  <h5 className="text-sm font-medium flex items-center flex-wrap text-slate-800">
                    {issue.field && (
                      <span className="mr-2 bg-slate-200 rounded-full px-2 py-0.5 text-xs">{issue.field}</span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${severityStyles[issue.severity]}`}>
                      {issue.severity}
                    </span>
                  </h5>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">{issue.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* No Issues */}
        {(!results.issues || results.issues.length === 0) && status === 'valid' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm transition-all duration-300 ease-in-out hover:shadow">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-slate-700 leading-relaxed">
                  No issues found with this term sheet. All terms match standard practices.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationResults; 