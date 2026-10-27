import data from '../../data/data.json';

// ==========================================
// הגדרות תצוגה לכל סטטוס (שם בעברית + צבעים בסגנון של שאר המערכת)
// ==========================================
export const STATUS_META = {
  'INCOMPLETE': {
    label: 'טיוטה',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-200',
    dot: 'bg-gray-400',
    chipActive: 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900'
  },
  'IN PROCESS': {
    label: 'בסבב אישורים',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    dot: 'bg-blue-500',
    chipActive: 'bg-blue-600 text-white'
  },
  'REJECTED': {
    label: 'נדחתה',
    badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    dot: 'bg-red-500',
    chipActive: 'bg-red-600 text-white'
  },
  'APPROVED': {
    label: 'אושרה',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    chipActive: 'bg-emerald-600 text-white'
  },
  'RETURNED': {
    label: 'הוחזרה מקניין',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    dot: 'bg-amber-500',
    chipActive: 'bg-amber-500 text-white'
  },
  'CANCELLED': {
    label: 'בוטלה',
    badge: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 line-through decoration-gray-400/60',
    dot: 'bg-gray-300 dark:bg-gray-600',
    chipActive: 'bg-gray-500 text-white'
  }
};

export const STATUS_ORDER = ['INCOMPLETE', 'IN PROCESS', 'REJECTED', 'RETURNED', 'APPROVED', 'CANCELLED'];

// ==========================================
// אייקונים (Heroicons Outline - אותה ספרייה שבה משתמשים בשאר המערכת)
// ==========================================
export const ICON_PATHS = {
  list: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
  view: ['M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  edit: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
  copy: 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75',
  delete: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.76-2.164-1.904-2.201a51.964 51.964 0 00-3.32 0c-1.144.037-1.904 1.022-1.904 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
  cancel: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  chevronDown: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
  chevronLeft: 'M15.75 19.5L8.25 12l7.5-7.5',
  back: 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3',
  cart: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  check: 'M4.5 12.75l6 6 9-13.5',
  x: 'M6 18L18 6M6 6l12 12',
  clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  budget: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
  route: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5'
};

// ==========================================
// הגדרות הפעולות (שם, אייקון וצבע) - משותף לטבלה ולמסך הפרטים
// ==========================================
export const ACTION_META = {
  view:   { label: 'צפייה',  icon: 'view',   hover: 'hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-700' },
  edit:   { label: 'עריכה',  icon: 'edit',   hover: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30' },
  copy:   { label: 'העתקה לסל', icon: 'copy', hover: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30' },
  cancel: { label: 'ביטול דרישה', icon: 'cancel', hover: 'hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/30' },
  delete: { label: 'מחיקה',  icon: 'delete', hover: 'hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30' }
};

// ==========================================
// פורמטים
// ==========================================
export const formatMoney = (value) =>
  `₪${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const currencySymbol = (currency) => (currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₪');

export const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${formatDate(iso)}, ${d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
};

// ==========================================
// תרגום מזהים לשמות (מתוך data.json)
// ==========================================
const byId = (list, id) => (id === null || id === undefined || id === '' ? null : (list || []).find(x => String(x.id) === String(id)) || null);

export const lookup = {
  inventoryOrg: (id) => {
    const o = byId(data.inventoryOrganizations, id);
    return o ? `${o.code} - ${o.name}` : null;
  },
  subInventory: (orgId, code) => {
    if (!code) return null;
    const s = (data.subInventories || []).find(x => x.code === code && (!orgId || String(x.inventoryOrgId) === String(orgId)));
    return s ? `${s.code} - ${s.name}` : code;
  },
  project: (id) => {
    const p = byId(data.projects, id);
    return p ? `${p.projectCode} - ${p.projectName}` : null;
  },
  task: (id) => {
    const t = byId(data.tasks, id);
    return t ? `${t.taskCode} - ${t.taskName}` : null;
  },
  expenditureType: (id) => {
    const e = byId(data.expenditureTypes, id);
    return e ? `${e.expenditureTypeCode} - ${e.name}` : null;
  },
  expenditureOrg: (id) => byId(data.expenditureOrganizations, id)?.name || null,
  supplier: (id) => byId(data.suppliers, id)?.name || null,
  buyer: (id) => byId(data.buyers, id)?.name || null,
  user: (id) => {
    const u = byId(data.users, id);
    return u ? `${u.firstName} ${u.lastName || ''}`.trim() : null;
  },
  uom: (code) => (data.uoms || []).find(u => u.code === code)?.name || code || ''
};
