import { isEffective, todayIso } from '../services/storage';
import { OPERATORS } from './approvalEngine';
import {
  VALIDATION_SCREENS, getField, isTargetField,
  headerContext, lineContext, budgetContext
} from './validationScreens';

// ==========================================
// מנוע הוולידציות שמנהל המערכת מגדיר
// רשומת ולידציה: מסך + שדה (שלידו מוצגת ההודעה) + תנאים (וגם) + סוג הודעה + נוסח
// פונקציות טהורות: ההגדרות ונתוני המסך מגיעים כפרמטר
// ==========================================

export const SEVERITIES = {
  ERROR: { label: 'הודעה חוסמת', short: 'חוסמת', hint: 'הפעולה במסך לא תתבצע עד שהמצב יתוקן', order: 1 },
  WARNING: { label: 'הערת אזהרה', short: 'אזהרה', hint: 'ההודעה מוצגת והמשתמש יכול להמשיך. בשליחה לאישור נרשמת ביומן הפעולות', order: 2 },
  INFO: { label: 'מידע', short: 'מידע', hint: 'הודעה לידיעת המשתמש בלבד', order: 3 }
};

// מתי ההודעה מוצגת
export const TIMINGS = {
  IMMEDIATE: { label: 'מיד, תוך כדי הזנה', short: 'מיידית' },
  ON_ACTION: { label: 'בלחיצה על הפעולה במסך', short: 'בפעולה' }
};

export const VALIDATION_OPERATORS = {
  ...OPERATORS,
  CONTAINS: 'מכיל את הטקסט',
  NOT_CONTAINS: 'לא מכיל אף אחד מתוך',
  LENGTH_LT: 'קצר מ (תווים)'
};

