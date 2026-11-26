import { Icon } from '../Requisitions/RequisitionUiParts';
import { VALIDITY } from './toolsFormat';

// ==========================================
// רכיבים משותפים למסכי הכלים (בדיקת פרויקטים, סטטוס פריט ב-ERP)
// ==========================================

const TONES = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/50',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/50',
  red: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/50',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50',
  gray: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700/60 dark:text-gray-300 dark:border-gray-600'
};

export function Badge({ tone = 'gray', children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold whitespace-nowrap ${TONES[tone]} ${className}`}>{children}</span>;
}

export const ValidityBadge = ({ status }) => <Badge tone={VALIDITY[status]?.tone}>{VALIDITY[status]?.label || status}</Badge>;

export function ToolPage({ icon, title, subtitle, onBack, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-5 md:p-8 mt-6 transition-colors duration-300 border border-gray-100 dark:border-gray-700" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-5 border-gray-100 dark:border-gray-700 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Icon name={icon} className="w-6 h-6" />
            </div>
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">{subtitle}</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors cursor-pointer shrink-0 shadow-sm">
          <Icon name="back" className="w-4 h-4" strokeWidth={2.5} />
          חזור לדף הבית
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs font-semibold text-amber-800 dark:text-amber-200">
        <Icon name="warning" className="w-4 h-4 shrink-0" />
        <span>הנתונים במסך הזה הם נתוני דמו. בחיבור ל-EBS הם ייקראו דרך ה-API, לקריאה בלבד.</span>
      </div>

      {children}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, ariaLabel, inputRef }) {
  return (
    <div className="relative">
      <Icon name="search" className="w-5 h-5 absolute top-1/2 -translate-y-1/2 start-3 text-gray-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      />
    </div>
  );
}

export function Section({ title, aside, children }) {
  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <h3 className="text-sm font-black text-gray-900 dark:text-white">{title}</h3>
        {aside && <span className="text-xs text-gray-500 dark:text-gray-400">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export function Tile({ label, children }) {
  return (
    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 min-w-0">
      <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-gray-900 dark:text-white truncate">{children}</div>
    </div>
  );
}

export const Ltr = ({ children, className = '' }) => <bdi dir="ltr" className={className}>{children}</bdi>;
