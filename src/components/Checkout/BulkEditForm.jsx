import React, { useState, useEffect } from 'react';
import data from '../../data/data.json';

export default function BulkEditForm({
  selectedLineIds,
  selectedLinesData,
  onApplyBulkEdit,
  onClose
}) {
  const [bulkFields, setBulkFields] = useState({});
  const [bulkDists, setBulkDists] = useState([]);

  const isSameUOM = selectedLinesData.length > 0 && selectedLinesData.every(l => l.uom === selectedLinesData[0].uom);
  const isSameQuantity = selectedLinesData.length > 0 && selectedLinesData.every(l => l.quantity === selectedLinesData[0].quantity);
  const commonUOM = isSameUOM ? selectedLinesData[0].uom : null;

  // אתחול הנתונים בעת פתיחת החלונית
  useEffect(() => {
    const getCommon = (field) => {
      const first = selectedLinesData[0]?.[field] ?? '';
      return selectedLinesData.every(l => (l[field] ?? '') === first) ? first : '__MIXED__';
    };

    const getMajorityDist = (field) => {
      const counts = {};
      selectedLinesData.forEach(l => {
        const d = l.distributions?.[0];
        if (d && d[field] !== undefined && d[field] !== '') counts[d[field]] = (counts[d[field]] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
      if (sorted.length === 0) return '';
      return isNaN(sorted[0][0]) ? sorted[0][0] : Number(sorted[0][0]);
    };

    setBulkFields({
      destinationType: getCommon('destinationType'),
      needByDate: getCommon('needByDate'),
      inventoryOrg: getCommon('inventoryOrg'),
      currency: getCommon('currency'),
      exchangeDate: getCommon('exchangeDate'),
      supplier: getCommon('supplier'),
      qualityRequirement: getCommon('qualityRequirement'),
      serviceApprover: getCommon('serviceApprover'),
      requester: getCommon('requester'), // נוסף שדה מזמין
      buyer: getCommon('buyer'),
      buyerNotes: getCommon('buyerNotes'), 
      justification: getCommon('justification') 
    });

    setBulkDists([{
      id: Date.now(),
      percentage: 100,
      quantity: isSameQuantity ? selectedLinesData[0].quantity : '',
      projectId: getMajorityDist('projectId'),
      taskId: getMajorityDist('taskId'),
      expenditureTypeId: getMajorityDist('expenditureTypeId'),
      expenditureOrgId: getMajorityDist('expenditureOrgId')
    }]);
  }, [selectedLinesData]);

  const handleBulkDistChange = (distId, field, value) => {
    setBulkDists(prev => prev.map(d => {
      if (d.id !== distId) return d;
      let updated = { ...d, [field]: value };
      
      if (field === 'percentage' && isSameQuantity) {
        updated.quantity = (Number(value) / 100) * selectedLinesData[0].quantity;
        if (commonUOM === 'EA') updated.quantity = Math.floor(updated.quantity);
      } else if (field === 'quantity' && isSameQuantity) {
        updated.percentage = (Number(value) / selectedLinesData[0].quantity) * 100;
      }
      return updated;
    }));
  };

  const handleAddBulkDist = () => {
    if (!isSameUOM) return;
    setBulkDists(prev => {
      const currentPct = prev.reduce((sum, d) => sum + Number(d.percentage || 0), 0);
      const remainingPct = Math.max(0, 100 - currentPct);
      let remainingQty = isSameQuantity ? (remainingPct / 100) * selectedLinesData[0].quantity : '';
      if (commonUOM === 'EA' && remainingQty !== '') remainingQty = Math.floor(remainingQty);
      
      const last = prev[prev.length - 1];
      return [...prev, {
        id: Date.now() + Math.random(),
        percentage: remainingPct,
        quantity: remainingQty,
        projectId: last?.projectId || '',
        taskId: last?.taskId || '',
        expenditureTypeId: last?.expenditureTypeId || '',
        expenditureOrgId: last?.expenditureOrgId || ''
      }];
    });
  };

  const handleApplyBulk = () => {
    const totalPct = bulkDists.reduce((sum, d) => sum + (Number(d.percentage) || 0), 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      alert('שגיאה: סך האחוזים בחלוקה התקציבית חייב להיות שווה בדיוק ל-100%');
      return;
    }

    if (commonUOM === 'EA') {
      let hasDecimal = false;
      selectedLinesData.forEach(line => {
        bulkDists.forEach(d => {
          const qty = (Number(d.percentage) / 100) * line.quantity;
          if (Math.abs(qty - Math.round(qty)) > 0.001) hasDecimal = true;
        });
      });
      if (hasDecimal) {
        alert('שגיאה חמורה: פיצול ליחידת מידה (EA) דורש כמויות שלמות. האחוזים שהזנת גורמים ליצירת חלקי יחידות באחת או יותר מהשורות הנבחרות.');
        return;
      }
    }

    onApplyBulkEdit(selectedLineIds, bulkFields, bulkDists);
    onClose();
  };

  const today = new Date().toISOString().split('T')[0];
  const isItemActive = (item) => (!item?.startDate || item.startDate <= today) && (!item?.endDate || item.endDate >= today);

  const selectedOrgs = [...new Set(selectedLinesData.map(l => l.inventoryOrg).filter(Boolean))];
  const isAllInventory = selectedLinesData.length > 0 && selectedLinesData.every(l => l.destinationType === 'Inventory');

  const bulkSelectClass = "w-full p-2 border border-blue-200 dark:border-blue-800/50 rounded-lg bg-white dark:bg-gray-800 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
  const bulkLabelClass = "block text-[11px] font-bold text-blue-800/70 dark:text-blue-300/70 mb-1";

  return (
    <div className="bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-900/10 dark:to-gray-800 border-2 border-blue-200 dark:border-blue-800/50 rounded-2xl p-5 mb-2 animate-fade-in shadow-lg">
      <h4 className="font-extrabold text-blue-800 dark:text-blue-300 mb-4 border-b border-blue-100 dark:border-gray-700 pb-2 flex justify-between items-center">
        <span>עריכה מרובה עבור {selectedLineIds.length} שורות</span>
      </h4>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label className={bulkLabelClass}>יעד דרישה</label>
          <select value={bulkFields.destinationType || '__MIXED__'} onChange={(e) => setBulkFields({...bulkFields, destinationType: e.target.value})} className={bulkSelectClass}>
            <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
            <option value="Inventory">מלאי (Inventory)</option>
            <option value="Expense">הוצאה (Expense)</option>
          </select>
        </div>
        <div>
          <label className={bulkLabelClass}>תאריך נדרש</label>
          <input type="date" value={bulkFields.needByDate === '__MIXED__' ? '' : (bulkFields.needByDate || '')} onChange={(e) => setBulkFields({...bulkFields, needByDate: e.target.value})} className={bulkSelectClass} />
        </div>
        <div>
          <label className={bulkLabelClass}>ארגון מלאי</label>
          <select value={bulkFields.inventoryOrg || '__MIXED__'} onChange={(e) => setBulkFields({...bulkFields, inventoryOrg: Number(e.target.value)})} className={bulkSelectClass}>
            <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
            <option value="">לא הוגדר</option>
            {data.inventoryOrganizations?.map(org => <option key={org.id} value={org.id}>{org.code} - {org.name}</option>)}
          </select>
        </div>
        <div>
          <label className={bulkLabelClass}>מטבע</label>
          <select value={bulkFields.currency || '__MIXED__'} onChange={(e) => setBulkFields({...bulkFields, currency: e.target.value})} className={bulkSelectClass}>
            <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
            <option value="ILS">ILS (שקל חדש)</option>
            <option value="USD">USD (דולר)</option>
            <option value="EUR">EUR (אירו)</option>
          </select>
        </div>
        <div>
          <label className={bulkLabelClass}>תאריך שערוך</label>
          <input type="date" value={bulkFields.exchangeDate === '__MIXED__' ? '' : (bulkFields.exchangeDate || '')} disabled={bulkFields.currency === 'ILS'} onChange={(e) => setBulkFields({...bulkFields, exchangeDate: e.target.value})} className={`${bulkSelectClass} disabled:opacity-50 disabled:cursor-not-allowed`} />
        </div>
        <div>
          <label className={bulkLabelClass}>ספק מומלץ</label>
          <select value={bulkFields.supplier || '__MIXED__'} onChange={(e) => setBulkFields({...bulkFields, supplier: e.target.value})} className={bulkSelectClass}>
            <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
            <option value="">לא הוגדר</option>
            {data.suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={bulkLabelClass}>דרישת איכות</label>
          <select value={bulkFields.qualityRequirement || '__MIXED__'} onChange={(e) => setBulkFields({...bulkFields, qualityRequirement: e.target.value})} className={bulkSelectClass}>
            <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
            <option value="">ללא דרישה</option>
            {data.qualityRequirements?.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
        <div>
          <label className={bulkLabelClass}>מאשר שירות</label>
          <select value={bulkFields.serviceApprover || '__MIXED__'} onChange={(e) => setBulkFields({...bulkFields, serviceApprover: e.target.value})} className={bulkSelectClass}>
            <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
            <option value="">לא הוגדר</option>
            {data.users?.map(u => <option key={u.id} value={u.firstName}>{u.firstName} {u.lastName}</option>)}
          </select>
        </div>
        
        {/* --- שדה מזמין --- */}
        <div>
          <label className={bulkLabelClass}>מזמין</label>
          <select value={bulkFields.requester || '__MIXED__'} onChange={(e) => setBulkFields({...bulkFields, requester: e.target.value})} className={bulkSelectClass}>
            <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
            <option value="">לא הוגדר</option>
            {data.users?.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </select>
        </div>

        <div>
          <label className={bulkLabelClass}>קניין מומלץ</label>
          <select value={bulkFields.buyer || '__MIXED__'} onChange={(e) => setBulkFields({...bulkFields, buyer: e.target.value})} className={bulkSelectClass}>
            <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
            <option value="">לא הוגדר</option>
            {data.buyers?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className={bulkLabelClass}>הערות לקניין</label>
          <textarea 
            rows="1" 
            value={bulkFields.buyerNotes === '__MIXED__' ? '' : (bulkFields.buyerNotes || '')} 
            onChange={(e) => setBulkFields({...bulkFields, buyerNotes: e.target.value})} 
            className={`${bulkSelectClass} resize-none`} 
            placeholder={bulkFields.buyerNotes === '__MIXED__' ? '-- ערכים שונים --' : ''} 
          />
        </div>
        <div>
          <label className={bulkLabelClass}>הצדקה</label>
          <textarea 
            rows="1" 
            value={bulkFields.justification === '__MIXED__' ? '' : (bulkFields.justification || '')} 
            onChange={(e) => setBulkFields({...bulkFields, justification: e.target.value})} 
            className={`${bulkSelectClass} resize-none`} 
            placeholder={bulkFields.justification === '__MIXED__' ? '-- ערכים שונים --' : ''} 
          />
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-blue-200/60 dark:border-gray-700/50">
        <h5 className="font-extrabold text-sm text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
          חלוקה תקציבית (לכלל השורות הנבחרות)
        </h5>
        
        {bulkDists.map((dist, idx) => {
          const isBulkInventory = bulkFields.destinationType === 'Inventory' || (bulkFields.destinationType === '__MIXED__' && isAllInventory);
          const selProj = dist.projectId && dist.projectId !== '__MIXED__' ? data.projects?.find(p => p.id === Number(dist.projectId)) : null;

          const availProjs = data.projects?.filter(p => {
            if (!isItemActive(p)) return false;
            if (selectedOrgs.length > 0 && !selectedOrgs.every(orgId => p.inventoryOrgIds?.includes(Number(orgId)))) return false;
            if (isBulkInventory && !p.allowedExpenditureTypeIds?.includes(4)) return false;
            return true;
          });

          return (
            <div key={dist.id} className="flex flex-col gap-3 p-3 mb-3 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50 rounded-xl shadow-sm">
              <div className="flex flex-wrap lg:flex-nowrap items-end gap-3 w-full">
                <span className="text-xs font-bold text-gray-400 shrink-0 mb-2">{idx + 1}.</span>
                
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-1.5 px-3 rounded-lg">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold mb-0.5">אחוז (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={dist.percentage || ''} onChange={e => handleBulkDistChange(dist.id, 'percentage', e.target.value)} className="w-16 p-1 border rounded text-xs font-bold outline-none focus:border-blue-500 dark:bg-gray-700" />
                  </div>
                  
                  {isSameQuantity && (
                    <>
                      <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 font-bold mb-0.5">כמות</label>
                        <input type="number" min="0" step={commonUOM === 'EA' ? '1' : '0.01'} value={dist.quantity || ''} onChange={e => handleBulkDistChange(dist.id, 'quantity', e.target.value)} className="w-16 p-1 border rounded text-xs font-bold outline-none focus:border-blue-500 dark:bg-gray-700" />
                      </div>
                    </>
                  )}
                </div>

                <div className={`grid grid-cols-2 ${!isBulkInventory ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-2 flex-1`}>
                  <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold mb-0.5">פרויקט</label>
                    <select value={dist.projectId || '__MIXED__'} onChange={(e) => handleBulkDistChange(dist.id, 'projectId', Number(e.target.value))} className={bulkSelectClass}>
                      <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
                      {availProjs?.map(p => <option key={p.id} value={p.id}>{p.projectCode} - {p.projectName}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold mb-0.5">משימה</label>
                    <select value={dist.taskId || '__MIXED__'} onChange={(e) => handleBulkDistChange(dist.id, 'taskId', Number(e.target.value))} className={bulkSelectClass}>
                      <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
                      {data.tasks?.filter(t => (!dist.projectId || t.projectId === dist.projectId) && isItemActive(t)).map(t => <option key={t.id} value={t.id}>{t.taskCode} - {t.taskName}</option>)}
                    </select>
                  </div>

                  {!isBulkInventory && (
                    <>
                      <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 font-bold mb-0.5">סוג הוצאה</label>
                        <select value={dist.expenditureTypeId || '__MIXED__'} onChange={(e) => handleBulkDistChange(dist.id, 'expenditureTypeId', Number(e.target.value))} className={bulkSelectClass}>
                          <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
                          {data.expenditureTypes?.filter(et => {
                            if (!isItemActive(et)) return false;
                            if (selProj?.allowedExpenditureTypeIds && !selProj.allowedExpenditureTypeIds.includes(et.id)) return false;
                            return true;
                          }).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 font-bold mb-0.5">יחידה מממנת</label>
                        <select value={dist.expenditureOrgId || '__MIXED__'} onChange={(e) => handleBulkDistChange(dist.id, 'expenditureOrgId', Number(e.target.value))} className={bulkSelectClass}>
                          <option value="__MIXED__" disabled hidden>-- ערכים שונים --</option>
                          {data.expenditureOrganizations?.filter(isItemActive).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
                
                {bulkDists.length > 1 && (
                  <button onClick={() => setBulkDists(prev => prev.filter(d => d.id !== dist.id))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-4 mt-3">
          <button onClick={handleAddBulkDist} disabled={!isSameUOM} className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-lg hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 text-sm transition-colors cursor-pointer">
            <span>+</span> הוסף פיצול (Split)
          </button>
          
          {!isSameUOM ? (
            <div className="text-xs text-rose-500 font-bold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
              לא ניתן לפצל: יחידות המידה שונות בשורות שנבחרו.
            </div>
          ) : commonUOM === 'EA' ? (
            <div className="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              שימו לב: פיצול ליחידת מידה (EA) יעוגל כלפי מטה למספרים שלמים.
            </div>
          ) : null}
        </div>
        
      </div>
      
      <div className="mt-6 pt-4 flex justify-end">
        <button 
          onClick={handleApplyBulk} 
          className="px-6 py-2.5 bg-blue-600 text-white font-black text-sm rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          אשר ועדכן {selectedLineIds.length} שורות נבחרות
        </button>
      </div>
    </div>
  );
}