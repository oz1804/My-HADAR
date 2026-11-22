import data from '../../data/data.json';
import LovCombobox from './LovCombobox';
import { isActiveOn, isPurchasingAllowed, getLovText, BUDGET_SETUP_CONTACT } from '../../utils/budgetValidation';

const INVENTORY_EXPENDITURE_TYPE_ID = 4;

// ==========================================
// ארבעת שדות הסעיף התקציבי כשדות חופשיים עם LOV - משמש את טופס העדכון הקבוצתי ואת ההוספה המהירה
// orgIds: ארגוני המלאי שהפרויקט חייב להיות מוגדר בהם (כמה, בעדכון קבוצתי)
// ==========================================
export default function BudgetLovFields({ dist, orgIds = [], isInventory = false, onCommit, badFields = [], labelClassName, size = 'form' }) {
  const projects = (data.projects || []).filter(p =>
    isActiveOn(p) &&
    orgIds.every(org => (p.inventoryOrgIds || []).includes(Number(org))) &&
    (!isInventory || (p.allowedExpenditureTypeIds || []).includes(INVENTORY_EXPENDITURE_TYPE_ID))
  );
  const selectedProject = dist.projectId ? (data.projects || []).find(p => String(p.id) === String(dist.projectId)) : null;
  const tasks = (data.tasks || []).filter(t => (!dist.projectId || String(t.projectId) === String(dist.projectId)) && isActiveOn(t));
  const expTypes = (data.expenditureTypes || []).filter(et =>
    isActiveOn(et) && (!selectedProject?.allowedExpenditureTypeIds || selectedProject.allowedExpenditureTypeIds.includes(et.id))
  );
  const expOrgs = (data.expenditureOrganizations || []).filter(o => isActiveOn(o) && isPurchasingAllowed(o));

  const field = (name, label, props) => (
    <div className="flex flex-col">
      <label className={labelClassName}>{label}</label>
      <LovCombobox
        size={size}
        ariaLabel={label}
        value={dist[name]}
        text={getLovText(dist, name)}
        onCommit={(v) => onCommit(name, v)}
        invalid={badFields.includes(name)}
        {...props}
      />
    </div>
  );

  return (
    <>
      {field('projectId', 'פרויקט', {
        items: data.projects, validItems: projects,
        getCode: p => p.projectCode, getName: p => p.projectName, getDisplay: p => `${p.projectCode} - ${p.projectName}`,
        placeholder: 'הקלד פרויקט...'
      })}
      {field('taskId', 'משימה', {
        items: data.tasks, validItems: tasks,
        getCode: t => t.taskCode, getName: t => t.taskName, getDisplay: t => `${t.taskCode} - ${t.taskName}`,
        prefer: t => String(t.projectId) === String(dist.projectId),
        placeholder: 'הקלד משימה...'
      })}
      {!isInventory && field('expenditureTypeId', 'סוג הוצאה', {
        items: data.expenditureTypes, validItems: expTypes,
        getCode: et => et.expenditureTypeCode, getName: et => et.name, getDisplay: et => et.name,
        placeholder: 'הקלד סוג הוצאה...'
      })}
      {!isInventory && field('expenditureOrgId', 'יחידה מממנת', {
        items: data.expenditureOrganizations, validItems: expOrgs,
        getCode: o => o.name.split(' - ')[0], getName: o => o.name.split(' - ').slice(1).join(' - '), getDisplay: o => o.name,
        placeholder: 'הקלד יחידה מממנת...'
      })}
    </>
  );
}

// תיבת שגיאות סעיף תקציבי (אותו עיצוב כמו בשורות החלוקה ובכותרת הסל)
export function BudgetErrorBox({ errors = [], className = '' }) {
  if (errors.length === 0) return null;
  return (
    <div role="alert" className={`flex items-start gap-2 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-900/20 ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-rose-500 shrink-0 mt-0.5">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <div className="text-xs text-rose-700 dark:text-rose-300 min-w-0">
        <ul className="space-y-0.5 font-semibold">
          {errors.map(err => <li key={err.field + err.message}>{err.message}</li>)}
        </ul>
        {errors.some(e => e.needsSetup) && <p className="mt-1 font-bold">{BUDGET_SETUP_CONTACT}</p>}
      </div>
    </div>
  );
}
