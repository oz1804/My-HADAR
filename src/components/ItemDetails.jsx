import React, { useState } from 'react';
import data from '../data/data.json';

export default function ItemDetails({ itemId, onBack, cartLines, onUpdateQty, onAddNewLine, onNavigate }) {
  const item = data.catalogItems.find(i => String(i.id) === String(itemId));
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // בדיקה דינמית: האם הפריט כבר קיים בסל כרגע?
  const isItemInCart = cartLines.some(line => String(line.itemId) === String(item?.id));

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

  const rawUom = item.uom || "EA";
  const uomDisplay = rawUom === "EA" ? "יחידה" : rawUom;

  const handleQtyChange = (val) => {
    const qty = Number(val);
    if (qty > 0) setQuantity(qty);
  };

  // פעולה עבור פריט שעוד לא קיים בסל
  const handleAddToCart = () => {
    onAddNewLine(item.id, quantity); // <-- הוספת הכמות
    setQuantity(1); // איפוס כמות ל-1
    alert("הפריט נוסף לסל בהצלחה!");
  };

  // פעולה עבור פריט שכבר קיים בסל (כפתור שורה נפרדת)
  const handleSeparateLine = () => {
    onAddNewLine(item.id, quantity); // <-- הוספת הכמות
    setQuantity(1); // איפוס כמות ל-1
    alert("הפריט נוסף כשורה נפרדת חדשה בהצלחה!");
  };

  // הזמנה מהירה (הוספה ומעבר לקופה)
  const handleQuickOrder = () => {
    if (isItemInCart) {
      // אם כבר בסל, נגדיל את הכמות של השורה הקיימת למען הנוחות של ההזמנה המהירה
      const existingLine = cartLines.find(line => String(line.itemId) === String(item.id));
      onUpdateQty(existingLine.id, existingLine.quantity + quantity);
    } else {
      onAddNewLine(item.id, quantity); // <-- הוספת הכמות
    }
    if (onNavigate) {
      onNavigate('checkout');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm mt-6 overflow-hidden transition-colors duration-300" dir="rtl">
      
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
          <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700/50 rounded-3xl flex items-center justify-center border border-gray-100 dark:border-gray-700 overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.description} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-6" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-32 h-32 text-gray-300 dark:text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
            )}
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

            <div className="mb-6">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); console.log(`מפיק דף מידע ERP עבור מק"ט: ${item.sku}`); }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                הפקת דף מידע לפריט (ERP)
              </a>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {item.hasMemory === 'Y' && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-md">אוגר זיכרון</span>}
              {item.isClassified === 'Y' && <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-md">מסווג</span>}
              {item.hasAcidBattery === 'Y' && <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-md">מצבר חומצתי</span>}
              {item.hasRadiation === 'Y' && <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-md">קרינה מייננת</span>}
            </div>

            <div className="mb-6">
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

          <div className="border-t border-gray-100 dark:border-gray-700 pt-6 flex flex-col gap-4 max-w-md">

            {/* בורר כמות מעוצב */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 px-2 uppercase">כמות</label>
              <div className="flex items-center gap-2">
                <button onClick={() => handleQtyChange(quantity - 1)} disabled={quantity <= 1} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg></button>
                <input type="number" min="1" value={quantity} onChange={(e) => handleQtyChange(e.target.value)} className="w-14 text-center bg-transparent border-0 font-black text-lg text-gray-900 dark:text-white p-0 focus:ring-0 outline-none font-mono" />
                <button onClick={() => handleQtyChange(quantity + 1)} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></button>
              </div>
            </div>

            {/* --- אזור הכפתורים המתחלף (הוסף לסל / שורה נפרדת) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              
              {!isItemInCart ? (
                <button 
                  onClick={handleAddToCart} 
                  className="w-full py-3.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl font-bold text-sm hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  הוסף לסל
                </button>
              ) : (
                <button 
                  onClick={handleSeparateLine} 
                  className="w-full py-3.5 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  הוסף כשורה נפרדת
                </button>
              )}

              <button 
                onClick={handleQuickOrder} 
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                הזמנה מהירה
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}