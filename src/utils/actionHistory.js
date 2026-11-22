// ==========================================
// יומן פעולות לדרישה (מקביל ל-PO_ACTION_HISTORY ב-EBS)
// כל רישום: מספר רץ, קוד פעולה, מי ביצע (null = המערכת), מתי, הערה ופרטים
// ==========================================
export const ACTION_CODES = {
  CREATE: { label: 'יצירת דרישה', tone: 'gray' },
  SUBMIT: { label: 'הגשה לאישור', tone: 'blue' },
  FUNDS_RESERVE: { label: 'שריון תקציב', tone: 'indigo' },
  APPROVE: { label: 'אישור', tone: 'emerald' },
  FINAL_APPROVE: { label: 'אישור סופי', tone: 'emerald' },
  REJECT: { label: 'דחייה', tone: 'red' },
  FUNDS_RELEASE: { label: 'שחרור שריון', tone: 'amber' },
  WITHDRAW: { label: 'משיכה מסבב האישורים', tone: 'amber' },
  CANCEL: { label: 'ביטול דרישה', tone: 'gray' },
  CANCEL_LINE: { label: 'ביטול שורה', tone: 'gray' }
};

export const makeAction = (actionCode, { userId = null, note = '', stepTitle = '', amount = null, lineNumbers = null } = {}) => ({
  actionCode,
  userId: userId != null ? Number(userId) : null,
  actionDate: new Date().toISOString(),
  note,
  stepTitle,
  amount,
  lineNumbers
});

// הוספת רישומים לדרישה (מספר רץ ממשיך מהרישום האחרון)
export const appendActions = (req, actions) => {
  const history = req.actionHistory || [];
  let seq = history.reduce((m, a) => Math.max(m, a.sequence || 0), 0);
  return { ...req, actionHistory: [...history, ...actions.filter(Boolean).map(a => ({ ...a, sequence: ++seq }))] };
};
