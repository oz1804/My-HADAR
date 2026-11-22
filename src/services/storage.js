// ==========================================
// שכבת אחסון מקומית - כל השירותים עוברים דרכה.
// כרגע: data.json (נתוני "EBS" סטטיים) + localStorage (נתונים שנוצרו במערכת).
// בעתיד: הפונקציות בתיקיית services יפנו ל-API (ORDS) במקום לכאן, והמסכים לא ישתנו.
// ==========================================

export const readStore = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStore = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // אחסון מלא / חסום - לא מפילים את המערכת
  }
};

export const todayIso = () => new Date().toISOString().split('T')[0];

// בתוקף בתאריך (כמו START_DATE / END_DATE בטבלאות EBS)
export const isEffective = (row, date = todayIso()) =>
  !!row && (!row.startDate || row.startDate <= date) && (!row.endDate || row.endDate >= date);

// כל קריאה לשירות מחזירה Promise - כמו קריאת רשת אמיתית, כדי שהמעבר לשרת לא ידרוש שינוי במסכים
export const respond = (value) => Promise.resolve(JSON.parse(JSON.stringify(value ?? null)));
