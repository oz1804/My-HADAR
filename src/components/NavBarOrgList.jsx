import React, { useState } from 'react';

export default function NavBarOrgList({ organizations, selectedOrgCode, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrgs = organizations.filter(org => 
    org.name.includes(searchTerm) || 
    org.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // החלפנו כאן את end-0 ב- start-0 כדי ליישר את התפריט לימין (לתחילת הקומפוננטה)
    <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 start-0 flex flex-col">
      
      <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="relative">
          <input
            type="text"
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 block p-2.5 pe-9 transition-colors placeholder:text-gray-400"
            placeholder="חיפוש ארגון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>
      </div>

      <ul className="max-h-56 overflow-y-auto">
        {filteredOrgs.length > 0 ? (
          filteredOrgs.map((org) => (
            <li key={org.id}>
              <button
                onClick={() => onSelect(org)}
                className={`w-full flex justify-between items-center px-4 py-3 text-start transition-colors ${
                  selectedOrgCode === org.code
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold border-s-4 border-blue-600 dark:border-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-s-4 border-transparent'
                }`}
              >
                <span className="text-sm">{org.name}</span>
                <span className={`text-xs px-2 py-1 rounded-md font-mono ${
                  selectedOrgCode === org.code 
                    ? 'bg-blue-100 dark:bg-blue-900/50' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {org.code}
                </span>
              </button>
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            לא נמצא ארגון
          </li>
        )}
      </ul>
      
    </div>
  );
}