import data from '../data/data.json';
import { todayIso } from '../services/storage';
import { requiredStepGroups, isStepOfGroup, isGroupMember, groupRoleLabel } from './approvalEngine';

// ==========================================
// מסכים ושדות שאפשר להגדיר עליהם ולידציות
// לכל מסך: השדות שלו (ומה מותר לבדוק בכל שדה), הפעולה שהולידציה חוסמת,
// משתנים לנוסח ההודעה, ופונקציה שמחשבת את ערכי השדות מתוך נתוני המסך.
//
// סוגי שדות:  text | number | date | enum (ערך יחיד מרשימה) | list (כמה ערכים)
// target: false = שדה שאפשר לבדוק בתנאי אבל ההודעה לא מוצגת לידו (שדה מחושב)
// ==========================================

const BUDGET_SETUP_CONTACT = 'לעדכון ההגדרות יש לפנות לכלכלן או לסת"ב.';
export { BUDGET_SETUP_CONTACT };

const INVENTORY_EXPENDITURE_TYPE_ID = 4; // 61220000 - רכש למלאי

// ---------- עזרי נתונים ----------
const isEmpty = (v) => v === null || v === undefined || String(v).trim() === '' || (typeof v === 'number' && Number.isNaN(v));
const byId = (list, id) => (isEmpty(id) ? null : (list || []).find(x => String(x.id) === String(id)) || null);
const num = (v) => (isEmpty(v) ? null : Number(v));
const dateText = (iso) => (iso ? String(iso).split('T')[0].split('-').reverse().join('.') : '');
const money = (n) => `₪${(Number(n) || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const daysUntil = (iso, from = todayIso()) => {
  if (!iso) return null;
  const to = new Date(`${String(iso).split('T')[0]}T00:00:00`);
  if (Number.isNaN(to.getTime())) return null;
  return Math.round((to - new Date(`${from}T00:00:00`)) / 86400000);
};
export const isActiveOn = (item, day = todayIso()) =>
  !!item && (!item.startDate || item.startDate <= day) && (!item.endDate || item.endDate >= day);
export const isPurchasingAllowed = (org) => !!org && org.purchasingAllowed !== false;
export const getLovText = (dist, field) => String(dist?.lovText?.[field] ?? '').trim();
const lineAmount = (l) => (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0) * (Number(l.rate) || 1);
const isActiveLine = (l) => l && l.cancelFlag !== 'Y';

const userName = (id) => {
  const u = byId(data.users, id);
  return u ? `${u.firstName} ${u.lastName || ''}`.trim() : '';
};
const orgText = (id) => {
  const o = byId(data.inventoryOrganizations, id);
  return o ? `${o.code} - ${o.name}` : '';
};
const lineClassifications = (itemId) => {
  const item = byId(data.catalogItems, itemId);
  if (!item) return [];
  return (data.itemClassifications || []).filter(c => item[c.itemAttribute] === 'Y').map(c => c.code);
};

// ---------- רשימות ערכים (לבחירה במסך הניהול) ----------
const yesNo = [{ value: 'Y', label: 'כן' }, { value: 'N', label: 'לא' }];
const OPTIONS = {
  lineType: [{ value: 'טובין', label: 'טובין' }, { value: 'שירות', label: 'שירות' }],
  destinationType: [{ value: 'Inventory', label: 'מלאי' }, { value: 'Expense', label: 'הוצאה' }],
  inventoryOrg: () => (data.inventoryOrganizations || []).map(o => ({ value: o.id, label: `${o.code} - ${o.name}` })),
  subInventory: () => [...new Map((data.subInventories || []).map(s => [s.code, { value: s.code, label: `${s.name} (${s.code})` }])).values()],
  currency: () => ['ILS', ...new Set((data.currencyExchangeRates || []).map(r => r.currency))].map(c => ({ value: c, label: c })),
  uom: () => (data.uoms || []).map(u => ({ value: u.code, label: `${u.code} - ${u.name}` })),
  users: () => (data.users || []).map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName || ''}`.trim() })),
  buyers: () => (data.buyers || []).map(b => ({ value: b.id, label: b.name })),
  suppliers: () => (data.suppliers || []).map(s => ({ value: s.id, label: s.name })),
  quality: () => (data.qualityRequirements || []).map(q => ({ value: q, label: q })),
  classifications: () => (data.itemClassifications || []).map(c => ({ value: c.code, label: c.name })),
  projects: () => (data.projects || []).map(p => ({ value: p.id, label: `${p.projectCode} - ${p.projectName}` })),
  tasks: () => (data.tasks || []).map(t => ({ value: t.id, label: `${t.taskCode} - ${t.taskName}` })),
  expTypes: () => (data.expenditureTypes || []).map(e => ({ value: e.id, label: `${e.expenditureTypeCode} - ${e.name}` })),
  expOrgs: () => (data.expenditureOrganizations || []).map(o => ({ value: o.id, label: o.name })),
  decision: [{ value: 'APPROVE', label: 'אישור' }, { value: 'REJECT', label: 'דחייה' }]
};

