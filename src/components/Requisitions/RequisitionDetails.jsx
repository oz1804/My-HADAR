import { useState } from 'react';
import { canDoAction } from '../../hooks/useAppData';
import { ACTION_META, formatMoney, formatDate, formatDateTime, currencySymbol, lookup } from './requisitionUi';
import { StatusBadge, Icon } from './RequisitionUiParts';

// סדר וצבעי כפתורי הפעולה במסך הפרטים
const DETAIL_ACTIONS = [
  { action: 'edit',   className: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20' },
  { action: 'copy',   className: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300' },
  { action: 'cancel', className: 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:text-amber-300' },
  { action: 'delete', className: 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-300' }
];

// אריח נתון קטן בכותרת
function StatTile({ label, value, mono }) {
  return (
    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700">
      <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-base font-black text-gray-900 dark:text-white ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

// כותרת של אזור (אותו סגנון כמו בכרטיסיות ה-Checkout)
function SectionTitle({ icon, children, aside }) {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-3 gap-3">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Icon name={icon} className="w-5 h-5 text-blue-500" strokeWidth={1.75} />
        {children}
      </h3>
      {aside}
    </div>
  );
}

// שדה בתצוגת קריאה בלבד
function Field({ label, value, wide }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 break-words">{value}</div>
    </div>
  );
}

// ==========================================
// שורת דרישה אחת (מתקפלת) + שורות החלוקה שלה
// ==========================================
function RequisitionLine({ line, isOpen, onToggle }) {
  const rate = line.rate || 1;
  const lineTotal = (line.unitPrice || 0) * (line.quantity || 0) * rate;
  const isForeign = line.currency && line.currency !== 'ILS';
  const isService = line.lineType === 'שירות';
  const isInventory = line.destinationType === 'Inventory';
  const isFreeItem = !line.itemId;

  return (
    <div className={`rounded-2xl border transition-colors ${isOpen ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-600'}`}>
      {/* --- שורת הסיכום --- */}
      <button onClick={onToggle} aria-expanded={isOpen} className="w-full text-start p-4 flex items-center gap-3 sm:gap-4 cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-black shrink-0">
          {line.lineNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 dark:text-white truncate">{line.itemDescription}</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <span className={`text-xs font-mono ${isFreeItem ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{line.sku || 'פריט חופשי'}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isService ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'}`}>
              {line.lineType || 'טובין'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {isInventory ? 'מלאי' : 'הוצאה'}
            </span>
          </div>
        </div>

        <div className="hidden sm:block text-end shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {Number(line.quantity).toLocaleString()} {lookup.uom(line.uom)} × {currencySymbol(line.currency)}{Number(line.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="font-black text-gray-900 dark:text-white">{formatMoney(lineTotal)}</div>
        </div>

        <Icon name="chevronDown" className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* סכום במובייל */}
      <div className="sm:hidden px-4 pb-3 -mt-1 flex justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">{Number(line.quantity).toLocaleString()} {lookup.uom(line.uom)} × {currencySymbol(line.currency)}{Number(line.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        <span className="font-black text-gray-900 dark:text-white">{formatMoney(lineTotal)}</span>
      </div>

      {/* --- פרטים מורחבים --- */}
      {isOpen && (
        <div className="px-4 pb-5 pt-1 space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 p-4 rounded-xl bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700">
            <Field label="תאריך נדרש" value={formatDate(line.needByDate)} />
            <Field label="ארגון מלאי" value={lookup.inventoryOrg(line.inventoryOrg)} />
            {isInventory && <Field label="תת-מלאי" value={lookup.subInventory(line.inventoryOrg, line.subInventory)} />}
            <Field label="ספק" value={lookup.supplier(line.supplier)} />
            <Field label="קניין" value={lookup.buyer(line.buyer)} />
            <Field label="מזמין" value={lookup.user(line.requester)} />
            <Field label="מאשר שירות" value={lookup.user(line.serviceApprover)} />
            <Field label="דרישת איכות" value={line.qualityRequirement} />
            {isForeign && <Field label="מטבע ושער" value={`${line.currency} · ${rate}${line.exchangeDate ? ` (${formatDate(line.exchangeDate)})` : ''}`} />}
            <Field label="הצדקה" value={line.justification} wide />
            <Field label="הערות לקניין" value={line.buyerNotes} wide />
          </div>

          {/* חלוקה תקציבית */}
          <div>
            <div className="text-sm font-bold text-indigo-500 dark:text-indigo-400 mb-2">
              חלוקה תקציבית ({(line.distributions || []).length})
            </div>

            {/* טבלה - מסכים רחבים */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="text-start px-3 py-2">#</th>
                    <th className="text-start px-3 py-2">כמות</th>
                    <th className="text-start px-3 py-2">%</th>
                    <th className="text-start px-3 py-2">פרויקט</th>
                    <th className="text-start px-3 py-2">משימה</th>
                    <th className="text-start px-3 py-2">סוג הוצאה</th>
                    <th className="text-start px-3 py-2">ארגון מממן</th>
                    <th className="text-end px-3 py-2">סכום</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800/40">
                  {(line.distributions || []).map((d, i) => (
                    <tr key={d.id || i} className="text-gray-700 dark:text-gray-300">
                      <td className="px-3 py-2 font-bold text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 font-semibold">{Number(d.quantity).toLocaleString()}</td>
                      <td className="px-3 py-2">{Number(d.percentage || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}%</td>
                      <td className="px-3 py-2">{lookup.project(d.projectId) || <span className="text-gray-400">—</span>}</td>
                      <td className="px-3 py-2">{lookup.task(d.taskId) || <span className="text-gray-400">—</span>}</td>
                      <td className="px-3 py-2">{lookup.expenditureType(d.expenditureTypeId) || <span className="text-gray-400">—</span>}</td>
                      <td className="px-3 py-2">{lookup.expenditureOrg(d.expenditureOrgId) || <span className="text-gray-400">—</span>}</td>
                      <td className="px-3 py-2 text-end font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatMoney(d.functionalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* כרטיסיות - מובייל */}
            <div className="md:hidden space-y-2">
              {(line.distributions || []).map((d, i) => (
                <div key={d.id || i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-sm">
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white mb-2">
                    <span>חלוקה {i + 1} · {Number(d.quantity).toLocaleString()} יח' ({Number(d.percentage || 0)}%)</span>
                    <span>{formatMoney(d.functionalAmount)}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <div><span className="font-bold">פרויקט: </span>{lookup.project(d.projectId) || '—'}</div>
                    <div><span className="font-bold">משימה: </span>{lookup.task(d.taskId) || '—'}</div>
                    <div><span className="font-bold">סוג הוצאה: </span>{lookup.expenditureType(d.expenditureTypeId) || '—'}</div>
                    <div><span className="font-bold">ארגון מממן: </span>{lookup.expenditureOrg(d.expenditureOrgId) || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ציר סבב האישורים (באותו עיצוב של מגירת סבב המאשרים)
// ==========================================
const STEP_STATUS = {
  approved: { label: 'אישר', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', ring: 'border-emerald-500', num: 'text-emerald-600 dark:text-emerald-400' },
  rejected: { label: 'דחה', className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300', ring: 'border-red-500', num: 'text-red-600 dark:text-red-400' },
  current:  { label: 'ממתין כעת', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', ring: 'border-blue-500', num: 'text-blue-600 dark:text-blue-400' },
  pending:  { label: 'ממתין', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400', ring: 'border-gray-300 dark:border-gray-600', num: 'text-gray-400' }
};

function RoutingTimeline({ steps, reqStatus }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <Icon name="route" className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" strokeWidth={1.5} />
        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">הדרישה טרם נשלחה לסבב אישורים</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">סבב המאשרים יוגדר בעת השליחה ממסך הסל.</p>
      </div>
    );
  }

  // הצעד הנוכחי = הצעד הראשון שעדיין ממתין (רק כשהדרישה באמת בסבב)
  const currentIdx = reqStatus === 'IN PROCESS' ? steps.findIndex(s => !s.status || s.status === 'pending') : -1;

  return (
    <div className="relative border-r-2 border-indigo-100 dark:border-indigo-900/30 mr-2 pr-8 space-y-4">
      {steps.map((step, idx) => {
        const isBuyer = String(step.id || '').startsWith('buyer-');
        const key = step.status === 'approved' ? 'approved' : step.status === 'rejected' ? 'rejected' : idx === currentIdx ? 'current' : 'pending';
        const st = STEP_STATUS[key];
        return (
          <div key={step.id || idx} className="relative">
            <div className={`absolute right-0 -mr-[41px] top-3 flex items-center justify-center w-6 h-6 border-2 rounded-full z-10 bg-white dark:bg-gray-800 ${st.ring}`}>
              {key === 'approved'
                ? <Icon name="check" className={`w-3.5 h-3.5 ${st.num}`} strokeWidth={3} />
                : key === 'rejected'
                  ? <Icon name="x" className={`w-3.5 h-3.5 ${st.num}`} strokeWidth={3} />
                  : <span className={`text-[10px] font-black ${st.num}`}>{idx + 1}</span>}
            </div>
            <div className={`bg-white dark:bg-gray-800/40 border p-4 rounded-2xl shadow-sm flex justify-between items-center gap-3 ${key === 'current' ? 'border-blue-200 dark:border-blue-800/60' : 'border-gray-100 dark:border-gray-700'}`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center font-black text-sm border shrink-0 ${isBuyer ? 'from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50' : 'from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'}`}>
                  {step.name ? step.name.charAt(0) : '?'}
                </div>
                <div className="min-w-0">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isBuyer ? 'text-purple-600 dark:text-purple-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{step.title}</span>
                  <div className="font-bold text-gray-900 dark:text-white leading-tight truncate">{step.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{step.role}{step.actionDate ? ` · ${formatDateTime(step.actionDate)}` : ''}</div>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${st.className}`}>{st.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// מסך פרטי דרישה (קריאה בלבד)
// ==========================================
export default function RequisitionDetails({ requisition: req, isEditing, onAction, onBack, onContinueEditing }) {
  const lines = req.lines || [];
  const [openLines, setOpenLines] = useState(() => (lines.length <= 2 ? lines.map(l => l.id) : []));
  const allOpen = lines.length > 0 && openLines.length === lines.length;
  const header = req.header || {};
  const availableActions = DETAIL_ACTIONS.filter(a => canDoAction(req.status, a.action));

  const toggleLine = (id) => setOpenLines(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-5 md:p-8 mt-6 transition-colors duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in" dir="rtl">

      {/* --- ניווט חזרה --- */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer mb-5">
        <Icon name="back" className="w-4 h-4" strokeWidth={2.5} />
        חזרה לרשימת הדרישות
      </button>

      {/* --- כותרת הדרישה --- */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 border-b pb-6 border-gray-100 dark:border-gray-700">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
              דרישה <span className="font-mono">{req.requisitionNumber}</span>
            </h2>
            <StatusBadge status={req.status} size="lg" />
          </div>
          <p className={`mt-2 text-base ${req.description ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 italic'}`}>
            {req.description || 'ללא תיאור'}
          </p>
        </div>

        {availableActions.length > 0 && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {availableActions.map(({ action, className }) => (
              <button
                key={action}
                onClick={() => onAction(action, req)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${className}`}
              >
                <Icon name={ACTION_META[action].icon} className="w-4 h-4" />
                {ACTION_META[action].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- התראה: הדרישה פתוחה בסל --- */}
      {isEditing && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-center gap-3 text-sm font-semibold text-blue-800 dark:text-blue-200">
            <Icon name="cart" className="w-5 h-5 shrink-0" />
            דרישה זו פתוחה כרגע לעריכה בסל. ייתכן שיש בסל שינויים שעדיין לא נשמרו.
          </div>
          <button onClick={onContinueEditing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer shrink-0">
            המשך לעריכה
          </button>
        </div>
      )}

      {/* --- נתוני מפתח --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <StatTile label='סה"כ (₪)' value={formatMoney(req.total)} />
        <StatTile label="שורות" value={lines.length} />
        <StatTile label="נוצרה" value={formatDate(req.creationDate)} />
        <StatTile label="עודכנה" value={formatDateTime(req.lastUpdateDate || req.creationDate)} />
      </div>

      {(header.justification || header.buyerNotes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {header.justification && (
            <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">הצדקה</div>
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{header.justification}</div>
            </div>
          )}
          {header.buyerNotes && (
            <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">הערות לקניין</div>
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{header.buyerNotes}</div>
            </div>
          )}
        </div>
      )}

      {/* --- שורות + סבב אישורים --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
        <section className="xl:col-span-2 min-w-0">
          <SectionTitle
            icon="budget"
            aside={lines.length > 1 && (
              <button
                onClick={() => setOpenLines(allOpen ? [] : lines.map(l => l.id))}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {allOpen ? 'כווץ הכל' : 'הרחב הכל'}
              </button>
            )}
          >
            שורות וחלוקה תקציבית
          </SectionTitle>
          <div className="space-y-3">
            {lines.map(line => (
              <RequisitionLine key={line.id} line={line} isOpen={openLines.includes(line.id)} onToggle={() => toggleLine(line.id)} />
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/40">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">סה"כ לדרישה</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{formatMoney(req.total)}</span>
          </div>
        </section>

        <section className="min-w-0">
          <SectionTitle icon="route">סבב אישורים</SectionTitle>
          <RoutingTimeline steps={req.routingSteps} reqStatus={req.status} />
        </section>
      </div>
    </div>
  );
}
