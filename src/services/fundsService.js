import data from '../data/data.json';
import { readStore, writeStore, respond } from './storage';

// ==========================================
// בדיקת תקציב ושריון מדומים (מקביל ל-Funds Check / Reserve של Budgetary Control ב-EBS)
// - יתרות התקציב לכל סעיף (פרויקט + משימה) נטענות מ-data.json (budgetBalances)
// - השריונים שנוצרו במערכת נשמרים ביומן שריונים ב-localStorage, ברמת שורת החלוקה
// - יתרה זמינה = תקציב - ביצוע והתחייבויות - שריונים פעילים
// ==========================================
const LEDGER_KEY = 'appFundsLedger';

const readLedger = () => readStore(LEDGER_KEY, []);
const writeLedger = (ledger) => writeStore(LEDGER_KEY, ledger);

const accountKey = (projectId, taskId) => `${Number(projectId)}-${Number(taskId)}`;

const accountLabel = (projectId, taskId) => {
  const p = (data.projects || []).find(x => String(x.id) === String(projectId));
  const t = (data.tasks || []).find(x => String(x.id) === String(taskId));
  return {
    project: p ? `${p.projectCode} - ${p.projectName}` : `פרויקט ${projectId}`,
    task: t ? `${t.taskCode} - ${t.taskName}` : `משימה ${taskId}`
  };
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// סכום שורת חלוקה בש"ח
const distAmount = (line, dist) => {
  const fa = Number(dist.functionalAmount);
  if (Number.isFinite(fa) && fa > 0) return fa;
  return (Number(line.unitPrice) || 0) * (Number(dist.quantity) || 0) * (Number(line.rate) || 1);
};

// שורות החלוקה של הדרישה שנכנסות לבדיקה: שורות פעילות עם פרויקט ומשימה
const distRows = (lines) => {
  const rows = [];
  (lines || []).filter(l => l.cancelFlag !== 'Y').forEach(line => {
    (line.distributions || []).forEach(dist => {
      if (!dist.projectId || !dist.taskId) return;
      rows.push({ line, dist, amount: round2(distAmount(line, dist)) });
    });
  });
  return rows;
};

const reservedByAccount = (ledger, excludeRequisitionId) => {
  const map = {};
  ledger.forEach(e => {
    if (e.status !== 'RESERVED') return;
    if (excludeRequisitionId != null && String(e.requisitionId) === String(excludeRequisitionId)) return;
    const k = accountKey(e.projectId, e.taskId);
    map[k] = round2((map[k] || 0) + e.amount);
  });
  return map;
};

const balanceRows = (ledger, excludeRequisitionId) => {
  const reserved = reservedByAccount(ledger, excludeRequisitionId);
  return (data.budgetBalances || []).map(b => {
    const k = accountKey(b.projectId, b.taskId);
    const res = reserved[k] || 0;
    return {
      key: k,
      projectId: b.projectId,
      taskId: b.taskId,
      ...accountLabel(b.projectId, b.taskId),
      budgetAmount: b.budgetAmount,
      consumedAmount: b.consumedAmount,
      reservedAmount: res,
      availableAmount: round2(b.budgetAmount - b.consumedAmount - res)
    };
  });
};

const runCheck = (lines, excludeRequisitionId) => {
  const ledger = readLedger();
  const balances = Object.fromEntries(balanceRows(ledger, excludeRequisitionId).map(b => [b.key, b]));
  const required = {};
  distRows(lines).forEach(({ dist, amount }) => {
    const k = accountKey(dist.projectId, dist.taskId);
    required[k] = required[k] || { projectId: Number(dist.projectId), taskId: Number(dist.taskId), amount: 0 };
    required[k].amount = round2(required[k].amount + amount);
  });
  const accounts = Object.entries(required).map(([k, r]) => {
    const bal = balances[k];
    const available = bal ? bal.availableAmount : 0;
    return {
      key: k,
      projectId: r.projectId,
      taskId: r.taskId,
      ...accountLabel(r.projectId, r.taskId),
      requiredAmount: r.amount,
      availableAmount: available,
      noBudget: !bal,
      ok: !!bal && available >= r.amount
    };
  });
  const totalRequired = round2(accounts.reduce((s, a) => s + a.requiredAmount, 0));
  return { ok: accounts.every(a => a.ok), accounts, totalRequired };
};

// הודעת שגיאה לסעיף שאין בו מספיק תקציב (בסגנון הודעות EBS)
export const fundsFailureMessage = (acc) => acc.noBudget
  ? `לא הוגדר תקציב לפרויקט ${acc.project}, משימה ${acc.task}.`
  : `אין מספיק תקציב בפרויקט ${acc.project}, משימה ${acc.task}: נדרש ₪${acc.requiredAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, זמין ₪${Math.max(acc.availableAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;

// בדיקת תקציב בלבד - לא משריינת. excludeRequisitionId: דרישה קיימת שהשריון שלה לא נספר נגדה
export const checkFunds = (lines, { excludeRequisitionId = null } = {}) =>
  respond(runCheck(lines, excludeRequisitionId));

// שריון תקציב לדרישה (בעת שליחה לאישור). נכשל אם אין מספיק תקציב באחד הסעיפים
export const reserveFunds = (requisition, userId) => {
  const check = runCheck(requisition.lines, requisition.id);
  if (!check.ok) return respond({ ok: false, check });
  const now = new Date().toISOString();
  // שריון קודם של אותה דרישה (אם נשאר) מוחלף בשריון החדש
  const ledger = readLedger().map(e => (String(e.requisitionId) === String(requisition.id) && e.status === 'RESERVED'
    ? { ...e, status: 'RELEASED', releasedAt: now, releasedBy: userId, releaseReason: 'הוחלף בשריון חדש' }
    : e));
  let nextId = ledger.reduce((m, e) => Math.max(m, e.id || 0), 0) + 1;
  const entries = distRows(requisition.lines).map(({ line, dist, amount }) => ({
    id: nextId++,
    requisitionId: requisition.id,
    requisitionNumber: requisition.requisitionNumber,
    requisitionLineId: line.id,
    lineNumber: line.lineNumber,
    distributionId: dist.id,
    projectId: Number(dist.projectId),
    taskId: Number(dist.taskId),
    amount,
    status: 'RESERVED',
    reservedAt: now,
    reservedBy: userId
  }));
  writeLedger([...ledger, ...entries]);
  return respond({ ok: true, check, reservedAmount: round2(entries.reduce((s, e) => s + e.amount, 0)), entries });
};

// שחרור שריון: כל הדרישה, או רק שורות מסוימות (lineIds)
export const releaseFunds = (requisitionId, { userId = null, reason = '', lineIds = null } = {}) => {
  const now = new Date().toISOString();
  let released = 0;
  const ledger = readLedger().map(e => {
    if (e.status !== 'RESERVED' || String(e.requisitionId) !== String(requisitionId)) return e;
    if (lineIds && !lineIds.map(String).includes(String(e.requisitionLineId))) return e;
    released = round2(released + e.amount);
    return { ...e, status: 'RELEASED', releasedAt: now, releasedBy: userId, releaseReason: reason };
  });
  writeLedger(ledger);
  return respond({ releasedAmount: released });
};

// הסכום המשוריין כרגע לדרישה
export const getReservedAmount = (requisitionId) =>
  respond(round2(readLedger().filter(e => e.status === 'RESERVED' && String(e.requisitionId) === String(requisitionId)).reduce((s, e) => s + e.amount, 0)));

// למסך הניהול: יתרות לכל סעיף + יומן השריונים
export const getBalances = () => respond(balanceRows(readLedger(), null));
export const getLedger = () => respond(readLedger());
