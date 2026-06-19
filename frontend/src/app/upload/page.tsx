import Layout from '@/components/layout/Layout';
import TermSheetUploadForm from '@/components/TermSheetUploadForm';

export default function UploadPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Term Sheet</h1>
          <p className="mt-2 text-gray-600">
            Upload a term sheet document to extract and analyze its content. We support PDF, Word, 
            image files (JPG, PNG), and plain text files.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <TermSheetUploadForm />
        </div>
        
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h2 className="text-lg font-medium text-blue-800 mb-2">File Format Guidelines</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>
              <span className="font-medium">PDF files</span> - Clean, digitally created PDFs work best. 
              Scanned PDFs should be clear and well-lit.
            </li>
            <li>
              <span className="font-medium">Word documents</span> - Both .doc and .docx formats are supported.
            </li>
            <li>
              <span className="font-medium">Images</span> - High-resolution, well-lit images of printed term sheets.
            </li>
            <li>
              <span className="font-medium">Text files</span> - Plain text files with clear formatting.
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
} 