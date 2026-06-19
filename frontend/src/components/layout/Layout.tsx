'use client';

import React from 'react';
import Navbar from './Navbar';
import { FiGithub, FiMail } from 'react-icons/fi';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="py-10 flex-grow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <footer className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} NeuroLex. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-slate-400 hover:text-indigo-500 transition-colors duration-200">
                <span className="sr-only">GitHub</span>
                <FiGithub className="h-5 w-5" />
              </a>
              <a href="mailto:contact@neurolex.ai" className="text-slate-400 hover:text-indigo-500 transition-colors duration-200">
                <span className="sr-only">Email</span>
                <FiMail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 