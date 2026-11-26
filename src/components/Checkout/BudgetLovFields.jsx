import data from '../../data/data.json';
import LovCombobox from './LovCombobox';
import { isActiveOn, isPurchasingAllowed, getLovText } from '../../utils/budgetValidation';
import { messagesFor } from '../../utils/validationEngine';
import { FieldLabelRow, FieldMessageBelow } from '../Validation/FieldMessage';
import { fieldToneClass } from '../Validation/fieldTone';
import { projectLovProps, taskLovProps } from '../../utils/lovFormat';

const INVENTORY_EXPENDITURE_TYPE_ID = 4;

// ==========================================
// ארבעת שדות הסעיף התקציבי כשדות חופשיים עם LOV - משמש את סעיף התקציב בכותרת הסל,
// את טופס העדכון הקבוצתי ואת ההוספה המהירה
// orgIds: ארגוני המלאי שהפרויקט חייב להיות מוגדר בהם (כמה, בעדכון קבוצתי)
// messages: הודעות הוולידציה של שורת החלוקה (מוצגות ליד השדה במחשב ומתחתיו בנייד)
// ==========================================
export default function BudgetLovFields({ dist, orgIds = [], isInventory = false, onCommit, messages = [], labelClassName, size = 'form', renderField }) {
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

  const field = (name, label, props) => {
    const fieldMsgs = messagesFor(messages, name);
    const control = (
      <LovCombobox
        size={size}
        ariaLabel={label}
        value={dist[name]}
        text={getLovText(dist, name)}
        onCommit={(v) => onCommit(name, v)}
        invalid={fieldMsgs.some(m => m.severity === 'ERROR')}
        toneClass={fieldToneClass(fieldMsgs)}
        {...props}
      />
    );
    if (renderField) return renderField({ name, label, control, messages: fieldMsgs });
    return (
      <div className="flex flex-col min-w-0" data-validation-field={name}>
        <FieldLabelRow messages={fieldMsgs}>
          <label className={labelClassName}>{label}</label>
        </FieldLabelRow>
        {control}
        <FieldMessageBelow messages={fieldMsgs} />
      </div>
    );
  };

  return (
    <>
      {field('projectId', 'פרויקט', {
        items: data.projects, validItems: projects,
        ...projectLovProps, getDisplay: p => `${p.projectCode} - ${p.projectName}`,
        placeholder: 'הקלד פרויקט...'
      })}
      {field('taskId', 'משימה', {
        items: data.tasks, validItems: tasks,
        ...taskLovProps, getDisplay: t => `${t.taskCode} - ${t.taskName}`,
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
