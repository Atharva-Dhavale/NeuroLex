'use client';

import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { 
  FiCode, 
  FiBook, 
  FiCheckCircle, 
  FiAlertCircle,
  FiChevronRight,
  FiCopy,
  FiLock,
  FiInfo
} from 'react-icons/fi';

export default function ApiDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('upload');
  const [copied, setCopied] = useState<string | null>(null);
  
  const endpoints = [
    { id: 'upload', name: 'Upload Term Sheet', method: 'POST', path: '/api/documents', category: 'Documents' },
    { id: 'list', name: 'List Term Sheets', method: 'GET', path: '/api/documents', category: 'Documents' },
    { id: 'get', name: 'Get Term Sheet', method: 'GET', path: '/api/documents/{id}', category: 'Documents' },
    { id: 'delete', name: 'Delete Term Sheet', method: 'DELETE', path: '/api/documents/{id}', category: 'Documents' },
    { id: 'extract', name: 'Extract Term Sheet Data', method: 'POST', path: '/api/documents/{id}/extract', category: 'Extraction' },
    { id: 'validate', name: 'Validate Term Sheet', method: 'POST', path: '/api/documents/{id}/validate', category: 'Validation' },
    { id: 'export', name: 'Export Term Sheet Data', method: 'GET', path: '/api/documents/{id}/export', category: 'Export' },
  ];
  
  // Group endpoints by category
  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = [];
    }
    acc[endpoint.category].push(endpoint);
    return acc;
  }, {} as Record<string, typeof endpoints>);
  
  const endpointDetails: Record<string, any> = {
    'upload': {
      description: 'Upload a new term sheet document for processing.',
      requestType: 'multipart/form-data',
      requestParams: [
        { name: 'file', type: 'File', required: true, description: 'The term sheet file to upload (PDF, DOCX, TXT, etc.)' },
        { name: 'title', type: 'string', required: true, description: 'Title for the uploaded document' },
      ],
      requestExample: `curl -X POST https://api.neurolex.ai/api/documents \\
  -H "Authorization: Bearer {api_key}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@term_sheet.pdf" \\
  -F "title=Q3 Trading Terms"`,
      responseExample: `{
  "data": {
    "id": "doc_12345",
    "title": "Q3 Trading Terms",
    "file_type": "application/pdf",
    "status": "uploaded",
    "uploaded_at": "2023-09-15T14:23:45Z",
    "created_at": "2023-09-15T14:23:45Z"
  }
}`
    },
    'list': {
      description: 'Retrieve a list of all uploaded term sheet documents.',
      requestType: 'application/json',
      requestParams: [
        { name: 'page', type: 'number', required: false, description: 'Page number for pagination' },
        { name: 'limit', type: 'number', required: false, description: 'Number of results per page' },
        { name: 'status', type: 'string', required: false, description: 'Filter by document status' },
      ],
      requestExample: `curl -X GET https://api.neurolex.ai/api/documents?page=1&limit=10 \\
  -H "Authorization: Bearer {api_key}"`,
      responseExample: `{
  "data": [
    {
      "id": "doc_12345",
      "title": "Q3 Trading Terms",
      "file_type": "application/pdf",
      "status": "completed",
      "uploaded_at": "2023-09-15T14:23:45Z"
    },
    {
      "id": "doc_12346",
      "title": "Q4 Trading Terms",
      "file_type": "application/msword",
      "status": "processing",
      "uploaded_at": "2023-09-16T10:11:12Z"
    }
  ],
  "pagination": {
    "total": 24,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}`
    },
    'get': {
      description: 'Retrieve details of a specific term sheet document.',
      requestType: 'application/json',
      pathParams: [
        { name: 'id', type: 'string', required: true, description: 'The document ID to retrieve' },
      ],
      requestExample: `curl -X GET https://api.neurolex.ai/api/documents/doc_12345 \\
  -H "Authorization: Bearer {api_key}"`,
      responseExample: `{
  "data": {
    "id": "doc_12345",
    "title": "Q3 Trading Terms",
    "file_type": "application/pdf",
    "status": "completed",
    "uploaded_at": "2023-09-15T14:23:45Z",
    "created_at": "2023-09-15T14:23:45Z",
    "updated_at": "2023-09-15T14:25:15Z",
    "extracted_text": "This Term Sheet outlines the principal terms...",
    "structured_data": {
      "trade_id": "TRD-2023-09-001",
      "trade_date": "2023-09-01",
      "reference_spot_price": "145.50",
      "notional_amount": "1,000,000.00",
      "strike_price": "150.00",
      "option_type": "Call",
      "position_type": "Buying"
    }
  }
}`
    },
    'delete': {
      description: 'Delete a specific term sheet document.',
      requestType: 'application/json',
      pathParams: [
        { name: 'id', type: 'string', required: true, description: 'The document ID to delete' },
      ],
      requestExample: `curl -X DELETE https://api.neurolex.ai/api/documents/doc_12345 \\
  -H "Authorization: Bearer {api_key}"`,
      responseExample: `{
  "data": {
    "message": "Document successfully deleted",
    "id": "doc_12345"
  }
}`
    },
    'extract': {
      description: 'Extract structured data from an uploaded term sheet document.',
      requestType: 'application/json',
      pathParams: [
        { name: 'id', type: 'string', required: true, description: 'The document ID to extract data from' },
      ],
      requestExample: `curl -X POST https://api.neurolex.ai/api/documents/doc_12345/extract \\
  -H "Authorization: Bearer {api_key}"`,
      responseExample: `{
  "data": {
    "id": "extract_67890",
    "document": "doc_12345",
    "extracted_at": "2023-09-15T14:24:30Z",
    "structured_data": {
      "trade_id": "TRD-2023-09-001",
      "trade_date": "2023-09-01",
      "reference_spot_price": "145.50",
      "notional_amount": "1,000,000.00",
      "strike_price": "150.00",
      "option_type": "Call",
      "position_type": "Buying",
      "expiry_date": "2023-12-15",
      "business_calendar": "NYSE",
      "delivery_date": "2023-12-17",
      "premium_rate": "3.5%",
      "transaction_currency": "USD",
      "counter_currency": "EUR",
      "underlying_currency": "USD"
    }
  }
}`
    },
    'validate': {
      description: 'Validate the extracted term sheet data against industry standards.',
      requestType: 'application/json',
      pathParams: [
        { name: 'id', type: 'string', required: true, description: 'The document ID to validate' },
      ],
      requestExample: `curl -X POST https://api.neurolex.ai/api/documents/doc_12345/validate \\
  -H "Authorization: Bearer {api_key}"`,
      responseExample: `{
  "data": {
    "id": "validation_54321",
    "document_id": "doc_12345",
    "validated_at": "2023-09-15T14:25:15Z",
    "status": "valid",
    "validation_score": 0.95,
    "is_valid": true,
    "explanation": "The term sheet complies with standard trading practices.",
    "recommendations": [
      "Consider adding additional settlement instructions."
    ],
    "issues": [
      {
        "field": "delivery_date",
        "severity": "low",
        "description": "Delivery date falls on a weekend. Confirm if this is intentional."
      }
    ],
    "validation_details": {
      "overall_status": "valid",
      "rag_metadata": {
        "reference_sheet_id": "ref_789",
        "similarity_score": 0.92,
        "comparison_summary": [
          {
            "field": "trade_id",
            "extracted_value": "TRD-2023-09-001",
            "reference_value": "TRD-2023-09-001",
            "is_matched": true
          }
        ]
      }
    }
  }
}`
    },
    'export': {
      description: 'Export the structured term sheet data in different formats.',
      requestType: 'application/json',
      pathParams: [
        { name: 'id', type: 'string', required: true, description: 'The document ID to export' },
      ],
      queryParams: [
        { name: 'format', type: 'string', required: false, description: 'Export format (json, csv, pdf)', defaultValue: 'json' },
      ],
      requestExample: `curl -X GET https://api.neurolex.ai/api/documents/doc_12345/export?format=csv \\
  -H "Authorization: Bearer {api_key}" \\
  -o "term_sheet_data.csv"`,
      responseExample: `Note: For CSV and PDF formats, a file will be downloaded directly.

For JSON format, the response will be:
{
  "data": {
    "trade_id": "TRD-2023-09-001",
    "trade_date": "2023-09-01",
    "reference_spot_price": "145.50",
    "notional_amount": "1,000,000.00",
    "strike_price": "150.00",
    "option_type": "Call",
    "position_type": "Buying",
    "expiry_date": "2023-12-15",
    "business_calendar": "NYSE",
    "delivery_date": "2023-12-17",
    "premium_rate": "3.5%",
    "transaction_currency": "USD",
    "counter_currency": "EUR",
    "underlying_currency": "USD"
  }
}`
    },
  };
  
  const selectedDetails = endpointDetails[selectedEndpoint];
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-emerald-500';
      case 'POST': return 'bg-indigo-500';
      case 'PUT': return 'bg-amber-500';
      case 'DELETE': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };
  
  return (
    <Layout>
      <div className="mb-8">
        <div className="px-1 py-4">
          <div className="flex items-center mb-2">
            <FiBook className="mr-2 h-5 w-5 text-indigo-500" />
            <h1 className="text-2xl font-semibold text-slate-900">API Documentation</h1>
          </div>
          <p className="text-sm text-slate-500">
            Integrate with the NeuroLex platform using our REST API
          </p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - API Endpoints */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200 sticky top-24">
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center text-sm">
                <FiCode className="mr-2 h-4 w-4 text-indigo-500" />
                <span className="font-medium text-slate-700">Endpoints</span>
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {Object.keys(groupedEndpoints).map((category) => (
                <div key={category} className="py-1">
                  <h4 className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {category}
                  </h4>
                  <div>
                    {groupedEndpoints[category].map((endpoint) => (
                      <button
                        key={endpoint.id}
                        className={`w-full px-4 py-2 text-left flex items-center justify-between text-sm hover:bg-slate-50 transition-colors duration-150 ${
                          selectedEndpoint === endpoint.id 
                            ? 'bg-indigo-50 text-indigo-700 font-medium border-l-2 border-indigo-500' 
                            : 'text-slate-700 border-l-2 border-transparent'
                        }`}
                        onClick={() => setSelectedEndpoint(endpoint.id)}
                      >
                        <span className="flex items-center">
                          <span className={`inline-flex items-center justify-center px-1.5 py-0.5 mr-2 text-xs font-medium text-white rounded ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <span className="text-xs sm:text-sm">{endpoint.name}</span>
                        </span>
                        {selectedEndpoint === endpoint.id && (
                          <FiChevronRight className="h-3 w-3 opacity-70" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content - Endpoint Details */}
        <div className="lg:w-3/4">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
            {selectedDetails && (
              <div>
                {/* Endpoint Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center px-2 py-1 mr-3 text-xs font-medium text-white rounded ${
                      getMethodColor(endpoints.find(e => e.id === selectedEndpoint)?.method || '')
                    }`}>
                      {endpoints.find(e => e.id === selectedEndpoint)?.method}
                    </span>
                    <h2 className="text-base font-semibold text-slate-800">
                      {endpoints.find(e => e.id === selectedEndpoint)?.path}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedDetails.description}
                  </p>
                </div>
                
                {/* Request Details */}
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-medium text-slate-700 mb-4">Request</h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Content Type</h4>
                    </div>
                    <div className="inline-block bg-slate-100 px-2 py-1 rounded text-xs text-slate-700 font-mono">
                      {selectedDetails.requestType}
                    </div>
                  </div>
                  
                  {/* Request Parameters */}
                  {selectedDetails.requestParams && selectedDetails.requestParams.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Request Parameters</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Required</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {selectedDetails.requestParams.map((param: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-xs font-medium text-slate-700">{param.name}</td>
                                <td className="px-3 py-2 text-xs text-slate-600 font-mono">{param.type}</td>
                                <td className="px-3 py-2 text-xs text-slate-600">
                                  {param.required ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                      Required
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                      Optional
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-600">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Path Parameters */}
                  {selectedDetails.pathParams && selectedDetails.pathParams.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Path Parameters</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Required</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {selectedDetails.pathParams.map((param: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-xs font-medium text-slate-700">{param.name}</td>
                                <td className="px-3 py-2 text-xs text-slate-600 font-mono">{param.type}</td>
                                <td className="px-3 py-2 text-xs text-slate-600">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                    Required
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-600">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Query Parameters */}
                  {selectedDetails.queryParams && selectedDetails.queryParams.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Query Parameters</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Required</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Default</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {selectedDetails.queryParams.map((param: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-xs font-medium text-slate-700">{param.name}</td>
                                <td className="px-3 py-2 text-xs text-slate-600 font-mono">{param.type}</td>
                                <td className="px-3 py-2 text-xs text-slate-600">
                                  {param.required ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                      Required
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                      Optional
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-600">{param.description}</td>
                                <td className="px-3 py-2 text-xs text-slate-600">{param.defaultValue || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Request Example */}
                  {selectedDetails.requestExample && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Request Example</h4>
                        <button 
                          onClick={() => copyToClipboard(selectedDetails.requestExample, 'request')}
                          className="text-indigo-500 hover:text-indigo-600 focus:outline-none flex items-center text-xs"
                        >
                          <FiCopy className="h-3 w-3 mr-1" />
                          {copied === 'request' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-slate-800 rounded overflow-hidden">
                        <pre className="p-3 text-xs text-slate-300 font-mono overflow-x-auto">
                          {selectedDetails.requestExample}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Response Details */}
                <div className="px-6 py-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-4">Response</h3>
                  
                  {/* Response Example */}
                  {selectedDetails.responseExample && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Response Example</h4>
                        <button 
                          onClick={() => copyToClipboard(selectedDetails.responseExample, 'response')}
                          className="text-indigo-500 hover:text-indigo-600 focus:outline-none flex items-center text-xs"
                        >
                          <FiCopy className="h-3 w-3 mr-1" />
                          {copied === 'response' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-slate-800 rounded overflow-hidden">
                        <pre className="p-3 text-xs text-slate-300 font-mono overflow-x-auto">
                          {selectedDetails.responseExample}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Authentication & Error Codes Sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center text-sm">
              <FiLock className="mr-2 h-4 w-4 text-indigo-500" />
              <span className="font-medium text-slate-700">Authentication</span>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-600 mb-3">
              All API requests require an API key in the Authorization header.
            </p>
            
            <div className="bg-slate-800 rounded overflow-hidden mb-3">
              <pre className="p-3 text-xs text-slate-300 font-mono overflow-x-auto">
                {`curl -X GET https://api.neurolex.ai/api/documents \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              </pre>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 rounded p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiInfo className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="ml-2">
                  <h4 className="text-xs font-medium text-indigo-800">API Rate Limits</h4>
                  <div className="mt-1 text-xs text-indigo-700 space-y-1">
                    <p>Free tier: 100 requests per day</p>
                    <p>Professional tier: 1,000 requests per day</p>
                    <p>Enterprise tier: Custom limits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Error Codes Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center text-sm">
              <FiAlertCircle className="mr-2 h-4 w-4 text-indigo-500" />
              <span className="font-medium text-slate-700">Error Codes</span>
            </div>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-20">Code</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Error Type</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-xs">
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">400</td>
                    <td className="px-3 py-2 text-slate-600">Bad Request</td>
                    <td className="px-3 py-2 text-slate-600">The request was invalid or cannot be served.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">401</td>
                    <td className="px-3 py-2 text-slate-600">Unauthorized</td>
                    <td className="px-3 py-2 text-slate-600">Authentication credentials were missing or invalid.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">403</td>
                    <td className="px-3 py-2 text-slate-600">Forbidden</td>
                    <td className="px-3 py-2 text-slate-600">The request is understood, but access is not allowed.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">404</td>
                    <td className="px-3 py-2 text-slate-600">Not Found</td>
                    <td className="px-3 py-2 text-slate-600">The requested resource could not be found.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">429</td>
                    <td className="px-3 py-2 text-slate-600">Too Many Requests</td>
                    <td className="px-3 py-2 text-slate-600">Request was rejected due to rate limiting.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">500</td>
                    <td className="px-3 py-2 text-slate-600">Server Error</td>
                    <td className="px-3 py-2 text-slate-600">Something went wrong on our end.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 