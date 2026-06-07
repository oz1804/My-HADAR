import React from 'react';

export default function NavNikraLink() {
  return (
    <a 
      href="#" 
      target="_blank" 
      rel="noopener noreferrer" 
      // עכשיו הקומפוננטה קומפקטית כבר מטאבלט (md)
      className="group flex flex-row md:flex-col 2xl:flex-row items-center justify-start md:justify-center gap-2 md:gap-1 2xl:gap-2 px-3 py-2.5 md:p-1.5 md:px-2 2xl:px-3 2xl:py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer w-full md:w-auto"
      title="פתח את מערכת ניקר״ה בכרטיסייה חדשה"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2} 
        stroke="currentColor" 
        className="w-5 h-5 md:w-4 md:h-4 2xl:w-5 2xl:h-5 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
      
      <span className="text-sm md:text-[10px] 2xl:text-sm font-bold leading-none text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        ניקר"ה
      </span>
    </a>
  );
}