import React, { useState } from 'react';

export default function WelcomeModal({ isOpen, onSelectOrg, organizations = [], userOrgs = [], currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // הגדרת אנימציית קפיצה רכה (Pop-in)
  const popInAnimation = `
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.9) translateY(20px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-pop-in {
      animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
  `;

  // התאמת טקסט לפי מגדר
  const isFemale = currentUser?.gender === 'female';
  const chooseText = isFemale ? 'בחרי' : 'בחר';
  const wantText = isFemale ? 'תרצי' : 'תרצה';
  const welcomeText = isFemale ? 'ברוכה הבאה' : 'ברוך הבא';

  // סינון ארגונים לפי טקסט חיפוש (קוד או שם)
  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    org.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-900/70 backdrop-blur-md p-4 transition-all" dir="rtl">
      <style>{popInAnimation}</style>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 border border-gray-100 dark:border-gray-700 text-center animate-pop-in flex flex-col max-h-[90vh]">
        
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-inner shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 sm:w-10 sm:h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
          </svg>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-2 shrink-0">{welcomeText} למערכת הד"ר החדשה!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-5 text-sm shrink-0">
          כדי שנוכל להתאים עבורך את הפריטים והתקציבים הרלוונטיים, אנא {chooseText} את ארגון המלאי אליו {wantText} לבצע הזמנות. 
        </p>

        {/* --- שורת חיפוש --- */}
        <div className="relative mb-4 shrink-0">
          <input
            type="text"
            placeholder="חיפוש ארגון (שם או קוד)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pr-4 pl-10 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-800 dark:text-gray-200"
          />
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar px-1 pb-2 flex-1">
          {filteredOrgs.length > 0 ? (
            filteredOrgs.map(org => {
              const isUserAssociated = userOrgs.includes(org.id);
              
              return (
                <button
                  key={org.id}
                  onClick={() => onSelectOrg(org)}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all group text-start focus:outline-none focus:ring-2 focus:ring-blue-500 ${isUserAssociated ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 text-sm">
                      {org.name}
                      {isUserAssociated && <span className="mr-2 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">מומלץ עבורך</span>}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{org.code}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              לא נמצאו ארגונים התואמים לחיפוש שלך.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}