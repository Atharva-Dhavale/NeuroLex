import React from 'react';
import { TermSheetData } from '@/types';
import { FiDownload, FiFileText, FiTrendingUp, FiRepeat, FiTable } from 'react-icons/fi';

interface StructuredTermSheetProps {
  data: TermSheetData;
  showDownloadButton?: boolean;
  isLoading?: boolean;
}

const StructuredTermSheet: React.FC<StructuredTermSheetProps> = ({ 
  data, 
  showDownloadButton = true,
  isLoading = false
}) => {
  // Define field groups and their fields
  const fieldGroups = [
    {
      title: 'Trading Details',
      icon: <FiTrendingUp className="text-indigo-500" />,
      fields: [
        { key: 'trade_id', label: 'Trade ID' },
        { key: 'trade_date', label: 'Trade Date' },
        { key: 'reference_spot_price', label: 'Reference Spot Price' },
        { key: 'notional_amount', label: 'Notional Amount' },
        { key: 'strike_price', label: 'Strike Price' },
        { key: 'option_type', label: 'Call/Put' },
        { key: 'position_type', label: 'Buying/Selling' },
      ]
    },
    {
      title: 'Settlement & Currency',
      icon: <FiRepeat className="text-teal-500" />,
      fields: [
        { key: 'expiry_date', label: 'Expiry Date' },
        { key: 'business_calendar', label: 'Business Calendar' },
        { key: 'delivery_date', label: 'Delivery Date' },
        { key: 'premium_rate', label: 'Premium Rate' },
        { key: 'transaction_currency', label: 'Transaction Currency (CCY)' },
        { key: 'counter_currency', label: 'Counter Currency (CCY)' },
        { key: 'underlying_currency', label: 'Underlying Currency' },
      ]
    }
  ];

  // Get all field labels and keys for CSV export
  const allFields = fieldGroups.flatMap(group => group.fields);

  // Handle download of structured data as JSON
  const handleJsonDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `term_sheet_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle download of structured data as CSV
  const handleCsvDownload = () => {
    // Create CSV header row
    const headers = allFields.map(field => field.label);
    
    // Create CSV data row
    const values = allFields.map(field => {
      const value = data[field.key];
      // Handle missing values and ensure proper CSV formatting
      if (value === null || value === undefined) return '';
      
      // Escape quotes in string values and enclose in quotes if contains comma
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      values.join(',')
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `term_sheet_data_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-slate-50 border-b border-slate-200">
          <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-8 bg-slate-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-8 md:gap-x-8 lg:grid-cols-2">
            {[1, 2].map((group) => (
              <div key={group} className="space-y-6">
                <div className="h-5 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((field) => (
                    <div key={field} className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200 transition-all duration-300 hover:shadow-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-slate-50 border-b border-slate-200">
        <h3 className="text-lg font-medium leading-6 text-slate-900 flex items-center">
          <FiFileText className="mr-2 h-5 w-5 text-indigo-500" />
          Trading Term Sheet Data
        </h3>
        {showDownloadButton && (
          <div className="flex space-x-2">
            <div className="relative group">
              <button
                onClick={handleCsvDownload}
                className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out hover:shadow hover:-translate-y-0.5"
              >
                <FiTable className="mr-1.5 h-4 w-4" />
                Download CSV
              </button>
              <div className="absolute bottom-full mb-2 right-0 transform -translate-y-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                <div className="bg-slate-800 text-white text-sm py-1 px-2 rounded shadow-lg">
                  Download as CSV for Excel or Google Sheets
                </div>
                <div className="w-2 h-2 bg-slate-800 transform rotate-45 absolute -bottom-1 right-7"></div>
              </div>
            </div>
            
            <div className="relative group">
              <button
                onClick={handleJsonDownload}
                className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out hover:shadow hover:-translate-y-0.5"
              >
                <FiDownload className="mr-1.5 h-4 w-4" />
                Download JSON
              </button>
              <div className="absolute bottom-full mb-2 right-0 transform -translate-y-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                <div className="bg-slate-800 text-white text-sm py-1 px-2 rounded shadow-lg">
                  Download as JSON for developers
                </div>
                <div className="w-2 h-2 bg-slate-800 transform rotate-45 absolute -bottom-1 right-7"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-slate-200 px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-y-8 md:gap-x-8 lg:grid-cols-2">
          {fieldGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-6 transition-all duration-300 ease-in-out hover:transform hover:translate-y-[-2px]">
              <h4 className="font-medium text-slate-900 flex items-center space-x-2">
                <span className="p-1 bg-slate-100 rounded-full">{group.icon}</span>
                <span>{group.title}</span>
              </h4>
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                {group.fields.map((field) => (
                  <div key={field.key} className="flex flex-col space-y-1 pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                    <dt className="text-sm font-medium text-slate-700">{field.label}</dt>
                    <dd className="text-sm text-slate-900 font-medium">
                      {data[field.key] !== null && data[field.key] !== undefined 
                        ? String(data[field.key]) 
                        : <span className="text-slate-400 italic font-normal">Not specified</span>}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StructuredTermSheet; 