// מצב שדה סעיף תקציבי מול ה-LOV
export const LOV_STATUSES = {
  EMPTY: 'ריק',
  UNKNOWN_TEXT: 'הוקלד טקסט שלא נמצא ברשימה',
  NOT_FOUND: 'הערך לא קיים',
  INACTIVE: 'לא בתוקף',
  NOT_IN_ORG: 'לא מוגדר בארגון המלאי של השורה',
  NO_INVENTORY: 'לא מאפשר רכש למלאי',
  NOT_IN_PROJECT: 'לא שייך לפרויקט שנבחר',
  NOT_ALLOWED: 'לא מורשה לרכש',
  VALID: 'תקין'
};
const statusOptions = (codes) => codes.map(c => ({ value: c, label: LOV_STATUSES[c] }));

// ---------- שדות משותפים ----------
const F = {
  quantity: { label: 'כמות', type: 'number' },
  unitPrice: { label: 'מחיר ליחידה', type: 'number' },
  lineAmount: { label: 'סכום שורה (₪)', type: 'number', target: false },
  needByDate: { label: 'תאריך נדרש', type: 'date' },
  needByDays: { label: 'ימים עד התאריך הנדרש', type: 'number', target: false },
  lineType: { label: 'סוג שורה', type: 'enum', options: OPTIONS.lineType },
  destinationType: { label: 'יעד הדרישה', type: 'enum', options: OPTIONS.destinationType },
  inventoryOrg: { label: 'ארגון מלאי', type: 'enum', options: OPTIONS.inventoryOrg },
  subInventory: { label: 'מחסן', type: 'enum', options: OPTIONS.subInventory },
  currency: { label: 'מטבע', type: 'enum', options: OPTIONS.currency },
  uom: { label: 'יחידת מידה', type: 'enum', options: OPTIONS.uom },
  requester: { label: 'מזמין', type: 'enum', options: OPTIONS.users },
  serviceApprover: { label: 'מאשר שירות', type: 'enum', options: OPTIONS.users },
  buyer: { label: 'קניין מומלץ', type: 'enum', options: OPTIONS.buyers },
  buyerNotes: { label: 'הערות לקניין', type: 'text' },
  justification: { label: 'הצדקה', type: 'text' },
  isNonCatalog: { label: 'פריט ללא מק"ט', type: 'enum', options: yesNo, target: false },
  percentTotal: { label: 'סך האחוזים בחלוקה', type: 'number', target: false },
  splitHasFraction: { label: 'בחלוקה יש כמות לא שלמה', type: 'enum', options: yesNo, target: false },
  distributions: { label: 'חלוקה תקציבית', type: 'section' }
};

