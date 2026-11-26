import { useEffect, useMemo, useState } from 'react';
import data from '../../data/data.json';
import { searchProjects, getProjectCheck } from '../../services/projectCheckService';
import { ToolPage, SearchBox, Section, Tile, Badge, ValidityBadge, Ltr } from './toolsUi';
import { formatDay, money } from './toolsFormat';

// ==========================================
// בדיקת פרויקטים: תוקף, משימות, ארגוני מלאי, סוגי הוצאה, Primary Planner ויתרת תקציב
// globalOrg: ארגון המלאי של המשתמש - מסומן, ומוצגת אזהרה כשהפרויקט לא מוגדר בו
// ==========================================
export default function ProjectCheck({ globalOrg, initialProjectId = null, onBack }) {
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(initialProjectId);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    searchProjects(query).then(list => { if (!cancelled) setProjects(list); });
    return () => { cancelled = true; };
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    if (selectedId == null) return undefined;
    getProjectCheck(selectedId).then(d => { if (!cancelled) setDetail(d); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const shown = selectedId == null ? null : detail;
  const userOrg = useMemo(() => (data.inventoryOrganizations || []).find(o => String(o.id) === String(globalOrg)), [globalOrg]);
  const inUserOrg = shown && userOrg ? shown.orgs.some(o => String(o.id) === String(userOrg.id)) : true;

  const choose = (id) => {
    setSelectedId(id);
    // בנייד הפרטים מופיעים מתחת לרשימה
    requestAnimationFrame(() => document.getElementById('project-check-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <ToolPage icon="budget" title="בדיקת פרויקטים" subtitle="תוקף הפרויקט והמשימות, ארגוני המלאי, סוגי ההוצאה המותרים ויתרת התקציב." onBack={onBack}>
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] items-start">

        <div className="flex flex-col gap-3 min-w-0">
          <SearchBox value={query} onChange={setQuery} placeholder="חיפוש לפי מספר או שם פרויקט" ariaLabel="חיפוש פרויקט" />
          <ul className="rounded-2xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden" aria-label="פרויקטים">
            {projects.length === 0 && <li className="p-4 text-sm text-gray-500 dark:text-gray-400">לא נמצא פרויקט מתאים.</li>}
            {projects.map(p => {
              const active = String(p.id) === String(selectedId);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => choose(p.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`w-full text-start px-4 py-3 transition-colors cursor-pointer ${active ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Ltr className="font-mono font-bold text-sm text-gray-900 dark:text-white">{p.projectCode}</Ltr>
                      <ValidityBadge status={p.status} />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate">{p.projectName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">תאריך סיום: {p.endDate ? formatDay(p.endDate) : 'ללא'}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div id="project-check-detail" className="min-w-0 scroll-mt-28">
          {!shown ? (
            <div className="min-h-[220px] flex items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 p-6 text-center">
              בחר פרויקט מהרשימה כדי לראות את הפרטים שלו.
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="text-xl font-black text-gray-900 dark:text-white"><Ltr className="font-mono">{shown.projectCode}</Ltr> · {shown.projectName}</h3>
                <ValidityBadge status={shown.status} />
              </div>

              {shown.status !== 'ACTIVE' && (
                <p className="mt-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                  {shown.status === 'EXPIRED' ? `הפרויקט הסתיים ב-${formatDay(shown.endDate)}, ולא ניתן לשייך אליו דרישות חדשות.` : `הפרויקט ייכנס לתוקף ב-${formatDay(shown.startDate)}.`}
                </p>
              )}
              {!inUserOrg && userOrg && (
                <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  הפרויקט לא מוגדר בארגון המלאי שלך ({userOrg.code} - {userOrg.name}), ולכן לא ניתן לבחור אותו בדרישות בארגון הזה.
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Tile label="תאריך התחלה">{shown.startDate ? formatDay(shown.startDate) : 'ללא'}</Tile>
                <Tile label="תאריך סיום">{shown.endDate ? formatDay(shown.endDate) : 'ללא'}</Tile>
                <Tile label="Primary Planner">{shown.primaryPlanner ? shown.primaryPlanner.name : 'לא הוגדר'}</Tile>
                <Tile label="יתרה זמינה בכל המשימות">{shown.totals ? money(shown.totals.availableAmount) : 'אין תקציב'}</Tile>
              </div>

              <Section title="משימות" aside={`${shown.tasks.length} משימות`}>
                {shown.tasks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">לא הוגדרו משימות לפרויקט.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-3 text-start whitespace-nowrap">מספר משימה</th>
                          <th className="px-4 py-3 text-start whitespace-nowrap">שם המשימה</th>
                          <th className="px-4 py-3 text-start whitespace-nowrap">תאריך סיום</th>
                          <th className="px-3 py-3 text-end whitespace-nowrap">תקציב</th>
                          <th className="px-3 py-3 text-end whitespace-nowrap">ביצוע והתחייבויות</th>
                          <th className="px-3 py-3 text-end whitespace-nowrap">שריונים</th>
                          <th className="px-3 py-3 text-end whitespace-nowrap">יתרה זמינה</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                        {shown.tasks.map(t => (
                          <tr key={t.id}>
                            <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap"><Ltr>{t.taskCode}</Ltr></td>
                            <td className="px-4 py-3 min-w-[10rem]">{t.taskName}</td>
                            <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                              {t.endDate ? formatDay(t.endDate) : 'ללא'}
                              {t.status !== 'ACTIVE' && <span className="ms-2"><ValidityBadge status={t.status} /></span>}
                            </td>
                            {t.budget ? (
                              <>
                                <td className="px-3 py-3 text-end whitespace-nowrap tabular-nums">{money(t.budget.budgetAmount)}</td>
                                <td className="px-3 py-3 text-end whitespace-nowrap tabular-nums">{money(t.budget.consumedAmount)}</td>
                                <td className="px-3 py-3 text-end whitespace-nowrap tabular-nums">{money(t.budget.reservedAmount)}</td>
                                <td className={`px-4 py-3 text-end whitespace-nowrap tabular-nums font-bold ${t.budget.availableAmount > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{money(t.budget.availableAmount)}</td>
                              </>
                            ) : (
                              <td colSpan={4} className="px-4 py-3 text-end text-gray-500 dark:text-gray-400">לא הוגדר תקציב</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              <div className="grid gap-x-6 md:grid-cols-2">
                <Section title="ארגוני מלאי" aside={`${shown.orgs.length} ארגונים`}>
                  <div className="flex flex-wrap gap-2">
                    {shown.orgs.map(o => {
                      const mine = userOrg && String(o.id) === String(userOrg.id);
                      return (
                        <Badge key={o.id} tone={mine ? 'blue' : 'gray'} className="text-xs! px-2.5! py-1!">
                          <Ltr>{o.code}</Ltr> - {o.name}{mine ? ' · הארגון שלך' : ''}
                        </Badge>
                      );
                    })}
                  </div>
                </Section>
                <Section title="סוגי הוצאה מותרים" aside={`${shown.expenditureTypes.length} סוגים`}>
                  <div className="flex flex-wrap gap-2">
                    {shown.expenditureTypes.map(et => (
                      <Badge key={et.id} tone={et.status === 'ACTIVE' ? 'gray' : 'red'} className="text-xs! px-2.5! py-1!">
                        <Ltr className="font-mono">{et.code}</Ltr> - {et.name}{et.status !== 'ACTIVE' ? ' · לא בתוקף' : ''}
                      </Badge>
                    ))}
                  </div>
                </Section>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolPage>
  );
}
