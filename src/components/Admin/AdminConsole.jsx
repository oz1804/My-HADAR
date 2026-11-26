import { useEffect, useMemo, useState } from 'react';
import data from '../../data/data.json';
import { getApprovalConfig } from '../../services/approvalConfigService';
import { getBalances, getLedger } from '../../services/fundsService';
import { isEffective } from '../../services/storage';
import { ATTRIBUTES, OPERATORS, VOTING_METHODS, KEY_MEMBER_ACTION, PROJECT_ROLES, groupRoleLabel, getRoleMemberIds, userDisplayName } from '../../utils/approvalEngine';
import { ACTION_CODES } from '../../utils/actionHistory';
import { Icon } from '../Requisitions/RequisitionUiParts';
import ValidationsAdmin from './ValidationsAdmin';
import { formatMoney, formatDate, formatDateTime } from '../Requisitions/requisitionUi';

const TABS = [
  { id: 'rules', label: 'חוקי סבב' },
  { id: 'validations', label: 'ולידציות' },
  { id: 'groups', label: 'קבוצות מאשרים' },
  { id: 'roles', label: 'תפקידי UMX' },
  { id: 'classes', label: 'סיווגי פריטים' },
  { id: 'funds', label: 'תקציב ושריונים' },
  { id: 'log', label: 'יומן פעולות' }
];

const ORG_SOURCE = { NONE: 'ללא תלות בארגון', LINE: 'לפי ארגון המלאי של השורה', HEADER: 'לפי ארגון הכותרת' };

const Badge = ({ ok, children }) => (
  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>{children}</span>
);

