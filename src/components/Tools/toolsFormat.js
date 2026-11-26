// עיצוב תאריכים, סכומים ותוקף במסכי הכלים

export const formatDay = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const money = (n) => `₪${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const VALIDITY = {
  ACTIVE: { label: 'בתוקף', tone: 'green' },
  EXPIRED: { label: 'לא בתוקף', tone: 'red' },
  FUTURE: { label: 'עוד לא בתוקף', tone: 'amber' }
};
