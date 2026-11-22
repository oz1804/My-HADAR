import { useState, useEffect, useMemo } from 'react';
import data from '../../data/data.json';
import { getApprovalConfig } from '../../services/approvalConfigService';
import { checkFunds, fundsFailureMessage } from '../../services/fundsService';
import { buildApprovalList } from '../../utils/approvalEngine';

const money = (n) => `₪${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// צבעי כרטיסייה לפי מקור הצעד
const TONES = {
  manual: { ring: 'border-indigo-500', num: 'text-indigo-600 dark:text-indigo-400', avatar: 'from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50', label: 'text-indigo-600 dark:text-indigo-400', drag: 'border-indigo-400 border-dashed bg-indigo-50/50 dark:bg-indigo-900/30' },
  rule: { ring: 'border-teal-500', num: 'text-teal-600 dark:text-teal-400', avatar: 'from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50', label: 'text-teal-600 dark:text-teal-400' },
  buyer: { ring: 'border-purple-500', num: 'text-purple-600 dark:text-purple-400', avatar: 'from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50', label: 'text-purple-600 dark:text-purple-400' }
};
const toneOf = (step) => (step.source === 'RULE' ? TONES.rule : step.source === 'BUYER' ? TONES.buyer : TONES.manual);

const userStep = (u, source, title) => ({
  id: `${source.toLowerCase()}-${u.id}-${Math.random().toString(36).slice(2, 8)}`,
  kind: 'USER',
  source,
  userId: u.id,
  title,
  name: `${u.firstName} ${u.lastName || ''}`.trim(),
  role: u.job || 'צוות ארגוני',
  status: 'pending'
});

// סיבת הכניסה לסבב: "שורות 1, 3 · אוגר זיכרון" / שם החוק לחוק ברמת הכותרת
const reasonText = (r) => {
  const lines = r.lineNumbers?.length ? `${r.lineNumbers.length > 1 ? 'שורות' : 'שורה'} ${[...r.lineNumbers].sort((a, b) => a - b).join(', ')}` : '';
  return [lines, r.detail || (!lines ? r.ruleName : '')].filter(Boolean).join(' · ');
};

const ErrorBox = ({ title, messages }) => (
  <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
    <div className="space-y-1 min-w-0">
      {title && <div className="font-black">{title}</div>}
      {messages.map((m, i) => <div key={i} className="font-medium">{m}</div>)}
    </div>
  </div>
);

export default function ApprovalRoutingDrawer({ isOpen, onClose, currentUser, lines, headerBuyer, headerOrg, editingRequisitionId, onSubmitApproval }) {
  // המגירה מורכבת מחדש בכל פתיחה, ולכן המצב ההתחלתי מחושב פעם אחת כאן
  const [manualSteps, setManualSteps] = useState(() => {
    const initialSteps = [];
    // קריאת רשימת מאשרים מועדפת מהזיכרון
    const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
    const userPrefs = storedPrefs[currentUser.id] || {};
    const preferredApprovers = userPrefs.preferredApprovers || [];

    if (preferredApprovers.length > 0) {
      preferredApprovers.forEach(userId => {
        const approverObj = data.users.find(u => String(u.id) === String(userId));
        if (approverObj) initialSteps.push(userStep(approverObj, 'PREFERRED', 'אישור מועדף'));
      });
    } else {
      // Fallback לממונה הישיר אם אין רשימה
      const supervisor = data.users.find(u => u.id === currentUser.supervisor);
      if (supervisor) initialSteps.push(userStep(supervisor, 'SUPERVISOR', 'אישור ממונה ישיר'));
    }
    return initialSteps;
  });
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [config, setConfig] = useState(null);
  const [funds, setFunds] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // הגדרות הסבב ובדיקת התקציב - דרך שכבת השירותים
  useEffect(() => {
    let cancelled = false;
    Promise.all([getApprovalConfig(), checkFunds(lines, { excludeRequisitionId: editingRequisitionId })]).then(([cfg, fundsResult]) => {
      if (cancelled) return;
      setConfig(cfg);
      setFunds(fundsResult);
    });
    return () => { cancelled = true; };
  }, [lines, editingRequisitionId]);

  // רשימת המאשרים המלאה: הידניים + קבוצות לפי החוקים + קניינים
  const { steps: routingSteps, errors: routingErrors } = useMemo(() => {
    if (!config) return { steps: manualSteps.map((s, i) => ({ ...s, stage: i + 1 })), errors: [] };
    return buildApprovalList({ lines, headerOrg, headerBuyer, requesterId: currentUser.id, config, manualSteps });
  }, [config, manualSteps, lines, headerOrg, headerBuyer, currentUser]);

  const stageSizes = useMemo(() => routingSteps.reduce((m, s) => ({ ...m, [s.stage]: (m[s.stage] || 0) + 1 }), {}), [routingSteps]);
  const fundsFailures = funds && !funds.ok ? funds.accounts.filter(a => !a.ok).map(fundsFailureMessage) : [];
  const isLoading = !config || !funds;
  const canSubmit = !isLoading && !isSubmitting && routingSteps.length > 0 && routingErrors.length === 0 && funds.ok;

  const handleAddApprover = () => {
    if (!selectedUserToAdd) return;
    const userObj = data.users.find(u => String(u.id) === String(selectedUserToAdd));
    if (userObj) {
      setManualSteps(prev => [...prev, userStep(userObj, 'ADHOC', 'מאשר נוסף')]);
      setSelectedUserToAdd('');
    }
  };

  const handleRemoveApprover = (stepId) => {
    setManualSteps(prev => prev.filter(step => step.id !== stepId));
  };

  // גרירה - רק בין המאשרים שהמשתמש בחר (המאשרים לפי חוק והקניינים נעולים)
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
    setTimeout(() => {
      if (e.target) e.target.classList.add('opacity-30');
    }, 0);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setManualSteps(prevSteps => {
      const newSteps = [...prevSteps];
      newSteps.splice(draggedIndex, 1);
      newSteps.splice(index, 0, prevSteps[draggedIndex]);
      return newSteps;
    });
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-30');
    setDraggedIndex(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !onSubmitApproval) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const result = await onSubmitApproval(routingSteps);
    if (result && result.ok === false) {
      setSubmitError(result);
      setIsSubmitting(false);
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  const drawerAnimation = `
    @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;

  return (
    <div className="fixed inset-0 z-[150] flex" dir="rtl">
      <style>{drawerAnimation}</style>

      <div
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      <div
        className="relative flex flex-col w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl h-full border-e border-gray-200 dark:border-gray-700"
        style={{ animation: 'slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">סבב מאשרים</h3>
            <button onClick={onClose} aria-label="סגור" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">גרור את המאשרים שבחרת כדי לשנות סדר. מאשרים לפי חוקי המערכת והקניינים נקבעים אוטומטית.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6">

          {/* --- בדיקת תקציב --- */}
          {!funds ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400">
              <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></span>
              בודק תקציב...
            </div>
          ) : funds.ok ? (
            <div data-testid="funds-ok" className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              <div className="min-w-0">
                <div className="font-black">בדיקת התקציב עברה בהצלחה</div>
                <div className="font-medium mt-0.5">בעת השליחה יישוריין {money(funds.totalRequired)} ב-{funds.accounts.length} {funds.accounts.length === 1 ? 'סעיף' : 'סעיפים'}.</div>
              </div>
            </div>
          ) : (
            <ErrorBox title="אין מספיק תקציב - לא ניתן לשלוח לאישור" messages={fundsFailures} />
          )}

          {routingErrors.length > 0 && <ErrorBox title="לא ניתן להשלים את סבב המאשרים" messages={routingErrors.map(e => e.message)} />}

          {routingSteps.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8">
              {isLoading ? 'טוען את סבב המאשרים...' : 'אין מאשרים בסבב הנוכחי.'}
            </div>
          ) : (
            <div className="relative border-r-2 border-indigo-100 dark:border-indigo-900/30 mr-2 pr-8 space-y-6">
              {routingSteps.map((step) => {
                const manualIndex = manualSteps.findIndex(m => m.id === step.id);
                const isManual = manualIndex !== -1;
                const tone = toneOf(step);
                const isParallel = stageSizes[step.stage] > 1;
                const initial = step.name ? step.name.charAt(0) : '?';
                const hasError = routingErrors.some(e => e.stepId === step.id);

                return (
                  <div
                    key={step.id}
                    data-testid="routing-step"
                    data-source={step.source}
                    className="relative group animate-fade-in"
                    draggable={isManual}
                    onDragStart={isManual ? (e) => handleDragStart(e, manualIndex) : undefined}
                    onDragEnter={isManual ? (e) => handleDragEnter(e, manualIndex) : undefined}
                    onDragEnd={isManual ? handleDragEnd : undefined}
                    onDragOver={isManual ? handleDragOver : undefined}
                  >
                    {/* ציר זמן - שלבים במקביל מקבלים אותו מספר */}
                    <div className={`absolute right-0 -mr-[41px] top-3 flex items-center justify-center w-6 h-6 border-2 rounded-full z-10 shadow-sm transition-colors bg-white dark:bg-gray-800 ${tone.ring}`}>
                       <span className={`text-[10px] font-black ${tone.num}`}>{step.stage}</span>
                    </div>

                    <div className={`relative bg-white dark:bg-gray-800/40 border ${isManual && draggedIndex === manualIndex ? tone.drag : hasError ? 'border-rose-300 dark:border-rose-700' : 'border-gray-100 dark:border-gray-700'} p-4 rounded-2xl shadow-sm hover:shadow-md transition-all ${isManual ? 'cursor-grab active:cursor-grabbing' : ''} flex justify-between items-center gap-3`}>

                      <div className="flex items-center gap-4 pointer-events-none min-w-0">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center font-black text-sm border shrink-0 ${tone.avatar}`}>
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${tone.label}`}>{step.title}</span>
                            {isParallel && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">במקביל</span>}
                          </div>
                          <div className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                            {step.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {step.kind === 'GROUP' ? (step.role ? `חברי הקבוצה: ${step.role}` : 'אין חברים פעילים בקבוצה') : step.role}
                          </div>
                          {step.reasons?.length > 0 && (
                            <div className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 mt-1 space-y-0.5">
                              {step.reasons.map(r => <div key={r.ruleId}>{reasonText(r)}</div>)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isManual ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveApprover(step.id); }}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                              title="הסר מאשר"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="text-gray-300 dark:text-gray-600 opacity-50 group-hover:opacity-100 transition-opacity">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6h16.5" />
                              </svg>
                            </div>
                          </>
                        ) : step.source === 'RULE' && (
                          <span className="text-gray-300 dark:text-gray-600" title="נקבע לפי חוקי המערכת">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
              הוספת מאשר נוסף לסבב
            </label>
            <div className="flex gap-2">
              <select
                value={selectedUserToAdd}
                onChange={(e) => setSelectedUserToAdd(e.target.value)}
                className="flex-1 min-w-0 p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">בחר משתמש...</option>
                {data.users.filter(u => u.id !== currentUser.id).map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName || ''} {u.job ? `- ${u.job}` : ''}</option>
                ))}
              </select>
              <button
                onClick={handleAddApprover}
                disabled={!selectedUserToAdd}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl font-bold text-sm hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              >
                הוסף
              </button>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 shrink-0 space-y-3">
          {submitError && <ErrorBox title={submitError.message} messages={submitError.errors || []} />}
          <button
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            {isSubmitting ? 'משריין תקציב ושולח...' : 'שלח דרישה לאישור'}
          </button>
        </div>
      </div>
    </div>
  );
}
