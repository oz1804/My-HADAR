import React from 'react';
import CheckoutLineDistributionRow from './CheckoutLineDistributionRow';

export default function CheckoutLineDistributions({ 
  line, 
  onAddDist, 
  onDistFieldChange, 
  onRemoveDist 
}) {
  const distributions = line.distributions || [];
  
  // חישוב כמות כוללת שחולקה כדי להציג חיווי למשתמש
  const totalAllocated = distributions.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  const isBalanced = totalAllocated === line.quantity;

  return (
    <div className="mt-6 pt-5 border-t border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/30 dark:bg-gray-900/10 rounded-b-xl px-2 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-purple-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            חלוקה תקציבית (Distributions)
          </h4>
          
          {/* חיווי איזון */}
          <div className={`text-xs font-bold px-2 py-1 rounded-md ${
            isBalanced 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
          }`}>
            חולק: {totalAllocated} / {line.quantity}
          </div>
        </div>

        <button 
          onClick={() => onAddDist(line.id)}
          className="text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>+</span> הוסף חלוקה (Split)
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {distributions.map((dist, idx) => (
          <CheckoutLineDistributionRow 
            key={dist.id}
            dist={dist}
            line={line}
            index={idx}
            onDistFieldChange={onDistFieldChange}
            onRemoveDist={onRemoveDist}
            canRemove={distributions.length > 1}
          />
        ))}
      </div>
      
      {!isBalanced && (
        <div className="mt-2 text-[11px] font-bold text-rose-500 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          שים לב: סך כמות החלוקות אינו שווה לכמות הכוללת בשורה!
        </div>
      )}
    </div>
  );
}