import { isEffective, todayIso } from '../services/storage';

// ==========================================
// מנוע סבב האישורים (בדומה ל-AME)
// מאפיינים -> תנאים -> חוקים -> קבוצות מאשרים -> רשימת מאשרים
// פונקציות טהורות: מקבלות את ההגדרות כפרמטר ולא ניגשות לנתונים בעצמן
// ==========================================

// קטלוג המאפיינים שהמנוע יודע לחשב (מפותח פעם אחת; מנהל המערכת רק בוחר מתוכו)
export const ATTRIBUTES = {
  ITEM_CLASSIFICATION: { level: 'LINE', label: 'סיווג פריט' },
  LINE_TYPE: { level: 'LINE', label: 'סוג שורה' },
  DESTINATION_TYPE: { level: 'LINE', label: 'יעד' },
  INVENTORY_ORG: { level: 'LINE', label: 'ארגון מלאי' },
  PROJECT: { level: 'LINE', label: 'פרויקט' },
  LINE_AMOUNT: { level: 'LINE', label: 'סכום שורה (₪)' },
  CURRENCY: { level: 'LINE', label: 'מטבע' },
  REQUISITION_TOTAL: { level: 'HEADER', label: 'סכום הדרישה (₪)' }
};

export const OPERATORS = {
  EQUALS: 'שווה ל',
  NOT_EQUALS: 'שונה מ',
  IN: 'אחד מתוך',
  NOT_IN: 'אף אחד מתוך',
  CONTAINS_ANY: 'מכיל אחד מתוך',
  GT: 'גדול מ',
  GTE: 'גדול או שווה ל',
  LT: 'קטן מ',
  LTE: 'קטן או שווה ל',
  STARTS_WITH: 'מתחיל ב',
  IS_EMPTY: 'ריק',
  IS_NOT_EMPTY: 'לא ריק'
};

// בשלב זה ממומשת רק השיטה הזו (First Responder Wins ב-AME)
export const VOTING_METHODS = {
  FIRST_RESPONDER: 'הראשון שמגיב מאשר בשם הקבוצה'
};

const isActiveLine = (l) => l.cancelFlag !== 'Y';
const lineAmount = (l) => (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0) * (Number(l.rate) || 1);

export const userDisplayName = (u) => (u ? `${u.firstName} ${u.lastName || ''}`.trim() : '');

// --- חישוב מאפיינים ---
const lineClassifications = (line, config) => {
  const item = line.itemId ? config.catalogItems.find(i => String(i.id) === String(line.itemId)) : null;
  if (!item) return [];
  return config.itemClassifications.filter(c => item[c.itemAttribute] === 'Y').map(c => c.code);
};

export const getLineAttributes = (line, config, headerOrg) => ({
  ITEM_CLASSIFICATION: lineClassifications(line, config),
  LINE_TYPE: line.lineType || '',
  DESTINATION_TYPE: line.destinationType || '',
  INVENTORY_ORG: line.inventoryOrg ? Number(line.inventoryOrg) : (headerOrg ? Number(headerOrg) : null),
  PROJECT: (line.distributions || []).map(d => Number(d.projectId)).filter(Boolean),
  LINE_AMOUNT: lineAmount(line),
  CURRENCY: line.currency || 'ILS'
});

export const getHeaderAttributes = (lines) => ({
  REQUISITION_TOTAL: lines.filter(isActiveLine).reduce((s, l) => s + lineAmount(l), 0)
});

// --- הערכת תנאי ---
const asList = (v) => (Array.isArray(v) ? v : [v]);
const same = (a, b) => String(a) === String(b);

