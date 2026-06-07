import React from 'react';

export default function KnowledgeAndProcDocsLinkList({ links, onClose, onNavigate }) {
  return (
    // במובייל: relative (דוחף את הכל למטה), בלי רקע ובלי צלליות. 
    // בדסקטופ (2xl): absolute צף, רקע לבן וצלליות בחזרה.
    <div className="relative 2xl:absolute 2xl:top-full mt-1 2xl:mt-2 w-full 2xl:w-56 bg-transparent 2xl:bg-white 2xl:dark:bg-gray-800 rounded-none 2xl:rounded-xl shadow-none 2xl:shadow-lg border-none 2xl:border 2xl:border-gray-100 2xl:dark:border-gray-700 overflow-hidden z-0 2xl:z-50 start-0 flex flex-col ps-2 2xl:ps-0">
      
      {/* במובייל יש קו גבול אנכי דק כדי לסמן שזו תת-רשימה */}
      <ul className="py-1 2xl:py-2 border-s-2 border-gray-200 dark:border-gray-700 2xl:border-none ms-2 2xl:ms-0">
        
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.url}`}
              onClick={(e) => {
                e.preventDefault(); 
                onNavigate(link.url); 
                onClose(); 
              }}
              // במובייל הריווח קטן יותר והצבעים יותר עדינים כדי להבדיל מהתפריט הראשי
              className="w-full flex items-center gap-2 2xl:gap-3 px-3 py-2.5 2xl:px-4 2xl:py-3 text-sm font-medium text-gray-600 dark:text-gray-400 2xl:text-gray-700 2xl:dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 2xl:hover:bg-blue-50 2xl:dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {link.title}
            </a>
          </li>
        ))}
        
      </ul>
    </div>
  );
}