// ==========================================
// הגדרת המסכים
// ==========================================
export const VALIDATION_SCREENS = {
  CHECKOUT_HEADER: {
    label: 'סל דרישה – פרטי הדרישה',
    group: 'סל דרישה',
    action: 'העברה לסבב אישורים',
    fields: {
      description: { label: 'תיאור הדרישה', type: 'text' },
      justification: F.justification,
      buyerNotes: F.buyerNotes,
      inventoryOrg: F.inventoryOrg,
      requester: F.requester,
      serviceApprover: F.serviceApprover,
      buyer: F.buyer,
      requisitionTotal: { label: 'סכום הדרישה (₪)', type: 'number', target: false },
      lineCount: { label: 'מספר שורות', type: 'number', target: false }
    },
    placeholders: { total: 'סכום הדרישה', lineCount: 'מספר שורות' },
    sample: { total: '₪125,000.00', lineCount: 3 }
  },
  CHECKOUT_LINE: {
    label: 'סל דרישה – שורת דרישה',
    group: 'סל דרישה',
    action: 'העברה לסבב אישורים',
    fields: {
      item: { label: 'הפריט (כותרת השורה)', type: 'section' },
      quantity: F.quantity,
      unitPrice: F.unitPrice,
      lineAmount: F.lineAmount,
      needByDate: F.needByDate,
      needByDays: F.needByDays,
      lineType: F.lineType,
      destinationType: F.destinationType,
      inventoryOrg: F.inventoryOrg,
      subInventory: F.subInventory,
      currency: F.currency,
      exchangeDate: { label: 'תאריך שערוך', type: 'date' },
      supplier: { label: 'ספק מומלץ', type: 'enum', options: OPTIONS.suppliers },
      qualityRequirement: { label: 'דרישות איכות', type: 'enum', options: OPTIONS.quality },
      requester: F.requester,
      serviceApprover: F.serviceApprover,
      buyer: F.buyer,
      buyerNotes: F.buyerNotes,
      justification: F.justification,
      distributions: F.distributions,
      isNonCatalog: F.isNonCatalog,
      itemClassification: { label: 'סיווג פריט', type: 'list', options: OPTIONS.classifications, target: false },
      distQuantityBalanced: { label: 'כמות החלוקות שווה לכמות השורה', type: 'enum', options: yesNo, target: false },
      requisitionTotal: { label: 'סכום הדרישה (₪)', type: 'number', target: false }
    },
    placeholders: { lineNumber: 'מספר שורה', item: 'תיאור הפריט', amount: 'סכום השורה', needByDate: 'תאריך נדרש', allocated: 'כמות שחולקה', quantity: 'כמות', total: 'סכום הדרישה' },
    sample: { lineNumber: 1, item: 'מסך מחשב 27 אינץ\'', amount: '₪12,500.00', needByDate: '01.12.2026', allocated: 3, quantity: 4, total: '₪125,000.00' }
  },
  BUDGET: {
    label: 'סעיף תקציבי (חלוקה תקציבית)',
    group: 'סל דרישה',
    action: 'העברה לסבב אישורים',
    note: 'חל בכל מקום שמוזן בו סעיף תקציבי: שורות החלוקה בסל, סעיף התקציב בכותרת הסל, הוספה מהירה ועדכון קבוצתי.',
    fields: {
      projectId: { label: 'פרויקט', type: 'enum', options: OPTIONS.projects },
      taskId: { label: 'משימה', type: 'enum', options: OPTIONS.tasks },
      expenditureTypeId: { label: 'סוג הוצאה', type: 'enum', options: OPTIONS.expTypes },
      expenditureOrgId: { label: 'יחידה מממנת', type: 'enum', options: OPTIONS.expOrgs },
      projectStatus: { label: 'מצב הפרויקט', type: 'enum', options: statusOptions(['EMPTY', 'UNKNOWN_TEXT', 'NOT_FOUND', 'INACTIVE', 'NOT_IN_ORG', 'NO_INVENTORY', 'VALID']), target: false },
      taskStatus: { label: 'מצב המשימה', type: 'enum', options: statusOptions(['EMPTY', 'UNKNOWN_TEXT', 'NOT_FOUND', 'NOT_IN_PROJECT', 'INACTIVE', 'VALID']), target: false },
      expenditureTypeStatus: { label: 'מצב סוג ההוצאה', type: 'enum', options: statusOptions(['EMPTY', 'UNKNOWN_TEXT', 'NOT_FOUND', 'INACTIVE', 'NOT_IN_PROJECT', 'VALID']), target: false },
      expenditureOrgStatus: { label: 'מצב היחידה המממנת', type: 'enum', options: statusOptions(['EMPTY', 'UNKNOWN_TEXT', 'NOT_FOUND', 'INACTIVE', 'NOT_ALLOWED', 'VALID']), target: false },
      destinationType: { ...F.destinationType, label: 'יעד השורה', target: false },
      inventoryOrg: { ...F.inventoryOrg, label: 'ארגון המלאי של השורה', target: false }
    },
    placeholders: {
      text: 'הטקסט שהוקלד', project: 'קוד פרויקט', projectStart: 'תחילת תוקף הפרויקט', projectEnd: 'סוף תוקף הפרויקט', org: 'ארגון המלאי',
      task: 'קוד משימה', taskEnd: 'סוף תוקף המשימה', expTypeCode: 'קוד סוג הוצאה', expTypeName: 'שם סוג הוצאה', expOrg: 'יחידה מממנת', contact: 'הפנייה לכלכלן / סת"ב'
    },
    sample: { text: '99999', project: '12345', projectStart: '01.01.2025', projectEnd: '31.12.2025', org: 'M1 - מנו"ר', task: '123451', taskEnd: '30.06.2026', expTypeCode: '61200000', expTypeName: 'רכש פריטים', expOrg: 'M10000 - מנו"ר הנהלה', contact: BUDGET_SETUP_CONTACT }
  },
  NON_CATALOG: {
    label: 'פריט ללא מק"ט',
    group: 'הוספת פריטים',
    action: 'הוספה לסל, הזמנה מהירה או שמירה כמועדף',
    fields: {
      lineType: F.lineType,
      requester: F.requester,
      description: { label: 'תיאור הפריט / השירות', type: 'text' },
      destinationType: F.destinationType,
      inventoryOrg: F.inventoryOrg,
      subInventory: F.subInventory,
      uom: F.uom,
      quantity: F.quantity,
      unitPrice: F.unitPrice,
      currency: F.currency,
      exchangeDate: { label: 'תאריך שערוך', type: 'date' },
      serviceApprover: F.serviceApprover,
      buyer: F.buyer,
      lineAmount: F.lineAmount
    },
    placeholders: { amount: 'סכום השורה' },
    sample: { amount: '₪4,500.00' }
  },
  QUICK_ADD: {
    label: 'הוספה מהירה (בסל)',
    group: 'הוספת פריטים',
    action: 'הוספת השורה לסל',
    fields: {
      description: { label: 'תיאור הפריט', type: 'text' },
      quantity: F.quantity,
      uom: F.uom,
      unitPrice: F.unitPrice,
      needByDate: F.needByDate,
      needByDays: F.needByDays,
      lineType: F.lineType,
      destinationType: F.destinationType,
      inventoryOrg: F.inventoryOrg,
      subInventory: F.subInventory,
      currency: F.currency,
      requester: F.requester,
      serviceApprover: F.serviceApprover,
      buyer: F.buyer,
      distributions: F.distributions,
      isNonCatalog: F.isNonCatalog,
      percentTotal: F.percentTotal,
      splitHasFraction: F.splitHasFraction,
      lineAmount: F.lineAmount
    },
    placeholders: { percentTotal: 'סך האחוזים', amount: 'סכום השורה' },
    sample: { percentTotal: '90%', amount: '₪4,500.00' }
  },
  BULK_EDIT: {
    label: 'עדכון קבוצתי (בסל)',
    group: 'סל דרישה',
    action: 'החלה על השורות הנבחרות',
    fields: {
      distributions: F.distributions,
      percentTotal: F.percentTotal,
      splitHasFraction: { ...F.splitHasFraction, label: 'החלוקה יוצרת כמות לא שלמה באחת השורות' },
      uom: { ...F.uom, label: 'יחידת המידה של השורות', target: false },
      lineCount: { label: 'מספר שורות נבחרות', type: 'number', target: false }
    },
    placeholders: { percentTotal: 'סך האחוזים', lineCount: 'מספר שורות' },
    sample: { percentTotal: '90%', lineCount: 4 }
  },
  APPROVAL_ROUTING: {
    label: 'סבב מאשרים – שליחה לאישור',
    group: 'אישורים',
    action: 'העברה לסבב אישורים',
    fields: {
      financeApprover: { label: 'ממונה כספים', type: 'section' },
      financeApproverCount: { label: 'מספר ממוני הכספים בסבב (חברי הקבוצה)', type: 'number', target: false },
      financeNotInGroupCount: { label: 'מאשרים מהפרויקט (Primary Planner) שלא חברים בקבוצה', type: 'number', target: false },
      approverCount: { label: 'מספר המאשרים בסבב', type: 'number', target: false },
      requisitionTotal: { label: 'סכום הדרישה (₪)', type: 'number', target: false }
    },
    placeholders: { financeApprover: 'ממוני הכספים בסבב', financeNotInGroup: 'המאשר מהפרויקט שלא בקבוצה', financeGroup: 'קבוצת ממוני הכספים', total: 'סכום הדרישה' },
    sample: { financeApprover: 'ניר', financeNotInGroup: 'ניר', financeGroup: '"ממוני כספים" (UMX|HADAR_FIN_APPROVER)', total: '₪25,600.00' }
  },
  APPROVAL_DECISION: {
    label: 'אישור או דחייה של דרישה',
    group: 'אישורים',
    action: 'אישור או דחייה',
    fields: {
      note: { label: 'הערה', type: 'text' },
      decision: { label: 'ההחלטה', type: 'enum', options: OPTIONS.decision, target: false },
      requisitionTotal: { label: 'סכום הדרישה (₪)', type: 'number', target: false }
    },
    placeholders: { total: 'סכום הדרישה' },
    sample: { total: '₪25,600.00' }
  },
  LOGIN: {
    label: 'כניסה למערכת',
    group: 'כללי',
    action: 'כניסה',
    fields: {
      username: { label: 'שם משתמש', type: 'text' },
      userExists: { label: 'המשתמש קיים', type: 'enum', options: yesNo, target: false }
    },
    placeholders: { username: 'שם המשתמש שהוקלד' },
    sample: { username: 'dani' }
  }
};