export const evaluateCondition = (cond, attrs) => {
  const actual = attrs[cond.attribute];
  const values = asList(cond.value);
  const actualList = asList(actual).filter(v => v !== null && v !== undefined && v !== '');
  switch (cond.operator) {
    case 'EQUALS': return actualList.some(a => same(a, values[0]));
    case 'NOT_EQUALS': return !actualList.some(a => same(a, values[0]));
    case 'IN':
    case 'CONTAINS_ANY': return actualList.some(a => values.some(v => same(a, v)));
    case 'NOT_IN': return !actualList.some(a => values.some(v => same(a, v)));
    case 'GT': return Number(actual) > Number(values[0]);
    case 'GTE': return Number(actual) >= Number(values[0]);
    case 'LT': return Number(actual) < Number(values[0]);
    case 'LTE': return Number(actual) <= Number(values[0]);
    case 'STARTS_WITH': return actualList.some(a => String(a).startsWith(String(values[0])));
    default: return false;
  }
};

// כל התנאים בחוק צריכים להתקיים (AND). חוק בלי תנאים חל תמיד
const ruleMatches = (rule, attrs) => (rule.conditions || []).every(c => evaluateCondition(c, attrs));

// --- שליפת חברי קבוצה מתפקיד UMX (כמו Dynamic Approver Group) ---
export const resolveGroupRole = (group, inventoryOrgId) => {
  const mappings = group.roleMappings || [];
  const specific = inventoryOrgId != null ? mappings.find(m => m.inventoryOrgId != null && same(m.inventoryOrgId, inventoryOrgId)) : null;
  const fallback = mappings.find(m => m.inventoryOrgId == null);
  const chosen = specific || fallback || null;
  return chosen ? { roleCode: chosen.roleCode, orgSpecific: !!specific } : null;
};

export const getRoleMemberIds = (roleCode, config, date = todayIso()) =>
  [...new Set(config.userRoleAssignments.filter(a => a.roleCode === roleCode && isEffective(a, date)).map(a => Number(a.userId)))]
    .filter(id => config.users.some(u => u.id === id));

// פירוט הסיבה: אילו סיווגים בשורה הפעילו את החוק
const ruleDetail = (rule, attrs, config) => {
  const cls = (rule.conditions || []).find(c => c.attribute === 'ITEM_CLASSIFICATION');
  if (!cls) return null;
  const names = attrs.ITEM_CLASSIFICATION.filter(code => asList(cls.value).includes(code))
    .map(code => config.itemClassifications.find(c => c.code === code)?.name || code);
  return names.join(', ');
};

// ==========================================
// אנשי מפתח בפרויקט (Key Members ב-EBS) כמאשרים
// חוק מסוג ADD_PROJECT_KEY_MEMBER מושך מכל פרויקט בחלוקות את בעל התפקיד בפרויקט (למשל Primary Planner)
// כצעד של מאשר יחיד שהמבקש יכול להזיז או להסיר. אין התחייבות שהוא חבר בקבוצת המאשרים,
// ולכן החברות נבדקת בנפרד (ולידציות מסך "סבב מאשרים")
// ==========================================
export const KEY_MEMBER_ACTION = 'ADD_PROJECT_KEY_MEMBER';
// קוד באנגלית בתוך משפט בעברית (למשל *12345 או UMX|...) - מבודד כדי שהסימנים לא יקפצו לצד השני
const ltr = (text) => `\u2066${text}\u2069`;
export const PROJECT_ROLES = {
  PRIMARY_PLANNER: { label: 'Primary Planner', field: 'primaryPlannerUserId' }
};

// חבר פעיל באחד מתפקידי ה-UMX של הקבוצה
export const isGroupMember = (userId, groupCode, config, date = todayIso()) => {
  const group = config.approverGroups.find(g => g.code === groupCode);
  if (!group || userId == null) return false;
  return (group.roleMappings || []).some(m => getRoleMemberIds(m.roleCode, config, date).some(id => same(id, userId)));
};

// שם הקבוצה והתפקיד שהחברות בה נדרשת: 'ממוני כספים (UMX|HADAR_FIN_APPROVER)'
export const groupRoleLabel = (groupCode, config) => {
  const group = config.approverGroups.find(g => g.code === groupCode);
  if (!group) return groupCode;
  const roles = [...new Set((group.roleMappings || []).map(m => m.roleCode))];
  return roles.length ? `"${group.name}" (${roles.map(ltr).join(', ')})` : `"${group.name}"`;
};

