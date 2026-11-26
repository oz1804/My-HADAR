import { useEffect, useMemo, useRef, useState } from 'react';
import data from '../../data/data.json';
import {
  getValidationRules, saveValidationRule, setValidationRuleEnabled, deleteValidationRule, resetValidationRule, isRuleModified
} from '../../services/validationService';
import { todayIso } from '../../services/storage';
import { userDisplayName } from '../../utils/approvalEngine';
import {
  SEVERITIES, TIMINGS, VALIDATION_OPERATORS, OPERATORS_BY_TYPE, VALUELESS_OPERATORS, MULTI_VALUE_OPERATORS, NUMERIC_VALUE_OPERATORS,
  isRuleActive, validateRuleDefinition
} from '../../utils/validationEngine';
import { VALIDATION_SCREENS, getField, fieldOptions, isTargetField } from '../../utils/validationScreens';
import { SeverityIcon, FieldMessageSide, FieldMessageBelow } from '../Validation/FieldMessage';
import { Icon } from '../Requisitions/RequisitionUiParts';
import { formatDate, formatDateTime } from '../Requisitions/requisitionUi';

// ==========================================
// ניהול ולידציות: רשומה = מסך + שדה + תנאים + סוג הודעה + נוסח
// הפעלה / השבתה, עריכה, הוספה. ולידציות המערכת (מ-data.json) אפשר לשנות ולהחזיר להגדרה המקורית
// ==========================================

const SEVERITY_STYLE = {
  ERROR: { badge: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', active: 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500', icon: 'text-rose-500' },
  WARNING: { badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', active: 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 ring-1 ring-amber-500', icon: 'text-amber-500' },
  INFO: { badge: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300', active: 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500', icon: 'text-sky-500' }
};

const inputCls = 'w-full p-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-800 disabled:cursor-not-allowed';
const labelCls = 'block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5';
const chipCls = (on) => `px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${on ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'}`;

