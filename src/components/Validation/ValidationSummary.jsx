import { getField } from '../../utils/validationScreens';
import { SeverityIcon } from './FieldMessage';

// ==========================================
// ריכוז הודעות ולידציה בתיבה אחת לפי סוג: חוסמות (אדום), אזהרות (ענבר) ומידע (כחול)
// משמש במגירת סבב המאשרים ובתצוגה המקדימה במסך הניהול
// ==========================================
const STYLES = {
  ERROR: { box: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200', title: 'יש לתקן לפני השליחה' },
  WARNING: { box: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-100', title: 'אזהרות' },
  INFO: { box: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/60 text-sky-800 dark:text-sky-200', chip: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-100', title: 'לידיעתך' }
};
const SCREEN_OF_SCOPE = { HEADER: 'CHECKOUT_HEADER', LINE: 'CHECKOUT_LINE', DIST: 'BUDGET' };

const whereText = (m) => {
  const field = getField(SCREEN_OF_SCOPE[m.scope] || m.screen, m.field)?.label;
  if (m.lineNumber) return `שורה ${m.lineNumber}${m.scope === 'DIST' && m.distIndex > 0 ? `, חלוקה ${m.distIndex + 1}` : ''}${field && m.field !== 'item' ? ` · ${field}` : ''}`;
  return field || '';
};

export default function ValidationSummary({ messages = [], titles = {} }) {
  if (!messages.length) return null;
  return (
    <div className="space-y-3">
      {['ERROR', 'WARNING', 'INFO'].map(sev => {
        const items = messages.filter(m => m.severity === sev);
        if (!items.length) return null;
        const s = STYLES[sev];
        return (
          <div key={sev} role={sev === 'ERROR' ? 'alert' : 'status'} data-testid={`validation-${sev.toLowerCase()}`} className={`p-3 rounded-xl border text-xs ${s.box}`}>
            <div className="flex items-center gap-2 font-black mb-1.5">
              <SeverityIcon severity={sev} />
              {titles[sev] || s.title}
            </div>
            <ul className="space-y-1.5 ps-6">
              {items.map((m, i) => {
                const where = whereText(m);
                return (
                  <li key={`${m.key}-${m.lineId ?? ''}-${m.distId ?? ''}-${i}`} data-testid="validation-message" className="font-medium leading-relaxed break-words">
                    {where && <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md me-1.5 align-[1px] whitespace-nowrap ${s.chip}`}>{where}</span>}
                    {m.message}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
