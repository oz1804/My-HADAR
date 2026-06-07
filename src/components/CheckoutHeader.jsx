import React, { useState } from 'react';
import BudgetaryFields from './BudgetaryFields';
import DocumentsModal from './DocumentsModal';
import data from '../data/data.json';

export default function CheckoutHeader({ 
  cartTotal, 
  headerOrg, 
  onHeaderOrgChange, 
  buyerNotes, 
  onHeaderNotesChange, 
  justification, 
  onHeaderJustificationChange,
  headerDescription,
  setHeaderDescription
}) {
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* --- צד ימין: שדות מחלחלים וסעיף תקציבי --- */}
      <div className="lg:col-span-8 space-y-6">
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 md:p-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 011.875 1.875v1.5a1.875 1.875 0 01-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875v-1.5c0-1.035.84-1.875 1.875-1.875z" />
              </svg>
              הגדרות לשורות הדרישה
            </h2>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-1 rounded-lg">
              מחלחל לשורות
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ארגון מלאי</label>
              <select 
                value={headerOrg}
                onChange={(e) => onHeaderOrgChange(e.target.value)}
                className={`w-full p-2.5 border rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none ${
                  headerOrg === 'mixed' ? 'border-amber-500 text-amber-600 font-semibold' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {headerOrg === 'mixed' && <option value="mixed">ארגוני מלאי שונים</option>}
                {data.inventoryOrganizations.map(org => (
                  <option key={org.id} value={org.id}>{org.code} - {org.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">הערות לקניין</label>
              <textarea 
                rows="2"
                value={buyerNotes}
                onChange={(e) => onHeaderNotesChange(e.target.value)}
                placeholder="הערות שיחלחלו לשורות..."
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none resize-none"
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">הצדקה</label>
              <textarea 
                rows="2"
                value={justification}
                onChange={(e) => onHeaderJustificationChange(e.target.value)}
                placeholder="הצדקה לביצוע הרכש..."
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 md:p-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              סעיף תקציבי
            </h2>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 dark:bg-purple-900/40 dark:text-purple-300 px-2.5 py-1 rounded-lg">
              שורות חלוקה (Distribution)
            </span>
          </div>
          <BudgetaryFields />
        </div>

      </div>

      {/* --- צד שמאל: סיכום דרישה --- */}
      <div className="lg:col-span-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 md:p-6 sticky top-24">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            פרטי הדרישה
          </h2>
          
          <div className="space-y-5">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">מספר דרישה:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white tracking-widest font-mono">180000001</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">תיאור דרישה</label>
              <input 
                type="text" 
                value={headerDescription}
                onChange={(e) => setHeaderDescription(e.target.value)}
                placeholder="הזן תיאור כללי לדרישה..."
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
              />
            </div>

            <div className="pt-5 mt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-end">
                <span className="text-base font-bold text-gray-700 dark:text-gray-300">סך הכל <span className="text-xs font-normal text-gray-400">(לפני מע"מ)</span></span>
                <span className="text-3xl font-black text-green-600 dark:text-green-400">
                  ₪{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setIsDocsModalOpen(true)}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              הוספת מסמכים ונספחים
            </button>
          </div>
        </div>
      </div>

      <DocumentsModal isOpen={isDocsModalOpen} onClose={() => setIsDocsModalOpen(false)} />
    </div>
  );
}