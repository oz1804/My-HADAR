import { useEffect, useRef, useState } from 'react';
import data from '../../data/data.json';

// ==========================================
// לחצן "כלים" ב-Navbar: בדיקת פרויקטים, סטטוס פריט ב-ERP והקישור לניקר"ה
// הרשימה מגיעה מ-data.json (toolLinks): view - מסך בתוך הד"ר, external - קישור שנפתח בלשונית חדשה
// מעוצב כמו "ידע ומסמכי רכש". variant="bar" - בשורה העליונה (מ-lg). variant="menu" - שורה נפתחת בתפריט הנייד
// ==========================================

const ExternalIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);
const ToolsIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
  </svg>
);
const ArrowIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);
const Chevron = ({ open, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`${className} transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export default function NavTools({ onNavigate, variant = 'bar' }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const tools = data.toolLinks || [];
  const isBar = variant === 'bar';

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [isOpen]);

  // התפריט בנוי כמו "ידע ומסמכי רכש": בשורה העליונה - רשימה צפה; בתפריט הנייד - תת-רשימה עם קו בצד
  const itemClass = isBar
    ? 'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-start text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer'
    : 'w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-start text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer';
  const iconClass = isBar ? 'w-4 h-4 shrink-0' : 'w-3.5 h-3.5 shrink-0';

  const content = (tool) => (
    <>
      {tool.external ? <ExternalIcon className={iconClass} /> : <ArrowIcon className={iconClass} />}
      <span>{tool.title}</span>
      {tool.external && <span className="sr-only">(נפתח בלשונית חדשה)</span>}
    </>
  );

  const list = (
    <ul
      role="menu"
      aria-label="כלים"
      className={isBar
        ? 'absolute top-full mt-2 start-0 w-56 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden'
        : 'mt-1 py-1 ms-2 ps-2 border-s-2 border-gray-200 dark:border-gray-700'}
    >
      {tools.map(tool => (
        <li key={tool.id} role="none">
          {tool.external ? (
            <a role="menuitem" href={tool.url || '#'} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className={itemClass} title={`פתח את ${tool.title} בלשונית חדשה`}>
              {content(tool)}
            </a>
          ) : (
            <button role="menuitem" type="button" onClick={() => { setIsOpen(false); onNavigate(tool.view); }} className={itemClass} title={tool.description || undefined}>
              {content(tool)}
            </button>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`relative shrink-0 ${isBar ? '' : 'w-full'}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        data-variant={variant}
        className={`flex items-center w-full gap-1.5 px-2 py-2 text-base font-bold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group ${isBar ? 'justify-start' : 'justify-between rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
      >
        <span className="flex items-center gap-1.5">
          <ToolsIcon className="w-5 h-5 shrink-0" />
          <span className="underline-offset-4 group-hover:underline whitespace-nowrap">כלים</span>
        </span>
        <Chevron open={isOpen} className={isBar ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} />
      </button>
      {isOpen && list}
    </div>
  );
}
