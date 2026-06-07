import React from 'react';

export default function NavUserReq({ onNavigate }) {
  return (
    <button 
      onClick={onNavigate}
      className="shrink-0 flex items-center gap-1.5 px-2 py-2 text-base font-bold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      
      {/* הוספנו whitespace-nowrap כדי למנוע שבירה לשתי שורות */}
      <span className="underline-offset-4 group-hover:underline whitespace-nowrap">
        הדרישות שלי
      </span>
    </button>
  );
}