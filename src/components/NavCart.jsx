import React, { useState, useRef, useEffect } from 'react';
import data from '../data/data.json';

// 1. הוספתי את onNavigate לחתימה
export default function NavCart({ cartLines = [], onUpdateQty, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // התאמה למבנה החדש שכולל פריטי טקסט חופשי (ללא itemId)
  const enrichedCartItems = cartLines.map(line => {
    let catalogItem = null;
    if (line.itemId) {
      catalogItem = data.catalogItems.find(i => String(i.id) === String(line.itemId));
    }
    
    return {
      ...line,
      sku: line.sku || (catalogItem ? catalogItem.sku : null),
      itemDescription: line.itemDescription || (catalogItem ? catalogItem.description : 'פריט לא מוגדר')
    };
  });

  const cartTotal = enrichedCartItems.reduce((sum, item) => sum + ((item.unitPrice || 0) * item.quantity), 0);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex flex-col items-center justify-center gap-1 p-1 md:p-1.5 xl:px-2 xl:py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group" title="עגלת קניות">
        <div className="relative mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
          {cartLines.length > 0 && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white dark:border-gray-800 rounded-full shadow-sm z-10">
              {cartLines.length}
            </span>
          )}
        </div>
        <span className="hidden xl:block text-[10px] font-bold text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-none">עגלת קניות</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-3 w-[300px] sm:w-[380px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[60] left-0 sm:end-0 sm:left-auto flex flex-col transition-all">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
            <span className="font-bold text-gray-900 dark:text-white">הסל שלי</span>
            {cartLines.length > 0 && <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">{cartLines.length} שורות</span>}
          </div>

          {cartLines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 dark:text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              </div>
              <span className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">סל הדרישה שלך ריק</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">פריטים שתבחר מהקטלוג יופיעו כאן.</span>
            </div>
          ) : (
            <ul className="max-h-[340px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50 custom-scrollbar">
              {enrichedCartItems.map((item) => (
                <li key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group/item">
                  <div className="flex justify-between items-center gap-3">
                    
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-gray-900 dark:text-white truncate" title={item.itemDescription}>{item.itemDescription}</span>
                      {item.sku ? (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">מק"ט: {item.sku}</span>
                      ) : (
                        <span className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5 font-medium bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded inline-block w-max">הוזן ידנית</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 text-start min-w-[70px]">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        ₪{item.unitPrice ? (item.unitPrice * item.quantity).toLocaleString() : '0'}
                      </span>
                      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">כמות: {item.quantity}</span>
                    </div>

                    <button 
                      onClick={() => onUpdateQty(item.id, 0)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer shrink-0 opacity-80 group-hover/item:opacity-100"
                      title="הסר שורה זו"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 9m-4.72 0-.34-9m9.28-2.52V5.25c0-1.036-.84-1.875-1.875-1.875H12c-1.036 0-1.875.84-1.875 1.875v.75m1.5-.75h4.5m-10.5 3H18.75m-1.5 0-1.12 12.42c-.063.693-.642 1.23-1.334 1.23H7.078c-.692 0-1.27-.537-1.334-1.23L4.62 5.712z" />
                      </svg>
                    </button>

                  </div>
                </li>
              ))}
            </ul>
          )}

          {cartLines.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex justify-between items-end mb-4 px-1">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">סך הדרישה (בסיס):</span>
                <span className="text-xl font-black text-gray-900 dark:text-white leading-none">₪{cartTotal.toLocaleString()}</span>
              </div>
              <button 
                // 2. התיקון השני: שימוש ב-setIsOpen במקום setIsCartOpen
                onClick={() => {
                  onNavigate('checkout');
                  setIsOpen(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-lg transition-colors mt-2 cursor-pointer"
              >
                מעבר לסל הדרישה
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}