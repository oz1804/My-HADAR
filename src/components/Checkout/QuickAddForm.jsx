import React, { useState, useEffect } from 'react';
import data from '../../data/data.json';

export default function QuickAddForm({
  onAddNewLine,
  onClose,
  hasLines,
  currentUser,
  buyerNotes,
  justification,
  headerProjectId,
  headerTaskId,
  headerExpTypeId,
  headerExpOrgId,
  isBudgetMixed,
  headerOrg,
  
  // קליטת הפרופס החדשים מהכותרת
  headerBuyer = '',
  headerRequester = '',
  headerServiceApprover = ''
}) {
  const getDefaultNeedByDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const [quickSearch, setQuickSearch] = useState('');
  const [quickItem, setQuickItem] = useState(null);
  const [quickDesc, setQuickDesc] = useState('');
  const [quickQty, setQuickQty] = useState(1);
  const [quickUom, setQuickUom] = useState('EA');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickNeedBy, setQuickNeedBy] = useState(getDefaultNeedByDate());
  
  const [quickLineType, setQuickLineType] = useState('טובין');
  const [quickDest, setQuickDest] = useState('Inventory');
  const [quickCurrency, setQuickCurrency] = useState('ILS');
  const [quickExchangeDate, setQuickExchangeDate] = useState('');
  const [quickSupplier, setQuickSupplier] = useState('');
  const [quickQuality, setQuickQuality] = useState('');
  
  // סטייטים לקניין, מזמין ומאשר שירות בשורה המהירה (מושכים את ברירת המחדל מהכותרת אם קיימת)
  const [quickBuyer, setQuickBuyer] = useState(headerBuyer !== 'mixed' ? headerBuyer : '');
  const [quickRequester, setQuickRequester] = useState(headerRequester !== 'mixed' ? headerRequester : '');
  const [quickApprover, setQuickApprover] = useState(headerServiceApprover !== 'mixed' && headerServiceApprover ? headerServiceApprover : (currentUser?.id || ''));

  const [quickBuyerNotes, setQuickBuyerNotes] = useState(buyerNotes);
  const [quickJustification, setQuickJustification] = useState(justification);

  const [quickOrg, setQuickOrg] = useState(headerOrg !== 'mixed' ? headerOrg : '');

  const [quickDists, setQuickDists] = useState([{
    id: Date.now(),
    percentage: 100,
    quantity: 1,
    projectId: headerProjectId,
    taskId: headerTaskId,
    expenditureTypeId: headerExpTypeId,
    expenditureOrgId: headerExpOrgId
  }]);

  const [filteredItems, setFilteredItems] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // סנכרון אוטומטי מהכותרת לשורה המהירה כשמשנים בהדר
  useEffect(() => { setQuickBuyerNotes(buyerNotes); }, [buyerNotes]);
  useEffect(() => { setQuickJustification(justification); }, [justification]);
  useEffect(() => { setQuickOrg(headerOrg !== 'mixed' ? headerOrg : ''); }, [headerOrg]);
  useEffect(() => { setQuickBuyer(headerBuyer !== 'mixed' ? headerBuyer : ''); }, [headerBuyer]);
  useEffect(() => { setQuickRequester(headerRequester !== 'mixed' ? headerRequester : ''); }, [headerRequester]);
  useEffect(() => { setQuickApprover(headerServiceApprover !== 'mixed' && headerServiceApprover ? headerServiceApprover : (currentUser?.id || '')); }, [headerServiceApprover, currentUser]);

  useEffect(() => {
    if (!isBudgetMixed && quickDists.length === 1) {
      setQuickDists(prev => [{
        ...prev[0],
        projectId: headerProjectId,
        taskId: headerTaskId,
        expenditureTypeId: headerExpTypeId,
        expenditureOrgId: headerExpOrgId
      }]);
    }
  }, [headerProjectId, headerTaskId, headerExpTypeId, headerExpOrgId, isBudgetMixed]);

  useEffect(() => {
    if (quickSearch.trim().length >= 2 && !quickItem) {
      const lowerSearch = quickSearch.toLowerCase();
      const results = data.catalogItems?.filter(i => 
        (i.sku && i.sku.toLowerCase().includes(lowerSearch)) || 
        (i.description && i.description.toLowerCase().includes(lowerSearch))
      ) || [];
      setFilteredItems(results);
    } else {
      setFilteredItems([]);
    }
  }, [quickSearch, quickItem]);

  const handleSelectQuickItem = (item) => {
    setQuickItem(item);
    setQuickSearch(item.sku);
    setQuickDesc(item.description);
    handleQuickUomChange(item.uom || 'EA');
    setQuickPrice(item.price ?? '');
    setFilteredItems([]);
    setIsSearchFocused(false);
  };

  const handleClearQuickItem = () => {
    setQuickItem(null);
    setQuickSearch('');
    setQuickDesc('');
    setQuickPrice('');
    handleQuickUomChange('EA');
  };

  const handleClearQuickAddForm = () => {
    handleClearQuickItem();
    handleQuickQtyChange(1);
    setQuickLineType('טובין');
    setQuickDest('Inventory');
    setQuickOrg(headerOrg !== 'mixed' ? headerOrg : '');
    setQuickCurrency('ILS');
    setQuickExchangeDate('');
    setQuickSupplier('');
    setQuickQuality('');
    
    // איפוס הערכים חזרה לברירת המחדל של הכותרת
    setQuickBuyer(headerBuyer !== 'mixed' ? headerBuyer : '');
    setQuickRequester(headerRequester !== 'mixed' ? headerRequester : '');
    setQuickApprover(headerServiceApprover !== 'mixed' && headerServiceApprover ? headerServiceApprover : (currentUser?.id || ''));
    setQuickBuyerNotes(buyerNotes);
    setQuickJustification(justification);

    setQuickDists([{
      id: Date.now(),
      percentage: 100,
      quantity: 1,
      projectId: isBudgetMixed ? '' : headerProjectId,
      taskId: isBudgetMixed ? '' : headerTaskId,
      expenditureTypeId: isBudgetMixed ? '' : headerExpTypeId,
      expenditureOrgId: isBudgetMixed ? '' : headerExpOrgId
    }]);
  };

  const handleQuickQtyChange = (newQtyStr) => {
    const newQty = Number(newQtyStr) || 0;
    setQuickQty(newQty);
    setQuickDists(prev => prev.map(d => ({
      ...d,
      quantity: quickUom === 'EA' ? Math.floor((d.percentage / 100) * newQty) : (d.percentage / 100) * newQty
    })));
  };

  const handleQuickUomChange = (newUom) => {
    setQuickUom(newUom);
    if (newUom === 'EA') {
      setQuickDists(prev => prev.map(d => ({
        ...d,
        quantity: Math.floor((d.percentage / 100) * quickQty)
      })));
    }
  };

  const handleQuickDistFieldChange = (distId, field, value) => {
    setQuickDists(prev => prev.map(d => {
      if (d.id !== distId) return d;
      let updated = { ...d, [field]: value };
      
      if (field === 'percentage') {
        updated.quantity = (Number(value) / 100) * quickQty;
        if (quickUom === 'EA') updated.quantity = Math.floor(updated.quantity);
      } else if (field === 'quantity') {
        updated.percentage = quickQty > 0 ? (Number(value) / quickQty) * 100 : 0;
      }
      return updated;
    }));
  };

  const handleAddQuickDist = () => {
    setQuickDists(prev => {
      const currentPct = prev.reduce((sum, d) => sum + Number(d.percentage || 0), 0);
      const remainingPct = Math.max(0, 100 - currentPct);
      let remainingQty = (remainingPct / 100) * quickQty;
      if (quickUom === 'EA') remainingQty = Math.floor(remainingQty);
      
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

  const handleSubmitQuickLine = () => {
    if (!quickItem && !quickDesc.trim()) {
      alert('חובה להזין תיאור פריט אם לא נבחר מק"ט מהקטלוג.');
      return;
    }
    if (Number(quickQty) <= 0) {
      alert('הכמות חייבת להיות גדולה מאפס.');
      return;
    }
    if (!quickOrg) {
      alert('חובה לבחור ארגון מלאי לשורה החדשה.');
      return;
    }
    if (quickLineType === 'שירות' && !String(quickApprover).trim()) {
      alert('עבור סוג שורה "שירות", חובה להזין מאשר שירות.');
      return;
    }

    const totalPct = quickDists.reduce((sum, d) => sum + (Number(d.percentage) || 0), 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      alert('שגיאה: סך האחוזים בחלוקה התקציבית לשורה חייב להיות בדיוק 100%');
      return;
    }

    if (quickUom === 'EA') {
      const hasDecimal = quickDists.some(d => Math.abs(d.quantity - Math.round(d.quantity)) > 0.001);
      if (hasDecimal) {
        alert('שגיאה חמורה: פיצול ליחידת מידה (EA) דורש כמויות שלמות באחוזים שבחרת.');
        return;
      }
    }

    onAddNewLine({
      itemId: quickItem?.id || null,
      sku: quickItem ? quickItem.sku : '',
      itemDescription: quickDesc,
      quantity: Number(quickQty),
      uom: quickUom,
      unitPrice: Number(quickPrice) || 0,
      needByDate: quickNeedBy,
      lineType: quickLineType,
      destinationType: quickDest,
      inventoryOrg: quickOrg,
      currency: quickCurrency,
      exchangeDate: quickExchangeDate,
      supplier: quickSupplier,
      qualityRequirement: quickQuality,
      buyer: quickBuyer,             
      requester: quickRequester,     
      serviceApprover: quickApprover,
      buyerNotes: quickBuyerNotes,
      justification: quickJustification,
      distributions: quickDists
    });

    handleClearQuickAddForm();
    if (hasLines && onClose) onClose();
  };

  const today = new Date().toISOString().split('T')[0];
  const isItemActive = (item) => (!item?.startDate || item.startDate <= today) && (!item?.endDate || item.endDate >= today);

  const quickInputClass = "w-full p-2 border border-emerald-200 dark:border-emerald-800/50 rounded-lg bg-white dark:bg-gray-800 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors disabled:bg-gray-100 disabled:dark:bg-gray-900/50 disabled:text-gray-500";
  const quickLabelClass = "block text-[10px] font-bold text-emerald-800/80 dark:text-emerald-300/80 mb-1 uppercase tracking-wider";

  const activeQuickOrg = quickOrg || '';
  const quickIsInventory = quickDest === 'Inventory';

  const quickAvailableProjects = data.projects?.filter(p => {
    if (!isItemActive(p)) return false;
    if (activeQuickOrg && !p.inventoryOrgIds?.includes(Number(activeQuickOrg))) return false;
    if (quickIsInventory && !p.allowedExpenditureTypeIds?.includes(4)) return false;
    return true;
  });

  const quickAvailableTasks = data.tasks?.filter(t => {
    if (!isItemActive(t)) return false;
    if (quickDists[0]?.projectId && t.projectId !== Number(quickDists[0].projectId)) return false;
    return true;
  });

  return (
    <div className="bg-gradient-to-l from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-gray-800 rounded-2xl shadow-sm border-t-4 border-t-emerald-500 border-x border-b border-gray-100 dark:border-gray-700 p-5 mt-4 mb-4 animate-fade-in relative z-20 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">הוספת שורה מהירה</h3>
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-black tracking-wider shadow-sm">חדש!</span>
        </div>
        {hasLines && onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer" title="מזער חלונית">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-2 relative">
          <label className={quickLabelClass}>חיפוש מק"ט (LOV)</label>
          <div className="relative">
            <input 
              type="text" 
              value={quickSearch}
              onChange={(e) => {
                setQuickSearch(e.target.value);
                if (quickItem) handleClearQuickItem();
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder='חפש מק"ט או תיאור...'
              className={quickInputClass}
            />
            {quickItem && (
              <button 
                onClick={handleClearQuickItem} 
                className="absolute left-2 top-2.5 text-gray-400 hover:text-red-500 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>
          {isSearchFocused && filteredItems.length > 0 && (
            <ul className="absolute top-full right-0 w-[300px] mt-1 bg-white dark:bg-gray-800 border border-emerald-100 dark:border-gray-600 shadow-xl rounded-xl max-h-60 overflow-y-auto z-50">
              {filteredItems.map(item => (
                <li key={item.id} onMouseDown={(e) => { e.preventDefault(); handleSelectQuickItem(item); }} className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors">
                  <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-0.5">{item.sku}</div>
                  <div className="text-sm text-gray-800 dark:text-gray-200 truncate">{item.description}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="md:col-span-3">
          <label className={quickLabelClass}>תיאור הפריט (חובה)</label>
          <input type="text" value={quickDesc} onChange={(e) => setQuickDesc(e.target.value)} disabled={!!quickItem} placeholder="תיאור הפריט..." className={quickInputClass} />
        </div>

        <div className="md:col-span-1">
          <label className={quickLabelClass}>כמות</label>
          <input type="number" min="1" value={quickQty} onChange={(e) => handleQuickQtyChange(e.target.value)} className={`${quickInputClass} text-center font-bold`} />
        </div>

        <div className="md:col-span-1">
          <label className={quickLabelClass}>יח' מידה</label>
          <select value={quickUom} disabled={!!quickItem} onChange={(e) => handleQuickUomChange(e.target.value)} className={quickInputClass}>
            {data.uoms?.map(u => <option key={u.code} value={u.code}>{u.name}</option>)}
          </select>
        </div>

        <div className="md:col-span-1">
          <label className={quickLabelClass}>מחיר (₪)</label>
          <input type="number" min="0" step="0.01" value={quickPrice} onChange={(e) => setQuickPrice(e.target.value)} disabled={quickItem?.price != null} placeholder="0.00" className={`${quickInputClass} text-center`} title={quickItem?.price != null ? "המחיר הגיע מהמחירון וננעל" : ""} />
        </div>

        <div className="md:col-span-2">
          <label className={quickLabelClass}>תאריך נדרש</label>
          <input type="date" value={quickNeedBy} onChange={(e) => setQuickNeedBy(e.target.value)} className={quickInputClass} />
        </div>

        <div className="md:col-span-2">
          <label className={quickLabelClass}>סוג שורה</label>
          <select 
            value={quickLineType} 
            onChange={(e) => {
              setQuickLineType(e.target.value);
              if (e.target.value === 'שירות' && !quickApprover) setQuickApprover(currentUser?.id || '');
            }} 
            disabled={!!quickItem}
            className={quickInputClass}
            title={!!quickItem ? "לא ניתן לשנות סוג שורה לפריט קטלוגי" : ""}
          >
            <option value="טובין">טובין</option>
            <option value="שירות">שירות</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={quickLabelClass}>יעד דרישה</label>
          <select value={quickDest} onChange={(e) => setQuickDest(e.target.value)} className={quickInputClass}>
            <option value="Inventory">מלאי (Inventory)</option>
            <option value="Expense">הוצאה (Expense)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={`${quickLabelClass} ${!quickOrg ? 'text-rose-600 dark:text-rose-400' : ''}`}>
            ארגון מלאי {!quickOrg ? '(חובה)' : ''}
          </label>
          <select value={quickOrg} onChange={(e) => setQuickOrg(e.target.value)} className={`${quickInputClass} ${!quickOrg ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}>
            <option value="">בחר ארגון מלאי...</option>
            {data.inventoryOrganizations?.map(org => <option key={org.id} value={org.id}>{org.code} - {org.name}</option>)}
          </select>
        </div>

        <div className="md:col-span-1">
          <label className={quickLabelClass}>מטבע</label>
          <select value={quickCurrency} onChange={(e) => {
            setQuickCurrency(e.target.value);
            if (e.target.value === 'ILS') setQuickExchangeDate('');
          }} className={quickInputClass}>
            <option value="ILS">ILS</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={quickLabelClass}>תאריך שערוך</label>
          <input type="date" value={quickExchangeDate} disabled={quickCurrency === 'ILS'} onChange={(e) => setQuickExchangeDate(e.target.value)} className={`${quickInputClass} disabled:opacity-50`} />
        </div>

        <div className="md:col-span-3">
          <label className={quickLabelClass}>ספק מומלץ</label>
          <select value={quickSupplier} onChange={(e) => setQuickSupplier(e.target.value)} className={quickInputClass}>
            <option value="">לא הוגדר</option>
            {data.suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className={quickLabelClass}>דרישת איכות</label>
          <select value={quickQuality} onChange={(e) => setQuickQuality(e.target.value)} className={quickInputClass}>
            <option value="">ללא דרישה</option>
            {data.qualityRequirements?.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className={quickLabelClass}>מזמין</label>
          <select value={quickRequester} onChange={(e) => setQuickRequester(e.target.value)} className={quickInputClass}>
            <option value="">לא הוגדר</option>
            {data.users?.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className={`${quickLabelClass} ${quickLineType === 'שירות' ? 'text-rose-600 dark:text-rose-400' : ''}`}>מאשר שירות {quickLineType === 'שירות' && '(חובה)'}</label>
          <select value={quickApprover} onChange={(e) => setQuickApprover(e.target.value)} className={`${quickInputClass} ${quickLineType === 'שירות' && !quickApprover ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}>
            <option value="">לא הוגדר</option>
            {data.users?.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className={quickLabelClass}>קניין מומלץ</label>
          <select value={quickBuyer} onChange={(e) => setQuickBuyer(e.target.value)} className={quickInputClass}>
            <option value="">לא הוגדר</option>
            {data.buyers?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div className="md:col-span-6">
          <label className={quickLabelClass}>הערות לקניין</label>
          <textarea 
            rows="2" 
            value={quickBuyerNotes} 
            onChange={(e) => setQuickBuyerNotes(e.target.value)} 
            className={`${quickInputClass} resize-none`} 
            placeholder="הערות..." 
          />
        </div>

        <div className="md:col-span-6">
          <label className={quickLabelClass}>הצדקה</label>
          <textarea 
            rows="2" 
            value={quickJustification} 
            onChange={(e) => setQuickJustification(e.target.value)} 
            className={`${quickInputClass} resize-none`} 
            placeholder="הצדקה לרכש..." 
          />
        </div>
        
        <div className="md:col-span-12 mt-2 pt-4 border-t border-emerald-200/60 dark:border-gray-700/50">
           <h5 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
             חלוקה תקציבית (לשורה החדשה)
           </h5>
           
           {quickDists.map((dist, idx) => {
             const distProj = dist.projectId ? data.projects?.find(p => p.id === Number(dist.projectId)) : null;
             
             return (
               <div key={dist.id} className="flex flex-col gap-3 p-3 mb-3 bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-900/50 rounded-xl shadow-sm">
                 <div className="flex flex-wrap lg:flex-nowrap items-end gap-3 w-full">
                   <span className="text-xs font-bold text-gray-400 shrink-0 mb-2">{idx + 1}.</span>
                   
                   <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-1.5 px-3 rounded-lg">
                     <div className="flex flex-col">
                       <label className="text-[10px] text-gray-500 font-bold mb-0.5">אחוז (%)</label>
                       <input type="number" min="0" max="100" step="0.01" value={dist.percentage || ''} onChange={e => handleQuickDistFieldChange(dist.id, 'percentage', e.target.value)} className="w-16 p-1 border rounded text-xs font-bold outline-none focus:border-emerald-500 dark:bg-gray-700" />
                     </div>
                     <div className="flex flex-col">
                       <label className="text-[10px] text-gray-500 font-bold mb-0.5">כמות</label>
                       <input type="number" min="0" step={quickUom === 'EA' ? '1' : '0.01'} value={dist.quantity || ''} onChange={e => handleQuickDistFieldChange(dist.id, 'quantity', e.target.value)} className="w-16 p-1 border rounded text-xs font-bold outline-none focus:border-emerald-500 dark:bg-gray-700" />
                     </div>
                   </div>

                   <div className={`grid grid-cols-2 ${!quickIsInventory ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-2 flex-1`}>
                     <div className="flex flex-col">
                       <label className={quickLabelClass}>פרויקט</label>
                       <select value={dist.projectId || ''} onChange={(e) => handleQuickDistFieldChange(dist.id, 'projectId', Number(e.target.value))} className={quickInputClass}>
                         <option value="">בחר פרויקט...</option>
                         {quickAvailableProjects?.map(p => <option key={p.id} value={p.id}>{p.projectCode} - {p.projectName}</option>)}
                       </select>
                     </div>
                     <div className="flex flex-col">
                       <label className={quickLabelClass}>משימה</label>
                       <select value={dist.taskId || ''} onChange={(e) => handleQuickDistFieldChange(dist.id, 'taskId', Number(e.target.value))} className={quickInputClass}>
                         <option value="">בחר משימה...</option>
                         {data.tasks?.filter(t => (!dist.projectId || t.projectId === dist.projectId) && isItemActive(t)).map(t => <option key={t.id} value={t.id}>{t.taskCode} - {t.taskName}</option>)}
                       </select>
                     </div>
                     {!quickIsInventory && (
                       <>
                         <div className="flex flex-col">
                           <label className={quickLabelClass}>סוג הוצאה</label>
                           <select value={dist.expenditureTypeId || ''} onChange={(e) => handleQuickDistFieldChange(dist.id, 'expenditureTypeId', Number(e.target.value))} className={quickInputClass}>
                             <option value="">בחר סוג הוצאה...</option>
                             {data.expenditureTypes?.filter(et => {
                               if (!isItemActive(et)) return false;
                               if (distProj?.allowedExpenditureTypeIds && !distProj.allowedExpenditureTypeIds.includes(et.id)) return false;
                               return true;
                             }).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                           </select>
                         </div>
                         <div className="flex flex-col">
                           <label className={quickLabelClass}>יחידה מממנת</label>
                           <select value={dist.expenditureOrgId || ''} onChange={(e) => handleQuickDistFieldChange(dist.id, 'expenditureOrgId', Number(e.target.value))} className={quickInputClass}>
                             <option value="">בחר יחידה מממנת...</option>
                             {data.expenditureOrganizations?.filter(isItemActive).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                           </select>
                         </div>
                       </>
                     )}
                   </div>
                   
                   {quickDists.length > 1 && (
                     <button onClick={() => setQuickDists(prev => prev.filter(d => d.id !== dist.id))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                     </button>
                   )}
                 </div>
               </div>
             );
           })}

           <div className="flex flex-wrap items-center gap-4 mt-3">
             <button onClick={handleAddQuickDist} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg hover:bg-emerald-200 text-sm transition-colors cursor-pointer">
               <span>+</span> הוסף פיצול (Split)
             </button>
             {quickUom === 'EA' && (
               <div className="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                 שימו לב: פיצול ליחידת מידה (EA) יעוגל כלפי מטה למספרים שלמים.
               </div>
             )}
           </div>
        </div>

        <div className="md:col-span-12 flex justify-end items-end h-full mt-2">
          <button onClick={handleSubmitQuickLine} className="w-full md:w-auto px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            הוסף שורה
          </button>
        </div>
      </div>
    </div>
  );
}