'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiUpload, FiList, FiHome, FiCode } from 'react-icons/fi';

const Navbar = () => {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  const navItems = [
    { path: '/', label: 'Home', icon: <FiHome className="h-5 w-5" /> },
    { path: '/upload', label: 'Upload Term Sheet', icon: <FiUpload className="h-5 w-5" /> },
    { path: '/documents', label: 'Term Sheets', icon: <FiList className="h-5 w-5" /> },
    { path: '/api-docs', label: 'API Docs', icon: <FiCode className="h-5 w-5" /> },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-shrink-0 items-center">
              <Link 
                href="/" 
                className="text-indigo-600 font-bold text-xl tracking-tight transition-colors duration-200 hover:text-indigo-700"
              >
                NeuroLex
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-200 ease-in-out ${
                    isActive(item.path)
                      ? 'border-b-2 border-indigo-500 text-slate-900'
                      : 'border-b-2 border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="space-y-1 pb-3 pt-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-4 py-2 text-base font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700'
                  : 'border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <span className="mr-3 opacity-75">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 