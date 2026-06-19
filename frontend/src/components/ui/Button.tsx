'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  // Base styles
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-all duration-200 ease-in-out';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm hover:shadow transform hover:-translate-y-0.5',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 shadow-sm hover:shadow transform hover:-translate-y-0.5',
    outline: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm hover:shadow transform hover:-translate-y-0.5',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 shadow-sm hover:shadow transform hover:-translate-y-0.5',
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };
  
  // Width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Disabled state
  const isDisabled = disabled || isLoading;
  const disabledClass = isDisabled ? 'opacity-60 cursor-not-allowed border-dashed transform-none hover:translate-y-0 hover:shadow-none' : '';
  
  // Merge all classes
  const buttonClasses = twMerge(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    disabledClass,
    className
  );
  
  return (
    <button
      type="button"
      className={buttonClasses}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button; 