// הקבוצות שהחוקים הפעילים מחייבים לכלול בסבב (בשלב זה: ממוני כספים)
export const requiredStepGroups = (config, date = todayIso()) =>
  [...new Set(config.approvalRules
    .filter(r => r.enabled !== false && isEffective(r, date) && r.action?.type === KEY_MEMBER_ACTION)
    .map(r => r.action.groupCode))];

// צעד בסבב שנחשב כמאשר מהקבוצה: צעד שסומן כך (נמשך מהפרויקט או נוסף ידנית) או צעד קבוצה
export const isStepOfGroup = (step, groupCode) =>
  step.requiredGroupCode === groupCode || (step.kind === 'GROUP' && step.groupCode === groupCode);

export const suggestKeyMemberSteps = ({ lines, headerOrg = null, requesterId, config, date = todayIso() }) => {
  const active = (lines || []).filter(isActiveLine);
  const headerAttrs = getHeaderAttributes(active);
  const steps = {};
  config.approvalRules
    .filter(r => r.enabled !== false && isEffective(r, date) && r.action?.type === KEY_MEMBER_ACTION)
    .forEach(rule => {
      const role = PROJECT_ROLES[rule.action.projectRole];
      const group = config.approverGroups.find(g => g.code === rule.action.groupCode);
      if (!role) return;
      active.forEach(line => {
        const attrs = getLineAttributes(line, config, headerOrg);
        if (rule.level !== 'HEADER' && !ruleMatches(rule, { ...headerAttrs, ...attrs })) return;
        if (rule.level === 'HEADER' && !ruleMatches(rule, headerAttrs)) return;
        attrs.PROJECT.forEach(projectId => {
          const project = (config.projects || []).find(p => same(p.id, projectId));
          const userId = project?.[role.field];
          if (!project || userId == null || same(userId, requesterId)) return;
          const user = config.users.find(u => same(u.id, userId));
          if (!user) return;
          const key = `${rule.action.groupCode}-${userId}`;
          if (!steps[key]) {
            steps[key] = {
              id: `keymember-${key}`,
              kind: 'USER',
              source: 'KEY_MEMBER',
              editable: rule.action.editable !== false,
              requiredGroupCode: rule.action.groupCode,
              userId: user.id,
              // מי שלא חבר בקבוצה נשאר בסבב, אבל לא מוצג כממונה הכספים
              title: isGroupMember(user.id, rule.action.groupCode, config, date)
                ? (rule.action.stepTitle || group?.name || 'אישור לפי חוק')
                : `אישור ${role.label}`,
              name: userDisplayName(user),
              role: user.job || '',
              reasons: [{ ruleId: rule.id, ruleName: rule.name, projects: [], lineNumbers: [] }],
              status: 'pending'
            };
          }
          const reason = steps[key].reasons[0];
          if (!reason.projects.includes(project.projectCode)) reason.projects.push(project.projectCode);
          if (line.lineNumber && !reason.lineNumbers.includes(line.lineNumber)) reason.lineNumbers.push(line.lineNumber);
          reason.detail = `${role.label} ב${reason.projects.length > 1 ? 'פרויקטים' : 'פרויקט'} ${reason.projects.map(ltr).join(', ')}`;
        });
      });
    });
  return Object.values(steps);
};