const Table = ({ head, children }) => (
  <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 dark:text-gray-400">
        <tr>{head.map((h, i) => <th key={i} className={`px-4 py-3 whitespace-nowrap ${h.end ? 'text-end' : 'text-start'}`}>{h.label ?? h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">{children}</tbody>
    </table>
  </div>
);
const Td = ({ children, end, mono, className = '' }) => (
  <td className={`px-4 py-3 text-gray-700 dark:text-gray-300 ${end ? 'text-end' : ''} ${mono ? 'font-mono' : ''} ${className}`}>{children}</td>
);

const userById = (id) => data.users.find(u => String(u.id) === String(id));
const orgName = (id) => {
  const o = (data.inventoryOrganizations || []).find(x => String(x.id) === String(id));
  return o ? `${o.code} - ${o.name}` : '';
};

// ==========================================
// מסך ניהול מערכת - קריאה בלבד בשלב זה (עריכת ההגדרות - בשלב הבא)
// ==========================================
export default function AdminConsole({ requisitions, currentUser, onBackToHome }) {
  const [tab, setTab] = useState('rules');
  const [config, setConfig] = useState(null);
  const [balances, setBalances] = useState([]);
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getApprovalConfig(), getBalances(), getLedger()]).then(([cfg, bal, led]) => {
      if (cancelled) return;
      setConfig(cfg);
      setBalances(bal);
      setLedger(led);
    });
    return () => { cancelled = true; };
  }, [requisitions]);

  const allActions = useMemo(() => requisitions
    .flatMap(r => (r.actionHistory || []).map(a => ({ ...a, requisitionNumber: r.requisitionNumber, key: `${r.id}-${a.sequence}` })))
    .sort((a, b) => new Date(b.actionDate) - new Date(a.actionDate)), [requisitions]);

  const classLabel = (code) => config?.itemClassifications.find(c => c.code === code)?.name || code;
  const conditionText = (c) => {
    const values = [].concat(c.value).map(v => (c.attribute === 'ITEM_CLASSIFICATION' ? classLabel(v) : v)).join(', ');
    return `${ATTRIBUTES[c.attribute]?.label || c.attribute} ${OPERATORS[c.operator] || c.operator}: ${values}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-5 md:p-8 mt-6 transition-colors duration-300 border border-gray-100 dark:border-gray-700" dir="rtl">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-5 border-gray-100 dark:border-gray-700 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Icon name="stack" className="w-6 h-6" />
            </div>
            ניהול מערכת
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
            הגדרות סבב האישורים, ולידציות, תפקידי UMX, יתרות התקציב ויומן הפעולות.
          </p>
        </div>
        <button onClick={onBackToHome} className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors cursor-pointer shrink-0 shadow-sm">
          <Icon name="back" className="w-4 h-4" strokeWidth={2.5} />
          חזור ללוח הבקרה
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs font-semibold text-amber-800 dark:text-amber-200">
        <Icon name="warning" className="w-4 h-4 shrink-0" />
        {tab === 'validations'
          ? 'הוולידציות נשמרות בשלב זה בדפדפן. בחיבור ל-EBS הן יישמרו בטבלת Custom דרך ה-API.'
          : 'חוקי הסבב, הקבוצות והשיוכים לקריאה בלבד ונטענים מ-data.json. עריכתם תתאפשר בשלב מסכי הניהול.'}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 custom-scrollbar" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${tab === t.id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700/60 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!config ? (
        <div className="py-12 text-center text-sm font-bold text-gray-500">טוען...</div>
      ) : (
        <div className="animate-fade-in">
          {tab === 'rules' && (
            <div className="space-y-3">
              {config.approvalRules.map(rule => {
                const group = config.approverGroups.find(g => g.code === rule.action?.groupCode);
                const active = rule.enabled !== false && isEffective(rule);
                return (
                  <div key={rule.id} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="font-bold text-gray-900 dark:text-white">{rule.name}</div>
                      <Badge ok={active}>{active ? 'פעיל' : 'לא פעיל'}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
                      <div>
                        <div className="font-bold text-gray-500 dark:text-gray-400 mb-0.5">רמה ותנאים</div>
                        <div className="text-gray-800 dark:text-gray-200">{rule.level === 'HEADER' ? 'כותרת' : 'שורה'} · {(rule.conditions || []).length === 0 ? 'חל על כל דרישה' : rule.conditions.map(conditionText).join(' וגם ')}</div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-500 dark:text-gray-400 mb-0.5">פעולה</div>
                        <div className="text-gray-800 dark:text-gray-200">
                          {rule.action?.type === KEY_MEMBER_ACTION
                            ? `הוספת ה-${PROJECT_ROLES[rule.action.projectRole]?.label || rule.action.projectRole} של הפרויקט כמאשר · נחשב כממונה הכספים רק אם הוא חבר בקבוצת ${groupRoleLabel(rule.action.groupCode, config)}; אחרת נשאר בסבב, ונדרש גם ממונה כספים מהקבוצה${rule.action.editable !== false ? ' · המבקש יכול להזיז או להסיר אותו' : ''}`
                            : `הוספת קבוצת "${group?.name || rule.action?.groupCode}" · ${ORG_SOURCE[rule.action?.orgSource] || ''}`}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-500 dark:text-gray-400 mb-0.5">תוקף</div>
                        <div className="text-gray-800 dark:text-gray-200">{formatDate(rule.startDate)} - {rule.endDate ? formatDate(rule.endDate) : 'ללא תאריך סיום'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'validations' && (
            <ValidationsAdmin currentUser={currentUser} />
          )}

          {tab === 'groups' && (
            <div className="space-y-4">
              {config.approverGroups.map(g => (
                <div key={g.code} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                    <span className="font-bold text-gray-900 dark:text-white">{g.name}</span>
                    <span className="text-xs font-mono text-gray-500">{g.code}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">· סדר בסבב: {g.position} · {VOTING_METHODS[g.votingMethod] || g.votingMethod}</span>
                  </div>
                  <Table head={['ארגון מלאי', 'תפקיד UMX', 'חברים פעילים']}>
                    {g.roleMappings.map(m => {
                      const members = getRoleMemberIds(m.roleCode, config);
                      return (
                        <tr key={`${m.inventoryOrgId}-${m.roleCode}`}>
                          <Td>{m.inventoryOrgId == null ? <span className="font-bold">ברירת מחדל</span> : orgName(m.inventoryOrgId)}</Td>
                          <Td mono className="text-xs whitespace-nowrap">{m.roleCode}</Td>
                          <Td>{members.length ? members.map(id => userDisplayName(userById(id))).join(', ') : <span className="text-rose-600 font-bold">אין חברים פעילים</span>}</Td>
                        </tr>
                      );
                    })}
                  </Table>
                </div>
              ))}
            </div>
          )}

          {tab === 'roles' && (
            <Table head={['תפקיד', 'קוד', 'משתמש', 'מתאריך', 'עד תאריך', 'סטטוס']}>
              {config.userRoleAssignments.map((a, i) => {
                const role = config.umxRoles.find(r => r.code === a.roleCode);
                const u = userById(a.userId);
                const active = isEffective(a);
                return (
                  <tr key={i}>
                    <Td className="font-semibold whitespace-nowrap">{role?.name || a.roleCode}</Td>
                    <Td mono className="text-xs whitespace-nowrap">{a.roleCode}</Td>
                    <Td className="whitespace-nowrap">{userDisplayName(u)} <span className="text-xs text-gray-400 font-mono">({a.userName})</span></Td>
                    <Td className="whitespace-nowrap">{formatDate(a.startDate)}</Td>
                    <Td className="whitespace-nowrap">{a.endDate ? formatDate(a.endDate) : '—'}</Td>
                    <Td><Badge ok={active}>{active ? 'פעיל' : 'פג תוקף'}</Badge></Td>
                  </tr>
                );
              })}
            </Table>
          )}

          {tab === 'classes' && (
            <Table head={['קוד', 'שם', 'Category Set', { label: 'פריטים בקטלוג', end: true }]}>
              {config.itemClassifications.map(c => (
                <tr key={c.code}>
                  <Td mono>{c.code}</Td>
                  <Td className="font-semibold">{c.name}</Td>
                  <Td mono className="text-xs">{c.categorySet}</Td>
                  <Td end>{config.catalogItems.filter(i => i[c.itemAttribute] === 'Y').length}</Td>
                </tr>
              ))}
            </Table>
          )}

          {tab === 'funds' && (
            <div className="space-y-6">
              <Table head={['פרויקט', 'משימה', { label: 'תקציב', end: true }, { label: 'ביצוע והתחייבויות', end: true }, { label: 'משוריין', end: true }, { label: 'זמין', end: true }]}>
                {balances.map(b => (
                  <tr key={b.key}>
                    <Td className="whitespace-nowrap">{b.project}</Td>
                    <Td className="whitespace-nowrap">{b.task}</Td>
                    <Td end className="whitespace-nowrap">{formatMoney(b.budgetAmount)}</Td>
                    <Td end className="whitespace-nowrap">{formatMoney(b.consumedAmount)}</Td>
                    <Td end className="whitespace-nowrap">{formatMoney(b.reservedAmount)}</Td>
                    <Td end className={`whitespace-nowrap font-bold ${b.availableAmount <= 0 ? 'text-rose-600' : ''}`}>{formatMoney(b.availableAmount)}</Td>
                  </tr>
                ))}
              </Table>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white mb-2">יומן שריונים</h3>
                {ledger.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">עדיין לא בוצעו שריונים.</p>
                ) : (
                  <Table head={['דרישה', 'שורה', 'סעיף', { label: 'סכום', end: true }, 'סטטוס', 'תאריך', 'סיבת שחרור']}>
                    {[...ledger].reverse().map(e => {
                      const t = data.tasks.find(x => x.id === e.taskId);
                      return (
                        <tr key={e.id}>
                          <Td mono>{e.requisitionNumber}</Td>
                          <Td>{e.lineNumber}</Td>
                          <Td className="whitespace-nowrap">{t ? `${t.taskCode} - ${t.taskName}` : e.taskId}</Td>
                          <Td end className="whitespace-nowrap">{formatMoney(e.amount)}</Td>
                          <Td><Badge ok={e.status === 'RESERVED'}>{e.status === 'RESERVED' ? 'משוריין' : 'שוחרר'}</Badge></Td>
                          <Td className="whitespace-nowrap text-xs">{formatDateTime(e.status === 'RESERVED' ? e.reservedAt : e.releasedAt)}</Td>
                          <Td className="text-xs">{e.releaseReason || '—'}</Td>
                        </tr>
                      );
                    })}
                  </Table>
                )}
              </div>
            </div>
          )}

          {tab === 'log' && (
            allActions.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">אין עדיין רישומים ביומן הפעולות.</p>
            ) : (
              <Table head={['תאריך', 'דרישה', 'פעולה', 'בוצע ע"י', { label: 'סכום', end: true }, 'הערה']}>
                {allActions.map(a => (
                  <tr key={a.key}>
                    <Td className="whitespace-nowrap text-xs">{formatDateTime(a.actionDate)}</Td>
                    <Td mono>{a.requisitionNumber}</Td>
                    <Td className="whitespace-nowrap font-semibold">{ACTION_CODES[a.actionCode]?.label || a.actionCode}{a.lineNumbers?.length ? ` ${a.lineNumbers.join(', ')}` : ''}</Td>
                    <Td className="whitespace-nowrap">{a.userId ? userDisplayName(userById(a.userId)) : 'המערכת'}{a.stepTitle ? <span className="text-xs text-gray-400"> · {a.stepTitle}</span> : null}</Td>
                    <Td end className="whitespace-nowrap">{a.amount != null ? formatMoney(a.amount) : '—'}</Td>
                    <Td className="text-xs">{a.note || '—'}</Td>
                  </tr>
                ))}
              </Table>
            )
          )}
        </div>
      )}
    </div>
  );
}
