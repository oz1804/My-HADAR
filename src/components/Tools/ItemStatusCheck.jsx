import { useEffect, useMemo, useRef, useState } from 'react';
import { searchErpItems, getItemStatus } from '../../services/itemStatusService';
import { ToolPage, SearchBox, Section, Badge, Ltr } from './toolsUi';
import { formatDay } from './toolsFormat';

// ==========================================
// סטטוס פריט ב-ERP: חיפוש פריט וסטטוס שלו בכל ארגון מלאי (Item Master של EBS)
// globalOrg: ארגון המלאי של המשתמש - מוצג ראשון, עם שורת סיכום
// ==========================================
const STATUS_TONE = { Active: 'green', Prototype: 'blue', Inactive: 'amber', Pending: 'amber', Obsolete: 'red' };

const YesNo = ({ value }) => (
  <span className={`font-bold ${value ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>{value ? 'כן' : 'לא'}</span>
);

export default function ItemStatusCheck({ globalOrg, initialItemId = null, onOpenItem, onBack }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(initialItemId);
  const [detail, setDetail] = useState(null);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (initialItemId == null) inputRef.current?.focus(); }, [initialItemId]);

  useEffect(() => {
    let cancelled = false;
    searchErpItems(query).then(list => { if (!cancelled) setResults(list); });
    return () => { cancelled = true; };
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    if (selectedId == null) return undefined;
    getItemStatus(selectedId).then(d => { if (!cancelled) setDetail(d); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const shown = selectedId == null ? null : detail;
  // ארגון המשתמש ראשון, אחריו הארגונים שהפריט משויך אליהם
  const orgs = useMemo(() => {
    if (!shown) return { assigned: [], unassigned: [], mine: null };
    const mine = shown.orgs.find(o => String(o.orgId) === String(globalOrg)) || null;
    const rest = shown.orgs.filter(o => o !== mine);
    return {
      mine,
      assigned: [...(mine?.assigned ? [mine] : []), ...rest.filter(o => o.assigned)],
      unassigned: [...(mine && !mine.assigned ? [mine] : []), ...rest.filter(o => !o.assigned)]
    };
  }, [shown, globalOrg]);

  const choose = (id) => {
    setSelectedId(id);
    setShowUnassigned(false);
    setQuery('');
  };

  const summary = (() => {
    const m = orgs.mine;
    if (!m) return null;
    const org = <><Ltr>{m.orgCode}</Ltr> - {m.orgName}</>;
    if (!m.assigned) return { tone: 'gray', text: <>הפריט לא משויך לארגון המלאי שלך ({org}), ולכן לא ניתן להזמין אותו מהקטלוג בארגון הזה.</> };
    if (m.purchasingEnabled) return { tone: m.statusCode === 'Active' ? 'green' : 'blue', text: <>בארגון שלך ({org}) הפריט בסטטוס <b>{m.statusName}</b> וניתן לרכוש אותו.</> };
    return { tone: 'red', text: <>בארגון שלך ({org}) הפריט בסטטוס <b>{m.statusName}</b>, והסטטוס הזה לא מאפשר רכש.</> };
  })();
  const SUMMARY_CLS = {
    green: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-200',
    blue: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-200',
    red: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-200',
    gray: 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-300'
  };

  const row = (o) => {
    const mine = String(o.orgId) === String(globalOrg);
    return (
      <tr key={o.orgId} className={mine ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-bold text-gray-900 dark:text-white"><Ltr className="font-mono">{o.orgCode}</Ltr> - {o.orgName}</span>
          {mine && <Badge tone="blue" className="ms-2">הארגון שלך</Badge>}
        </td>
        {o.assigned ? (
          <>
            <td className="px-4 py-3"><Badge tone={STATUS_TONE[o.statusCode] || 'gray'}>{o.statusName} <Ltr className="font-mono font-medium opacity-70">{o.statusCode}</Ltr></Badge></td>
            <td className="px-4 py-3"><YesNo value={o.purchasingEnabled} /></td>
            <td className="px-4 py-3"><YesNo value={o.stockEnabled} /></td>
            <td className="px-4 py-3 whitespace-nowrap tabular-nums text-gray-500 dark:text-gray-400">{o.lastUpdateDate ? formatDay(o.lastUpdateDate) : ''}</td>
          </>
        ) : (
          <td colSpan={4} className="px-4 py-3 text-gray-500 dark:text-gray-400">הפריט לא משויך לארגון</td>
        )}
      </tr>
    );
  };

  return (
    <ToolPage icon="stack" title="סטטוס פריט ב-ERP" subtitle="הסטטוס של הפריט בכל ארגון מלאי, והאם הסטטוס מאפשר רכש." onBack={onBack}>
      <div className="relative max-w-2xl">
        <SearchBox inputRef={inputRef} value={query} onChange={setQuery} placeholder='חיפוש לפי מק"ט, תיאור, יצרן או מק"ט יצרן' ariaLabel="חיפוש פריט" />
        {query.trim().length >= 2 && (
          <ul className="mt-2 rounded-2xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden" aria-label="תוצאות חיפוש">
            {results.length === 0 && <li className="p-4 text-sm text-gray-500 dark:text-gray-400">לא נמצא פריט מתאים.</li>}
            {results.map(i => (
              <li key={i.id}>
                <button type="button" onClick={() => choose(i.id)} className="w-full text-start px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer">
                  <Ltr className="font-mono font-bold text-sm text-gray-900 dark:text-white">{i.sku}</Ltr>
                  <span className="block text-sm text-gray-600 dark:text-gray-300 truncate">{i.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!shown ? (
        query.trim().length < 2 && (
          <div className="mt-6 min-h-[200px] flex items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 p-6 text-center">
            הקלד לפחות שני תווים כדי לחפש פריט.
          </div>
        )
      ) : (
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">מק"ט <Ltr className="font-mono text-gray-900 dark:text-white">{shown.item.sku}</Ltr></div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">{shown.item.description}</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{shown.item.manufacturer}{shown.item.manufacturerSku ? <> · מק"ט יצרן <Ltr className="font-mono">{shown.item.manufacturerSku}</Ltr></> : null}</div>
            </div>
            {onOpenItem && (
              <button type="button" onClick={() => onOpenItem(shown.item.id)} className="shrink-0 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-700 dark:text-gray-200 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                לכרטיס הפריט בקטלוג
              </button>
            )}
          </div>

          {summary && <p className={`mt-4 p-3.5 rounded-xl border text-sm font-semibold ${SUMMARY_CLS[summary.tone]}`} data-testid="item-status-summary">{summary.text}</p>}

          <Section title="סטטוס לפי ארגון מלאי" aside={`משויך ל-${orgs.assigned.length} ארגונים`}>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-start whitespace-nowrap">ארגון מלאי</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">סטטוס</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">רכש</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">מלאי</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">עדכון אחרון</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                  {orgs.assigned.map(row)}
                  {showUnassigned && orgs.unassigned.map(row)}
                </tbody>
              </table>
            </div>
            {orgs.unassigned.length > 0 && (
              <button type="button" onClick={() => setShowUnassigned(v => !v)} className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {showUnassigned ? 'הסתר ארגונים שהפריט לא משויך אליהם' : `הצג ${orgs.unassigned.length} ארגונים שהפריט לא משויך אליהם`}
              </button>
            )}
          </Section>
        </div>
      )}
    </ToolPage>
  );
}
