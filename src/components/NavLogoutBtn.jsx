import React from 'react';

export default function NavLogoutBtn({ onLogout }) {
  return (
    <button
      onClick={onLogout}
      title="התנתק מהמערכת"
      // במובייל פדינג קטן (p-1), במסכים גדולים (xl) כפתור רחב
      className="flex items-center justify-center gap-1.5 p-1 sm:p-1.5 md:p-2 xl:px-4 xl:py-2.5 font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg xl:rounded-xl transition-colors cursor-pointer shrink-0"
    >
      {/* אייקון Power (כיבוי) */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2.5} 
        stroke="currentColor" 
        className="w-4 h-4 sm:w-5 sm:h-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
      </svg>
      
      {/* הטקסט מוסתר במסכים קטנים ומופיע רק מ-xl ומעלה */}
      <span className="hidden xl:block text-sm leading-none">
        התנתק
      </span>
    </button>
  );
}