export const getScreen = (code) => VALIDATION_SCREENS[code] || null;
export const getField = (screen, field) => VALIDATION_SCREENS[screen]?.fields?.[field] || null;
export const fieldOptions = (fieldDef) => (typeof fieldDef?.options === 'function' ? fieldDef.options() : fieldDef?.options || []);
export const isTargetField = (fieldDef) => !!fieldDef && fieldDef.target !== false;

// ==========================================
// חישוב ערכי השדות (values) והמשתנים להודעה (vars) לכל מסך
// ==========================================

// --- סעיף תקציבי: מצב כל אחד מארבעת השדות מול ה-LOV ---
export const budgetContext = (line, dist, day = todayIso()) => {
  const d = dist || {};
  const invOrg = byId(data.inventoryOrganizations, line?.inventoryOrg);
  const isInventory = line?.destinationType === 'Inventory';
  const status = (field, check) => {
    if (!isEmpty(d[field])) return check();
    return getLovText(d, field) ? 'UNKNOWN_TEXT' : 'EMPTY';
  };

  const project = byId(data.projects, d.projectId);
  const projectStatus = status('projectId', () => {
    if (!project) return 'NOT_FOUND';
    if (!isActiveOn(project, day)) return 'INACTIVE';
    if (invOrg && !(project.inventoryOrgIds || []).includes(Number(invOrg.id))) return 'NOT_IN_ORG';
    if (isInventory && !(project.allowedExpenditureTypeIds || []).includes(INVENTORY_EXPENDITURE_TYPE_ID)) return 'NO_INVENTORY';
    return 'VALID';
  });

  const task = byId(data.tasks, d.taskId);
  const taskStatus = status('taskId', () => {
    if (!task) return 'NOT_FOUND';
    if (project && String(task.projectId) !== String(project.id)) return 'NOT_IN_PROJECT';
    if (!isActiveOn(task, day)) return 'INACTIVE';
    return 'VALID';
  });

  const expType = byId(data.expenditureTypes, d.expenditureTypeId);
  const expenditureTypeStatus = status('expenditureTypeId', () => {
    if (!expType) return 'NOT_FOUND';
    if (!isActiveOn(expType, day)) return 'INACTIVE';
    if (project && !(project.allowedExpenditureTypeIds || []).includes(Number(expType.id))) return 'NOT_IN_PROJECT';
    return 'VALID';
  });

  const expOrg = byId(data.expenditureOrganizations, d.expenditureOrgId);
  const expenditureOrgStatus = status('expenditureOrgId', () => {
    if (!expOrg) return 'NOT_FOUND';
    if (!isActiveOn(expOrg, day)) return 'INACTIVE';
    if (!isPurchasingAllowed(expOrg)) return 'NOT_ALLOWED';
    return 'VALID';
  });

  return {
    values: {
      projectId: num(d.projectId), taskId: num(d.taskId), expenditureTypeId: num(d.expenditureTypeId), expenditureOrgId: num(d.expenditureOrgId),
      projectStatus, taskStatus, expenditureTypeStatus, expenditureOrgStatus,
      destinationType: line?.destinationType || '',
      inventoryOrg: num(line?.inventoryOrg)
    },
    // {text} = הטקסט שהוקלד בשדה שההודעה מוצגת לידו (מוחלף לפי השדה, ראו fieldVars)
    fieldVars: {
      projectId: { text: getLovText(d, 'projectId') },
      taskId: { text: getLovText(d, 'taskId') },
      expenditureTypeId: { text: getLovText(d, 'expenditureTypeId') },
      expenditureOrgId: { text: getLovText(d, 'expenditureOrgId') }
    },
    vars: {
      project: project?.projectCode || '', projectStart: dateText(project?.startDate), projectEnd: dateText(project?.endDate),
      org: invOrg ? `${invOrg.code} - ${invOrg.name}` : '',
      task: task?.taskCode || '', taskEnd: dateText(task?.endDate),
      expTypeCode: expType?.expenditureTypeCode || '', expTypeName: expType?.name || '',
      expOrg: expOrg?.name || '',
      contact: BUDGET_SETUP_CONTACT
    }
  };
};