const LOCK_PATH = 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z';
const RESET_PATH = 'M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3';
const SvgIcon = ({ d, className = 'w-4 h-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const userById = (id) => data.users.find(u => String(u.id) === String(id));
const SCREEN_GROUPS = [...new Set(Object.values(VALIDATION_SCREENS).map(s => s.group))];

// תיאור תנאי בשפה פשוטה: "מצב הפרויקט שווה ל לא בתוקף"
const conditionText = (screen, c) => {
  const f = getField(screen, c.field);
  const head = `${f?.label || c.field} ${VALIDATION_OPERATORS[c.operator] || c.operator}`;
  if (VALUELESS_OPERATORS.includes(c.operator)) return head;
  const opts = fieldOptions(f);
  const values = [].concat(c.value).map(v => opts.find(o => String(o.value) === String(v))?.label ?? (f?.type === 'number' ? Number(v).toLocaleString() : v));
  return `${head} ${values.join(', ')}`;
};

// נוסח ההודעה עם המשתנים מסומנים
function MessageWithTokens({ text, screen }) {
  const labels = VALIDATION_SCREENS[screen]?.placeholders || {};
  return String(text || '').split(/(\{\w+\})/g).map((part, i) => {
    const key = part.slice(1, -1);
    return /^\{\w+\}$/.test(part) && labels[key]
      ? <span key={i} className="inline-block px-1.5 py-px mx-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 align-[1px]">{labels[key]}</span>
      : <span key={i}>{part}</span>;
  });
}

const fillSample = (text, screen) => {
  const sample = VALIDATION_SCREENS[screen]?.sample || {};
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (sample[k] ?? m));
};

const defaultValueFor = (operator) => (VALUELESS_OPERATORS.includes(operator) ? null : MULTI_VALUE_OPERATORS.includes(operator) ? [] : '');
const firstOperator = (screen, field) => OPERATORS_BY_TYPE[getField(screen, field)?.type || 'text'][0];
const newCondition = (screen, field) => {
  const operator = firstOperator(screen, field);
  return { field, operator, value: defaultValueFor(operator) };
};
const firstTarget = (screen) => Object.entries(VALIDATION_SCREENS[screen].fields).find(([, f]) => isTargetField(f))?.[0];
const emptyRule = () => {
  const screen = 'CHECKOUT_LINE';
  const field = 'quantity';
  return { name: '', screen, field, conditions: [newCondition(screen, field)], severity: 'ERROR', timing: 'IMMEDIATE', message: '', enabled: true, startDate: todayIso(), endDate: null };
};

function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? '-translate-x-[22px]' : '-translate-x-0.5'}`} />
    </button>
  );
}

// ==========================================
// תצוגה מקדימה: איך ההודעה תיראה במחשב (ליד השדה) ובנייד (מתחת לשדה)
// ==========================================
function MessagePreview({ draft }) {
  const fieldLabel = getField(draft.screen, draft.field)?.label || 'שדה';
  const msg = draft.message.trim() ? [{ key: 'p', severity: draft.severity, message: fillSample(draft.message, draft.screen) }] : [];
  const box = 'p-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30';
  const fakeInput = `h-9 rounded-lg border bg-white dark:bg-gray-800 ${msg.length ? { ERROR: 'border-rose-400 ring-1 ring-rose-200', WARNING: 'border-amber-400 ring-1 ring-amber-200', INFO: 'border-sky-300' }[draft.severity] : 'border-gray-200 dark:border-gray-600'}`;
  return (
    <div data-testid="validation-preview">
      <div className={labelCls}>תצוגה מקדימה <span className="font-medium text-gray-400">(עם ערכים לדוגמה)</span></div>
      {msg.length === 0 ? (
        <p className="text-xs text-gray-400">ההודעה תוצג כאן.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-3">
          <div className={box}>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">במחשב · ליד השדה</div>
            <div className="flex items-start justify-between gap-2 min-w-0">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{fieldLabel}</span>
              <FieldMessageSide messages={msg} force />
            </div>
            <div className={fakeInput} />
          </div>
          <div className={`${box} max-w-xs`}>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">בנייד · מתחת לשדה</div>
            <span className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{fieldLabel}</span>
            <div className={fakeInput} />
            <FieldMessageBelow messages={msg} force />
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// עורך ולידציה (חלון)
// ==========================================
function ValidationEditor({ initial, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => (initial ? JSON.parse(JSON.stringify(initial)) : emptyRule()));
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const messageRef = useRef(null);
  const locked = !!initial?.locked;
  const isSystem = initial?.source === 'SYSTEM';

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const errors = useMemo(() => validateRuleDefinition(draft), [draft]);
  const hasErrors = Object.keys(errors).length > 0;
  const set = (patch) => setDraft(d => ({ ...d, ...patch }));
  const screen = VALIDATION_SCREENS[draft.screen];
  const fieldEntries = Object.entries(screen.fields);
  const targetEntries = fieldEntries.filter(([, f]) => isTargetField(f));

  // החלפת מסך: שדה ותנאים מתחילים מחדש
  const changeScreen = (code) => {
    const field = firstTarget(code);
    setDraft(d => ({ ...d, screen: code, field, conditions: [newCondition(code, field)] }));
  };
  // החלפת השדה: התנאי הראשון עובר איתו אם הוא היה על השדה הקודם
  const changeField = (field) => setDraft(d => ({
    ...d,
    field,
    conditions: d.conditions.length && d.conditions[0].field === d.field
      ? [newCondition(d.screen, field), ...d.conditions.slice(1)]
      : d.conditions
  }));

  const updateCondition = (i, patch) => setDraft(d => ({ ...d, conditions: d.conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));
  const changeCondField = (i, field) => updateCondition(i, newCondition(draft.screen, field));
  const changeOperator = (i, operator) => {
    const current = [].concat(draft.conditions[i].value ?? []).filter(v => v !== '');
    const value = VALUELESS_OPERATORS.includes(operator) ? null
      : MULTI_VALUE_OPERATORS.includes(operator) ? current
      : (current[0] ?? '');
    updateCondition(i, { operator, value });
  };
  const toggleValue = (i, v) => {
    const list = [].concat(draft.conditions[i].value ?? []);
    updateCondition(i, { value: list.some(x => String(x) === String(v)) ? list.filter(x => String(x) !== String(v)) : [...list, v] });
  };
  const addCondition = () => setDraft(d => ({ ...d, conditions: [...d.conditions, newCondition(d.screen, d.field)] }));
  const removeCondition = (i) => setDraft(d => ({ ...d, conditions: d.conditions.filter((_, idx) => idx !== i) }));

  const insertPlaceholder = (token) => {
    const el = messageRef.current;
    const text = draft.message || '';
    const start = el ? el.selectionStart : text.length;
    const end = el ? el.selectionEnd : text.length;
    set({ message: text.slice(0, start) + token + text.slice(end) });
    requestAnimationFrame(() => { if (el) { el.focus(); el.selectionStart = el.selectionEnd = start + token.length; } });
  };

  const handleSave = async () => {
    if (hasErrors) { setShowErrors(true); return; }
    setSaving(true);
    await onSave({
      ...draft,
      name: draft.name.trim(),
      message: draft.message.trim(),
      endDate: draft.endDate || null,
      conditions: draft.conditions.map(c => {
        const f = getField(draft.screen, c.field);
        const numeric = f?.type === 'number' || NUMERIC_VALUE_OPERATORS.includes(c.operator);
        return { field: c.field, operator: c.operator, value: numeric && c.value !== null && c.value !== '' ? Number(c.value) : c.value };
      })
    });
  };

  const err = (key) => (showErrors && errors[key] ? <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{errors[key]}</p> : null);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in p-3 sm:p-4" dir="rtl" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="validation-editor-title"
        data-testid="validation-editor"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between gap-3 p-5 sm:px-7 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <h3 id="validation-editor-title" className="text-xl font-black text-gray-900 dark:text-white">{initial ? 'עריכת ולידציה' : 'ולידציה חדשה'}</h3>
          <button onClick={onCancel} aria-label="סגור" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer">
            <Icon name="x" className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:px-7 space-y-6 custom-scrollbar">
          {locked && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
              <SvgIcon d={LOCK_PATH} className="w-4 h-4 shrink-0 mt-px" />
              <span>ולידציית מערכת נעולה: היא שומרת על תקינות הנתונים שעוברים ל-EBS, ולכן אפשר לשנות בה רק את השם ואת נוסח ההודעה.</span>
            </div>
          )}

          {/* שם */}
          <div>
            <label htmlFor="vr-name" className={labelCls}>שם הוולידציה <span className="text-red-500">*</span></label>
            <input id="vr-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder='לדוגמה: כמות מעל 100 יחידות' />
            {err('name')}
          </div>

          {/* מסך ושדה */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="vr-screen" className={labelCls}>המסך</label>
              <select id="vr-screen" value={draft.screen} disabled={locked || isSystem} onChange={(e) => changeScreen(e.target.value)} className={inputCls}>
                {SCREEN_GROUPS.map(g => (
                  <optgroup key={g} label={g}>
                    {Object.entries(VALIDATION_SCREENS).filter(([, s]) => s.group === g).map(([code, s]) => <option key={code} value={code}>{s.label}</option>)}
                  </optgroup>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-snug">
                הודעה חוסמת עוצרת את הפעולה: <span className="font-bold">{screen.action}</span>.{screen.note ? ` ${screen.note}` : ''}
              </p>
            </div>
            <div>
              <label htmlFor="vr-field" className={labelCls}>השדה שלידו תוצג ההודעה</label>
              <select id="vr-field" value={draft.field} disabled={locked} onChange={(e) => changeField(e.target.value)} className={inputCls}>
                {targetEntries.map(([code, f]) => <option key={code} value={code}>{f.label}</option>)}
              </select>
              {err('field')}
            </div>
          </div>

          {/* סוג ההודעה */}
          <div>
            <span className={labelCls}>סוג ההודעה</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="סוג ההודעה">
              {Object.entries(SEVERITIES).map(([code, s]) => {
                const on = draft.severity === code;
                return (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    data-severity={code}
                    disabled={locked}
                    onClick={() => set({ severity: code })}
                    className={`text-start p-3 rounded-2xl border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${on ? SEVERITY_STYLE[code].active : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-black">
                      <SeverityIcon severity={code} className={`w-4 h-4 ${SEVERITY_STYLE[code].icon}`} />
                      {s.label}
                    </span>
                    <span className="block text-[11px] font-medium mt-1 opacity-80 leading-snug">{s.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* מתי מוצגת */}
          <div>
            <span className={labelCls}>מתי ההודעה מוצגת</span>
            <div className="inline-flex flex-wrap p-1 rounded-xl bg-gray-100 dark:bg-gray-700/60" role="radiogroup" aria-label="מתי ההודעה מוצגת">
              {Object.entries(TIMINGS).map(([code, t]) => (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={draft.timing === code}
                  disabled={locked}
                  onClick={() => set({ timing: code })}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer disabled:cursor-not-allowed ${draft.timing === code ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                  {code === 'ON_ACTION' ? `בלחיצה על ${screen.action}` : t.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
              {draft.timing === 'IMMEDIATE' ? 'ההודעה מופיעה ונעלמת תוך כדי שהמשתמש ממלא את השדות.' : 'מתאים לשדות חובה: ההודעה מופיעה רק אחרי שהמשתמש ניסה לבצע את הפעולה, ומתעדכנת בזמן התיקון.'}
            </p>
          </div>

          {/* תנאים */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">תנאים</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">ההודעה מוצגת כשכל התנאים מתקיימים (וגם)</span>
            </div>
            <div className="space-y-2">
              {draft.conditions.map((c, i) => {
                const f = getField(draft.screen, c.field) || { type: 'text' };
                const opts = fieldOptions(f);
                const isMulti = MULTI_VALUE_OPERATORS.includes(c.operator);
                const noValue = VALUELESS_OPERATORS.includes(c.operator);
                const numericValue = f.type === 'number' || NUMERIC_VALUE_OPERATORS.includes(c.operator);
                return (
                  <div key={i} data-testid="condition-row" className={`p-3 rounded-2xl border ${showErrors && errors[`cond-${i}`] ? 'border-rose-300 dark:border-rose-700' : 'border-gray-100 dark:border-gray-700'} bg-gray-50/50 dark:bg-gray-900/20`}>
                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1.4fr)_auto] gap-2 items-start">
                      <select aria-label="שדה" value={c.field} disabled={locked} onChange={(e) => changeCondField(i, e.target.value)} className={inputCls}>
                        {fieldEntries.map(([code, fd]) => <option key={code} value={code}>{fd.label}</option>)}
                      </select>
                      <select aria-label="אופרטור" value={c.operator} disabled={locked} onChange={(e) => changeOperator(i, e.target.value)} className={inputCls}>
                        {OPERATORS_BY_TYPE[f.type].map(op => <option key={op} value={op}>{VALIDATION_OPERATORS[op]}</option>)}
                      </select>
                      <div className="min-w-0">
                        {noValue ? (
                          <div className="p-2.5 text-xs text-gray-400">ללא ערך</div>
                        ) : numericValue ? (
                          <input aria-label="ערך" type="number" inputMode="decimal" disabled={locked} value={c.value ?? ''} onChange={(e) => updateCondition(i, { value: e.target.value })} className={inputCls} />
                        ) : opts.length === 0 ? (
                          <input aria-label="ערך" disabled={locked} value={c.value ?? ''} onChange={(e) => updateCondition(i, { value: e.target.value })} className={inputCls} />
                        ) : isMulti ? (
                          <div className="flex flex-wrap gap-1.5 py-1 max-h-40 overflow-y-auto custom-scrollbar" role="group" aria-label="ערכים">
                            {opts.map(o => {
                              const on = [].concat(c.value ?? []).some(v => String(v) === String(o.value));
                              return (
                                <button key={o.value} type="button" aria-pressed={on} disabled={locked} onClick={() => toggleValue(i, o.value)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer disabled:cursor-not-allowed ${on ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'}`}>
                                  {o.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <select aria-label="ערך" disabled={locked} value={c.value ?? ''} onChange={(e) => updateCondition(i, { value: e.target.value })} className={inputCls}>
                            <option value="">בחר...</option>
                            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        )}
                      </div>
                      {!locked && draft.conditions.length > 1 ? (
                        <button type="button" onClick={() => removeCondition(i)} aria-label="הסר תנאי" title="הסר תנאי" className="justify-self-end p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer">
                          <Icon name="delete" className="w-4 h-4" />
                        </button>
                      ) : <span className="hidden sm:block w-9" />}
                    </div>
                    {err(`cond-${i}`)}
                  </div>
                );
              })}
            </div>
            {err('conditions')}
            {!locked && (
              <button type="button" onClick={addCondition} data-testid="add-condition" className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                <span className="text-base leading-none">+</span> הוספת תנאי
              </button>
            )}
          </div>

          {/* נוסח ההודעה */}
          <div>
            <label htmlFor="vr-message" className={labelCls}>מלל ההודעה <span className="text-red-500">*</span></label>
            <textarea id="vr-message" ref={messageRef} rows={3} value={draft.message} onChange={(e) => set({ message: e.target.value })} className={inputCls + ' resize-y'} placeholder="מה קרה ומה המשתמש צריך לעשות" />
            {Object.keys(screen.placeholders || {}).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">הוספת ערך מהמסך:</span>
                {Object.entries(screen.placeholders).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => insertPlaceholder(`{${key}}`)} title={`{${key}}`}
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
                    {label}
                  </button>
                ))}
              </div>
            )}
            {err('message')}
          </div>

          {/* תוקף והפעלה */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label htmlFor="vr-start" className={labelCls}>בתוקף מתאריך</label>
              <input id="vr-start" type="date" disabled={locked} value={draft.startDate || ''} onChange={(e) => set({ startDate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label htmlFor="vr-end" className={labelCls}>עד תאריך</label>
              <input id="vr-end" type="date" disabled={locked} value={draft.endDate || ''} onChange={(e) => set({ endDate: e.target.value || null })} className={inputCls} />
            </div>
            <label className="flex items-center gap-2.5 p-2.5 cursor-pointer select-none">
              <Switch checked={draft.enabled !== false} disabled={locked} onChange={(v) => set({ enabled: v })} label="ולידציה פעילה" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">פעילה</span>
            </label>
          </div>
          {err('dates')}

          <div className="pt-5 border-t border-gray-100 dark:border-gray-700">
            <MessagePreview draft={draft} />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-5 sm:px-7 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 rounded-b-3xl shrink-0">
          {showErrors && hasErrors && <span className="text-xs font-bold text-rose-600 dark:text-rose-400 sm:me-auto self-center">יש להשלים את השדות המסומנים</span>}
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">ביטול</button>
          <button onClick={handleSave} disabled={saving} data-testid="save-validation" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50">
            {saving ? 'שומר...' : 'שמירה'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// כרטיס ולידציה ברשימה
// ==========================================
function RuleCard({ rule, onToggle, onEdit, onDelete, onReset }) {
  const [confirm, setConfirm] = useState(null); // 'delete' | 'reset'
  const active = isRuleActive(rule);
  const expired = rule.enabled !== false && !active;
  const sev = SEVERITY_STYLE[rule.severity] || SEVERITY_STYLE.ERROR;
  const updater = userById(rule.lastUpdatedBy);
  const isSystem = rule.source === 'SYSTEM';
  const modified = isSystem && isRuleModified(rule);
  const field = getField(rule.screen, rule.field);
  const tag = 'text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap';

  return (
    <div data-testid="validation-card" data-rule-id={rule.id} className={`p-4 rounded-2xl border border-gray-100 dark:border-gray-700 transition-opacity ${rule.enabled === false ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-full sm:basis-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 ${tag} ${sev.badge}`}>
              <SeverityIcon severity={rule.severity} className="w-3.5 h-3.5" />
              {SEVERITIES[rule.severity]?.short}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">{rule.name}</span>
            <span className={`${tag} ${isSystem ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'}`}>{isSystem ? 'מערכת' : 'מותאמת'}</span>
            {rule.locked && <span className={`inline-flex items-center gap-1 ${tag} bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400`} title="אפשר לשנות רק שם ונוסח"><SvgIcon d={LOCK_PATH} className="w-3 h-3" />נעולה</span>}
            {modified && <span className={`${tag} bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}>שונתה</span>}
            {expired && <span className={`${tag} bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400`}>לא בתוקף</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <label className="flex items-center gap-2 me-2 cursor-pointer select-none text-xs font-bold text-gray-600 dark:text-gray-300">
            <Switch checked={rule.enabled !== false} disabled={rule.locked} onChange={(v) => onToggle(rule, v)} label={`הפעלת ${rule.name}`} />
            <span className="w-9">{rule.enabled !== false ? 'פעילה' : 'כבויה'}</span>
          </label>
          <button onClick={() => onEdit(rule)} title="עריכה" aria-label={`עריכת ${rule.name}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer">
            <Icon name="edit" className="w-4 h-4" />
          </button>
          {confirm ? (
            <span className="flex items-center gap-1 text-xs font-bold">
              <button onClick={() => { (confirm === 'delete' ? onDelete : onReset)(rule.id); setConfirm(null); }} className={`px-2 py-1 rounded-lg text-white cursor-pointer ${confirm === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}>{confirm === 'delete' ? 'מחק' : 'שחזר'}</button>
              <button onClick={() => setConfirm(null)} className="px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">ביטול</button>
            </span>
          ) : isSystem ? (
            modified && (
              <button onClick={() => setConfirm('reset')} title="החזרה להגדרה המקורית" aria-label={`שחזור ${rule.name}`} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors cursor-pointer">
                <SvgIcon d={RESET_PATH} />
              </button>
            )
          ) : (
            <button onClick={() => setConfirm('delete')} title="מחיקה" aria-label={`מחיקת ${rule.name}`} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer">
              <Icon name="delete" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
        <MessageWithTokens text={rule.message} screen={rule.screen} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs">
        <div className="min-w-0">
          <div className="font-bold text-gray-500 dark:text-gray-400 mb-0.5">שדה</div>
          <div className="text-gray-800 dark:text-gray-200">{field?.label || rule.field}</div>
        </div>
        <div className="min-w-0 sm:col-span-1 lg:col-span-2">
          <div className="font-bold text-gray-500 dark:text-gray-400 mb-0.5">תנאים</div>
          <div className="text-gray-800 dark:text-gray-200">{(rule.conditions || []).map(c => conditionText(rule.screen, c)).join(' וגם ')}</div>
        </div>
        <div className="min-w-0">
          <div className="font-bold text-gray-500 dark:text-gray-400 mb-0.5">מתי מוצגת</div>
          <div className="text-gray-800 dark:text-gray-200">{rule.timing === 'ON_ACTION' ? `בלחיצה על ${VALIDATION_SCREENS[rule.screen]?.action}` : TIMINGS.IMMEDIATE.label}</div>
        </div>
        <div className="min-w-0 sm:col-span-2 lg:col-span-4 text-[11px] text-gray-500 dark:text-gray-400">
          בתוקף {formatDate(rule.startDate)} - {rule.endDate ? formatDate(rule.endDate) : 'ללא תאריך סיום'}
          {rule.lastUpdateDate && <> · עדכון אחרון {formatDateTime(rule.lastUpdateDate)}{updater ? `, ${userDisplayName(updater)}` : ''}</>}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// לשונית הוולידציות במסך הניהול
// ==========================================
export default function ValidationsAdmin({ currentUser }) {
  const [rules, setRules] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | rule
  const [screenFilter, setScreenFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  const reload = () => getValidationRules().then(setRules);
  useEffect(() => {
    let cancelled = false;
    getValidationRules().then(r => { if (!cancelled) setRules(r); });
    return () => { cancelled = true; };
  }, []);

  const handleToggle = async (rule, enabled) => { await setValidationRuleEnabled(rule.id, enabled, currentUser?.id); reload(); };
  const handleDelete = async (id) => { await deleteValidationRule(id); reload(); };
  const handleReset = async (id) => { await resetValidationRule(id); reload(); };
  const handleSave = async (rule) => { await saveValidationRule(rule, currentUser?.id); setEditing(null); reload(); };

  const filtered = useMemo(() => {
    const q = query.trim();
    return (rules || []).filter(r =>
      (screenFilter === 'ALL' || r.screen === screenFilter) &&
      (severityFilter === 'ALL' || r.severity === severityFilter) &&
      (sourceFilter === 'ALL' || r.source === sourceFilter) &&
      (!q || [r.name, r.message, getField(r.screen, r.field)?.label].some(t => String(t || '').includes(q)))
    );
  }, [rules, screenFilter, severityFilter, sourceFilter, query]);

  if (!rules) return <div className="py-12 text-center text-sm font-bold text-gray-500">טוען...</div>;

  const activeCount = rules.filter(r => isRuleActive(r)).length;
  const countBy = (sev) => rules.filter(r => r.severity === sev).length;
  const screensInView = Object.keys(VALIDATION_SCREENS).filter(code => filtered.some(r => r.screen === code));

  return (
    <div data-testid="validations-admin">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ולידציה מציגה ליד שדה במסך הודעה חוסמת, אזהרה או מידע, לפי תנאים. <span className="font-bold text-gray-800 dark:text-gray-200">{activeCount} מתוך {rules.length} פעילות.</span>
        </p>
        <button onClick={() => setEditing('new')} data-testid="new-validation" className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer shrink-0">
          <span className="text-lg leading-none">+</span> ולידציה חדשה
        </button>
      </div>

      {/* סינון */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:w-[30rem] shrink-0">
          <select aria-label="סינון לפי מסך" data-testid="filter-screen" value={screenFilter} onChange={(e) => setScreenFilter(e.target.value)} className={inputCls}>
            <option value="ALL">כל המסכים</option>
            {SCREEN_GROUPS.map(g => (
              <optgroup key={g} label={g}>
                {Object.entries(VALIDATION_SCREENS).filter(([, s]) => s.group === g).map(([code, s]) => <option key={code} value={code}>{s.label} ({rules.filter(r => r.screen === code).length})</option>)}
              </optgroup>
            ))}
          </select>
          <div className="relative">
            <Icon name="search" className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-gray-400 pointer-events-none" />
            <input aria-label="חיפוש" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש בשם, בשדה או בנוסח..." className={`${inputCls} ps-9`} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="סינון לפי סוג">
          <button type="button" onClick={() => setSeverityFilter('ALL')} aria-pressed={severityFilter === 'ALL'} className={chipCls(severityFilter === 'ALL')}>הכל</button>
          {Object.entries(SEVERITIES).map(([code, s]) => (
            <button key={code} type="button" onClick={() => setSeverityFilter(code)} aria-pressed={severityFilter === code} className={`${chipCls(severityFilter === code)} inline-flex items-center gap-1`}>
              <SeverityIcon severity={code} className={`w-3.5 h-3.5 ${severityFilter === code ? '' : SEVERITY_STYLE[code].icon}`} />
              {s.short} <span className="opacity-60">{countBy(code)}</span>
            </button>
          ))}
          <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
          {[['ALL', 'כל המקורות'], ['SYSTEM', 'מערכת'], ['CUSTOM', 'מותאמות']].map(([code, label]) => (
            <button key={code} type="button" onClick={() => setSourceFilter(code)} aria-pressed={sourceFilter === code} className={chipCls(sourceFilter === code)}>{label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-500 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">אין ולידציות שמתאימות לסינון.</div>
      ) : (
        <div className="space-y-8">
          {screensInView.map(code => {
            const screen = VALIDATION_SCREENS[code];
            const list = filtered.filter(r => r.screen === code);
            return (
              <section key={code} data-testid="validation-screen-group" data-screen={code}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2.5">
                  <h3 className="text-base font-black text-gray-900 dark:text-white">{screen.label} <span className="text-xs font-bold text-gray-400">({list.length})</span></h3>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">הודעה חוסמת עוצרת: {screen.action}</span>
                </div>
                <div className="space-y-3">
                  {list.map(rule => (
                    <RuleCard key={rule.id} rule={rule} onToggle={handleToggle} onEdit={setEditing} onDelete={handleDelete} onReset={handleReset} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {editing && (
        <ValidationEditor
          initial={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
