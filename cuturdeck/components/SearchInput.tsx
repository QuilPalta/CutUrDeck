import React, { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

export default function SearchInput({ wrapperClassName = '', className = '', ...props }: SearchInputProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
      <input
        type="text"
        className={`w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-500 text-gray-200 ${className}`}
        {...props}
      />
    </div>
  );
}