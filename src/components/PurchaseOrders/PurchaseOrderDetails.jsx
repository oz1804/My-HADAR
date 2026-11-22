import { useEffect, useMemo, useState } from 'react';
import data from '../../data/data.json';
import { getPurchaseOrderView } from '../../utils/purchaseOrders';
import { formatMoney, formatDate, currencySymbol, lookup } from '../Requisitions/requisitionUi';
import { Icon } from '../Requisitions/RequisitionUiParts';
import { PoStatusBadge, PoClosedBadge, PoTypeBadge, PoDocChip } from './PoLinks';

const supplierOf = (id) => (data.suppliers || []).find(s => s.id === id);
const siteOf = (id) => (data.supplierSites || []).find(s => s.id === id);
const money = (value, currency) => `${currencySymbol(currency)}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qty = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

// ==========================================
// רכיבי תצוגה קטנים (באותו סגנון של מסך פרטי הדרישה)
// ==========================================
function StatTile({ label, value, sub, mono }) {
  return (
    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 min-w-0">
      <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-base font-black text-gray-900 dark:text-white truncate ${mono ? 'font-mono' : ''}`} title={typeof value === 'string' ? value : undefined}>{value}</div>
      {sub && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

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

// מד התקדמות: המספר תמיד מוצג בטקסט, הפס רק ממחיש
function Meter({ label, value, total, valueText, totalText }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          <span className="font-black text-gray-900 dark:text-white">{pct}%</span> · {valueText} מתוך {totalText}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
        <div className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// כמה מתוך כמה, בתוך טבלה
function QtyOf({ value, total }) {
  const done = total > 0 && value >= total;
  return (
    <span className={`whitespace-nowrap ${done ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
      {qty(value)} <span className="text-gray-400">/ {qty(total)}</span>
    </span>
  );
}

// תגית "דרישה 180000 · שורה 2" - לחיצה פותחת את הדרישה (אם היא של המשתמש)
function RequisitionRef({ requisition, canOpen, onOpen }) {
  if (!requisition) return <span className="text-gray-400">—</span>;
  const label = <><span className="font-mono">{requisition.requisitionNumber}</span><span className="opacity-60"> · שורה {requisition.lineNumber}</span></>;
  if (!canOpen(requisition)) {
    return <span className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">{label}</span>;
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(requisition.id)}
      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer"
      title="פתח את הדרישה"
    >
      {label}
    </button>
  );
}

// ==========================================
// משלוח + שורות החלוקה שלו
// ==========================================
function Shipment({ shipment, header, showRelease, onOpenDoc, canOpenRequisition, onOpenRequisition }) {
  const s = shipment;
  const releaseDoc = showRelease && s.release
    ? { key: `R${s.release.id}`, kind: 'RELEASE', number: s.release.releaseNumber, poHeaderId: header.id, releaseId: s.release.id, authorizationStatus: s.release.authorizationStatus }
    : null;

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/40 overflow-hidden">
      {/* כותרת המשלוח */}
      <div className="p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 bg-gray-50/60 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon name="truck" className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm font-black text-gray-900 dark:text-white whitespace-nowrap">משלוח {s.shipmentNum}</span>
          {releaseDoc && <PoDocChip doc={releaseDoc} onOpen={onOpenDoc} size="xs" />}
          <PoClosedBadge closedCode={s.closedCode} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs flex-1">
          <div><div className="font-bold text-gray-500 dark:text-gray-400">ארגון יעד</div><div className="font-semibold text-gray-800 dark:text-gray-200 truncate">{lookup.inventoryOrg(s.shipToOrganizationId) || '—'}</div></div>
          <div><div className="font-bold text-gray-500 dark:text-gray-400">תאריך נדרש</div><div className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(s.needByDate)}</div></div>
          <div><div className="font-bold text-gray-500 dark:text-gray-400">תאריך מובטח</div><div className="font-semibold text-gray-800 dark:text-gray-200">{s.promisedDate ? formatDate(s.promisedDate) : '—'}</div></div>
          <div><div className="font-bold text-gray-500 dark:text-gray-400">כמות · מחיר</div><div className="font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{qty(s.quantity)} × {money(s.priceOverride, header.currency)}</div></div>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Meter label="התקבל" value={s.quantityReceived} total={s.quantity} valueText={qty(s.quantityReceived)} totalText={qty(s.quantity)} />
          <Meter label="חויב" value={s.quantityBilled} total={s.quantity} valueText={qty(s.quantityBilled)} totalText={qty(s.quantity)} />
        </div>

        {/* שורות חלוקה - טבלה */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-[11px] font-bold text-gray-500 dark:text-gray-400">
              <tr>
                <th className="text-start px-3 py-2">#</th>
                <th className="text-start px-3 py-2">כמות</th>
                <th className="text-start px-3 py-2">נמסר</th>
                <th className="text-start px-3 py-2">יעד</th>
                <th className="text-start px-3 py-2">פרויקט / משימה</th>
                <th className="text-start px-3 py-2">סוג הוצאה</th>
                <th className="text-start px-3 py-2">ארגון מממן</th>
                <th className="text-end px-3 py-2">סכום (₪)</th>
                <th className="text-start px-3 py-2">דרישה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800/40">
              {s.distributions.map(d => (
                <tr key={d.id} className="text-gray-700 dark:text-gray-300 align-top">
                  <td className="px-3 py-2 font-bold text-gray-400">{d.distributionNum}</td>
                  <td className="px-3 py-2 font-semibold">{qty(d.quantityOrdered)}</td>
                  <td className="px-3 py-2"><QtyOf value={d.quantityDelivered} total={d.quantityOrdered} /></td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {d.destinationType === 'Inventory' ? 'מלאי' : 'הוצאה'}
                    {d.destinationSubinventory && <span className="text-xs text-gray-400"> · {d.destinationSubinventory}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div>{lookup.project(d.projectId) || '—'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{lookup.task(d.taskId) || ''}</div>
                  </td>
                  <td className="px-3 py-2">{lookup.expenditureType(d.expenditureTypeId) || <span className="text-gray-400">—</span>}</td>
                  <td className="px-3 py-2">{lookup.expenditureOrg(d.expenditureOrgId) || <span className="text-gray-400">—</span>}</td>
                  <td className="px-3 py-2 text-end font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatMoney(d.amountOrdered)}</td>
                  <td className="px-3 py-2"><RequisitionRef requisition={d.requisition} canOpen={canOpenRequisition} onOpen={onOpenRequisition} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* שורות חלוקה - מובייל */}
        <div className="md:hidden space-y-2">
          {s.distributions.map(d => (
            <div key={d.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-sm">
              <div className="flex justify-between items-start gap-2 font-bold text-gray-900 dark:text-white mb-2">
                <span>חלוקה {d.distributionNum} · {qty(d.quantityOrdered)} יח'</span>
                <span className="whitespace-nowrap">{formatMoney(d.amountOrdered)}</span>
              </div>
              <div className="grid grid-cols-1 gap-1 text-xs text-gray-600 dark:text-gray-400">
                <div><span className="font-bold">נמסר: </span><QtyOf value={d.quantityDelivered} total={d.quantityOrdered} /></div>
                <div><span className="font-bold">יעד: </span>{d.destinationType === 'Inventory' ? `מלאי${d.destinationSubinventory ? ` · ${d.destinationSubinventory}` : ''}` : 'הוצאה'}</div>
                <div><span className="font-bold">פרויקט: </span>{lookup.project(d.projectId) || '—'}</div>
                <div><span className="font-bold">משימה: </span>{lookup.task(d.taskId) || '—'}</div>
                {d.expenditureTypeId && <div><span className="font-bold">סוג הוצאה: </span>{lookup.expenditureType(d.expenditureTypeId)}</div>}
                {d.expenditureOrgId && <div><span className="font-bold">ארגון מממן: </span>{lookup.expenditureOrg(d.expenditureOrgId)}</div>}
                <div className="pt-1"><RequisitionRef requisition={d.requisition} canOpen={canOpenRequisition} onOpen={onOpenRequisition} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// שורת הזמנה (מתקפלת)
// ==========================================
function PoLine({ line, header, isBlanketHeader, showRelease, isOpen, onToggle, isFocused, ...rest }) {
  const isService = line.lineType === 'שירות';
  const unit = lookup.uom(line.uom);

  return (
    <div id={`po-line-${line.id}`} className={`scroll-mt-28 rounded-2xl border transition-colors ${isFocused ? 'ring-2 ring-blue-400/60 dark:ring-blue-500/50 ' : ''}${isOpen ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-600'}`}>
      <button onClick={onToggle} aria-expanded={isOpen} className="w-full text-start p-4 flex items-center gap-3 sm:gap-4 cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-black shrink-0">{line.lineNum}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 dark:text-white truncate">{line.itemDescription}</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{line.itemId ? lookup.sku(line.itemId) : 'פריט חופשי'}</span>
            {line.supplierItemNum && <span className="text-xs font-mono text-gray-400">מק"ט ספק: {line.supplierItemNum}</span>}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isService ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'}`}>{line.lineType || 'טובין'}</span>
            <PoClosedBadge closedCode={line.closedCode} />
          </div>
        </div>
        <div className="hidden sm:block text-end shrink-0">
          {isBlanketHeader ? (
            <>
              <div className="text-xs text-gray-500 dark:text-gray-400">מחיר מוסכם ל{unit}: {money(line.unitPrice, header.currency)}</div>
              <div className="font-black text-gray-900 dark:text-white">נמשכו {qty(line.displayQuantity)} {unit}</div>
            </>
          ) : (
            <>
              <div className="text-xs text-gray-500 dark:text-gray-400">{qty(line.displayQuantity)} {unit} × {money(line.unitPrice, header.currency)}</div>
              <div className="font-black text-gray-900 dark:text-white">{money(line.amount, header.currency)}</div>
            </>
          )}
        </div>
        <Icon name="chevronDown" className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className="sm:hidden px-4 pb-3 -mt-1 flex justify-between text-xs gap-2">
        <span className="text-gray-500 dark:text-gray-400">
          {isBlanketHeader ? `מחיר מוסכם: ${money(line.unitPrice, header.currency)}` : `${qty(line.displayQuantity)} ${unit} × ${money(line.unitPrice, header.currency)}`}
        </span>
        <span className="font-black text-gray-900 dark:text-white whitespace-nowrap">{isBlanketHeader ? `נמשכו ${qty(line.displayQuantity)}` : money(line.amount, header.currency)}</span>
      </div>

      {isOpen && (
        <div className="px-4 pb-5 pt-1 space-y-3 animate-fade-in">
          {line.priceBreaks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-gray-500 dark:text-gray-400">מחירי מדרגה:</span>
              {line.priceBreaks.map(pb => (
                <span key={pb.id} className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                  מ-{qty(pb.quantity)} {unit}: {money(pb.priceOverride, header.currency)}
                </span>
              ))}
            </div>
          )}
          {line.shipments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">טרם נמשכו כמויות משורה זו.</p>
          ) : (
            line.shipments.map(s => <Shipment key={s.id} shipment={s} header={header} showRelease={showRelease} {...rest} />)
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// מסך פרטי הזמנה / הזמנת מסגרת / הוראת משיכה (קריאה בלבד)
// ==========================================
export default function PurchaseOrderDetails({ poHeaderId, releaseId = null, focusPoLineId = null, backLabel, onBack, onOpenDoc, canOpenRequisition, onOpenRequisition }) {
  const view = useMemo(() => getPurchaseOrderView(poHeaderId, releaseId), [poHeaderId, releaseId]);
  // הגעה משורת דרישה: שורת ההזמנה המקושרת נפתחת ומודגשת
  const [openLines, setOpenLines] = useState(() => {
    if (!view) return [];
    if (focusPoLineId && view.lines.some(l => l.id === focusPoLineId)) return [focusPoLineId];
    return view.lines.length <= 2 ? view.lines.map(l => l.id) : [];
  });
  useEffect(() => {
    const el = focusPoLineId && document.getElementById(`po-line-${focusPoLineId}`);
    if (el) el.scrollIntoView({ block: 'start' });
    else window.scrollTo({ top: 0 });
  }, [focusPoLineId]);

  if (!view) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-8 mt-6 border border-gray-100 dark:border-gray-700 text-center" dir="rtl">
        <p className="font-bold text-gray-700 dark:text-gray-200">ההזמנה לא נמצאה.</p>
        <button onClick={onBack} className="mt-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{backLabel}</button>
      </div>
    );
  }

  const { doc, header, lines } = view;
  const isBlanketHeader = doc.kind === 'BLANKET';
  const isForeign = header.currency && header.currency !== 'ILS';
  const supplier = supplierOf(header.supplierId);
  const site = siteOf(header.supplierSiteId);
  const allOpen = lines.length > 0 && openLines.length === lines.length;
  const toggleLine = (id) => setOpenLines(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  // ערך שהתקבל / חויב (לפי סכום - כך שורות בשעות ובימים משוקללות נכון יחד)
  const valueOf = (field) => lines.reduce((s, l) => s + l.shipments.reduce((t, sh) => t + sh[field] * sh.priceOverride, 0), 0);
  const receivedValue = valueOf('quantityReceived');
  const billedValue = valueOf('quantityBilled');
  const releasedTotal = isBlanketHeader ? view.releases.reduce((s, r) => s + r.amount, 0) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-5 md:p-8 mt-6 transition-colors duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in" dir="rtl">

      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer mb-5">
        <Icon name="back" className="w-4 h-4" strokeWidth={2.5} />
        {backLabel}
      </button>

      {/* --- כותרת --- */}
      <div className="border-b pb-6 border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
            {doc.kind === 'RELEASE' ? 'הוראת משיכה' : 'הזמנה'} <bdi className="font-mono">{doc.number}</bdi>
          </h2>
          <PoTypeBadge kind={doc.kind} size="lg" />
          <PoStatusBadge status={doc.authorizationStatus} size="lg" />
          <PoClosedBadge closedCode={doc.closedCode} size="lg" />
        </div>
        <p className="mt-2 text-base text-gray-700 dark:text-gray-300 font-medium">{header.description}</p>
        {header.revisionNum > 0 && <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">גרסה {header.revisionNum}</p>}
      </div>

      {/* --- הוראת משיכה: מאיזו הזמנת מסגרת --- */}
      {view.blanket && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-900/15 border border-purple-100 dark:border-purple-900/40">
          <div className="text-sm font-semibold text-purple-900 dark:text-purple-200">
            נמשכה מתוך הזמנת המסגרת "{view.blanket.description}"
            <span className="block text-xs font-medium text-purple-700/80 dark:text-purple-300/80 mt-0.5">בתוקף {formatDate(view.blanket.header.startDate)} – {formatDate(view.blanket.header.endDate)}</span>
          </div>
          <PoDocChip doc={view.blanket} onOpen={onOpenDoc} />
        </div>
      )}

      {/* --- נתוני מפתח --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <StatTile label="ספק" value={supplier?.name || '—'} sub={site?.siteCode} />
        <StatTile label="קניין" value={lookup.buyer(header.buyerId) || '—'} />
        {isBlanketHeader ? (
          <>
            <StatTile label="סכום מוסכם" value={money(header.amountAgreed, header.currency)} sub={`נמשך עד כה ${money(releasedTotal, header.currency)}`} />
            <StatTile label="תוקף ההסכם" value={`${formatDate(header.startDate)} – ${formatDate(header.endDate)}`} />
          </>
        ) : (
          <>
            <StatTile
              label={`סה"כ (${header.currency})`}
              value={money(view.amount, header.currency)}
              sub={isForeign ? `${formatMoney(view.functionalAmount)} · שער ${header.rate} (${formatDate(header.rateDate)})` : undefined}
            />
            <StatTile
              label={doc.release ? 'תאריך משיכה' : 'נוצרה'}
              value={formatDate(doc.date)}
              sub={(doc.release ? doc.release.approvedDate : header.approvedDate) ? `אושרה ${formatDate(doc.release ? doc.release.approvedDate : header.approvedDate)}` : 'טרם אושרה'}
            />
          </>
        )}
      </div>

      {/* --- התקדמות קבלה וחיוב --- */}
      {!isBlanketHeader && view.amount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Meter label="התקבל (מערך ההזמנה)" value={receivedValue} total={view.amount} valueText={money(receivedValue, header.currency)} totalText={money(view.amount, header.currency)} />
          <Meter label="חויב (מערך ההזמנה)" value={billedValue} total={view.amount} valueText={money(billedValue, header.currency)} totalText={money(view.amount, header.currency)} />
        </div>
      )}
      {isBlanketHeader && header.amountAgreed > 0 && (
        <div className="mt-3 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Meter label="ניצול הסכם המסגרת" value={releasedTotal} total={header.amountAgreed} valueText={money(releasedTotal, header.currency)} totalText={money(header.amountAgreed, header.currency)} />
        </div>
      )}

      {/* --- הוראות משיכה (בהזמנת מסגרת) --- */}
      {isBlanketHeader && (
        <section className="mt-8">
          <SectionTitle icon="document">הוראות משיכה ({view.releases.length})</SectionTitle>
          {view.releases.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">טרם נמשכו הוראות מהזמנה זו.</p>
          ) : (
            <div className="space-y-2">
              {view.releases.map(r => (
                <div key={r.key} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <PoDocChip doc={r} onOpen={onOpenDoc} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(r.date)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PoStatusBadge status={r.authorizationStatus} />
                    <PoClosedBadge closedCode={r.closedCode} />
                    <span className="font-black text-gray-900 dark:text-white whitespace-nowrap ms-2">{money(r.amount, header.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* --- שורות --- */}
      <section className="mt-8">
        <SectionTitle
          icon="budget"
          aside={lines.length > 1 && (
            <button onClick={() => setOpenLines(allOpen ? [] : lines.map(l => l.id))} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
              {allOpen ? 'כווץ הכל' : 'הרחב הכל'}
            </button>
          )}
        >
          {isBlanketHeader ? 'שורות ההסכם' : 'שורות, משלוחים וחלוקה'}
        </SectionTitle>
        <div className="space-y-3">
          {lines.map(line => (
            <PoLine
              key={line.id}
              line={line}
              header={header}
              isBlanketHeader={isBlanketHeader}
              showRelease={isBlanketHeader}
              isOpen={openLines.includes(line.id)}
              isFocused={line.id === focusPoLineId}
              onToggle={() => toggleLine(line.id)}
              onOpenDoc={onOpenDoc}
              canOpenRequisition={canOpenRequisition}
              onOpenRequisition={onOpenRequisition}
            />
          ))}
        </div>
        {!isBlanketHeader && (
          <div className="flex justify-between items-center mt-4 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/40">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">סה"כ ל{doc.kind === 'RELEASE' ? 'הוראת המשיכה' : 'הזמנה'}</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">{money(view.amount, header.currency)}</span>
          </div>
        )}
      </section>

    </div>
  );
}