// ==========================================
// בניית רשימת המאשרים
// manualSteps: מאשרים שהמשתמש בחר (מועדפים / ממונה / נוסף / ממונה הכספים מהפרויקט) - ראשונים, לפי הסדר שקבע
// אחריהם קבוצות לפי החוקים (לפי position; אותו position = במקביל), ובסוף הקניינים
// ==========================================
export const buildApprovalList = ({ lines, headerOrg = null, headerBuyer = null, requesterId, config, manualSteps = [], date = todayIso() }) => {
  const errors = [];
  const active = (lines || []).filter(isActiveLine);
  const orgName = (id) => config.inventoryOrganizations.find(o => same(o.id, id))?.name || '';
  const rules = config.approvalRules.filter(r => r.enabled !== false && isEffective(r, date));
  const headerAttrs = getHeaderAttributes(active);

  // --- 1. חוקים -> קבוצות (ללא כפילויות: קבוצה + תפקיד = צעד אחד) ---
  const groupSteps = {};
  const addGroup = (rule, inventoryOrgId, reason) => {
    const group = config.approverGroups.find(g => g.code === rule.action?.groupCode);
    if (!group) return;
    const resolved = resolveGroupRole(group, inventoryOrgId);
    const key = `${group.code}|${resolved?.roleCode || 'NONE'}`;
    if (!groupSteps[key]) {
      const role = resolved ? config.umxRoles.find(r => r.code === resolved.roleCode) : null;
      const members = resolved ? getRoleMemberIds(resolved.roleCode, config, date).filter(id => !same(id, requesterId)) : [];
      const orgLabel = resolved?.orgSpecific ? orgName(inventoryOrgId) : '';
      groupSteps[key] = {
        id: `group-${group.code}-${resolved?.orgSpecific ? inventoryOrgId : 'default'}`,
        kind: 'GROUP',
        source: 'RULE',
        locked: true,
        title: 'אישור לפי חוק',
        groupCode: group.code,
        groupName: group.name,
        name: orgLabel ? `${group.name} - ${orgLabel}` : group.name,
        roleCode: resolved?.roleCode || null,
        roleName: role?.name || '',
        inventoryOrgId: resolved?.orgSpecific ? Number(inventoryOrgId) : null,
        votingMethod: group.votingMethod || 'FIRST_RESPONDER',
        position: group.position ?? 100,
        members,
        role: members.map(id => userDisplayName(config.users.find(u => u.id === id))).join(', '),
        reasons: [],
        status: 'pending'
      };
      if (!resolved) {
        errors.push({ stepId: groupSteps[key].id, message: `לא הוגדר תפקיד UMX לקבוצה "${group.name}"${inventoryOrgId ? ` בארגון ${orgName(inventoryOrgId)}` : ''}. יש לפנות למנהל המערכת.` });
      } else if (members.length === 0) {
        errors.push({ stepId: groupSteps[key].id, message: `לא נמצאו מאשרים פעילים בתפקיד "${role?.name || resolved.roleCode}" (${resolved.roleCode}). יש לפנות למנהל המערכת.` });
      }
    }
    const step = groupSteps[key];
    const existing = step.reasons.find(r => r.ruleId === rule.id);
    if (existing) {
      if (reason.lineNumber && !existing.lineNumbers.includes(reason.lineNumber)) existing.lineNumbers.push(reason.lineNumber);
    } else {
      step.reasons.push({ ruleId: rule.id, ruleName: rule.name, detail: reason.detail || null, lineNumbers: reason.lineNumber ? [reason.lineNumber] : [] });
    }
  };

  rules.forEach(rule => {
    // חוקי אנשי מפתח בפרויקט לא נכנסים כאן: הם מוצעים כצעדים שהמבקש יכול להזיז (suggestKeyMemberSteps)
    if (rule.action?.type !== 'ADD_APPROVER_GROUP') return;
    if (rule.level === 'HEADER') {
      if (ruleMatches(rule, headerAttrs)) addGroup(rule, rule.action.orgSource === 'HEADER' ? headerOrg : null, {});
      return;
    }
    active.forEach(line => {
      const attrs = getLineAttributes(line, config, headerOrg);
      if (!ruleMatches(rule, { ...headerAttrs, ...attrs })) return;
      addGroup(rule, rule.action.orgSource === 'LINE' ? attrs.INVENTORY_ORG : (rule.action.orgSource === 'HEADER' ? headerOrg : null), {
        lineNumber: line.lineNumber,
        detail: ruleDetail(rule, attrs, config)
      });
    });
  });

  // --- 2. קניינים (סוגרים את הסבב, כמו קודם) ---
  const buyerIds = new Set();
  if (headerBuyer && headerBuyer !== 'mixed') buyerIds.add(headerBuyer);
  active.forEach(l => { if (l.buyer) buyerIds.add(l.buyer); });
  const buyerSteps = [...buyerIds].map(bId => {
    const b = config.buyers.find(x => same(x.id, bId));
    if (!b) return null;
    if (!b.userId) errors.push({ stepId: `buyer-${bId}`, message: `הקניין ${b.name} אינו משויך למשתמש במערכת. יש לפנות למנהל המערכת.` });
    return { id: `buyer-${bId}`, kind: 'USER', source: 'BUYER', locked: true, userId: b.userId || null, title: 'אישור קניין', name: b.name, role: 'מדור רכש', status: 'pending' };
  }).filter(Boolean);

  // --- 3. שלבים: ידניים (אחד אחרי השני) -> קבוצות לפי position -> קניינים ---
  let stage = 0;
  const steps = manualSteps.map(s => ({ ...s, stage: ++stage }));
  const positions = [...new Set(Object.values(groupSteps).map(s => s.position))].sort((a, b) => a - b);
  positions.forEach(pos => {
    stage += 1;
    Object.values(groupSteps).filter(s => s.position === pos).forEach(s => steps.push({ ...s, stage }));
  });
  buyerSteps.forEach(s => steps.push({ ...s, stage: ++stage }));

  return { steps, errors };
};

