import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { FiUpload, FiList, FiCheckCircle, FiCpu, FiArrowRight } from 'react-icons/fi';
import Button from '@/components/ui/Button';

export default function Home() {
  // Features for the landing page
  const features = [
    {
      title: 'Upload Multiple Formats',
      description: 'Upload term sheets as PDF, Word documents, images, or plain text files. Our system can process all common file formats.',
      icon: <FiUpload className="h-6 w-6" />,
      color: 'bg-indigo-500',
    },
    {
      title: 'AI-Powered Extraction',
      description: 'Our advanced AI system extracts key information from term sheets and organizes it into a structured, standardized format.',
      icon: <FiCpu className="h-6 w-6" />,
      color: 'bg-slate-700',
    },
    {
      title: 'Validation & Verification',
      description: 'Validate term sheets against industry standards and detect potential issues or missing information with RAG technology.',
      icon: <FiCheckCircle className="h-6 w-6" />,
      color: 'bg-indigo-600',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
        <div className="py-12 px-6 lg:px-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl tracking-tight">
              NeuroLex
            </h1>
            <p className="mt-4 text-xl text-slate-600">
              Intelligent term sheet processing powered by AI
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                href="/upload"
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors duration-200"
              >
                Upload Term Sheet
              </Link>
              <Link
                href="/documents"
                className="inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors duration-200"
              >
                View Term Sheets
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-slate-900">
              How NeuroLex Works
            </h2>
            <p className="mt-2 text-slate-500 max-w-2xl mx-auto">
              Our platform streamlines the entire term sheet processing workflow
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md">
                <div className="px-5 py-5">
                  <div className="flex items-center mb-4">
                    <div className={`flex-shrink-0 ${feature.color} rounded p-2 text-white`}>
                      {feature.icon}
                    </div>
                    <h3 className="ml-3 text-base font-medium text-slate-900">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="py-16 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-slate-900">
              Processing Flow
            </h2>
            <p className="mt-2 text-slate-500 max-w-2xl mx-auto">
              A smooth, three-step process that transforms raw term sheets into structured data
            </p>
          </div>
          
          <div className="space-y-10">
            <div className="relative">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-700 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-900">Upload Term Sheet Documents</h3>
                  <p className="text-sm text-slate-500 mt-1">Upload your term sheet documents in any format - PDF, Word, Image, or Text.</p>
                </div>
              </div>
              <div className="absolute left-5 top-10 h-14 border-l border-indigo-200"></div>
            </div>
            
            <div className="relative">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-700 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-900">Extract & Structure Data</h3>
                  <p className="text-sm text-slate-500 mt-1">Our AI system extracts key information and organizes it into a structured format.</p>
                </div>
              </div>
              <div className="absolute left-5 top-10 h-14 border-l border-indigo-200"></div>
            </div>
            
            <div className="relative">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-700 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-900">Validate Term Sheet</h3>
                  <p className="text-sm text-slate-500 mt-1">Validate the extracted data against industry standards and identify potential issues.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link
              href="/api-docs"
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
            >
              Explore our API documentation
              <FiArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-slate-900">
            Ready to get started?
          </h2>
          <p className="mt-4 text-slate-500">
            Process your first term sheet in under a minute
          </p>
          <div className="mt-8">
            <Link href="/upload">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
