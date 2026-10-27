import data from '../data/data.json';

// ==========================================
// בדיקת סעיף תקציבי בשורות החלוקה - חובה לפני העברה לסבב אישורים
// ==========================================

export const BUDGET_FIELD_LABELS = {
  projectId: 'פרויקט',
  taskId: 'משימה',
  expenditureTypeId: 'סוג הוצאה',
  expenditureOrgId: 'יחידה מממנת'
};

const isEmpty = (v) => v === null || v === undefined || v === '' || Number.isNaN(v);

// אילו שדות חובה לפי יעד השורה (זהה לשדות שמוצגים בשורת החלוקה ב-Checkout)
export const getRequiredBudgetFields = (line) =>
  line?.destinationType === 'Inventory'
    ? ['projectId', 'taskId']
    : ['projectId', 'taskId', 'expenditureTypeId', 'expenditureOrgId'];

// השדות החסרים בשורת חלוקה אחת
export const getMissingDistFields = (line, dist) => {
  const missing = getRequiredBudgetFields(line).filter(f => isEmpty(dist?.[f]));

  // משימה שלא שייכת לפרויקט שנבחר נחשבת כחסרה
  if (!missing.includes('taskId') && !isEmpty(dist?.projectId)) {
    const task = (data.tasks || []).find(t => String(t.id) === String(dist.taskId));
    if (!task || String(task.projectId) !== String(dist.projectId)) missing.push('taskId');
  }
  return missing;
};

// מחזיר רק את השורות שיש בהן חלוקות עם שדות חסרים
// [{ lineId, lineNumber, itemDescription, dists: [{ index, missing: ['projectId', ...] }] }]
export const validateBudgetForApproval = (lines = []) =>
  lines
    .filter(Boolean)
    .map((line, idx) => {
      const dists = (line.distributions || []);
      const distErrors = dists.length === 0
        ? [{ index: 0, missing: getRequiredBudgetFields(line) }]
        : dists
            .map((d, i) => ({ index: i, missing: getMissingDistFields(line, d) }))
            .filter(d => d.missing.length > 0);
      return { lineId: line.id, lineNumber: line.lineNumber || idx + 1, itemDescription: line.itemDescription, dists: distErrors };
    })
    .filter(l => l.dists.length > 0);
