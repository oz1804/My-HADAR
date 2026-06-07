import React, { useState, useRef, useEffect } from 'react';
import KnowledgeAndProcDocsLinkList from './KnowledgeAndProcDocsLinkList';
import data from '../data/data.json';

export default function KnowledgeAndProcDocs({ onNavigate }) {
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

  return (
    // הוספנו w-full כדי שיתפוס את כל השורה במובייל, ובדסקטופ (2xl) יהיה w-auto
    <div className="relative shrink-0 w-full 2xl:w-auto" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        // justify-between מרחיק את החץ לקצה במובייל. בדסקטופ (2xl) חוזר להיות צמוד
        className="flex items-center justify-between 2xl:justify-start w-full gap-1.5 px-2 py-2 text-base font-bold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group rounded-lg 2xl:rounded-none hover:bg-gray-50 dark:hover:bg-gray-700/50 2xl:hover:bg-transparent 2xl:dark:hover:bg-transparent"
      >
        
        {/* עטפנו את האייקון והטקסט ב-div כדי שיישארו תמיד יחד בצד ימין */}
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          
          <span className="underline-offset-4 group-hover:underline whitespace-nowrap">
            ידע ומסמכי רכש
          </span>
        </div>

        {/* האייקון של החץ (^) - במובייל הוא יישב בצד שמאל, מופרד לגמרי מהטקסט */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 2xl:w-3.5 2xl:h-3.5 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <KnowledgeAndProcDocsLinkList 
          links={data.knowledgeLinks || []} 
          onClose={() => setIsOpen(false)} 
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}