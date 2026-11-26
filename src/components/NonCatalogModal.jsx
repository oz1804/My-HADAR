import React, { useState, useEffect } from 'react';
import data from '../data/data.json';
import { runScreen, visibleMessages, messagesFor, hasBlocking } from '../utils/validationEngine';
import { nonCatalogContext } from '../utils/validationScreens';
import { useValidationRules } from '../hooks/validationRulesContext';
import { FieldLabelRow, FieldMessageBelow } from './Validation/FieldMessage';
import { fieldToneClass, focusFirstBlocking } from './Validation/fieldTone';

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
  
  // --- שלב מקדים: מהות הפריט (טובין שמצריך קליטה / שירות) קובעת את סוג השורה ---
  const [step, setStep] = useState('choose'); // 'choose' | 'form'

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
  
  // הודעת סיכום כשהפעולה נחסמה; ההודעות עצמן מוצגות ליד השדות (ולידציות "פריט ללא מק"ט")
  const [errorMessage, setErrorMessage] = useState('');
  const [attempted, setAttempted] = useState(false);
  const rules = useValidationRules();

  // --- לוגיקה אוטומטית: נעילת יעד דרישה כשנבחר "שירות" ---
  useEffect(() => {
    if (lineType === 'שירות') {
      setDestinationType('Expense');
      setSubInventory(''); // איפוס במעבר להוצאה
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
      setStep('choose');
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
      setAttempted(false);
    }
  }, [isOpen, globalDestType, globalSubInv]);

  if (!isOpen) return null;

  const clearError = () => setErrorMessage('');

  // בחירה במסך המקדים: סוג השורה נקבע לפיה (בשירות - יעד הוצאה נעול ומאשר שירות חובה, ב-useEffect למעלה)
  const chooseKind = (kind) => {
    setLineType(kind);
    setAttempted(false);
    setErrorMessage('');
    setStep('form');
  };

  // --- ולידציות המסך (מוגדרות במסך ניהול המערכת) ---
  const allMessages = runScreen('NON_CATALOG', nonCatalogContext({
    lineType, requester, description, destinationType, inventoryOrg, subInventory, uom,
    quantity, unitPrice, currency, exchangeDate, rate, serviceApprover, buyer
  }), rules);
  const messages = visibleMessages(allMessages, attempted);
  const nm = (field) => messagesFor(messages, field);

  const validateForm = () => {
    setAttempted(true);
    if (hasBlocking(allMessages)) {
      setErrorMessage('יש לתקן את השדות המסומנים.');
      focusFirstBlocking();
      return false;
    }
    setErrorMessage('');
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
        
        {step === 'choose' && (
          <div className="p-6 sm:p-8" data-testid="noncat-kind-step">
            <h4 className="text-lg font-black text-gray-900 dark:text-white">מה ברצונך להוסיף לסל?</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">הבחירה קובעת את סוג השורה ואת השדות שיידרשו בטופס.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="group" aria-label="מהות הפריט">
              {[
                {
                  kind: 'טובין', title: 'טובין ללא מק"ט', tag: 'טובין (Goods)',
                  text: 'פריט פיזי שיסופק ויחייב קליטה במחסן או אישור קבלה.',
                  tone: 'blue',
                  icon: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9'
                },
                {
                  kind: 'שירות', title: 'שירות', tag: 'שירות (Service)',
                  text: 'עבודה או שירות. יעד הדרישה יהיה הוצאה, ויש לבחור מאשר שירות.',
                  tone: 'emerald',
                  icon: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z'
                }
              ].map(o => (
                <button
                  key={o.kind}
                  type="button"
                  data-kind={o.kind}
                  onClick={() => chooseKind(o.kind)}
                  className={`group flex flex-col items-start text-start p-5 rounded-2xl border-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 ${o.tone === 'blue'
                    ? 'border-blue-100 dark:border-blue-900/50 hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 focus-visible:ring-blue-500'
                    : 'border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-500 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20 focus-visible:ring-emerald-500'}`}
                >
                  <span className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${o.tone === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={o.icon} /></svg>
                  </span>
                  <span className="block text-base font-black text-gray-900 dark:text-white">{o.title}</span>
                  <span className="block text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{o.text}</span>
                  <span className={`inline-block mt-3 text-[11px] font-bold px-2 py-0.5 rounded-md ${o.tone === 'blue' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>סוג שורה: {o.tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'form' && (<>
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
            
            <div data-validation-field="lineType">
              <FieldLabelRow messages={nm('lineType')}>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  סוג השורה
                  <button type="button" onClick={() => setStep('choose')} data-testid="noncat-change-kind" className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">שינוי</button>
                </label>
              </FieldLabelRow>
              {/* נקבע במסך המקדים (מהות הפריט); לשינוי - "שינוי" */}
              <select value={lineType} disabled aria-label="סוג השורה" onChange={(e) => { setLineType(e.target.value); clearError('lineType'); }} className={`w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed text-sm transition-all outline-none ${fieldToneClass(nm('lineType'))}`}>
                <option value="טובין">טובין (Goods)</option>
                <option value="שירות">שירות (Service)</option>
              </select>
              <FieldMessageBelow messages={nm('lineType')} />
            </div>
            <div data-validation-field="requester">
              <FieldLabelRow messages={nm('requester')}>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">מזמין</label>
              </FieldLabelRow>
              <select value={requester} onChange={(e) => setRequester(e.target.value)} className={`w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none ${fieldToneClass(nm('requester'))}`}>
                {data.users?.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
              <FieldMessageBelow messages={nm('requester')} />
            </div>

            <div className="md:col-span-2" data-validation-field="description">
              <FieldLabelRow messages={nm('description')}>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">תיאור הפריט/השירות <span className="text-red-500">*</span></label>
              </FieldLabelRow>
              <textarea 
                rows="2" 
                value={description} 
                onChange={(e) => { setDescription(e.target.value); clearError('description'); }} 
                placeholder="הזן תיאור מפורט ככל הניתן..." 
                className={`w-full p-3 border rounded-xl text-sm transition-all outline-none resize-none border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 ${fieldToneClass(nm('description'))}`}
              ></textarea>
              <FieldMessageBelow messages={nm('description')} />
            </div>

            {/* בלוק יעד דרישה, ארגון מלאי ומחסן */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5 p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <div data-validation-field="destinationType">
                <FieldLabelRow messages={nm('destinationType')}>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">יעד הדרישה</label>
                </FieldLabelRow>
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
                  className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none ${lineType === 'שירות' ? 'bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'} ${fieldToneClass(nm('destinationType'))}`}
                >
                  <option value="Inventory">מלאי (Inventory)</option>
                  <option value="Expense">הוצאה (Expense)</option>
                </select>
                <FieldMessageBelow messages={nm('destinationType')} />
              </div>

              {/* ארגון מלאי תמיד פתוח לבחירה ותמיד חובה */}
              <div data-validation-field="inventoryOrg">
                <FieldLabelRow messages={nm('inventoryOrg')}>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  ארגון מלאי <span className="text-red-500">*</span>
                </label>
                </FieldLabelRow>
                <select 
                  value={inventoryOrg} 
                  onChange={(e) => { setInventoryOrg(e.target.value); clearError('inventoryOrg'); }} 
                  className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 ${fieldToneClass(nm('inventoryOrg'))}`}
                >
                  <option value="">בחר ארגון...</option>
                  {data.inventoryOrganizations?.map(org => (
                    <option key={org.id} value={org.id}>{org.code} - {org.name}</option>
                  ))}
                </select>
                <FieldMessageBelow messages={nm('inventoryOrg')} />
              </div>

              {/* שדה מחסן מוצג רק אם היעד הוא מלאי, ואינו חובה */}
              {destinationType === 'Inventory' && (
                <div className="animate-fade-in" data-validation-field="subInventory">
                  <FieldLabelRow messages={nm('subInventory')}>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    מחסן (Sub-Inv)
                  </label>
                  </FieldLabelRow>
                  <select 
                    value={subInventory} 
                    onChange={(e) => { setSubInventory(e.target.value); clearError('subInventory'); }} 
                    disabled={!inventoryOrg} 
                    className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 ${fieldToneClass(nm('subInventory'))} ${!inventoryOrg ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">בחר מחסן...</option>
                    {data.subInventories?.filter(s => String(s.inventoryOrgId) === String(inventoryOrg)).map(sub => (
                      <option key={sub.id} value={sub.code}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                  <FieldMessageBelow messages={nm('subInventory')} />
                </div>
              )}
            </div>

            <div data-validation-field="uom">
              <FieldLabelRow messages={nm('uom')}>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">יחידת מידה</label>
              </FieldLabelRow>
              <select value={uom} onChange={(e) => setUom(e.target.value)} className={`w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono ${fieldToneClass(nm('uom'))}`}>
                {data.uoms?.map(u => (
                  <option key={u.code} value={u.code}>{u.name} ({u.code})</option>
                ))}
              </select>
              <FieldMessageBelow messages={nm('uom')} />
            </div>
            
            <div className="hidden md:block"></div> {/* שומר על יישור הרשת (Grid) */}

            <div data-validation-field="quantity">
              <FieldLabelRow messages={nm('quantity')}>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">כמות <span className="text-red-500">*</span></label>
              </FieldLabelRow>
              <input 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={(e) => { setQuantity(e.target.value); clearError('quantity'); }} 
                className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none font-mono border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 ${fieldToneClass(nm('quantity'))}`} 
              />
              <FieldMessageBelow messages={nm('quantity')} />
            </div>
            <div data-validation-field="unitPrice">
              <FieldLabelRow messages={nm('unitPrice')}>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">מחיר ליחידה <span className="text-red-500">*</span></label>
              </FieldLabelRow>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={unitPrice} 
                onChange={(e) => { setUnitPrice(e.target.value); clearError('unitPrice'); }} 
                placeholder="0.00" 
                className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none font-mono border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 ${fieldToneClass(nm('unitPrice'))}`} 
              />
              <FieldMessageBelow messages={nm('unitPrice')} />
            </div>

            {/* קוביית כספים ושערי חליפין */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/80 dark:bg-gray-900/30 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <div data-validation-field="currency">
                <FieldLabelRow messages={nm('currency')}>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">מטבע</label>
                </FieldLabelRow>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${fieldToneClass(nm('currency'))}`}>
                  <option value="ILS">שקל חדש (ILS)</option>
                  <option value="USD">דולר אמריקאי (USD)</option>
                  <option value="EUR">אירו (EUR)</option>
                  <option value="GBP">ליש"ט (GBP)</option>
                </select>
                <FieldMessageBelow messages={nm('currency')} />
              </div>
              <div data-validation-field="exchangeDate">
                <FieldLabelRow messages={nm('exchangeDate')}>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">תאריך שערוך</label>
                </FieldLabelRow>
                <input 
                  type="date" 
                  value={exchangeDate} 
                  onChange={(e) => handleExchangeDateChange(e.target.value)} 
                  disabled={currency === 'ILS'} 
                  className={`w-full p-2 border rounded-lg text-sm outline-none font-mono ${currency === 'ILS' ? 'bg-gray-200 dark:bg-gray-700 border-transparent text-gray-400' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'} ${fieldToneClass(nm('exchangeDate'))}`} 
                />
                <FieldMessageBelow messages={nm('exchangeDate')} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">שער</label>
                <input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} disabled={currency === 'ILS'} className={`w-full p-2 border rounded-lg text-sm outline-none font-mono ${currency === 'ILS' ? 'bg-gray-200 dark:bg-gray-700 border-transparent text-gray-400' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'}`} />
              </div>
            </div>

            <div data-validation-field="serviceApprover">
              <FieldLabelRow messages={nm('serviceApprover')}>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">מאשר שירות {lineType === 'שירות' && <span className="text-red-500">*</span>}</label>
              </FieldLabelRow>
              <select 
                value={serviceApprover} 
                onChange={(e) => { setServiceApprover(e.target.value); clearError('serviceApprover'); }} 
                className={`w-full p-2.5 border rounded-xl text-sm transition-all outline-none border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 ${fieldToneClass(nm('serviceApprover'))}`}
              >
                <option value="">בחר מאשר שירות...</option>
                {data.users?.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
              <FieldMessageBelow messages={nm('serviceApprover')} />
            </div>
            <div data-validation-field="buyer">
              <FieldLabelRow messages={nm('buyer')}>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">קניין מומלץ</label>
              </FieldLabelRow>
              <select value={buyer} onChange={(e) => setBuyer(e.target.value)} className={`w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none ${fieldToneClass(nm('buyer'))}`}>
                <option value="">בחר קניין...</option>
                {data.buyers?.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <FieldMessageBelow messages={nm('buyer')} />
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
        </>)}

      </div>
    </div>
  );
}