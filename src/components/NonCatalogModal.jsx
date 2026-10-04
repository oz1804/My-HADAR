import React, { useState, useEffect } from 'react';
import data from '../data/data.json';

export default function NonCatalogModal({ 
  isOpen, 
  onClose, 
  onAddToCart, 
  onQuickOrder, 
  onSaveFavorite, // <--- הפונקציה החדשה לשמירת פריט חופשי כמועדף
  currentUser, 
  globalDestType,
  globalSubInv,
  globalProject,   
  globalTask,      
  globalExpType,   
  globalExpOrg     
}) {
  
  // --- ניהול הסטייט (מצבי הטופס) ---
  const [requester, setRequester] = useState(currentUser?.id || '');
  const [lineType, setLineType] = useState('טובין');
  const [description, setDescription] = useState('');
  
  // שימוש בברירת המחדל הגלובלית ליעד הדרישה
  const [destinationType, setDestinationType] = useState(globalDestType || 'Expense');
  
  const [uom, setUom] = useState('EA');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currency, setCurrency] = useState('ILS');
  const [exchangeDate, setExchangeDate] = useState('');
  const [rate, setRate] = useState(1);
  const [serviceApprover, setServiceApprover] = useState('');
  const [buyer, setBuyer] = useState('');
  
  // תוספת שדות ארגון מלאי ומחסן
  const [inventoryOrg, setInventoryOrg] = useState('');
  
  // אתחול המחסן מההגדרות הגלובליות רק אם היעד הוא מלאי!
  const [subInventory, setSubInventory] = useState(
    (globalDestType === 'Inventory' && globalSubInv) ? globalSubInv : ''
  );
  
  const [isFavorite, setIsFavorite] = useState(false);
  
  // ניהול הודעות שגיאה וסימון שדות חסרים
  const [errorMessage, setErrorMessage] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);

  // --- לוגיקה אוטומטית: נעילת יעד דרישה כשנבחר "שירות" ---
  useEffect(() => {
    if (lineType === 'שירות') {
      setDestinationType('Expense');
      setSubInventory(''); // איפוס במעבר להוצאה
    } else {
      setInvalidFields(prev => prev.filter(f => f !== 'serviceApprover'));
    }
  }, [lineType]);

  // --- לוגיקה אוטומטית: איפוס מחסן כשמשנים ארגון מלאי ---
  useEffect(() => {
    setSubInventory('');
  }, [inventoryOrg]);

  // --- לוגיקה אוטומטית: שליפת שער חליפין ברירת מחדל בעת שינוי מטבע ---
  useEffect(() => {
    if (currency === 'ILS') {
      setRate(1);
      setExchangeDate('');
    } else {
      const relevantRates = data.currencyExchangeRates?.filter(r => r.currency === currency) || [];
      if (relevantRates.length > 0) {
        relevantRates.sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestRate = relevantRates[0];
        setRate(latestRate.rate);
        setExchangeDate(latestRate.date);
      } else {
        setRate(1);
        setExchangeDate('');
      }
    }
  }, [currency]);

  const handleExchangeDateChange = (selectedDate) => {
    setExchangeDate(selectedDate);
    if (currency !== 'ILS') {
      const matchedRate = data.currencyExchangeRates?.find(
        r => r.currency === currency && r.date === selectedDate
      );
      if (matchedRate) {
        setRate(matchedRate.rate);
      }
    }
  };

  // איפוס הטופס והשגיאות כשסוגרים אותו
  useEffect(() => {
    if (!isOpen) {
      setLineType('טובין');
      setDescription('');
      setDestinationType(globalDestType || 'Expense');
      setInventoryOrg('');
      setSubInventory((globalDestType === 'Inventory' && globalSubInv) ? globalSubInv : '');
      setUom('EA');
      setUnitPrice('');
      setQuantity(1);
      setCurrency('ILS');
      setExchangeDate('');
      setRate(1);
      setServiceApprover('');
      setBuyer('');
      setIsFavorite(false); // איפוס מצב הלב
      setErrorMessage(''); 
      setInvalidFields([]);
    }
  }, [isOpen, globalDestType, globalSubInv]);

  if (!isOpen) return null;

  const clearError = (fieldName) => {
    setErrorMessage('');
    if (invalidFields.includes(fieldName)) {
      setInvalidFields(prev => prev.filter(f => f !== fieldName));
    }
  };

  const validateForm = () => {
    let missing = [];
    
    if (!description.trim()) missing.push('description');
    if (!quantity || Number(quantity) <= 0) missing.push('quantity');
    if (!unitPrice || Number(unitPrice) < 0) missing.push('unitPrice');
    if (!inventoryOrg) missing.push('inventoryOrg');
    if (lineType === 'שירות' && !serviceApprover) missing.push('serviceApprover');

    if (missing.length > 0) {
      setInvalidFields(missing);
      setErrorMessage("אנא השלם את שדות החובה המסומנים באדום.");
      return false;
    }
    
    setErrorMessage('');
    setInvalidFields([]);
    return true;
  };

  const buildLineData = () => ({
    isNonCatalog: true,
    requester,
    lineType,
    description,
    destinationType,
    inventoryOrg: inventoryOrg ? Number(inventoryOrg) : null,
    subInventory: destinationType === 'Inventory' ? subInventory : null,
    uom,
    unitPrice: Number(unitPrice),
    quantity: Number(quantity),
    currency,
    exchangeDate,
    rate: Number(rate),
    serviceApprover,
    buyer
  });

  const handleAddToCart = () => {
    if (!validateForm()) return;
    onAddToCart && onAddToCart(buildLineData());
    onClose();
  };

  const handleQuickOrder = () => {
    if (!validateForm()) return;
    onQuickOrder && onQuickOrder(buildLineData());
    onClose();
  };

  // --- הפונקציה שמופעלת בלחיצה על הלב ---
  const handleToggleFavorite = () => {
    if (isFavorite) {
      // אם כבר היה מועדף והוא לוחץ להסיר - במודל כזה אין לנו כרגע מנגנון הסרה מתוך הטופס עצמו, 
      // אבל נוכל להחזיר את הסטייט ל-false (ההסרה בפועל תתבצע ממסך המועדפים).
      setIsFavorite(false);
    } else {
      // חייבים וולידציה לפני ששומרים את זה במועדפים!
      if (!validateForm()) {
        setErrorMessage("אנא השלם את כל פרטי הפריט (שם, מחיר, ארגון) לפני השמירה כמועדף.");
        return;
      }
      
      const itemData = buildLineData();
      // מוסיפים ID וירטואלי ייחודי לפריט החופשי הזה כדי שנוכל לזהות אותו במועדפים
      itemData.id = `nc-${Date.now()}`; 
      
      if (onSaveFavorite) {
        onSaveFavorite(itemData);
      }
      setIsFavorite(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl my-auto flex flex-col transform transition-all border border-gray-100 dark:border-gray-700" dir="rtl">
        
        {/* כותרת */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-3xl">
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            הוספת פריט חופשי ללא מק"ט
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* טופס */}
        <div className="p-6 overflow-y-auto max-h-[70vh] scrollbar-thin">
          
          {/* באנר השגיאות האלגנטי */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-2xl flex items-start gap-3 animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-black text-red-800 dark:text-red-400">שגיאת הזנת נתונים</h4>
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">סוג השורה</label>
              <select value={lineType} onChange={(e) => { setLineType(e.target.value); clearError('lineType'); }} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                <option value="טובין">טובין (Goods)</option>
                <option value="שירות">שירות (Service)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">מזמין</label>
              <select value={requester} onChange={(e) => setRequester(e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                {data.users?.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">תיאור הפריט/השירות <span className="text-red-500">*</span></label>
              <textarea 
                rows="2" 
                value={description} 
                onChange={(e) => { setDescription(e.target.value); clearError('description'); }} 
                placeholder="הזן תיאור מפורט ככל הניתן..." 
                className={`w-full p-3 border rounded-xl text-sm transition-all outline-none resize-none ${invalidFields.includes('description') ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500'}`}
              ></textarea>
            </div>

            {/* בלוק יעד דרישה, ארגון מלאי ומחסן */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5 p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">יעד הדרישה</label>
                <select 
                  value={destinationType} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setDestinationType(val);
                    if (val === 'Expense') {
                      setSubInventory(''); // מאפס את המחסן אם עוברים להוצאה
                    }
                  }} 
                  disabled={lineType === 'שירות'} 
                  className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none ${lineType === 'שירות' ? 'bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'}`}
                >
                  <option value="Inventory">מלאי (Inventory)</option>
                  <option value="Expense">הוצאה (Expense)</option>
                </select>
              </div>

              {/* ארגון מלאי תמיד פתוח לבחירה ותמיד חובה */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${invalidFields.includes('inventoryOrg') ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  ארגון מלאי <span className="text-red-500">*</span>
                </label>
                <select 
                  value={inventoryOrg} 
                  onChange={(e) => { setInventoryOrg(e.target.value); clearError('inventoryOrg'); }} 
                  className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none ${invalidFields.includes('inventoryOrg') ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500 focus:ring-2 focus:ring-red-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'}`}
                >
                  <option value="">בחר ארגון...</option>
                  {data.inventoryOrganizations?.map(org => (
                    <option key={org.id} value={org.id}>{org.code} - {org.name}</option>
                  ))}
                </select>
              </div>

              {/* שדה מחסן מוצג רק אם היעד הוא מלאי, ואינו חובה */}
              {destinationType === 'Inventory' && (
                <div className="animate-fade-in">
                  <label className={`block text-xs font-bold mb-1.5 ${invalidFields.includes('subInventory') ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    מחסן (Sub-Inv)
                  </label>
                  <select 
                    value={subInventory} 
                    onChange={(e) => { setSubInventory(e.target.value); clearError('subInventory'); }} 
                    disabled={!inventoryOrg} 
                    className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none ${invalidFields.includes('subInventory') ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500 focus:ring-2 focus:ring-red-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'} ${!inventoryOrg ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">בחר מחסן...</option>
                    {data.subInventories?.filter(s => String(s.inventoryOrgId) === String(inventoryOrg)).map(sub => (
                      <option key={sub.id} value={sub.code}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">יחידת מידה</label>
              <select value={uom} onChange={(e) => setUom(e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono">
                {data.uoms?.map(u => (
                  <option key={u.code} value={u.code}>{u.name} ({u.code})</option>
                ))}
              </select>
            </div>
            
            <div className="hidden md:block"></div> {/* שומר על יישור הרשת (Grid) */}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">כמות <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={(e) => { setQuantity(e.target.value); clearError('quantity'); }} 
                className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none font-mono ${invalidFields.includes('quantity') ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500'}`} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">מחיר ליחידה <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={unitPrice} 
                onChange={(e) => { setUnitPrice(e.target.value); clearError('unitPrice'); }} 
                placeholder="0.00" 
                className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none font-mono ${invalidFields.includes('unitPrice') ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500'}`} 
              />
            </div>

            {/* קוביית כספים ושערי חליפין */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/80 dark:bg-gray-900/30 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">מטבע</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="ILS">שקל חדש (ILS)</option>
                  <option value="USD">דולר אמריקאי (USD)</option>
                  <option value="EUR">אירו (EUR)</option>
                  <option value="GBP">ליש"ט (GBP)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">תאריך שערוך</label>
                <input 
                  type="date" 
                  value={exchangeDate} 
                  onChange={(e) => handleExchangeDateChange(e.target.value)} 
                  disabled={currency === 'ILS'} 
                  className={`w-full p-2 border rounded-lg text-sm outline-none font-mono ${currency === 'ILS' ? 'bg-gray-200 dark:bg-gray-700 border-transparent text-gray-400' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'}`} 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">שער</label>
                <input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} disabled={currency === 'ILS'} className={`w-full p-2 border rounded-lg text-sm outline-none font-mono ${currency === 'ILS' ? 'bg-gray-200 dark:bg-gray-700 border-transparent text-gray-400' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'}`} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">מאשר שירות {lineType === 'שירות' && <span className="text-red-500">*</span>}</label>
              <select 
                value={serviceApprover} 
                onChange={(e) => { setServiceApprover(e.target.value); clearError('serviceApprover'); }} 
                className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none ${invalidFields.includes('serviceApprover') ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500'}`}
              >
                <option value="">בחר מאשר שירות...</option>
                {data.users?.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">קניין מומלץ</label>
              <select value={buyer} onChange={(e) => setBuyer(e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                <option value="">בחר קניין...</option>
                {data.buyers?.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <button 
            onClick={handleToggleFavorite} 
            className={`flex items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${isFavorite ? 'bg-rose-100/90 text-rose-600 border-rose-200 dark:bg-rose-900/50 dark:border-rose-800' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 hover:text-rose-500 hover:bg-rose-50 dark:border-gray-600 dark:hover:bg-gray-700'}`}
            title={isFavorite ? "הפריט נשמר כרגע כהעדפה" : "שמור תבנית פריט זה כמועדף"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          </button>

          <div className="flex w-full sm:w-auto gap-3">
            <button onClick={handleAddToCart} className="flex-1 sm:flex-none py-3 px-6 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl font-bold hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              הוספה לסל
            </button>
            <button onClick={handleQuickOrder} className="flex-1 sm:flex-none py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              הזמנה מהירה
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}