'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { TermSheetDocument } from '@/types';
import { termSheetService } from '@/services/api';
import { FiFile, FiCheckCircle, FiClock, FiAlertCircle, FiUpload, FiTrash2, FiExternalLink } from 'react-icons/fi';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<TermSheetDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await termSheetService.getDocuments();
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setDocuments(result.data);
      }
    } catch (err) {
      setError('An error occurred while fetching documents');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle deleting all documents (clearing history)
  const handleDeleteAll = async () => {
    // Ask for confirmation
    if (!confirm('Are you sure you want to delete all documents? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await termSheetService.deleteAllDocuments();
      
      if (result.error) {
        setError(result.error);
      } else {
        // Refetch documents to update the list
        await fetchDocuments();
      }
    } catch (err) {
      setError('An error occurred while deleting documents');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle deleting a specific document
  const handleDeleteDocument = async (id: string) => {
    // Ask for confirmation
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    
    setDeletingId(id);
    setError(null);
    
    try {
      const result = await termSheetService.deleteDocument(id.toString());
      
      if (result.error) {
        setError(result.error);
      } else {
        // Refetch documents to update the list
        await fetchDocuments();
      }
    } catch (err) {
      setError('An error occurred while deleting the document');
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Get status icon based on document status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
      case 'validated':
        return <FiCheckCircle className="text-success-500" />;
      case 'processing':
        return <FiClock className="text-warning-500" />;
      case 'failed':
      case 'error':
        return <FiAlertCircle className="text-danger-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  // Get status text and color
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return { text: 'Processed', color: 'text-success-700 bg-success-50' };
      case 'validated':
        return { text: 'Validated', color: 'text-primary-700 bg-primary-50' };
      case 'processing':
        return { text: 'Processing', color: 'text-warning-700 bg-warning-50' };
      case 'failed':
      case 'error':
        return { text: 'Failed', color: 'text-danger-700 bg-danger-50' };
      case 'uploaded':
        return { text: 'Uploaded', color: 'text-gray-700 bg-gray-50' };
      default:
        return { text: 'Pending', color: 'text-gray-500 bg-gray-50' };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Term Sheets</h1>
            <p className="mt-2 text-gray-600">
              View and manage your uploaded term sheet documents
            </p>
          </div>
          <div className="flex gap-2">
            {documents.length > 0 && (
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting || deletingId !== null}
                className="rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-danger-700 inline-flex items-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin mr-1.5 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="mr-1.5 h-4 w-4" />
                    Delete All
                  </>
                )}
              </button>
            )}
            <Link
              href="/upload"
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 inline-flex items-center"
            >
              <FiUpload className="mr-1.5 h-4 w-4" />
              Upload New
            </Link>
          </div>
        </div>
        
        {isLoading ? (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center">
            <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-primary-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="bg-danger-50 text-danger-700 p-4 rounded-md">
            <p>{error}</p>
            <button
              className="mt-2 text-sm font-medium text-danger-800 underline"
              onClick={() => fetchDocuments()}
            >
              Try again
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center">
            <FiFile className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No term sheets found</h3>
            <p className="mt-2 text-gray-500">Get started by uploading your first term sheet.</p>
            <Link
              href="/upload"
              className="mt-6 inline-flex text-black items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <FiUpload className="mr-1.5 h-4 w-4" />
              Upload Term Sheet
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((document) => {
                  const statusDetails = getStatusDetails(document.status);
                  const isDeleting = deletingId === document.id.toString();
                  
                  return (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                            {getStatusIcon(document.status)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {document.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {document.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(document.uploaded_at || document.created_at || '')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusDetails.color}`}>
                          {statusDetails.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.file_type ? document.file_type.toUpperCase() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            href={`/documents/${document.id}`}
                            className="text-primary-600 hover:text-primary-900 flex items-center"
                          >
                            <FiExternalLink className="mr-1 h-4 w-4" />
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteDocument(document.id.toString())}
                            disabled={deletingId !== null}
                            className="text-danger-600 hover:text-danger-900 flex items-center"
                          >
                            {isDeleting ? (
                              <div className="animate-spin h-4 w-4 border-2 border-danger-600 border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <FiTrash2 className="mr-1 h-4 w-4" />
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
} 