const requisitionTotal = (lines) => (lines || []).filter(isActiveLine).reduce((s, l) => s + lineAmount(l), 0);

export const headerContext = (header = {}, lines = []) => {
  const active = (lines || []).filter(isActiveLine);
  const total = requisitionTotal(active);
  const val = (v) => (v === 'mixed' || v === '__MIXED__' ? null : v);
  return {
    values: {
      description: header.description || '',
      justification: val(header.justification) || '',
      buyerNotes: val(header.buyerNotes) || '',
      inventoryOrg: num(val(header.org)),
      requester: num(val(header.requester)),
      serviceApprover: num(val(header.serviceApprover)),
      buyer: num(val(header.buyer)),
      requisitionTotal: total,
      lineCount: active.length
    },
    vars: { total: money(total), lineCount: active.length }
  };
};

export const lineContext = (line, { lines = [], day = todayIso() } = {}) => {
  const dists = line.distributions || [];
  const allocated = dists.reduce((s, d) => s + (Number(d.quantity) || 0), 0);
  const amount = lineAmount(line);
  return {
    values: {
      item: line.itemDescription || '',
      quantity: Number(line.quantity) || 0,
      unitPrice: Number(line.unitPrice) || 0,
      lineAmount: amount,
      needByDate: line.needByDate || '',
      needByDays: daysUntil(line.needByDate, day),
      lineType: line.lineType || '',
      destinationType: line.destinationType || '',
      inventoryOrg: num(line.inventoryOrg),
      subInventory: line.subInventory || '',
      currency: line.currency || 'ILS',
      exchangeDate: line.exchangeDate || '',
      supplier: num(line.supplier),
      qualityRequirement: line.qualityRequirement || '',
      requester: num(line.requester),
      serviceApprover: num(line.serviceApprover),
      buyer: num(line.buyer),
      buyerNotes: line.buyerNotes || '',
      justification: line.justification || '',
      distributions: dists.length,
      isNonCatalog: line.itemId ? 'N' : 'Y',
      itemClassification: lineClassifications(line.itemId),
      distQuantityBalanced: dists.length === 0 || allocated === Number(line.quantity) ? 'Y' : 'N',
      requisitionTotal: requisitionTotal(lines)
    },
    vars: {
      lineNumber: line.lineNumber,
      item: line.itemDescription || line.sku || '',
      amount: money(amount),
      needByDate: dateText(line.needByDate),
      allocated,
      quantity: line.quantity,
      total: money(requisitionTotal(lines))
    }
  };
};

