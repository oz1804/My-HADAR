import React from 'react';
import data from '../../data/data.json';

export default function CheckoutLineItem({
  line, index, selectedLines, handleSelectLine, 
  updateLineField, handleDistChange, addDistribution, removeDistribution
}) {

  const availableProjects = data.projects.filter(p => {
    if (line.destinationType === 'Inventory') {
      return p.inventoryOrgIds?.includes(Number(line.inventoryOrg)) && p.allowedExpenditureTypeIds?.includes(4);
    }
    return true; 
  });

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all ${selectedLines.includes(line.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100 dark:border-gray-700'}`}>
      
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center gap-4 rounded-t-2xl">
        <div className="flex items-center gap-4">
          <input type="checkbox" checked={selectedLines.includes(line.id)} onChange={() => handleSelectLine(line.id)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/>
          <span className="font-bold text-gray-700 dark:text-gray-300">שורה {index + 1}</span>
          {line.sku && <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md font-mono text-gray-600 dark:text-gray-400">מק"ט: {line.sku}</span>}
        </div>
        <div className="flex items-center gap-6">
          <button className="text-sm font-medium flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg>
            מסמכי שורה
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">יעד הדרישה</label>
            <select value={line.destinationType} onChange={(e) => updateLineField(line.id, 'destinationType', e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-blue-500">
              <option value="Expense">הוצאה (Expense)</option>
              <option value="Inventory" disabled={line.lineType === 'שירות'}>מלאי (Inventory)</option>
            </select>
            {line.lineType === 'שירות' && <span className="text-[10px] text-red-500 mt-1 block">שירות נדרש להיות הוצאה</span>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">סוג שורה</label>
            <select value={line.lineType} onChange={(e) => updateLineField(line.id, 'lineType', e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-blue-500">
              <option value="טובין">טובין</option>
              <option value="שירות">שירות</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-1">תיאור</label>
            <input type="text" value={line.itemDescription || ''} disabled={!!line.sku} onChange={(e) => updateLineField(line.id, 'itemDescription', e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm disabled:bg-gray-100 disabled:dark:bg-gray-800 outline-none focus:border-blue-500"/>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">כמות</label>
            <input type="number" min="1" value={line.quantity || ''} onChange={(e) => updateLineField(line.id, 'quantity', e.target.value)} className="w-full p-2.5 border rounded-xl text-sm dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-blue-500"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">יחידת מידה</label>
            <select value={line.uom || ''} disabled={!!line.sku} onChange={(e) => updateLineField(line.id, 'uom', e.target.value)} className="w-full p-2.5 border rounded-xl text-sm dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 disabled:dark:bg-gray-800 outline-none focus:border-blue-500">
               {data.uoms ? data.uoms.map(u => <option key={u.code} value={u.code}>{u.name}</option>) : <option value="EA">יחידה</option>}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">מחיר ליחידה</label>
            <input type="number" min="0" value={line.unitPrice || ''} disabled={!!line.sku} onChange={(e) => updateLineField(line.id, 'unitPrice', e.target.value)} className="w-full p-2.5 border rounded-xl text-sm dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 disabled:dark:bg-gray-800 outline-none focus:border-blue-500"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">ארגון מלאי</label>
            <select value={line.inventoryOrg || ''} onChange={(e) => updateLineField(line.id, 'inventoryOrg', Number(e.target.value))} className="w-full p-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-blue-500">
              {data.inventoryOrganizations.map(org => <option key={org.id} value={org.id}>{org.code} - {org.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-indigo-500"><path fillRule="evenodd" d="M1 4.25A2.25 2.25 0 0 1 3.25 2h13.5A2.25 2.25 0 0 1 19 4.25v8.5A2.25 2.25 0 0 1 16.75 15H3.25A2.25 2.25 0 0 1 1 12.75v-8.5Zm1.5 0v8.5a.75.75 0 0 0 .75.75h13.5a.75.75 0 0 0 .75-.75v-8.5a.75.75 0 0 0-.75-.75H3.25a.75.75 0 0 0-.75.75ZM10 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM6.25 5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1-.75-.75Zm0 4a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1-.75-.75Zm0 4a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
              סעיפים תקציביים / חשבונאות
            </h4>
            <button onClick={() => addDistribution(line.id)} className="text-xs font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
              + פיצול סעיף
            </button>
          </div>

          <div className="space-y-4">
            {line.distributions.map((dist, dIdx) => {
              
              const selProject = data.projects.find(p => p.id === dist.projectId);
              const availableTasks = data.tasks.filter(t => t.projectId === dist.projectId);
              
              const availableExpTypes = data.expenditureTypes.filter(et => {
                if (line.destinationType === 'Inventory') return et.id === 4; 
                return selProject ? selProject.allowedExpenditureTypeIds?.includes(et.id) : true;
              });

              return (
                <div key={dist.id} className="flex flex-col gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  
                  <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <span className="text-xs font-bold text-gray-400 min-w-[20px]">{dIdx + 1}.</span>
                    
                    <div className="flex flex-col">
                      <label className="text-[10px] text-gray-500 mb-1">אחוז (%)</label>
                      <input type="number" min="0" max="100" value={dist.percentage} onChange={(e) => handleDistChange(line.id, dist.id, 'percentage', e.target.value)} className="w-16 p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 outline-none"/>
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="text-[10px] text-gray-500 mb-1">כמות (שלם)</label>
                      <input type="number" min="1" step="1" value={dist.quantity} onChange={(e) => handleDistChange(line.id, dist.id, 'quantity', e.target.value)} className="w-16 p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 outline-none"/>
                    </div>

                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-gray-500 mb-1">מטבע</label>
                      <select value={dist.currency || 'ILS'} onChange={(e) => handleDistChange(line.id, dist.id, 'currency', e.target.value)} className="p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 outline-none font-bold text-blue-600 dark:text-blue-400">
                        <option value="ILS">ש"ח (ILS)</option>
                        <option value="USD">דולר (USD)</option>
                        <option value="EUR">אירו (EUR)</option>
                      </select>
                    </div>

                    {dist.currency && dist.currency !== 'ILS' && (
                      <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 mb-1">תאריך שערוך</label>
                        <input type="date" value={dist.exchangeDate || ''} onChange={(e) => handleDistChange(line.id, dist.id, 'exchangeDate', e.target.value)} className="p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 outline-none"/>
                      </div>
                    )}

                    <div className="flex flex-col ms-auto text-end">
                      <label className="text-[10px] text-gray-500 mb-1">ערך משוערך (ש"ח)</label>
                      <span className="text-sm font-black text-gray-900 dark:text-white">
                        ₪{(dist.functionalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                      {dist.currency !== 'ILS' && dist.rate && <span className="text-[10px] text-gray-400">לפי שער: {dist.rate}</span>}
                    </div>

                    {line.distributions.length > 1 && (
                      <button onClick={() => removeDistribution(line.id, dist.id)} className="ms-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded cursor-pointer" title="מחק סעיף">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[140px]">
                      <label className="text-[10px] text-gray-500 mb-1">פרויקט</label>
                      <select value={dist.projectId || ''} onChange={(e) => handleDistChange(line.id, dist.id, 'projectId', Number(e.target.value))} className="w-full p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-blue-500">
                        <option value="">בחר פרויקט...</option>
                        {availableProjects.map(p => <option key={p.id} value={p.id}>{p.projectCode} - {p.projectName}</option>)}
                      </select>
                    </div>
                    
                    <div className="flex-1 min-w-[140px]">
                      <label className="text-[10px] text-gray-500 mb-1">משימה</label>
                      <select value={dist.taskId || ''} onChange={(e) => handleDistChange(line.id, dist.id, 'taskId', Number(e.target.value))} disabled={!dist.projectId} className="w-full p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 outline-none disabled:bg-gray-100 disabled:dark:bg-gray-800">
                        <option value="">{dist.projectId ? 'בחר משימה...' : 'בחר פרויקט קודם'}</option>
                        {availableTasks.map(t => <option key={t.id} value={t.id}>{t.taskCode} - {t.taskName}</option>)}
                      </select>
                    </div>

                    <div className="flex-1 min-w-[140px]">
                      <label className="text-[10px] text-gray-500 mb-1">סוג הוצאה</label>
                      <select value={dist.expenditureTypeId || ''} onChange={(e) => handleDistChange(line.id, dist.id, 'expenditureTypeId', Number(e.target.value))} disabled={line.destinationType === 'Inventory'} className="w-full p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 outline-none disabled:bg-gray-100 disabled:dark:bg-gray-800">
                        <option value="">בחר סוג...</option>
                        {availableExpTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
                      </select>
                    </div>

                    {line.destinationType === 'Expense' && (
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[10px] text-gray-500 mb-1">ארגון מממן</label>
                        <select value={dist.expenditureOrgId || ''} onChange={(e) => handleDistChange(line.id, dist.id, 'expenditureOrgId', Number(e.target.value))} className="w-full p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 outline-none">
                          <option value="">בחר ארגון...</option>
                          {data.expenditureOrganizations.map(eo => <option key={eo.id} value={eo.id}>{eo.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">הצדקה לשורה (דורס את הכללית)</label>
            <textarea value={line.justification || ''} onChange={(e) => updateLineField(line.id, 'justification', e.target.value)} className="w-full p-2.5 border rounded-xl text-sm h-16 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500"></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">הערות לקניין (לשורה זו)</label>
            <textarea value={line.buyerNotes || ''} onChange={(e) => updateLineField(line.id, 'buyerNotes', e.target.value)} className="w-full p-2.5 border rounded-xl text-sm h-16 bg-indigo-50/30 dark:bg-indigo-900/10 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500"></textarea>
          </div>
        </div>

      </div>
    </div>
  );
}