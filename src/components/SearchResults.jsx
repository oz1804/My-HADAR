import React from 'react';

export default function SearchResults({ query, onBackToHome }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 mt-6 transition-colors duration-300">
      <div className="flex justify-between items-center border-b pb-4 border-gray-100 dark:border-gray-700 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          תוצאות חיפוש עבור: <span className="text-blue-600 dark:text-blue-400">"{query}"</span>
        </h2>
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
          חזור
        </button>
      </div>
      <div className="min-h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p className="text-lg">כאן יופיע מסך תוצאות החיפוש המלא, עם אפשרויות סינון מתקדמות...</p>
      </div>
    </div>
  );
}