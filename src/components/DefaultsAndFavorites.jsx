import React, { useState, useRef, useEffect } from 'react';

export default function DefaultsAndFavorites({ currentUser, onNavigate, onOpenDefaultsModal }) {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleAction = (action) => {
    setIsOpen(false);
    if (action === 'modal') {
      onOpenDefaultsModal();
    } else {
      onNavigate(action);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-4 text-start group cursor-pointer"
      >
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap leading-tight">
            {currentUser.gender === 'male' ? 'ברוך הבא' : 'ברוכה הבאה'}, <span className="font-bold text-gray-900 dark:text-white">{currentUser.firstName}</span>
          </span>
          
          {/* עברנו לצבעים עדינים (אפור) וללא קו תחתון כדי שייראה כמו טקסט משנה אינפורמטיבי */}
          <div className="flex items-center gap-1 text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <span>הגדרות ומועדפים</span>
          </div>
        </div>

        <div className="flex items-center justify-center p-1.5 rounded-full bg-gray-100 dark:bg-gray-700/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="relative md:absolute top-full mt-2 md:mt-4 w-full md:w-56 bg-transparent md:bg-white md:dark:bg-gray-800 rounded-none md:rounded-xl shadow-none md:shadow-xl border-none md:border border-gray-100 dark:border-gray-700 overflow-hidden z-[60] start-0 flex flex-col ps-2 md:ps-0 transition-all">
          <ul className="py-1 md:py-2 border-s-2 border-gray-200 dark:border-gray-700 md:border-none ms-2 md:ms-0">
            <li>
              <button 
                onClick={() => handleAction('modal')} 
                className="w-full flex items-center gap-2 text-start px-3 py-2.5 md:px-4 md:py-3 text-sm font-medium text-gray-600 dark:text-gray-400 md:text-gray-700 md:dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 md:hover:bg-blue-50 md:dark:hover:bg-blue-900/30 transition-colors"
              >
                ברירות מחדל
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleAction('preferred-approvers')} 
                className="w-full flex items-center gap-2 text-start px-3 py-2.5 md:px-4 md:py-3 text-sm font-medium text-gray-600 dark:text-gray-400 md:text-gray-700 md:dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 md:hover:bg-blue-50 md:dark:hover:bg-blue-900/30 transition-colors"
              >
                רשימת מאשרים מועדפת
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleAction('favorite-items')} 
                className="w-full flex items-center gap-2 text-start px-3 py-2.5 md:px-4 md:py-3 text-sm font-medium text-gray-600 dark:text-gray-400 md:text-gray-700 md:dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 md:hover:bg-blue-50 md:dark:hover:bg-blue-900/30 transition-colors"
              >
                פריטים מועדפים
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}