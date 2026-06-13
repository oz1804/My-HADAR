import React, { useState, useMemo } from 'react';
import data from '../data/data.json'; 
import CatalogItemRow from './CatalogItemRow';
import CatalogItemCard from './CatalogItemCard'; // הייבוא החדש לכרטיסייה

export default function SearchResults({ 
  query, 
  onBackToHome, 
  onNavigate, 
  onAddToCart, 
  onQuickOrder,
  favoriteItems = [],
  onToggleFavorite
}) {
  const [selectedMfrs, setSelectedMfrs] = useState([]);
  
  // הסטייט החדש שמנהל את מצב התצוגה ('list' או 'grid')
  const [viewMode, setViewMode] = useState('grid');

  const baseResults = useMemo(() => {
    if (!query) return data.catalogItems;
    const lowerQuery = query.toLowerCase();
    
    return data.catalogItems.filter(item => {
      return (
        (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
        (item.sku && item.sku.toLowerCase().includes(lowerQuery)) ||
        (item.manufacturer && item.manufacturer.toLowerCase().includes(lowerQuery)) ||
        (item.manufacturerSku && item.manufacturerSku.toLowerCase().includes(lowerQuery))
      );
    });
  }, [query]);

  const availableMfrs = useMemo(() => {
    const mfrs = new Set();
    baseResults.forEach(item => {
      if (item.manufacturer) mfrs.add(item.manufacturer);
    });
    return Array.from(mfrs).sort();
  }, [baseResults]);

  const finalResults = useMemo(() => {
    if (selectedMfrs.length === 0) return baseResults;
    return baseResults.filter(item => selectedMfrs.includes(item.manufacturer));
  }, [baseResults, selectedMfrs]);

  const toggleMfr = (mfr) => {
    setSelectedMfrs(prev => 
      prev.includes(mfr) ? prev.filter(m => m !== mfr) : [...prev, mfr]
    );
  };

  return (
    <div className="mt-6" dir="rtl">
      
      {/* --- כותרת עליונה ומתג תצוגה --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-100 dark:border-gray-700 transition-colors">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            תוצאות חיפוש עבור: <span className="text-blue-600 dark:text-blue-400 font-mono tracking-wide">"{query}"</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-bold">
            נמצאו {finalResults.length} פריטים תואמים
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          
          {/* מתג החלפת תצוגה (Grid / List) */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-xl border border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer'
              }`}
              title="תצוגת רשת (כרטיסיות)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer'
              }`}
              title="תצוגת רשימה (שורות)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 011.875 1.875v1.5a1.875 1.875 0 01-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875v-1.5c0-1.035.84-1.875 1.875-1.875z" />
              </svg>
            </button>
          </div>

          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
            <span className="hidden sm:inline">חזרה ללוח הבקרה</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* סרגל צדדי - פילטרים */}
        {availableMfrs.length > 0 && (
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 sticky top-24">
              <h3 className="font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                סינון תוצאות
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">יצרן / מותג</h4>
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                    {availableMfrs.map(mfr => (
                      <label key={mfr} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={selectedMfrs.includes(mfr)}
                            onChange={() => toggleMfr(mfr)}
                            className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-blue-600 focus:ring-blue-500 focus:ring-offset-0 dark:bg-gray-700 transition-colors cursor-pointer"
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {mfr}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {selectedMfrs.length > 0 && (
                <button 
                  onClick={() => setSelectedMfrs([])}
                  className="w-full mt-6 py-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors cursor-pointer"
                >
                  נקה פילטרים
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- אזור מרכזי: רשימת התוצאות מרונדרת לפי ה-viewMode --- */}
        <div className="flex-1">
          {finalResults.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">לא נמצאו פריטים תואמים</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                לא הצלחנו למצוא תוצאות עבור החיפוש הנוכחי או הסינון שבחרת. נסה לחפש לפי מונח כללי יותר או נקה את הפילטרים.
              </p>
              {selectedMfrs.length > 0 && (
                <button 
                  onClick={() => setSelectedMfrs([])}
                  className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  נקה פילטרים
                </button>
              )}
            </div>
          ) : (
            // כאן קורה הקסם: רינדור מותנה לפי המצב הנבחר
            viewMode === 'list' ? (
              <div className="flex flex-col gap-4">
                {finalResults.map(item => (
                  <CatalogItemRow 
                    key={item.id}
                    item={item}
                    onAddToCart={onAddToCart}
                    onQuickOrder={onQuickOrder}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={favoriteItems.includes(item.id)}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {finalResults.map(item => (
                  <CatalogItemCard 
                    key={item.id}
                    item={item}
                    onAddToCart={onAddToCart}
                    onQuickOrder={onQuickOrder}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={favoriteItems.includes(item.id)}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}