import { budgetContext } from './validationScreens';
import { runScreen, visibleMessages } from './validationEngine';

// ==========================================
// בדיקת סעיף תקציבי בשורת חלוקה
// הבדיקות עצמן מוגדרות כוולידציות של המסך "סעיף תקציבי" (data.json -> validationRules)
// ונערכות במסך ניהול המערכת. כאן רק מריצים אותן על שורת חלוקה אחת.
// ==========================================

export { isActiveOn, isPurchasingAllowed, getLovText, BUDGET_SETUP_CONTACT } from './validationScreens';

export const BUDGET_FIELD_LABELS = {
  projectId: 'פרויקט',
  taskId: 'משימה',
  expenditureTypeId: 'סוג הוצאה',
  expenditureOrgId: 'יחידה מממנת'
};

// הודעות הסעיף התקציבי של שורת חלוקה. line = { destinationType, inventoryOrg }
// attempted = הייתה כבר לחיצה על הפעולה (אז מוצגות גם הודעות "בפעולה", כמו שדות חובה)
export const getBudgetMessages = (rules, line, dist, { attempted = false } = {}) =>
  visibleMessages(runScreen('BUDGET', budgetContext(line, dist), rules), attempted);
