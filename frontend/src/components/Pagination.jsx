import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex items-center justify-center space-x-2 py-8" aria-label="Pagination">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 border border-gray-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 transition font-bold"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center space-x-1">
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`w-10 h-10 rounded-xl text-sm font-bold transition ${
              currentPage === number
                ? 'bg-brand text-white shadow-md shadow-brand/10'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            aria-current={currentPage === number ? 'page' : undefined}
          >
            {number}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 border border-gray-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 transition font-bold"
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
};

export default Pagination;
