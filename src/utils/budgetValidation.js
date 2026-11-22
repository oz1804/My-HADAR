import data from '../data/data.json';

// ==========================================
// בדיקת סעיף תקציבי בשורות החלוקה
// 1. שדות חסרים  - חובה לפני העברה לסבב אישורים (מוצג אחרי ניסיון העברה)
// 2. ערכים לא תקינים מול ה-LOV - מוצג מיד, וגם חוסם העברה לסבב
// ==========================================

export const BUDGET_FIELD_LABELS = {
  projectId: 'פרויקט',
  taskId: 'משימה',
  expenditureTypeId: 'סוג הוצאה',
  expenditureOrgId: 'יחידה מממנת'
};

// הפנייה למי שמגדיר פרויקטים
export const BUDGET_SETUP_CONTACT = 'לעדכון ההגדרות יש לפנות לכלכלן או לסת"ב.';

const INVENTORY_EXPENDITURE_TYPE_ID = 4; // 61220000 - רכש למלאי

const isEmpty = (v) => v === null || v === undefined || v === '' || Number.isNaN(v);
const findById = (list, id) => (list || []).find(x => String(x.id) === String(id)) || null;
const todayISO = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => (d ? d.split('-').reverse().join('.') : '');

export const isActiveOn = (item, day = todayISO()) =>
  !!item && (!item.startDate || item.startDate <= day) && (!item.endDate || item.endDate >= day);

// יחידה מממנת מורשית לרכש (ברירת מחדל: מורשית, אם השדה לא הוגדר)
export const isPurchasingAllowed = (org) => !!org && org.purchasingAllowed !== false;

// אילו שדות חובה לפי יעד השורה (זהה לשדות שמוצגים בשורת החלוקה ב-Checkout)
export const getRequiredBudgetFields = (line) =>
  line?.destinationType === 'Inventory'
    ? ['projectId', 'taskId']
    : ['projectId', 'taskId', 'expenditureTypeId', 'expenditureOrgId'];

// טקסט שהמשתמש הקליד בשדה ולא זוהה ברשימת הערכים (נשמר ב-dist.lovText)
export const getLovText = (dist, field) => String(dist?.lovText?.[field] ?? '').trim();

// השדות החסרים בשורת חלוקה אחת (שדה עם טקסט שלא זוהה אינו "חסר" אלא "לא תקין")
export const getMissingDistFields = (line, dist) =>
  getRequiredBudgetFields(line).filter(f => isEmpty(dist?.[f]) && !getLovText(dist, f));

// הודעה לטקסט שלא נמצא ברשימה
const UNKNOWN_TEXT_MESSAGES = {
  projectId: (t) => `הפרויקט "${t}" אינו קיים. יש לבחור פרויקט מהרשימה.`,
  taskId: (t) => `המשימה "${t}" אינה קיימת. יש לבחור משימה מהרשימה.`,
  expenditureTypeId: (t) => `סוג ההוצאה "${t}" אינו קיים. יש לבחור סוג הוצאה מהרשימה.`,
  expenditureOrgId: (t) => `היחידה המממנת "${t}" אינה קיימת. יש לבחור יחידה מממנת מהרשימה.`
};

