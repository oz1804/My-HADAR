import React from 'react';

export default function CheckoutSummary({ 
  localLines, 
  currentUser, 
  headerData, 
  handleHeaderChange, 
  setShowSaveModal 
}) {
  // חישוב סך הכל בשקלים (מתוך כל ה-Distributions לאחר שערוך מטבע)
  const totalFunctionalAmount = localLines.reduce((total, line) => {
    const lineDistTotal = line.distributions.reduce((dSum, dist) => dSum + (dist.functionalAmount || 0), 0);
    return total + lineDistTotal;
  }, 0);

  return (
    <div className="w-full xl:w-[400px] shrink-0 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-28">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">סיכום כותרת דרישה</h2>
        
        <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between text-sm"><span className="text-gray-500">שורות בדרישה</span><span className="font-bold dark:text-white">{localLines.length}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">מבקש</span><span className="font-bold dark:text-white">{currentUser.firstName}</span></div>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end">
            <span className="font-bold text-gray-900 dark:text-white">סך הכל (ש"ח)</span>
            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">₪{totalFunctionalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>

        <button className="w-full mb-6 py-3 border-2 border-dashed border-blue-300 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg>
          הוסף מסמכי כותרת
        </button>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">תיאור הדרישה (Header)</label>
            <textarea value={headerData.description} onChange={(e) => handleHeaderChange('description', e.target.value)} placeholder="טקסט כללי שישויך לכותרת..." className="w-full p-3 border rounded-xl text-sm h-16 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500"></textarea>
          </div>
          <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
            <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">הצדקה כללית (מחלחל לכל השורות)</label>
            <textarea value={headerData.justification} onChange={(e) => handleHeaderChange('justification', e.target.value)} className="w-full p-2 border rounded-lg text-sm h-12 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500"></textarea>
          </div>
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl">
            <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">הערות קניין גורפות</label>
            <textarea value={headerData.buyerNotes} onChange={(e) => handleHeaderChange('buyerNotes', e.target.value)} className="w-full p-2 border rounded-lg text-sm h-12 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500"></textarea>
          </div>
        </div>

        <button onClick={() => setShowSaveModal(true)} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black text-lg rounded-2xl shadow-lg hover:shadow-green-500/30 transition-all cursor-pointer">
          שמור דרישה
        </button>
      </div>
    </div>
  );
}