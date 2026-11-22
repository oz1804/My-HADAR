import { Icon } from '../Requisitions/RequisitionUiParts';
import { PO_TYPE_META, PO_STATUS_META, PO_CLOSED_META } from '../../utils/purchaseOrders';

// תגית סטטוס של הזמנה / הוראת משיכה
export function PoStatusBadge({ status, size = 'sm' }) {
  const meta = PO_STATUS_META[status] || PO_STATUS_META.INCOMPLETE;
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-lg whitespace-nowrap ${sizeClass} ${meta.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`}></span>
      {meta.label}
    </span>
  );
}

// תגית מצב סגירה (מוצגת רק כשההזמנה לא פתוחה)
export function PoClosedBadge({ closedCode, size = 'sm' }) {
  if (!closedCode || closedCode === 'OPEN') return null;
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-lg whitespace-nowrap border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 ${sizeClass}`}>
      <Icon name="check" className="w-3 h-3" strokeWidth={3} />
      {(PO_CLOSED_META[closedCode] || {}).label || closedCode}
    </span>
  );
}

export function PoTypeBadge({ kind, size = 'sm' }) {
  const meta = PO_TYPE_META[kind] || PO_TYPE_META.STANDARD;
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-[10px] px-2 py-0.5';
  return <span className={`inline-flex items-center font-bold rounded-md whitespace-nowrap ${sizeClass} ${meta.badge}`}>{meta.label}</span>;
}

// כפתור-תגית עם מספר ההזמנה / הוראת המשיכה - לחיצה פותחת את מסך ההזמנה
export function PoDocChip({ doc, onOpen, size = 'sm', suffix }) {
  if (!doc) return null;
  const isRelease = doc.kind === 'RELEASE';
  const sizeClass = size === 'xs' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onOpen(doc); }}
      title={`${PO_TYPE_META[doc.kind]?.label || 'הזמנה'} ${doc.number}${suffix ? ` · ${suffix}` : ''} · ${PO_STATUS_META[doc.authorizationStatus]?.label || doc.authorizationStatus}`}
      className={`inline-flex items-center font-mono font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer border ${sizeClass} ${
        isRelease
          ? 'bg-fuchsia-50 border-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-100 hover:border-fuchsia-200 dark:bg-fuchsia-900/20 dark:border-fuchsia-900/40 dark:text-fuchsia-300 dark:hover:bg-fuchsia-900/40'
          : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/40'
      }`}
    >
      <Icon name="document" className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <bdi>{doc.number}</bdi>
      {suffix && <span className="font-sans font-semibold opacity-75">· {suffix}</span>}
    </button>
  );
}

// ההזמנה של שורת דרישה + שורת ההזמנה המקושרת אליה: "348000101 · שורה 2" (ומשלוח, אם יש לשורה כמה משלוחים)
export function PoLineLinkChip({ link, onOpen }) {
  if (!link?.doc) return null;
  const suffix = [`שורה ${link.poLineNum}`, link.shipmentNum ? `משלוח ${link.shipmentNum}` : null].filter(Boolean).join(' · ');
  return <PoDocChip doc={link.doc} suffix={suffix} onOpen={(doc) => onOpen(doc, link.poLineId)} />;
}
