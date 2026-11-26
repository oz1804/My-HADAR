import { useState } from 'react';
import data from '../../data/data.json';
import { isReqLineOnPo } from '../../utils/purchaseOrders';

// ==========================================
// השורות שכבר אושרו בדרישה שהוחזרה מקניין - לקריאה בלבד בסל
// אפשר רק לבטל שורה שלא מקושרת להזמנה, ולהוסיף בסל שורה חדשה במקומה
// ==========================================

const money = (n) => `₪${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const lineAmount = (l) => (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0) * (Number(l.rate) || 1);
const projectCode = (id) => (data.projects || []).find(p => String(p.id) === String(id))?.projectCode;
const taskCode = (id) => (data.tasks || []).find(t => String(t.id) === String(id))?.taskCode;

const LOCK_PATH = 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z';

function LockedLineRow({ line, requisition, canCancel, onCancelLine }) {
  const [confirming, setConfirming] = useState(false);
  const onPo = isReqLineOnPo(requisition, line);
  const budget = (line.distributions || [])
    .map(d => [projectCode(d.projectId), taskCode(d.taskId)].filter(Boolean).join(' / '))
    .filter(Boolean);

  return (
    <li data-testid="locked-line" data-line-id={line.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="text-xs font-black text-gray-400 mt-0.5 shrink-0">#{line.lineNumber}</span>
        <div className="min-w-0">
          <div className="font-bold text-sm text-gray-800 dark:text-gray-100 line-clamp-2">{line.itemDescription}</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="font-mono">{line.sku}</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr">{line.quantity} {line.uom} × {money(line.unitPrice)}</span>
            {budget.length > 0 && <><span aria-hidden="true">·</span><span dir="ltr" className="font-mono">{budget.join(', ')}</span></>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 ps-7 sm:ps-0">
        <span className="font-black text-sm text-gray-900 dark:text-white">{money(lineAmount(line))}</span>
        {onPo ? (
          <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 whitespace-nowrap">מקושרת להזמנה</span>
        ) : !canCancel ? (
          <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 whitespace-nowrap" title="לביטול השורה האחרונה יש לבטל את הדרישה כולה">שורה אחרונה</span>
        ) : confirming ? (
          <span className="flex items-center gap-1 text-xs font-bold">
            <button type="button" onClick={() => { setConfirming(false); onCancelLine(line); }} className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer">בטל שורה</button>
            <button type="button" onClick={() => setConfirming(false)} className="px-2.5 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">חזרה</button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} data-testid="locked-line-cancel" className="text-xs font-bold px-3 py-1.5 rounded-lg text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer whitespace-nowrap">
            ביטול שורה
          </button>
        )}
      </div>
    </li>
  );
}

export default function LockedLines({ requisition, lines = [], onCancelLine, showNeedsNewLine = false }) {
  if (!requisition) return null;
  const cancelledCount = (requisition.lines || []).filter(l => l.cancelFlag === 'Y').length;
  const total = lines.reduce((s, l) => s + lineAmount(l), 0);

  return (
    <section data-testid="locked-lines" className="mt-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={LOCK_PATH} /></svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-black text-gray-900 dark:text-white">שורות שאושרו ({lines.length})</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              הדרישה אושרה והוחזרה מהקניין, ולכן אי אפשר לערוך את השורות האלה או למחוק את הדרישה. שורה שלא מקושרת להזמנה אפשר לבטל, ולהוסיף למטה שורה חדשה במקומה. בשליחה, הדרישה כולה עוברת סבב אישורים מחדש.
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 sm:text-end shrink-0 ps-12 sm:ps-0">
          סה"כ מאושר <span className="font-black text-gray-800 dark:text-gray-100">{money(total)}</span>
          {cancelledCount > 0 && <div className="mt-0.5">{cancelledCount === 1 ? 'שורה אחת בוטלה' : `${cancelledCount} שורות בוטלו`}</div>}
        </div>
      </div>

      {requisition.returnReason && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          <span className="font-black">סיבת ההחזרה מהקניין: </span>{requisition.returnReason}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {lines.map(line => (
          <LockedLineRow key={line.id} line={line} requisition={requisition} canCancel={lines.length > 1} onCancelLine={onCancelLine} />
        ))}
      </ul>

      {showNeedsNewLine && (
        <p role="alert" data-testid="amend-needs-line" className="mt-4 text-xs font-bold text-rose-600 dark:text-rose-400">
          כדי לשלוח את הדרישה לסבב מחדש יש להוסיף לפחות שורה חדשה.
        </p>
      )}
    </section>
  );
}
