import React, { useState } from 'react';

export default function CatalogItemRow({ 
  item, 
  onAddToCart, 
  onQuickOrder, 
  onToggleFavorite, 
  isFavorite, 
  onNavigate 
}) {
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  // הגדרת סמל המטבע בהתאם לנתוני הקטלוג
  const currencySymbol = item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : '₪';
  const hasPrice = item.price !== null && item.price !== undefined && item.price > 0;

  const handleQtyChange = (val) => {
    const qty = Number(val);
    if (qty > 0) setQuantity(qty);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all duration-200 group relative" dir="rtl">
      
      {/* --- אזור 1: תמונה ומידע על הפריט (לחיץ למעבר לדף הפריט) --- */}
      <div 
        onClick={() => onNavigate && onNavigate('item-details', item.id)}
        className="flex-1 min-w-0 cursor-pointer flex items-center gap-4"
      >
        {/* --- התמונת מוצר או ה-Placeholder הזהה לדף הפריט --- */}
        <div className="w-16 h-16 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.description} 
              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-1"
            />
          ) : (
            // ה-Placeholder האחיד מתוך ItemDetails.jsx
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-gray-300 dark:text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          )}
        </div>

        {/* מידע טקסטואלי */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="min-w-0 shrink-0">
            <span className="font-mono text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
              {item.sku}
            </span>
          </div>
          
          <div className="min-w-0">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {item.description}
            </h4>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold mt-0.5 tracking-wide">
              יצרן: <span className="text-gray-600 dark:text-gray-300 font-extrabold">{item.manufacturer || 'לא הוגדר'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* --- אזור 2: מחיר, כמות ולחצני פעולה מהירה --- */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-700">
        
        {/* תצוגת מחיר */}
        <div className="flex flex-col items-end min-w-[90px] justify-center ml-2">
          {hasPrice ? (
            <>
              <span className="font-black text-gray-900 dark:text-white text-base font-mono">
                {currencySymbol}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono tracking-wider">{item.uom}</span>
            </>
          ) : (
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30">
              ללא מחירון
            </span>
          )}
        </div>

        {/* בורר כמות פנימי */}
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700 h-9">
          <input 
            type="number" 
            min="1" 
            value={quantity}
            onChange={(e) => handleQtyChange(e.target.value)}
            className="w-10 text-center bg-transparent border-0 font-black text-sm text-gray-900 dark:text-white p-0 focus:ring-0 outline-none font-mono"
          />
        </div>

        {/* חלונית כפתורי הרכש */}
        <div className="flex items-center gap-1.5 h-9">
          
          {/* כפתור 1: הוספה/הסרה ממועדפים (ממוקם מעל כולם בפינה בנייד) */}
          <button 
            onClick={() => onToggleFavorite && onToggleFavorite(item.id)}
            className={`absolute top-2 left-2 p-1.5 rounded-full border transition-all cursor-pointer z-10 sm:relative sm:top-auto sm:left-auto sm:rounded-xl sm:p-2 sm:h-full sm:w-9 sm:flex sm:items-center sm:justify-center ${
              isFavorite 
                ? 'bg-rose-100 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:border-rose-900' 
                : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:border-gray-700 dark:hover:bg-gray-700'
            }`}
            title={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={isFavorite ? 1.5 : 2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          {/* כפתור 2: הוספה רגילה לסל */}
          <button 
            onClick={() => onAddToCart && onAddToCart(item.id, quantity)}
            className="px-3 h-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="הוסף לסל הנוכחי"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden lg:inline">הוסף לסל</span>
          </button>

          {/* כפתור 3: הזמנה מהירה (הוספה ומעבר לקופה) */}
          <button 
            onClick={() => onQuickOrder && onQuickOrder(item.id, quantity)}
            className="px-3 h-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            title="בצע רכש מהיר ומעבר מיידי לקופה"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span>הזמנה מהירה</span>
          </button>
          
        </div>

      </div>

    </div>
  );
}