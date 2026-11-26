import { SEVERITIES } from '../../utils/validationEngine';
import { SEVERITY_TEXT } from './fieldTone';

// ==========================================
// הודעות ולידציה ליד שדה
// מחשב (מרוחב md ומעלה): ליד השדה, בשורת התווית שלו - אייקון ותחילת ההודעה, והנוסח המלא במעבר עכבר / פוקוס
// נייד: מתחת לשדה, בנוסח מלא
// ==========================================

const ICONS = {
  ERROR: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z',
  WARNING: 'M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z',
  INFO: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z'
};


export function SeverityIcon({ severity, className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d={ICONS[severity] || ICONS.INFO} clipRule="evenodd" />
    </svg>
  );
}

// מחשב: ליד השדה (בשורת התווית). compact = אייקון בלבד (לשדות צרים). force = להציג בכל רוחב (תצוגה מקדימה)
export function FieldMessageSide({ messages = [], compact = false, className = '', force = false }) {
  if (!messages.length) return null;
  const first = messages[0];
  const label = messages.map(m => `${SEVERITIES[m.severity].short}: ${m.message}`).join('\n');
  return (
    <span
      tabIndex={0}
      aria-label={label}
      data-testid="field-message-side"
      data-validation-severity={first.severity}
      className={`group/fm relative ${force ? 'inline-flex' : 'hidden md:inline-flex'} items-center gap-1 min-w-0 text-[11px] font-bold leading-tight outline-none rounded focus-visible:ring-2 focus-visible:ring-blue-400 cursor-help ${SEVERITY_TEXT[first.severity]} ${className}`}
    >
      <SeverityIcon severity={first.severity} className="w-3.5 h-3.5 shrink-0" />
      {!compact && <span className="truncate">{first.message}</span>}
      {messages.length > 1 && <span className="shrink-0 px-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px]">+{messages.length - 1}</span>}
      <span
        role="tooltip"
        className="pointer-events-none invisible opacity-0 group-hover/fm:visible group-hover/fm:opacity-100 group-focus/fm:visible group-focus/fm:opacity-100 transition-opacity absolute z-50 bottom-full mb-1.5 end-0 w-72 max-w-[min(18rem,80vw)] p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl text-start"
      >
        <span className="flex flex-col gap-1.5">
          {messages.map(m => (
            <span key={m.key} className={`flex items-start gap-1.5 text-xs font-semibold leading-snug whitespace-normal ${SEVERITY_TEXT[m.severity]}`}>
              <SeverityIcon severity={m.severity} className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>{m.message}</span>
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

// נייד: מתחת לשדה
export function FieldMessageBelow({ messages = [], className = '', force = false }) {
  if (!messages.length) return null;
  return (
    <ul className={`${force ? '' : 'md:hidden'} mt-1.5 space-y-1 ${className}`} data-testid="field-message-below">
      {messages.map(m => (
        <li
          key={m.key}
          role={m.severity === 'ERROR' ? 'alert' : undefined}
          data-validation-severity={m.severity}
          className={`flex items-start gap-1.5 text-[11px] font-semibold leading-snug ${SEVERITY_TEXT[m.severity]}`}
        >
          <SeverityIcon severity={m.severity} className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span className="min-w-0 break-words">{m.message}</span>
        </li>
      ))}
    </ul>
  );
}

// שורת התווית של שדה: התווית מימין וההודעה (במחשב) משמאל
export function FieldLabelRow({ messages = [], compact = false, className = '', children }) {
  return (
    <div className={`flex items-start justify-between gap-2 min-w-0 ${className}`}>
      {children}
      <FieldMessageSide messages={messages} compact={compact} className="mt-px" />
    </div>
  );
}
