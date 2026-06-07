import React, { useState } from 'react';
import data from '../data/data.json';

export default function ItemDetails({ itemId, onBack, cartLines, onUpdateQty, onAddNewLine }) {
  const item = data.catalogItems.find(i => String(i.id) === String(itemId));
  const [isFavorite, setIsFavorite] = useState(false);

  if (!item) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm mt-6 p-10 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">הפריט לא נמצא</h2>
        <p className="text-gray-600 dark:text-gray-400">
          המערכת חיפשה פריט עם מזהה: <strong className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{String(itemId)}</strong>
        </p>
        <button onClick={onBack} className="mt-6 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
          חזור אחורה
        </button>
      </div>
    );
  }

  const linesForThisItem = cartLines.filter(line => String(line.itemId) === String(item.id));
  const activeLine = linesForThisItem.length > 0 ? linesForThisItem[linesForThisItem.length - 1] : null;

  const handleIncrease = () => {
    if (activeLine) {
      onUpdateQty(activeLine.id, activeLine.quantity + 1);
    } else {
      onAddNewLine(item.id); 
    }
  };

  const handleDecrease = () => {
    if (activeLine) {
      onUpdateQty(activeLine.id, activeLine.quantity - 1); 
    }
  };

  const rawUom = item.uom || "EA";
  const uomDisplay = rawUom === "EA" ? "יחידה" : rawUom;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm mt-6 overflow-hidden transition-colors duration-300">
      
      <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
          <button onClick={onBack} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">קטלוג</button>
          <span>/</span>
          <span className="text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[400px]">{item.description}</span>
        </div>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 dark:hover:text-white cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 relative group">
          <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700/50 rounded-3xl flex items-center justify-center border border-gray-100 dark:border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-32 h-32 text-gray-300 dark:text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
          </div>
          <button onClick={() => setIsFavorite(!isFavorite)} className="absolute top-4 start-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer group/fav" title="הוסף למועדפים">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className={`w-6 h-6 ${isFavorite ? 'text-red-500' : 'text-gray-400 group-hover/fav:text-red-400'} transition-colors`}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
          </button>
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <div className="flex-1">
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg mb-3">{item.manufacturer}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4">{item.description}</h1>
            
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
              <div className="flex flex-col"><span className="text-xs">מק"ט מערכת</span><span className="font-mono font-bold text-gray-900 dark:text-white text-base">{item.sku}</span></div>
              <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex flex-col"><span className="text-xs">מק"ט יצרן</span><span className="font-mono font-bold text-gray-900 dark:text-white text-base">{item.manufacturerSku}</span></div>
              <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex flex-col"><span className="text-xs">יחידת מידה</span><span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">{uomDisplay}</span></div>
            </div>

            {/* קישור להפקת דף מידע מה-ERP */}
            <div className="mb-8">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); console.log(`מפיק דף מידע ERP עבור מק"ט: ${item.sku}`); }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                title="הפקת דף מידע לפריט ממערכת ה-ERP"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                הפקת דף מידע לפריט (ERP)
              </a>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {item.hasMemory === 'Y' && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-md">אוגר זיכרון</span>}
              {item.isClassified === 'Y' && <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-md">מסווג</span>}
              {item.hasAcidBattery === 'Y' && <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-md">מצבר חומצתי</span>}
              {item.hasRadiation === 'Y' && <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-md">קרינה מייננת</span>}
            </div>

            <div className="mb-10">
              {item.price ? (
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-black text-gray-900 dark:text-white">₪{item.price.toLocaleString()}</div>
                  <div className="text-lg font-medium text-gray-500 dark:text-gray-400">/ {uomDisplay}</div>
                </div>
              ) : (
                <div className="text-xl font-bold text-gray-500 dark:text-gray-400 italic">מחיר ייקבע בהמשך</div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-8 flex flex-col gap-4 max-w-sm">
            
            {linesForThisItem.length > 1 && (
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                יש לך {linesForThisItem.length} שורות נפרדות מפריט זה בסל. הלחצנים שולטים בשורה האחרונה.
              </div>
            )}

            {!activeLine ? (
              <button onClick={handleIncrease} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer flex justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                הוסף לסל
              </button>
            ) : (
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-2xl border-2 border-blue-500 dark:border-blue-400">
                <button onClick={handleDecrease} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm text-gray-900 dark:text-white hover:bg-gray-50 cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                </button>
                <span className="text-xl font-black text-blue-700 dark:text-blue-300 w-16 text-center">{activeLine.quantity}</span>
                <button onClick={handleIncrease} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm text-gray-900 dark:text-white hover:bg-gray-50 cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
              </div>
            )}

            {activeLine && (
              <button 
                onClick={() => onAddNewLine(item.id)} 
                className="w-full py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 font-bold rounded-2xl transition-all cursor-pointer flex justify-center items-center gap-2 mt-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                הוסף כשורה חדשה נפרדת
              </button>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}