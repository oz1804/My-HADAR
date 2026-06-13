import React, { useState } from 'react';

export default function CatalogItemCard({ 
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col hover:shadow-xl transition-all duration-300 group overflow-hidden relative h-full" dir="rtl">
      
      {/* --- אזור 1: תמונת המוצר וכפתור מועדפים --- */}
      <div className="relative w-full h-48 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex items-center justify-center shrink-0">
        
        {/* כפתור מועדפים צף */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite && onToggleFavorite(item.id);
          }}
          className={`absolute top-3 left-3 p-2 rounded-full z-10 backdrop-blur-md shadow-sm transition-all cursor-pointer hover:scale-110 ${
            isFavorite 
              ? 'bg-rose-100/90 text-rose-600 border border-rose-200 dark:bg-rose-900/50 dark:border-rose-800' 
              : 'bg-white/80 text-gray-400 border border-gray-200 hover:text-rose-500 hover:bg-rose-50 dark:bg-gray-800/80 dark:border-gray-600 dark:hover:bg-gray-700'
          }`}
          title={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={isFavorite ? 1.5 : 2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* תמונה לחיצה (למעבר לדף פריט) */}
        <div 
          onClick={() => onNavigate && onNavigate('item-details', item.id)}
          className="w-full h-full flex items-center justify-center p-4 cursor-pointer"
        >
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.description} 
              className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            // Placeholder תואם לדף הפריט ולשורה
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-gray-300 dark:text-gray-600 group-hover:scale-110 transition-transform duration-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          )}
        </div>
      </div>

      {/* --- אזור 2: פרטי המוצר (Flex-1 כדי לדחוף את הכפתורים למטה באחידות) --- */}
      <div 
        onClick={() => onNavigate && onNavigate('item-details', item.id)}
        className="p-4 flex flex-col flex-1 cursor-pointer"
      >
        <div className="flex flex-wrap items-center gap-2 mb-2 shrink-0">
          <span className="font-mono text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
            {item.sku}
          </span>
          {item.manufacturerSku && (
            <span className="font-mono text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md truncate max-w-[100px]" title="מק&quot;ט יצרן">
              {item.manufacturerSku}
            </span>
          )}
        </div>

        <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[2.5rem]">
          {item.description}
        </h4>
        
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold mt-1">
          יצרן: <span className="text-gray-600 dark:text-gray-300 font-extrabold">{item.manufacturer || 'לא הוגדר'}</span>
        </p>

        {/* מחיר - נדחף תמיד לתחתית אזור הטקסט */}
        <div className="mt-auto pt-4 flex items-end justify-between">
          {hasPrice ? (
            <div className="flex items-baseline gap-1">
              <span className="font-black text-gray-900 dark:text-white text-xl font-mono">
                {currencySymbol}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono tracking-wider">
                /{item.uom}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">
              ללא מחירון
            </span>
          )}
        </div>
      </div>

      {/* --- אזור 3: בחירת כמות ופעולות רכש --- */}
      <div className="p-4 pt-0 mt-auto shrink-0 space-y-3">
        
        {/* בורר כמות מעוצב לרוחב הכרטיסייה */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
          <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 px-2 uppercase">כמות</label>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => handleQtyChange(quantity - 1)}
              disabled={quantity <= 1}
              className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              -
            </button>
            <input 
              type="number" 
              min="1" 
              value={quantity}
              onChange={(e) => handleQtyChange(e.target.value)}
              className="w-10 text-center bg-transparent border-0 font-black text-sm text-gray-900 dark:text-white p-0 focus:ring-0 outline-none font-mono"
            />
            <button 
              onClick={() => handleQtyChange(quantity + 1)}
              className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* כפתורי הוספה */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => onAddToCart && onAddToCart(item.id, quantity)}
            className="w-full py-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 hover:shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="הוסף לסל"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            הוסף לסל
          </button>

          <button 
            onClick={() => onQuickOrder && onQuickOrder(item.id, quantity)}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="הזמנה מהירה"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            הזמנה מהירה
          </button>
        </div>

      </div>
    </div>
  );
}