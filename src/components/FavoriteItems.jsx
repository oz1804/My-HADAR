import React, { useMemo } from 'react';
import data from '../data/data.json';
import CatalogItemCard from './CatalogItemCard'; 

export default function FavoriteItems({ 
  favoriteItems = [],
  favoriteNonCatalogItems = [], // הפרופ החדש לפריטים חופשיים
  toggleFavorite,
  onRemoveNonCatalogFavorite,   // פונקציה להסרת פריט חופשי
  onAddToCart,
  onAddNonCatalogToCart,        // הוספת פריט חופשי לסל
  onQuickOrder,
  onQuickOrderNonCatalog,       // הזמנה מהירה לפריט חופשי
  onNavigate,
  onBackToHome 
}) {
  
  // מסנן את קטלוג הפריטים כדי להציג רק את הפריטים שנמצאים במערך המועדפים של המשתמש
  const favoriteItemsData = useMemo(() => {
    return data.catalogItems.filter(item => favoriteItems.includes(item.id));
  }, [favoriteItems]);

  const hasFavorites = favoriteItemsData.length > 0 || favoriteNonCatalogItems.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 md:p-8 mt-6 transition-colors duration-300 border border-gray-100 dark:border-gray-700" dir="rtl">
      
      {/* --- אזור כותרת --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-5 border-gray-100 dark:border-gray-700 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            פריטים מועדפים
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
            הפריטים ששמרת לקנייה מהירה ולגישה נוחה (כולל פריטים חופשיים).
          </p>
        </div>
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
          חזור ללוח הבקרה
        </button>
      </div>

      {/* --- אזור תוכן (גריד פריטים או מצב ריק) --- */}
      <div className="min-h-[300px]">
        {!hasFavorites ? (
          <div className="text-center py-16 px-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <p className="text-gray-800 dark:text-gray-200 font-black text-xl">אין לך עדיין פריטים מועדפים.</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
              כדי להוסיף פריטים לרשימה זו, חפש פריטים בקטלוג ולחץ על סמל הלב, או הוסף פריט חופשי חדש למועדפים.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
            
            {/* 1. רינדור פריטים קטלוגיים */}
            {favoriteItemsData.map(item => (
              <CatalogItemCard 
                key={item.id}
                item={item}
                onAddToCart={onAddToCart}
                onQuickOrder={onQuickOrder}
                onToggleFavorite={toggleFavorite}
                isFavorite={true}
                onNavigate={onNavigate}
              />
            ))}

            {/* 2. רינדור פריטים חופשיים (מומרים למבנה ש-CatalogItemCard מכיר) */}
            {favoriteNonCatalogItems.map(ncItem => (
              <CatalogItemCard 
                key={ncItem.id}
                item={{
                  id: ncItem.id,
                  description: ncItem.description,
                  sku: 'פריט חופשי',
                  manufacturer: 'הזנה ידנית (Non-Catalog)',
                  price: ncItem.unitPrice,
                  currency: ncItem.currency,
                  uom: ncItem.uom,
                  imageUrl: null
                }}
                // חיווט מחדש של הפונקציות כדי שישלחו את כל האובייקט ולא רק ID
                onAddToCart={(id, qty) => onAddNonCatalogToCart && onAddNonCatalogToCart({ ...ncItem, quantity: qty })}
                onQuickOrder={(id, qty) => onQuickOrderNonCatalog && onQuickOrderNonCatalog({ ...ncItem, quantity: qty })}
                onToggleFavorite={() => onRemoveNonCatalogFavorite && onRemoveNonCatalogFavorite(ncItem.id)}
                isFavorite={true}
                onNavigate={null} // חוסם מעבר לדף פריט (כי אין דף לפריט חופשי)
              />
            ))}

          </div>
        )}
      </div>

    </div>
  );
}