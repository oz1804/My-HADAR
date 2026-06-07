import React from 'react';

export default function NavNonCatalogBtn({ onOpenModal }) {
  return (
    <button 
      onClick={onOpenModal}
      className="shrink-0 flex flex-col 2xl:flex-row items-center justify-center gap-0.5 sm:gap-1 2xl:gap-1.5 p-1 sm:p-1.5 2xl:px-2 2xl:py-2 font-bold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group w-auto"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2.5} 
        stroke="currentColor" 
        className="w-3.5 h-3.5 sm:w-4 sm:h-4 2xl:w-5 2xl:h-5 shrink-0"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      
      <span className="text-[9px] sm:text-[10px] 2xl:text-base leading-none underline-offset-4 group-hover:underline whitespace-nowrap">
        פריט ללא מק"ט
      </span>
    </button>
  );
}