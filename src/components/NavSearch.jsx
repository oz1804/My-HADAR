import React, { useState, useRef, useEffect } from 'react';
import data from '../data/data.json';

export default function NavSearch({ onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // סגירת החלון בלחיצה בחוץ
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ניהול החיפוש בהקלדה
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (val.trim().length >= 2) {
      const lowerVal = val.toLowerCase();
      // סינון ללא תלות בארגון המלאי - מחפש בכל הקטלוג לפי 4 פרמטרים
      const filtered = data.catalogItems.filter(item =>
        (item.sku && item.sku.toLowerCase().includes(lowerVal)) ||
        (item.description && item.description.toLowerCase().includes(lowerVal)) ||
        (item.manufacturer && item.manufacturer.toLowerCase().includes(lowerVal)) ||
        (item.manufacturerSku && item.manufacturerSku.toLowerCase().includes(lowerVal))
      ).slice(0, 6); // מציג עד 6 תוצאות כדי לא להעמיס

      setResults(filtered);
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  };

  // שליחה לעמוד תוצאות החיפוש המלא
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length > 0) {
      setShowDropdown(false);
      onNavigate('search-results', searchTerm);
    }
  };

  // מעבר ישיר לדף הפריט
  const handleItemClick = (item) => {
    setShowDropdown(false);
    setSearchTerm('');
    onNavigate('item-details', item.id);
  };

  return (
    <div className="relative group flex-1 w-full min-w-0 md:min-w-[200px] xl:min-w-[300px]" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative w-full">
        
        {/* אייקון חיפוש פנימי */}
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 xl:ps-4 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 xl:w-5 xl:h-5 text-blue-600 dark:text-blue-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        
        {/* תיבת החיפוש */}
        <input
          type="text"
          className="block w-full py-2 xl:py-3.5 ps-9 xl:ps-12 pe-16 xl:pe-24 text-[11px] xl:text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 xl:border-2 rounded-lg focus:ring-0 focus:border-blue-600 focus:bg-white dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500 dark:focus:bg-gray-800 transition-all shadow-sm placeholder:text-gray-500"
          placeholder='חיפוש לפי מק"ט, תיאור או יצרן...'
          value={searchTerm}
          onChange={handleSearchChange}
          autoComplete="off"
        />
        
        {/* כפתור אישור */}
        <div className="absolute inset-y-1 end-1 xl:inset-y-1.5 xl:end-1.5">
          <button 
            type="submit"
            className="h-full px-3 xl:px-5 text-[10px] xl:text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none transition-colors shadow-sm cursor-pointer"
          >
            חפש
          </button>
        </div>
      </form>

      {/* תפריט תוצאות החיפוש המהיר (Autocomplete) */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full min-w-[300px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] start-0">
          <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {results.map((item) => (
              <li 
                key={item.id} 
                onClick={() => handleItemClick(item)}
                className="p-3 hover:bg-blue-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {item.description}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="font-mono"><strong className="font-medium me-1">מק"ט:</strong>{item.sku}</span>
                    <span><strong className="font-medium me-1">יצרן:</strong>{item.manufacturer}</span>
                    <span className="font-mono"><strong className="font-medium me-1">מק"ט יצרן:</strong>{item.manufacturerSku}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}