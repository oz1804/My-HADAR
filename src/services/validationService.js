import data from '../data/data.json';
import { readStore, writeStore, respond, todayIso } from './storage';

// ==========================================
// ולידציות שמנהל המערכת מגדיר
// ולידציות המערכת (source: SYSTEM) מגיעות מ-data.json; שינויים של מנהל המערכת וולידציות חדשות
// נשמרים בדפדפן. בעתיד: טבלת Custom ב-EBS דרך ה-API
// ==========================================
const STORE_KEY = 'appValidationRules';
export const VALIDATION_RULES_CHANGED = 'hadar:validation-rules-changed';

const defaults = () => data.validationRules || [];

// השמור בדפדפן + ולידציות מערכת חדשות שעדיין לא נשמרו (למשל אחרי עדכון גרסה)
const load = () => {
  const stored = readStore(STORE_KEY, null);
  if (!Array.isArray(stored)) return defaults();
  const defaultIds = new Set(defaults().map(r => r.id));
  // ולידציית מערכת שהוסרה מ-data.json (למשל אחרי עדכון גרסה) לא נשארת מהעותק השמור
  const kept = stored.filter(r => r.source !== 'SYSTEM' || defaultIds.has(r.id));
  const ids = new Set(kept.map(r => r.id));
  return [...kept, ...defaults().filter(r => !ids.has(r.id))];
};
const save = (rules) => {
  writeStore(STORE_KEY, rules);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(VALIDATION_RULES_CHANGED));
};

// טעינה מיידית מהעותק המקומי - לאתחול המסכים בלי המתנה
export const loadValidationRulesSync = () => load();

export const getValidationRules = () => respond(load());

// יצירה או עדכון. מחזיר את הוולידציה השמורה
export const saveValidationRule = (rule, userId) => {
  const rules = load();
  const now = new Date().toISOString();
  const audit = { lastUpdatedBy: userId != null ? Number(userId) : null, lastUpdateDate: now };
  const exists = rule.id != null && rules.some(r => r.id === rule.id);
  let saved;
  if (exists) {
    const current = rules.find(r => r.id === rule.id);
    saved = { ...current, ...rule, source: current.source, locked: current.locked, ...audit };
    // ולידציה נעולה: אפשר לשנות רק את נוסח ההודעה
    if (current.locked) saved = { ...current, name: rule.name ?? current.name, message: rule.message ?? current.message, ...audit };
    save(rules.map(r => (r.id === rule.id ? saved : r)));
  } else {
    // ולידציות חדשות ממוספרות מ-1000 כדי לא להתנגש בוולידציות המערכת
    const id = rules.reduce((m, r) => Math.max(m, Number(r.id) || 0), 999) + 1;
    saved = {
      enabled: true,
      startDate: todayIso(),
      endDate: null,
      ...rule,
      id,
      source: 'CUSTOM',
      createdBy: audit.lastUpdatedBy,
      creationDate: now,
      ...audit
    };
    save([...rules, saved]);
  }
  return respond(saved);
};

export const setValidationRuleEnabled = (id, enabled, userId) => {
  const target = load().find(r => r.id === id);
  if (!target || target.locked) return respond(target || null);
  return saveValidationRule({ ...target, enabled: !!enabled }, userId);
};

// מחיקה - רק לוולידציות שמנהל המערכת הוסיף
export const deleteValidationRule = (id) => {
  const rules = load();
  if (rules.find(r => r.id === id)?.source !== 'CUSTOM') return respond(false);
  save(rules.filter(r => r.id !== id));
  return respond(true);
};

// החזרת ולידציית מערכת להגדרה המקורית
export const resetValidationRule = (id) => {
  const original = defaults().find(r => r.id === id);
  if (!original) return respond(null);
  save(load().map(r => (r.id === id ? original : r)));
  return respond(original);
};

export const isRuleModified = (rule) => {
  const original = defaults().find(r => r.id === rule.id);
  if (!original) return false;
  const pick = (r) => JSON.stringify([r.name, r.field, r.conditions, r.severity, r.timing, r.message, r.enabled !== false, r.startDate || null, r.endDate || null]);
  return pick(original) !== pick(rule);
};
