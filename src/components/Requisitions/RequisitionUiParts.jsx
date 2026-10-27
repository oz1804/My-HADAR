import { STATUS_META, ICON_PATHS } from './requisitionUi';

// תגית סטטוס צבעונית
export function StatusBadge({ status, size = 'sm' }) {
  const meta = STATUS_META[status] || STATUS_META.INCOMPLETE;
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-lg whitespace-nowrap ${sizeClass} ${meta.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`}></span>
      {meta.label}
    </span>
  );
}

// אייקון לפי שם
export function Icon({ name, className = 'w-5 h-5', strokeWidth = 2 }) {
  const paths = [].concat(ICON_PATHS[name] || []);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} stroke="currentColor" className={className} aria-hidden="true">
      {paths.map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />)}
    </svg>
  );
}

