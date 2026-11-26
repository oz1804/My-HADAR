import data from '../data/data.json';
import { respond, todayIso } from './storage';
import { getBalances } from './fundsService';

// ==========================================
// בדיקת פרויקט: תוקף הפרויקט והמשימות, ארגוני המלאי, סוגי ההוצאה המותרים, ה-Primary Planner ויתרת התקציב
// (מקביל ל-PA_PROJECTS_ALL / PA_TASKS ולבדיקת התקציב של Budgetary Control ב-EBS)
// בחיבור ל-EBS: קריאה בלבד דרך ה-API, בלי גישה ישירה ל-DB
// ==========================================
const norm = (s) => String(s ?? '').trim().toLowerCase();

// ACTIVE / EXPIRED (תאריך הסיום עבר) / FUTURE (עוד לא התחיל)
export const validityStatus = (row, day = todayIso()) => {
  if (row?.startDate && row.startDate > day) return 'FUTURE';
  if (row?.endDate && row.endDate < day) return 'EXPIRED';
  return 'ACTIVE';
};

const projectSummary = (p) => ({
  id: p.id, projectCode: p.projectCode, projectName: p.projectName,
  startDate: p.startDate || null, endDate: p.endDate || null, status: validityStatus(p)
});

export const searchProjects = (query = '') => {
  const q = norm(query);
  const list = (data.projects || [])
    .filter(p => !q || norm(p.projectCode).includes(q) || norm(p.projectName).includes(q))
    .map(projectSummary);
  return respond(list);
};

export const getProjectCheck = async (projectId) => {
  const p = (data.projects || []).find(x => String(x.id) === String(projectId));
  if (!p) return null;
  const balances = await getBalances();
  const planner = (data.users || []).find(u => String(u.id) === String(p.primaryPlannerUserId));
  const tasks = (data.tasks || []).filter(t => String(t.projectId) === String(p.id)).map(t => {
    const bal = balances.find(b => String(b.projectId) === String(p.id) && String(b.taskId) === String(t.id));
    return {
      id: t.id, taskCode: t.taskCode, taskName: t.taskName, startDate: t.startDate || null, endDate: t.endDate || null,
      status: validityStatus(t),
      budget: bal ? { budgetAmount: bal.budgetAmount, consumedAmount: bal.consumedAmount, reservedAmount: bal.reservedAmount, availableAmount: bal.availableAmount } : null
    };
  });
  const orgs = (data.inventoryOrganizations || []).filter(o => (p.inventoryOrgIds || []).map(Number).includes(Number(o.id)))
    .map(({ id, code, name }) => ({ id, code, name }));
  const expenditureTypes = (data.expenditureTypes || []).filter(et => (p.allowedExpenditureTypeIds || []).map(Number).includes(Number(et.id)))
    .map(et => ({ id: et.id, code: et.expenditureTypeCode, name: et.name, status: validityStatus(et) }));
  const withBudget = tasks.filter(t => t.budget);
  return respond({
    ...projectSummary(p),
    primaryPlanner: planner ? { id: planner.id, name: [planner.firstName, planner.lastName].filter(Boolean).join(' '), job: planner.job || '' } : null,
    orgs,
    expenditureTypes,
    tasks,
    totals: withBudget.length ? {
      budgetAmount: withBudget.reduce((s, t) => s + t.budget.budgetAmount, 0),
      availableAmount: withBudget.reduce((s, t) => s + t.budget.availableAmount, 0)
    } : null
  });
};