// ערכים שקיימים בשורת החלוקה אבל לא תואמים את רשימות הערכים (LOV)
// מחזיר [{ field, message, needsSetup }] - needsSetup = נדרשת הגדרה בפרויקט (כלכלן / סת"ב)
export const getInvalidDistFields = (line, dist, day = todayISO()) => {
  const errors = [];
  if (!dist) return errors;
  const isInventory = line?.destinationType === 'Inventory';
  const invOrg = findById(data.inventoryOrganizations, line?.inventoryOrg);
  const add = (field, message, needsSetup = true) => errors.push({ field, message, needsSetup });

  // טקסט שהוקלד ולא זוהה - טעות הקלדה, לא חוסר הגדרה
  const fieldsToCheck = isInventory ? ['projectId', 'taskId'] : ['projectId', 'taskId', 'expenditureTypeId', 'expenditureOrgId'];
  fieldsToCheck.forEach(f => {
    const t = getLovText(dist, f);
    if (isEmpty(dist[f]) && t) add(f, UNKNOWN_TEXT_MESSAGES[f](t), false);
  });

  // --- פרויקט ---
  const project = isEmpty(dist.projectId) ? null : findById(data.projects, dist.projectId);
  if (!isEmpty(dist.projectId)) {
    if (!project) {
      add('projectId', 'הפרויקט שנבחר אינו קיים.');
    } else if (!isActiveOn(project, day)) {
      add('projectId', `הפרויקט ${project.projectCode} אינו בתוקף (בתוקף ${fmtDate(project.startDate)} - ${fmtDate(project.endDate)}).`);
    } else if (invOrg && !(project.inventoryOrgIds || []).includes(Number(invOrg.id))) {
      add('projectId', `הפרויקט ${project.projectCode} אינו מוגדר בארגון המלאי ${invOrg.code} - ${invOrg.name}.`);
    } else if (isInventory && !(project.allowedExpenditureTypeIds || []).includes(INVENTORY_EXPENDITURE_TYPE_ID)) {
      add('projectId', `הפרויקט ${project.projectCode} אינו מאפשר רכש למלאי.`);
    }
  }

  // --- משימה ---
  if (!isEmpty(dist.taskId)) {
    const task = findById(data.tasks, dist.taskId);
    if (!task) {
      add('taskId', 'המשימה שנבחרה אינה קיימת.');
    } else if (project && String(task.projectId) !== String(project.id)) {
      add('taskId', `המשימה ${task.taskCode} אינה שייכת לפרויקט ${project.projectCode}.`, false);
    } else if (!isActiveOn(task, day)) {
      add('taskId', `המשימה ${task.taskCode} אינה בתוקף (בתוקף עד ${fmtDate(task.endDate)}).`);
    }
  }

  if (!isInventory) {
    // --- סוג הוצאה ---
    if (!isEmpty(dist.expenditureTypeId)) {
      const expType = findById(data.expenditureTypes, dist.expenditureTypeId);
      if (!expType) {
        add('expenditureTypeId', 'סוג ההוצאה שנבחר אינו קיים.');
      } else if (!isActiveOn(expType, day)) {
        add('expenditureTypeId', `סוג ההוצאה ${expType.expenditureTypeCode} אינו בתוקף.`);
      } else if (project && !(project.allowedExpenditureTypeIds || []).includes(Number(expType.id))) {
        add('expenditureTypeId', `סוג ההוצאה ${expType.expenditureTypeCode} - ${expType.name} אינו מוגדר בפרויקט ${project.projectCode}.`);
      }
    }

    // --- יחידה מממנת ---
    if (!isEmpty(dist.expenditureOrgId)) {
      const expOrg = findById(data.expenditureOrganizations, dist.expenditureOrgId);
      if (!expOrg) {
        add('expenditureOrgId', 'היחידה המממנת שנבחרה אינה קיימת.');
      } else if (!isActiveOn(expOrg, day)) {
        add('expenditureOrgId', `היחידה המממנת ${expOrg.name} אינה בתוקף.`);
      } else if (!isPurchasingAllowed(expOrg)) {
        add('expenditureOrgId', `היחידה המממנת ${expOrg.name} אינה מורשית לרכש.`);
      }
    }
  }
  return errors;
};

// האם יש בשורה ערך לא תקין כלשהו (לסימון השורה גם כשהיא מקופלת)
export const lineHasInvalidBudget = (line) =>
  (line?.distributions || []).some(d => getInvalidDistFields(line, d).length > 0);

// מחזיר רק את השורות שיש בהן חלוקות עם שדות חסרים או ערכים לא תקינים
// [{ lineId, lineNumber, itemDescription, dists: [{ index, missing: [...], invalid: [{ field, message, needsSetup }] }] }]
export const validateBudgetForApproval = (lines = []) =>
  lines
    .filter(Boolean)
    .map((line, idx) => {
      const dists = (line.distributions || []);
      const distErrors = dists.length === 0
        ? [{ index: 0, missing: getRequiredBudgetFields(line), invalid: [] }]
        : dists
            .map((d, i) => ({ index: i, missing: getMissingDistFields(line, d), invalid: getInvalidDistFields(line, d) }))
            .filter(d => d.missing.length > 0 || d.invalid.length > 0);
      return { lineId: line.id, lineNumber: line.lineNumber || idx + 1, itemDescription: line.itemDescription, dists: distErrors };
    })
    .filter(l => l.dists.length > 0);
