import React, { useState, useRef, useEffect } from 'react';
import NavBarOrgList from './NavBarOrgList';
import data from '../data/data.json';

export default function NavOrg() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(data.inventoryOrganizations[0]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (org) => {
    setSelectedOrg(org);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 md:gap-3 p-1 md:p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer text-start border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
      >
        
        {/* === תצוגת מובייל בלבד (< md) === */}
        <div className="flex flex-col items-start md:hidden leading-none px-0.5 sm:px-1">
          <span className="text-[9px] sm:text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            ארגון
          </span>
          <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white mt-0.5">
            {selectedOrg.code}
          </span>
        </div>

        {/* === תצוגת טאבלט/דסקטופ (md ומעלה) === */}
        <div className="hidden md:flex items-center gap-2 xl:gap-3">
          <div className="flex items-center justify-center w-8 h-8 xl:w-10 xl:h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 xl:w-5 xl:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] xl:text-xs font-semibold text-gray-500 dark:text-gray-400 leading-tight mb-0.5">
              ארגון מלאי
            </span>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs xl:text-sm font-bold text-gray-900 dark:text-white">
                {selectedOrg.name}
              </span>
              <span className="text-[10px] xl:text-xs px-1 xl:px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 font-mono text-gray-700 dark:text-gray-300">
                {selectedOrg.code}
              </span>
            </div>
          </div>
        </div>

        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" 
          className={`w-3 h-3 md:w-4 md:h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <NavBarOrgList
          organizations={data.inventoryOrganizations}
          selectedOrgCode={selectedOrg.code}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}