// אחוזי חלוקה וכמויות לא שלמות - משותף להוספה מהירה ולעדכון קבוצתי
const percentTotalOf = (dists) => Math.round((dists || []).reduce((s, d) => s + (Number(d.percentage) || 0), 0) * 100) / 100;
const hasFraction = (q) => Math.abs(q - Math.round(q)) > 0.001;

export const nonCatalogContext = (form) => ({
  values: {
    lineType: form.lineType || '',
    requester: num(form.requester),
    description: form.description || '',
    destinationType: form.destinationType || '',
    inventoryOrg: num(form.inventoryOrg),
    subInventory: form.subInventory || '',
    uom: form.uom || '',
    quantity: Number(form.quantity) || 0,
    unitPrice: Number(form.unitPrice) || 0,
    currency: form.currency || 'ILS',
    exchangeDate: form.exchangeDate || '',
    serviceApprover: num(form.serviceApprover),
    buyer: num(form.buyer),
    lineAmount: (Number(form.unitPrice) || 0) * (Number(form.quantity) || 0) * (Number(form.rate) || 1)
  },
  vars: { amount: money((Number(form.unitPrice) || 0) * (Number(form.quantity) || 0) * (Number(form.rate) || 1)) }
});

export const quickAddContext = (form, day = todayIso()) => {
  const dists = form.distributions || [];
  const pct = percentTotalOf(dists);
  const amount = (Number(form.unitPrice) || 0) * (Number(form.quantity) || 0) * (Number(form.rate) || 1);
  return {
    values: {
      description: form.description || '',
      quantity: Number(form.quantity) || 0,
      uom: form.uom || '',
      unitPrice: Number(form.unitPrice) || 0,
      needByDate: form.needByDate || '',
      needByDays: daysUntil(form.needByDate, day),
      lineType: form.lineType || '',
      destinationType: form.destinationType || '',
      inventoryOrg: num(form.inventoryOrg),
      subInventory: form.subInventory || '',
      currency: form.currency || 'ILS',
      requester: num(form.requester),
      serviceApprover: num(form.serviceApprover),
      buyer: num(form.buyer),
      distributions: dists.length,
      isNonCatalog: form.itemId ? 'N' : 'Y',
      percentTotal: pct,
      splitHasFraction: dists.some(d => hasFraction(Number(d.quantity) || 0)) ? 'Y' : 'N',
      lineAmount: amount
    },
    vars: { percentTotal: `${pct}%`, amount: money(amount) }
  };
};

