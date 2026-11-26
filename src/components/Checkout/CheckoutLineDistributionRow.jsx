import data from '../../data/data.json';
import { isPurchasingAllowed, getLovText } from '../../utils/budgetValidation';
import { messagesFor } from '../../utils/validationEngine';
import LovCombobox from './LovCombobox';
import { projectLovProps, taskLovProps } from '../../utils/lovFormat';
import { FieldLabelRow, FieldMessageBelow } from '../Validation/FieldMessage';
import { fieldToneClass } from '../Validation/fieldTone';

export default function CheckoutLineDistributionRow({ 
  dist, 
  line, 
  index, 
  onDistFieldChange, 
  onRemoveDist, 
  canRemove,
  messages = []      // הודעות הוולידציה של שורת החלוקה (כבר מסוננות לפי מה שמוצג עכשיו)
}) {
  const isInventory = line.destinationType === 'Inventory';

  // --- הודעות הסעיף התקציבי: ליד השדה במחשב, מתחתיו בנייד ---
  const fm = (field) => messagesFor(messages, field);
  const hasBlocking = messages.some(m => m.severity === 'ERROR');
  const requiredMark = <span className="text-rose-500 ms-0.5">*</span>;

  // --- לוגיקת סינון תוקף (Dates) ---
  const today = new Date().toISOString().split('T')[0];
  const isItemActive = (item) => {
    if (!item) return false;
    const isStarted = !item.startDate || item.startDate <= today;
    const isNotEnded = !item.endDate || item.endDate >= today;
    return isStarted && isNotEnded;
  };

  // סינון פרויקטים: פעילים בתאריך, רשאים לארגון המלאי של השורה, ואם מלאי אז מתירים רכש מלאי
  const availableProjects = data.projects?.filter(p => {
    if (!isItemActive(p)) return false;
    
    // סינון לפי ארגון המלאי הנוכחי של השורה
    if (line.inventoryOrg && !p.inventoryOrgIds?.includes(Number(line.inventoryOrg))) {
      return false;
    }
    
    if (isInventory && !p.allowedExpenditureTypeIds?.includes(4)) {
      return false;
    }
    return true;
  });

  // שמירת ערך מה-LOV: המזהה בשדה, וטקסט שלא זוהה ב-lovText (כדי שיוצג ויסומן כשגיאה)
  const commitLov = (field) => ({ value, text }) => {
    onDistFieldChange(line.id, dist.id, field, value);
    const nextText = { ...(dist.lovText || {}) };
    if (text) nextText[field] = text; else delete nextText[field];
    onDistFieldChange(line.id, dist.id, 'lovText', nextText);
  };

  const availableTasks = data.tasks?.filter(t => (!dist.projectId || t.projectId === Number(dist.projectId)) && isItemActive(t));
  const selectedProject = dist.projectId ? data.projects?.find(p => p.id === Number(dist.projectId)) : null;
  const availableExpTypes = data.expenditureTypes?.filter(e => {
    if (!isItemActive(e)) return false;
    if (selectedProject?.allowedExpenditureTypeIds) return selectedProject.allowedExpenditureTypeIds.includes(e.id);
    return true;
  });
  // יחידה מממנת: בתוקף ומורשית לרכש
  const availableExpOrgs = data.expenditureOrganizations?.filter(org => isItemActive(org) && isPurchasingAllowed(org));

  return (
    <div className={`flex flex-col gap-3 p-3 bg-white dark:bg-gray-800 border rounded-xl relative transition-colors ${hasBlocking ? 'border-rose-300 dark:border-rose-700/70' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
      
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full">
        <div className="w-6 text-center font-bold text-gray-400 text-xs shrink-0">
          {index + 1}.
        </div>

        <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 dark:bg-gray-900/50 p-1.5 px-2 sm:px-3 rounded-lg min-w-0">
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 font-bold mb-0.5">כמות</label>
            <input 
              type="number" 
              min="1" 
              step="1"
              value={dist.quantity || ''}
              onChange={(e) => onDistFieldChange(line.id, dist.id, 'quantity', Number(e.target.value))}
              className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-center text-xs font-bold outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 font-bold mb-0.5">אחוז (%)</label>
            <div className="w-12 p-1 bg-transparent text-center text-xs font-bold text-gray-600 dark:text-gray-300 cursor-default">
              {Number(dist.percentage || 0).toFixed(1)}%
            </div>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 font-bold mb-0.5">סכום (₪)</label>
            <div className="w-20 p-1 bg-transparent text-center text-xs font-bold text-gray-900 dark:text-white cursor-default truncate">
              {Number(dist.functionalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-end">
          {canRemove && (
            <button 
              onClick={() => onRemoveDist(line.id, dist.id)}
              className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 p-1.5 rounded transition-colors"
              title="מחק שורת חלוקה"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-2 ${isInventory ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-2 w-full lg:pl-12 pt-2 border-t border-gray-100 dark:border-gray-700/50 mt-1`}>
        <div className="flex flex-col min-w-0" data-validation-field="projectId">
          <FieldLabelRow messages={fm('projectId')}>
            <label className="text-[10px] text-gray-500 font-bold mb-0.5">פרויקט{requiredMark}</label>
          </FieldLabelRow>
          <LovCombobox
            ariaLabel="פרויקט"
            items={data.projects}
            validItems={availableProjects}
            value={dist.projectId}
            text={getLovText(dist, 'projectId')}
            {...projectLovProps}
            onCommit={commitLov('projectId')}
            placeholder="הקלד פרויקט..."
            invalid={fm('projectId').some(m => m.severity === 'ERROR')}
            toneClass={fieldToneClass(fm('projectId'))}
          />
          <FieldMessageBelow messages={fm('projectId')} />
        </div>

        <div className="flex flex-col min-w-0" data-validation-field="taskId">
          <FieldLabelRow messages={fm('taskId')}>
            <label className="text-[10px] text-gray-500 font-bold mb-0.5">משימה{requiredMark}</label>
          </FieldLabelRow>
          <LovCombobox
            ariaLabel="משימה"
            items={data.tasks}
            validItems={availableTasks}
            value={dist.taskId}
            text={getLovText(dist, 'taskId')}
            {...taskLovProps}
            prefer={t => String(t.projectId) === String(dist.projectId)}
            onCommit={commitLov('taskId')}
            placeholder="הקלד משימה..."
            invalid={fm('taskId').some(m => m.severity === 'ERROR')}
            toneClass={fieldToneClass(fm('taskId'))}
          />
          <FieldMessageBelow messages={fm('taskId')} />
        </div>

        {!isInventory && (
          <>
            <div className="flex flex-col min-w-0" data-validation-field="expenditureTypeId">
              <FieldLabelRow messages={fm('expenditureTypeId')}>
                <label className="text-[10px] text-gray-500 font-bold mb-0.5">סוג הוצאה{requiredMark}</label>
              </FieldLabelRow>
              <LovCombobox
                ariaLabel="סוג הוצאה"
                items={data.expenditureTypes}
                validItems={availableExpTypes}
                value={dist.expenditureTypeId}
                text={getLovText(dist, 'expenditureTypeId')}
                getCode={e => e.expenditureTypeCode}
                getName={e => e.name}
                getDisplay={e => e.name}
                onCommit={commitLov('expenditureTypeId')}
                placeholder="הקלד סוג הוצאה..."
                invalid={fm('expenditureTypeId').some(m => m.severity === 'ERROR')}
                toneClass={fieldToneClass(fm('expenditureTypeId'))}
              />
              <FieldMessageBelow messages={fm('expenditureTypeId')} />
            </div>

            <div className="flex flex-col min-w-0" data-validation-field="expenditureOrgId">
              <FieldLabelRow messages={fm('expenditureOrgId')}>
                <label className="text-[10px] text-gray-500 font-bold mb-0.5">יחידה מממנת{requiredMark}</label>
              </FieldLabelRow>
              <LovCombobox
                ariaLabel="יחידה מממנת"
                items={data.expenditureOrganizations}
                validItems={availableExpOrgs}
                value={dist.expenditureOrgId}
                text={getLovText(dist, 'expenditureOrgId')}
                getCode={o => o.name.split(' - ')[0]}
                getName={o => o.name.split(' - ').slice(1).join(' - ')}
                getDisplay={o => o.name}
                onCommit={commitLov('expenditureOrgId')}
                placeholder="הקלד יחידה מממנת..."
                invalid={fm('expenditureOrgId').some(m => m.severity === 'ERROR')}
                toneClass={fieldToneClass(fm('expenditureOrgId'))}
              />
              <FieldMessageBelow messages={fm('expenditureOrgId')} />
            </div>
          </>
        )}
      </div>


    </div>
  );
}