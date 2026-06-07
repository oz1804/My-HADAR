import React from 'react';

export default function NonCatalogModal({ isOpen, onClose }) {
  // אם המודל סגור, לא נרנדר כלום. זה מה שיעלים את הכפילות של הלחצן!
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* חלון המודל עצמו */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg transform transition-all" 
        dir="rtl"
      >
        
        {/* כותרת וכפתור סגירה */}
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            הוספת פריט ללא מק"ט
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* אזור התוכן */}
        <div className="py-10 text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          טופס הזנת פריט חופשי ייבנה כאן...
        </div>
        
        {/* כפתורי פעולה */}
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors cursor-pointer"
          >
            ביטול
          </button>
          <button 
            className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            הוסף פריט
          </button>
        </div>

      </div>
    </div>
  );
}