export const OPERATORS_BY_TYPE = {
  text: ['IS_EMPTY', 'IS_NOT_EMPTY', 'EQUALS', 'NOT_EQUALS', 'CONTAINS', 'STARTS_WITH', 'LENGTH_LT'],
  number: ['GT', 'GTE', 'LT', 'LTE', 'EQUALS', 'NOT_EQUALS', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  date: ['IS_EMPTY', 'IS_NOT_EMPTY'],
  enum: ['EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  list: ['CONTAINS_ANY', 'NOT_CONTAINS', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  section: ['IS_EMPTY', 'IS_NOT_EMPTY']
};
export const VALUELESS_OPERATORS = ['IS_EMPTY', 'IS_NOT_EMPTY'];
export const MULTI_VALUE_OPERATORS = ['IN', 'NOT_IN', 'CONTAINS_ANY', 'NOT_CONTAINS'];
export const NUMERIC_VALUE_OPERATORS = ['GT', 'GTE', 'LT', 'LTE', 'LENGTH_LT'];

// ---------- הערכת תנאי ----------
const asList = (v) => (Array.isArray(v) ? v : [v]);
const present = (v) => v !== null && v !== undefined && String(v).trim() !== '' && !(typeof v === 'number' && Number.isNaN(v));
const same = (a, b) => String(a).trim() === String(b).trim();

// type: סוג השדה. בשדה מסוג section הערך הוא מספר הפריטים (למשל מספר שורות החלוקה)
export const evaluateCondition = (cond, values, type) => {
  const actual = values[cond.field];
  const list = asList(actual).filter(present);
  const expected = asList(cond.value);
  const isSection = type === 'section';
  switch (cond.operator) {
    case 'IS_EMPTY': return isSection ? !(Number(actual) > 0) : list.length === 0;
    case 'IS_NOT_EMPTY': return isSection ? Number(actual) > 0 : list.length > 0;
    case 'EQUALS': return list.some(a => same(a, expected[0]));
    case 'NOT_EQUALS': return !list.some(a => same(a, expected[0]));
    case 'IN':
    case 'CONTAINS_ANY': return list.some(a => expected.some(v => same(a, v)));
    case 'NOT_IN':
    case 'NOT_CONTAINS': return !list.some(a => expected.some(v => same(a, v)));
    case 'CONTAINS': return list.some(a => String(a).includes(String(expected[0] ?? '')));
    case 'STARTS_WITH': return list.some(a => String(a).startsWith(String(expected[0] ?? '')));
    case 'LENGTH_LT': return String(actual ?? '').trim().length < Number(expected[0]);
    case 'GT': case 'GTE': case 'LT': case 'LTE': {
      // השוואה מספרית לערך חסר (למשל תאריך נדרש שלא הוזן) - התנאי לא מתקיים
      if (!present(actual) || Number.isNaN(Number(actual))) return false;
      const a = Number(actual); const b = Number(expected[0]);
      return cond.operator === 'GT' ? a > b : cond.operator === 'GTE' ? a >= b : cond.operator === 'LT' ? a < b : a <= b;
    }
    default: return false;
  }
};

export const isRuleActive = (rule, date = todayIso()) => rule.enabled !== false && isEffective(rule, date);

const fillMessage = (template, vars) =>
  String(template || '').replace(/\{(\w+)\}/g, (m, key) => (vars[key] !== undefined && vars[key] !== null && vars[key] !== '' ? vars[key] : m));

// ==========================================
// הרצת הוולידציות של מסך אחד על נתוני המסך
// ctx = { values, vars, fieldVars } (מ-validationScreens)
// מחזיר [{ key, ruleId, field, severity, timing, message }] ממוין לפי חומרה
// ==========================================
export const runScreen = (screen, ctx, rules = [], { date = todayIso(), includeInactive = false } = {}) => {
  const def = VALIDATION_SCREENS[screen];
  if (!def || !ctx) return [];
  return rules
    .filter(r => r.screen === screen && (includeInactive || isRuleActive(r, date)))
    .filter(r => (r.conditions || []).every(c => evaluateCondition(c, ctx.values, def.fields[c.field]?.type)))
    .map(r => ({
      key: `${r.id}`,
      ruleId: r.id,
      ruleName: r.name,
      field: r.field,
      severity: SEVERITIES[r.severity] ? r.severity : 'ERROR',
      timing: TIMINGS[r.timing] ? r.timing : 'IMMEDIATE',
      message: fillMessage(r.message, { ...(ctx.vars || {}), ...(ctx.fieldVars?.[r.field] || {}) })
    }))
    .sort((a, b) => SEVERITIES[a.severity].order - SEVERITIES[b.severity].order);
};

// --- עזרים לתצוגה ---
// ההודעות שמוצגות עכשיו: מיידיות תמיד, "בפעולה" רק אחרי ניסיון הפעולה
export const visibleMessages = (messages, attempted) => (messages || []).filter(m => m.timing === 'IMMEDIATE' || attempted);
export const messagesFor = (messages, field) => (messages || []).filter(m => m.field === field);
export const hasBlocking = (messages) => (messages || []).some(m => m.severity === 'ERROR');
export const worstSeverity = (messages) => (messages || []).reduce((w, m) => (!w || SEVERITIES[m.severity].order < SEVERITIES[w].order ? m.severity : w), null);

// ==========================================
// סל הדרישה: כותרת, שורות ושורות חלוקה בבת אחת
// ==========================================
export const validateCheckout = ({ rules = [], header = {}, lines = [], date = todayIso() }) => {
  const active = (lines || []).filter(l => l && l.cancelFlag !== 'Y');
  const all = [];
  const headerMsgs = runScreen('CHECKOUT_HEADER', headerContext(header, active), rules, { date });
  headerMsgs.forEach(m => all.push({ ...m, scope: 'HEADER' }));

  const byLine = {};
  const byDist = {};
  active.forEach((line, idx) => {
    const lineNumber = line.lineNumber || idx + 1;
    const lineMsgs = runScreen('CHECKOUT_LINE', lineContext(line, { lines: active, day: date }), rules, { date });
    byLine[line.id] = lineMsgs;
    lineMsgs.forEach(m => all.push({ ...m, scope: 'LINE', lineId: line.id, lineNumber }));
    // שורה בלי חלוקה: בודקים חלוקה ריקה כדי שהשדות החסרים יסומנו
    const dists = (line.distributions || []).length ? line.distributions : [{ id: `${line.id}-empty` }];
    dists.forEach((dist, distIndex) => {
      const distMsgs = runScreen('BUDGET', budgetContext(line, dist, date), rules, { date });
      byDist[dist.id] = distMsgs;
      distMsgs.forEach(m => all.push({ ...m, scope: 'DIST', lineId: line.id, lineNumber, distId: dist.id, distIndex }));
    });
  });
  return { header: headerMsgs, lines: byLine, dists: byDist, all };
};

// "שורה 2 · פרויקט: ..." - ליומן הפעולות ולרשימות טקסט
export const messageText = (m) => {
  const fieldLabel = m.scope === 'DIST' ? getField('BUDGET', m.field)?.label : m.scope === 'LINE' ? getField('CHECKOUT_LINE', m.field)?.label : null;
  const where = m.lineNumber ? `שורה ${m.lineNumber}${m.scope === 'DIST' && m.distIndex > 0 ? ` (חלוקה ${m.distIndex + 1})` : ''}${fieldLabel ? ` · ${fieldLabel}` : ''}: ` : '';
  return `${where}${m.message}`;
};

// ==========================================
// בדיקת הגדרת ולידציה לפני שמירה (במסך הניהול)
// ==========================================
export const validateRuleDefinition = (rule) => {
  const errors = {};
  const screen = VALIDATION_SCREENS[rule.screen];
  if (!String(rule.name || '').trim()) errors.name = 'יש להזין שם';
  if (!screen) errors.screen = 'יש לבחור מסך';
  else if (!isTargetField(screen.fields[rule.field])) errors.field = 'יש לבחור את השדה שלידו תוצג ההודעה';
  if (!String(rule.message || '').trim()) errors.message = 'יש להזין את נוסח ההודעה';
  if (!SEVERITIES[rule.severity]) errors.severity = 'יש לבחור סוג הודעה';
  if (!TIMINGS[rule.timing]) errors.timing = 'יש לבחור מתי להציג';
  if (rule.endDate && rule.startDate && rule.endDate < rule.startDate) errors.dates = 'תאריך הסיום מוקדם מתאריך ההתחלה';
  if (screen && (rule.conditions || []).length === 0) errors.conditions = 'יש להוסיף לפחות תנאי אחד';
  (rule.conditions || []).forEach((c, i) => {
    const f = screen?.fields[c.field];
    if (!f) { errors[`cond-${i}`] = 'יש לבחור שדה'; return; }
    if (!OPERATORS_BY_TYPE[f.type].includes(c.operator)) { errors[`cond-${i}`] = 'יש לבחור אופרטור'; return; }
    if (VALUELESS_OPERATORS.includes(c.operator)) return;
    const values = [].concat(c.value).filter(v => v !== '' && v !== null && v !== undefined);
    if (values.length === 0) errors[`cond-${i}`] = 'יש להזין ערך';
    else if ((f.type === 'number' || NUMERIC_VALUE_OPERATORS.includes(c.operator)) && values.some(v => Number.isNaN(Number(v)))) errors[`cond-${i}`] = 'יש להזין מספר';
  });
  return errors;
};