// ==========================================
// ריצת הסבב
// ==========================================
// דרישות ישנות שנשמרו לפני המנוע - כל צעד הוא שלב נפרד
export const normalizeSteps = (steps) => (steps || []).map((s, i) => ({ ...s, stage: s.stage ?? i + 1 }));

export const getCurrentStage = (steps) => {
  const pending = normalizeSteps(steps).filter(s => !s.status || s.status === 'pending');
  return pending.length ? Math.min(...pending.map(s => s.stage)) : null;
};

const canUserActOnStep = (step, userId) =>
  step.kind === 'GROUP' ? (step.members || []).some(id => same(id, userId)) : (step.userId != null && same(step.userId, userId));

// הצעדים שהמשתמש יכול לפעול עליהם כעת בדרישה
export const getActionableSteps = (req, userId) => {
  if (!req || req.status !== 'IN PROCESS') return [];
  const steps = normalizeSteps(req.routingSteps);
  const stage = getCurrentStage(steps);
  if (stage == null) return [];
  return steps.filter(s => s.stage === stage && (!s.status || s.status === 'pending') && canUserActOnStep(s, userId));
};

// איך להציג את התפקיד של המאשר בצעד: לקבוצה - שם הקבוצה; למאשר יחיד - סוג האישור ("אישור ממונה ישיר")
export const stepRoleLabel = (step) => (step.kind === 'GROUP' ? step.name : step.title);

// אישור / דחייה של המשתמש על כל הצעדים שממתינים לו בשלב הנוכחי
export const applyDecision = (req, userId, decision, note = '') => {
  const now = new Date().toISOString();
  const actionableIds = getActionableSteps(req, userId).map(s => s.id);
  if (actionableIds.length === 0) return null;
  let steps = normalizeSteps(req.routingSteps).map(s => (actionableIds.includes(s.id)
    ? { ...s, status: decision === 'approve' ? 'approved' : 'rejected', actedBy: Number(userId), actionDate: now, note }
    : s));
  if (decision === 'reject') {
    steps = steps.map(s => (s.status === 'pending' || !s.status ? { ...s, status: 'skipped' } : s));
    return { steps, outcome: 'REJECTED', actedStepIds: actionableIds };
  }
  return { steps, outcome: getCurrentStage(steps) == null ? 'APPROVED' : 'IN PROCESS', actedStepIds: actionableIds };
};
