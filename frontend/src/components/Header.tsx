import React from 'react';
import { FiFileText } from 'react-icons/fi';

  <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
    <div className="flex-shrink-0 flex items-center">
      <div className="flex items-center">
        <FiFileText className="h-8 w-8 text-blue-500" />
        <span className="ml-2 text-xl font-bold text-black">Term Sheet Analyzer</span>
      </div>
    </div>
    <div className="hidden sm:block sm:ml-6">
      <div className="flex space-x-4">
        <a
          href="#"
          className="text-black hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
        >
          Dashboard
        </a>
        <a
          href="#"
          className="text-black hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
        >
          History
        </a>
        <a
          href="#"
          className="text-black hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
        >
          Settings
        </a>
      </div>
    </div>
  </div> 