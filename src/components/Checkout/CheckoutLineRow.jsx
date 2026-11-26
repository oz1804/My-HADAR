import React, { useState } from 'react';
import data from '../../data/data.json';
import CheckoutLineDistributions from './CheckoutLineDistributions';
import { messagesFor, worstSeverity } from '../../utils/validationEngine';
import { FieldLabelRow, FieldMessageBelow, FieldMessageSide, SeverityIcon } from '../Validation/FieldMessage';
import { fieldToneClass, SEVERITY_TEXT } from '../Validation/fieldTone';

// שדות השורה שמוצגים בשורה הראשית (גם כשהשורה סגורה)
const SUMMARY_FIELDS = ['item', 'quantity', 'unitPrice'];

export default function CheckoutLineRow({ 
  line, 
  index, 
  isSelected, 
  onToggleSelect, 
  onLineOrgChange, 
  onLineFieldChange, 
  onRemoveLine, 
  currentUser,
  onOpenDocs,
  onAddDist,
  onDistFieldChange,
  onRemoveDist,
  lineMessages = [],          // הודעות הוולידציה של השורה (כבר מסוננות לפי מה שמוצג עכשיו)
  distMessages = () => [],    // (distId) => הודעות שורת החלוקה
  showValidation = false      // הייתה לחיצה על "העבר לסבב אישורים"
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [wasClosedByUser, setWasClosedByUser] = useState(false);
  const [isPriceEditable] = useState(!line?.unitPrice || line?.unitPrice === 0);

  // --- חומת מגן (Safeguard): מונע קריסה מוחלטת במידה ויש שורה ריקה ---
  // חייב להיות אחרי כל ה-hooks!
  if (!line) return null;

  // הודעות הוולידציה: של השורה ושל שורות החלוקה שלה
  const allDistMessages = (line.distributions || []).flatMap(d => distMessages(d.id));
  const lm = (field) => messagesFor(lineMessages, field);
  const hasLineBlocking = lineMessages.some(m => m.severity === 'ERROR');
  const hasBudgetBlocking = allDistMessages.some(m => m.severity === 'ERROR');
  const showBudgetFlag = hasLineBlocking || hasBudgetBlocking;
  // הודעות שמוצגות רק בהגדרות הנוספות - כשהשורה סגורה מציגים עליהן חיווי בשורה הראשית
  const hiddenMessages = [...lineMessages.filter(m => !SUMMARY_FIELDS.includes(m.field)), ...allDistMessages];
  // אחרי ניסיון העברה לסבב: שורה עם הודעה חוסמת נפתחת כדי שהשדות המסומנים יהיו גלויים
  const isOpen = isExpanded || (showValidation && showBudgetFlag && !wasClosedByUser);
  const toggleExpanded = () => {
    if (isOpen) { setIsExpanded(false); setWasClosedByUser(true); }
    else { setIsExpanded(true); setWasClosedByUser(false); }
  };

  const isForeignCurrency = line.currency && line.currency !== 'ILS';
  const currencySymbol = line.currency === 'USD' ? '$' : line.currency === 'EUR' ? '€' : '₪';

  // שליפת שם הקניין מתוך מאגר הנתונים כדי להציג אותו בשורה העליונה
  const buyerObj = data.buyers?.find(b => String(b.id) === String(line.buyer));
  const buyerName = buyerObj ? buyerObj.name : 'לא הוגדר';

  const stealthInputClass = "bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 rounded-lg text-sm transition-all outline-none cursor-pointer focus:cursor-text";

  return (
    <div id={`checkout-line-${line.id}`} className={`bg-white dark:bg-gray-800 rounded-xl transition-all duration-200 scroll-mt-28 ${
      isSelected 
        ? 'border-2 border-blue-500 shadow-md ring-4 ring-blue-50 dark:ring-blue-900/20' 
        : showBudgetFlag
          ? 'border-2 border-rose-300 dark:border-rose-700/70 shadow-sm'
          : 'border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
    }`}>
      
      <div className="p-4 flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
        
        <div className="flex items-center gap-4 flex-1">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onToggleSelect(line.id)}
            className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer mt-1 lg:mt-0"
          />
          <span className="font-mono text-gray-400 dark:text-gray-500 font-bold text-sm">
            #{index}
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-mono mb-0.5">
              <span>מק"ט: {line.sku || 'ללא מק"ט'}</span>
              {showBudgetFlag && (
                <span className="font-sans text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">{hasBudgetBlocking ? 'סעיף תקציבי לא תקין' : 'יש לתקן את השורה'}</span>
              )}
              <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
              <span className="flex items-center gap-1" title="קניין מטפל">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-indigo-400">
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
                {buyerName}
              </span>
            </div>
            <div className="flex items-start gap-2 min-w-0" data-validation-field="item">
              <span className="font-bold text-gray-900 dark:text-white text-base lg:text-lg line-clamp-2">
                {line.itemDescription}
              </span>
              <FieldMessageSide messages={lm('item')} compact className="mt-1.5 shrink-0" />
            </div>
            <FieldMessageBelow messages={lm('item')} />
            {!isOpen && hiddenMessages.length > 0 && (
              <button
                type="button"
                onClick={toggleExpanded}
                data-testid="line-hidden-messages"
                className={`mt-1.5 self-start inline-flex items-center gap-1.5 text-[11px] font-bold hover:underline cursor-pointer ${SEVERITY_TEXT[worstSeverity(hiddenMessages)]}`}
              >
                <SeverityIcon severity={worstSeverity(hiddenMessages)} className="w-3.5 h-3.5" />
                {hiddenMessages.length === 1 ? 'הודעה אחת' : `${hiddenMessages.length} הודעות`} בהגדרות הנוספות
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 w-full sm:flex sm:w-auto sm:items-center sm:gap-4 bg-gray-50 dark:bg-gray-900/50 p-2 px-3 sm:px-4 rounded-xl shrink-0">
          
          <div className="flex flex-col items-center min-w-0" data-validation-field="quantity">
            <span className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">כמות<FieldMessageSide messages={lm('quantity')} compact /></span>
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                min="1"
                value={line.quantity || 1}
                onChange={(e) => onLineFieldChange(line.id, 'quantity', Number(e.target.value))}
                className={`${stealthInputClass} w-14 sm:w-16 p-1.5 text-center font-bold text-gray-900 dark:text-white ${fieldToneClass(lm('quantity'))}`}
              />
              <span className="text-xs text-gray-500 font-medium">{line.uom}</span>
            </div>
            <FieldMessageBelow messages={lm('quantity')} />
          </div>

          <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

          {/* מחיר יחידה */}
          <div className="flex flex-col items-center min-w-0 sm:min-w-[100px]" data-validation-field="unitPrice">
            <span className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">מחיר יחידה<FieldMessageSide messages={lm('unitPrice')} compact /></span>
            <div className="flex items-center justify-center w-full sm:w-24 min-w-0">
              <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm ml-1 shrink-0">{currencySymbol}</span>
              {isPriceEditable ? (
                <input 
                  type="number" 
                  min="0" step="0.01"
                  value={line.unitPrice || ''}
                  onChange={(e) => onLineFieldChange(line.id, 'unitPrice', Number(e.target.value))}
                  placeholder="0.00"
                  className={`${stealthInputClass.replace(' text-sm ', ' ')} w-full min-w-0 sm:w-20 p-1 text-right text-xs sm:text-sm font-bold text-gray-900 dark:text-white ${fieldToneClass(lm('unitPrice'))}`}
                />
              ) : (
                <div className="min-w-0 sm:w-20 p-1 text-right font-bold text-gray-900 dark:text-white text-xs sm:text-sm cursor-default truncate">
                  {Number(line.unitPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </div>
              )}
            </div>
            {/* ערך יחידה בש"ח אם מטבע זר */}
            {isForeignCurrency && (
              <span className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">
                {line.rate && line.rate !== 1
                  ? `₪${(Number(line.unitPrice || 0) * line.rate).toLocaleString(undefined, {minimumFractionDigits: 2})} ליח'`
                  : 'בחר תאריך שערוך'
                }
              </span>
            )}
            <FieldMessageBelow messages={lm('unitPrice')} />
          </div>

          <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

          {/* ערך שורה כולל בש"ח */}
          <div className="flex flex-col items-center min-w-0 sm:min-w-[110px]">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">ערך שורה ₪</span>
            {isForeignCurrency && (!line.rate || line.rate === 1) ? (
              <span className="text-[11px] text-amber-500 font-bold text-center leading-tight">
                נדרש תאריך<br/>שערוך
              </span>
            ) : (
              <div className="flex flex-col items-center">
                <span className="font-black text-gray-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
                  ₪{(Number(line.unitPrice || 0) * (line.quantity || 1) * (line.rate || 1)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
                {isForeignCurrency && line.rate && line.rate !== 1 && (
                  <span className="text-[10px] text-emerald-500 leading-none mt-0.5 font-bold">
                    שער: {line.rate}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end mt-4 lg:mt-0 shrink-0">
          <button 
            onClick={() => onOpenDocs(line.id)}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
            title="מסמכים ונספחים"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
          </button>
          
          <button 
            onClick={() => onRemoveLine(line.id)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
            title="הסר שורה"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>

          <button 
            onClick={toggleExpanded}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              isOpen 
                ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {isOpen ? 'סגור הגדרות' : 'הגדרות נוספות'}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

      </div>

      {isOpen && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">לוגיסטיקה ורכש</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="flex flex-col gap-1" data-validation-field="lineType">
                <FieldLabelRow messages={lm('lineType')}>
                  <label className="text-[11px] font-semibold text-gray-500">סוג שורה</label>
                </FieldLabelRow>
                <div className="p-1.5 px-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 w-fit">
                  {line.lineType || 'טובין'}
                </div>
                <FieldMessageBelow messages={lm('lineType')} />
              </div>

              <div className="flex flex-col gap-1" data-validation-field="destinationType">
                <FieldLabelRow messages={lm('destinationType')}>
                  <label className="text-[11px] font-semibold text-gray-500">יעד דרישה (Destination)</label>
                </FieldLabelRow>
                <select 
                  value={line.destinationType || 'Inventory'}
                  onChange={(e) => {
                    const val = e.target.value;
                    onLineFieldChange(line.id, 'destinationType', val);
                    // אם עוברים להוצאה, נאפס את המחסן כדי לא לשמור זבל
                    if (val === 'Expense') {
                      onLineFieldChange(line.id, 'subInventory', '');
                    }
                  }}
                  className={`p-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldToneClass(lm('destinationType'))}`}
                >
                  <option value="Inventory">מלאי (Inventory)</option>
                  <option value="Expense">הוצאה (Expense)</option>
                </select>
                <FieldMessageBelow messages={lm('destinationType')} />
              </div>

              <div className="flex flex-col gap-1" data-validation-field="needByDate">
                <FieldLabelRow messages={lm('needByDate')}>
                  <label className="text-[11px] font-semibold text-gray-500">תאריך נדרש</label>
                </FieldLabelRow>
                <input 
                  type="date" 
                  value={line.needByDate || ''}
                  onChange={(e) => onLineFieldChange(line.id, 'needByDate', e.target.value)}
                  className={`p-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldToneClass(lm('needByDate'))}`}
                />
                <FieldMessageBelow messages={lm('needByDate')} />
              </div>

              <div className="flex flex-col gap-1" data-validation-field="inventoryOrg">
                <FieldLabelRow messages={lm('inventoryOrg')}>
                  <label className="text-[11px] font-semibold text-gray-500">ארגון מלאי</label>
                </FieldLabelRow>
                <select 
                  value={line.inventoryOrg || ''}
                  onChange={(e) => {
                    onLineOrgChange(line.id, e.target.value);
                    // איפוס המחסן ברגע שמשנים את הארגון שלו
                    onLineFieldChange(line.id, 'subInventory', '');
                  }}
                  className={`p-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldToneClass(lm('inventoryOrg'))}`}
                >
                  {data.inventoryOrganizations?.map(org => (
                    <option key={org.id} value={org.id}>{org.code}</option>
                  ))}
                </select>
                <FieldMessageBelow messages={lm('inventoryOrg')} />
              </div>

              {/* --- התוספת החדשה: שדה מחסן (Sub-Inventory) --- */}
              {(!line.destinationType || line.destinationType === 'Inventory') && (
                <div className="flex flex-col gap-1" data-validation-field="subInventory">
                  <FieldLabelRow messages={lm('subInventory')}>
                    <label className="text-[11px] font-semibold text-gray-500">מחסן (Sub-Inv)</label>
                  </FieldLabelRow>
                  <select 
                    value={line.subInventory || ''}
                    onChange={(e) => onLineFieldChange(line.id, 'subInventory', e.target.value)}
                    disabled={!line.inventoryOrg}
                    className={`p-1.5 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                      !line.inventoryOrg
                        ? 'bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800/50 dark:border-gray-700/50 cursor-not-allowed'
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 focus:border-blue-500'
                    } ${fieldToneClass(lm('subInventory'))}`}
                  >
                    <option value="">בחר מחסן...</option>
                    {data.subInventories?.filter(s => String(s.inventoryOrgId) === String(line.inventoryOrg)).map(sub => (
                      <option key={sub.id} value={sub.code}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                  <FieldMessageBelow messages={lm('subInventory')} />
                </div>
              )}

              <div className="flex flex-col gap-1" data-validation-field="currency">
                <FieldLabelRow messages={lm('currency')}>
                  <label className="text-[11px] font-semibold text-gray-500">מטבע</label>
                </FieldLabelRow>
                <select 
                  value={line.currency || 'ILS'}
                  onChange={(e) => onLineFieldChange(line.id, 'currency', e.target.value)}
                  className={`p-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldToneClass(lm('currency'))}`}
                >
                  <option value="ILS">ILS (שקל חדש)</option>
                  <option value="USD">USD (דולר ארה"ב)</option>
                  <option value="EUR">EUR (אירו)</option>
                </select>
                <FieldMessageBelow messages={lm('currency')} />
              </div>

              <div className="flex flex-col gap-1" data-validation-field="exchangeDate">
                <FieldLabelRow messages={lm('exchangeDate')}>
                  <label className="text-[11px] font-semibold text-gray-500">תאריך שערוך</label>
                </FieldLabelRow>
                <input 
                  type="date" 
                  value={line.exchangeDate || ''}
                  onChange={(e) => onLineFieldChange(line.id, 'exchangeDate', e.target.value)}
                  disabled={line.currency === 'ILS' || !line.currency}
                  className={`p-1.5 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                    line.currency === 'ILS' || !line.currency
                      ? 'bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800/50 dark:border-gray-700/50 cursor-not-allowed' 
                      : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 focus:border-blue-500'
                  } ${fieldToneClass(lm('exchangeDate'))}`}
                  title={line.currency === 'ILS' ? "לא נדרש שערוך למטבע מקומי" : ""}
                />
                <FieldMessageBelow messages={lm('exchangeDate')} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500">שער {line.currency}</label>
                <div className={`p-1.5 border rounded-lg text-sm font-bold transition-colors cursor-not-allowed ${
                  isForeignCurrency && line.exchangeDate && line.rate && line.rate !== 1
                    ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                    : 'bg-gray-100 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 text-gray-400'
                }`}>
                  {isForeignCurrency && line.exchangeDate && line.rate && line.rate !== 1
                    ? `₪${line.rate}`
                    : <span className="font-normal text-xs">בחר תאריך שערוך...</span>
                  }
                </div>
              </div>

              <div className="flex flex-col gap-1" data-validation-field="supplier">
                <FieldLabelRow messages={lm('supplier')}>
                  <label className="text-[11px] font-semibold text-gray-500">ספק מומלץ</label>
                </FieldLabelRow>
                <select 
                  value={line.supplier || ''} 
                  onChange={(e) => onLineFieldChange(line.id, 'supplier', e.target.value)}
                  className={`p-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldToneClass(lm('supplier'))}`}
                >
                  <option value="">לא הוגדר</option>
                  {data.suppliers?.map(s => (
                    <option key={s.id} value={s.id}>{s.name || s.id}</option>
                  ))}
                </select>
                <FieldMessageBelow messages={lm('supplier')} />
              </div>

              <div className="flex flex-col gap-1" data-validation-field="qualityRequirement">
                <FieldLabelRow messages={lm('qualityRequirement')}>
                  <label className="text-[11px] font-semibold text-gray-500">דרישות איכות</label>
                </FieldLabelRow>
                <select 
                  value={line.qualityRequirement || ''}
                  onChange={(e) => onLineFieldChange(line.id, 'qualityRequirement', e.target.value)}
                  className={`p-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldToneClass(lm('qualityRequirement'))}`}
                >
                  <option value="">ללא</option>
                  {data.qualityRequirements?.map((q, i) => {
                    const val = q.id || q.name || q;
                    const display = q.name || q.description || q;
                    return <option key={val} value={val}>{display}</option>;
                  })}
                </select>
                <FieldMessageBelow messages={lm('qualityRequirement')} />
              </div>

              {/* --- שדה המזמין --- */}
              <div className="flex flex-col gap-1 lg:col-span-1" data-validation-field="requester">
                <FieldLabelRow messages={lm('requester')}>
                  <label className="text-[11px] font-semibold text-gray-500">מזמין</label>
                </FieldLabelRow>
                <select 
                  value={line.requester || ''}
                  onChange={(e) => onLineFieldChange(line.id, 'requester', e.target.value)}
                  className={`p-1.5 w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldToneClass(lm('requester'))}`}
                >
                  <option value="">לא הוגדר</option>
                  {data.users?.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
                <FieldMessageBelow messages={lm('requester')} />
              </div>

              {/* --- שדה מאשר שירות --- */}
              <div className="flex flex-col gap-1 lg:col-span-1" data-validation-field="serviceApprover">
                <FieldLabelRow messages={lm('serviceApprover')}>
                  <label className="text-[11px] font-semibold text-gray-500">מאשר שירות</label>
                </FieldLabelRow>
                <select 
                  value={line.serviceApprover || ''}
                  onChange={(e) => onLineFieldChange(line.id, 'serviceApprover', e.target.value)}
                  className={`p-1.5 w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldToneClass(lm('serviceApprover'))}`}
                >
                  <option value="">לא הוגדר</option>
                  {data.users?.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
                <FieldMessageBelow messages={lm('serviceApprover')} />
              </div>

              <div className="flex flex-col gap-1 lg:col-span-1" data-validation-field="buyer">
                <FieldLabelRow messages={lm('buyer')}>
                  <label className="text-[11px] font-semibold text-gray-500">קניין מומלץ</label>
                </FieldLabelRow>
                <select 
                  value={line.buyer || ''}
                  onChange={(e) => onLineFieldChange(line.id, 'buyer', e.target.value)}
                  className={`p-1.5 w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldToneClass(lm('buyer'))}`}
                >
                  <option value="">לא הוגדר</option>
                  {data.buyers?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <FieldMessageBelow messages={lm('buyer')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
              <div className="flex flex-col gap-1" data-validation-field="buyerNotes">
                <FieldLabelRow messages={lm('buyerNotes')}>
                  <label className="text-[11px] font-semibold text-gray-500">הערות לקניין</label>
                </FieldLabelRow>
                <textarea 
                  rows="2"
                  value={line.buyerNotes || ''}
                  onChange={(e) => onLineFieldChange(line.id, 'buyerNotes', e.target.value)}
                  className={`p-2 w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none ${fieldToneClass(lm('buyerNotes'))}`}
                  placeholder="הערות שיועברו לקניין..."
                />
                <FieldMessageBelow messages={lm('buyerNotes')} />
              </div>
              <div className="flex flex-col gap-1" data-validation-field="justification">
                <FieldLabelRow messages={lm('justification')}>
                  <label className="text-[11px] font-semibold text-gray-500">הצדקה</label>
                </FieldLabelRow>
                <textarea 
                  rows="2"
                  value={line.justification || ''}
                  onChange={(e) => onLineFieldChange(line.id, 'justification', e.target.value)}
                  className={`p-2 w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none ${fieldToneClass(lm('justification'))}`}
                  placeholder="הצדקה לרכש..."
                />
                <FieldMessageBelow messages={lm('justification')} />
              </div>
            </div>
            
            <CheckoutLineDistributions 
              line={line}
              onAddDist={onAddDist}
              onDistFieldChange={onDistFieldChange}
              onRemoveDist={onRemoveDist}
              lineMessages={lineMessages}
              distMessages={distMessages}
            />

          </div>
        </div>
      )}
    </div>
  );
}