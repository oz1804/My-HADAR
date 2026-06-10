import React from 'react';
import data from '../data/data.json';

export default function CheckoutLineDistributionRow({ 
  dist, 
  line, 
  index, 
  onDistFieldChange, 
  onRemoveDist, 
  canRemove 
}) {
  const isInventory = line.destinationType === 'Inventory';

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

  return (
    <div className="flex flex-col gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl relative hover:border-blue-300 transition-colors">
      
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full">
        <div className="w-6 text-center font-bold text-gray-400 text-xs shrink-0">
          {index + 1}.
        </div>

        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-1.5 px-3 rounded-lg shrink-0">
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
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 font-bold mb-0.5">פרויקט</label>
          <select 
            value={dist.projectId || ''}
            onChange={(e) => onDistFieldChange(line.id, dist.id, 'projectId', e.target.value)}
            className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs outline-none focus:border-blue-500"
          >
            <option value="">בחר פרויקט...</option>
            {availableProjects?.map(p => <option key={p.id} value={p.id}>{p.projectCode}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 font-bold mb-0.5">משימה</label>
          <select 
            value={dist.taskId || ''}
            onChange={(e) => onDistFieldChange(line.id, dist.id, 'taskId', e.target.value)}
            className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs outline-none focus:border-blue-500"
          >
            <option value="">בחר משימה...</option>
            {data.tasks
              ?.filter(t => (!dist.projectId || t.projectId === Number(dist.projectId)) && isItemActive(t))
              .map(t => <option key={t.id} value={t.id}>{t.taskCode}</option>)}
          </select>
        </div>

        {!isInventory && (
          <>
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-500 font-bold mb-0.5">סוג הוצאה</label>
              <select 
                value={dist.expenditureTypeId || ''}
                onChange={(e) => onDistFieldChange(line.id, dist.id, 'expenditureTypeId', e.target.value)}
                className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs outline-none focus:border-blue-500"
              >
                <option value="">בחר סוג הוצאה...</option>
                {data.expenditureTypes
                  ?.filter(e => {
                    if (!isItemActive(e)) return false;
                    const selectedProject = dist.projectId ? data.projects?.find(p => p.id === Number(dist.projectId)) : null;
                    if (selectedProject?.allowedExpenditureTypeIds) {
                      return selectedProject.allowedExpenditureTypeIds.includes(e.id);
                    }
                    return true;
                  })
                  .map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] text-gray-500 font-bold mb-0.5">יחידה מממנת</label>
              <select 
                value={dist.expenditureOrgId || ''}
                onChange={(e) => onDistFieldChange(line.id, dist.id, 'expenditureOrgId', e.target.value)}
                className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs outline-none focus:border-blue-500"
              >
                <option value="">בחר יחידה מממנת...</option>
                {data.expenditureOrganizations?.filter(isItemActive).map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

    </div>
  );
}