export const bulkEditContext = ({ distributions = [], lines = [], uom = null }) => {
  const pct = percentTotalOf(distributions);
  const fraction = lines.some(line => distributions.some(d => hasFraction((Number(d.percentage) / 100) * (Number(line.quantity) || 0))));
  return {
    values: {
      distributions: distributions.length,
      percentTotal: pct,
      splitHasFraction: fraction ? 'Y' : 'N',
      uom: uom || '',
      lineCount: lines.length
    },
    vars: { percentTotal: `${pct}%`, lineCount: lines.length }
  };
};

// סבב המאשרים לפני השליחה: האם יש בסבב ממונה כספים שחבר בקבוצת ממוני הכספים (תפקיד UMX).
// ה-Primary Planner שנמשך מהפרויקט נשאר בסבב גם כשאינו חבר בקבוצה, אבל לא נחשב כממונה הכספים
const routingConfig = () => ({
  approverGroups: data.approverGroups || [],
  approvalRules: data.approvalRules || [],
  userRoleAssignments: data.userRoleAssignments || [],
  users: data.users || []
});
export const routingContext = ({ steps = [], lines = [] }, day = todayIso()) => {
  const config = routingConfig();
  const groupCode = requiredStepGroups(config, day)[0] || 'FINANCE';
  const ofGroup = steps.filter(s => isStepOfGroup(s, groupCode));
  const isMember = (s) => s.kind === 'GROUP' || isGroupMember(s.userId, groupCode, config, day);
  const finance = ofGroup.filter(isMember);
  const notInGroup = ofGroup.filter(s => !isMember(s));
  const names = (list) => list.map(s => s.name || userName(s.userId)).filter(Boolean).join(', ');
  const total = requisitionTotal(lines);
  return {
    values: {
      financeApproverCount: finance.length,
      financeNotInGroupCount: notInGroup.length,
      approverCount: steps.length,
      requisitionTotal: total
    },
    vars: { financeApprover: names(finance), financeNotInGroup: names(notInGroup), financeGroup: groupRoleLabel(groupCode, config), total: money(total) },
    notInGroupStepIds: notInGroup.map(s => s.id)
  };
};

export const approvalDecisionContext = ({ decision, note, requisition }) => {
  const total = requisitionTotal(requisition?.lines || []);
  return {
    values: { note: note || '', decision: decision || '', requisitionTotal: total },
    vars: { total: money(total) }
  };
};

export const loginContext = ({ username }) => {
  const u = String(username || '').trim().toLowerCase();
  return {
    values: { username: username || '', userExists: (data.users || []).some(x => x.username.toLowerCase() === u) ? 'Y' : 'N' },
    vars: { username: username || '' }
  };
};

// לתצוגה (שם משתמש וארגון) - משמש את מסך הניהול
export const displayHelpers = { userName, orgText, dateText, money };
