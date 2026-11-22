import { useEffect, useState } from 'react';
import { checkFunds, fundsFailureMessage } from '../../services/fundsService';

const money = (n) => `₪${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ==========================================
// בדיקת תקציב מהסל (כמו Check Funds ב-iProcurement) - בודקת בלבד, לא משריינת
// נטען מחדש בכל פתיחה (ה-Checkout מרכיב אותו רק כשהוא פתוח)
// ==========================================
export default function FundsCheckModal({ isOpen, onClose, lines, editingRequisitionId, hasBudgetErrors }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    checkFunds(lines, { excludeRequisitionId: editingRequisitionId }).then(r => { if (!cancelled) setResult(r); });
    return () => { cancelled = true; };
  }, [isOpen, lines, editingRequisitionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="funds-check-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <h3 id="funds-check-title" className="text-xl font-black text-center text-gray-900 dark:text-white mb-1">בדיקת תקציב</h3>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">הבדיקה אינה משריינת תקציב. השריון מתבצע בעת השליחה לסבב האישורים.</p>

        {!result ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm font-bold text-gray-500">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></span>
            בודק תקציב...
          </div>
        ) : (
          <>
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-black mb-4 ${result.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/60' : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/60'}`}>
              {result.ok ? 'יש תקציב מספיק לכל שורות החלוקה' : 'אין מספיק תקציב בחלק מהסעיפים'}
              <span className="ms-auto font-mono">{money(result.totalRequired)}</span>
            </div>

            {result.accounts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">אין שורות חלוקה עם פרויקט ומשימה לבדיקה.</p>
            ) : (
              <div className="space-y-2">
                {result.accounts.map(acc => (
                  <div key={acc.key} className={`p-3 rounded-xl border ${acc.ok ? 'border-gray-100 dark:border-gray-700' : 'border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-900/10'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-gray-900 dark:text-white">{acc.project}</div>
                        <div className="text-gray-500 dark:text-gray-400">{acc.task}</div>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${acc.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
                        {acc.ok ? 'תקין' : acc.noBudget ? 'אין תקציב' : 'חריגה'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div><span className="text-gray-500">נדרש: </span><span className="font-bold font-mono">{money(acc.requiredAmount)}</span></div>
                      <div><span className="text-gray-500">זמין: </span><span className="font-bold font-mono">{money(Math.max(acc.availableAmount, 0))}</span></div>
                    </div>
                    {!acc.ok && <div className="text-[11px] text-rose-700 dark:text-rose-300 font-medium mt-1.5">{fundsFailureMessage(acc)}</div>}
                  </div>
                ))}
              </div>
            )}

            {hasBudgetErrors && (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl mt-4">
                יש שורות חלוקה עם סעיף תקציבי חסר או שגוי. שורות שחסרים בהן פרויקט או משימה לא נכללו בבדיקה.
              </p>
            )}
          </>
        )}

        <button onClick={onClose} className="w-full py-3 px-4 mt-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-bold transition-colors cursor-pointer border border-gray-200 dark:border-gray-600">
          סגור
        </button>
      </div>
    </div>
  );
}
