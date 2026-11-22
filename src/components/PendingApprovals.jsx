import data from '../data/data.json';
import RequisitionDetails from './Requisitions/RequisitionDetails';
import { StatusBadge, Icon } from './Requisitions/RequisitionUiParts';
import { formatMoney, formatDate } from './Requisitions/requisitionUi';
import { getActionableSteps, stepRoleLabel } from '../utils/approvalEngine';

const userName = (id) => {
  const u = data.users.find(x => String(x.id) === String(id));
  return u ? `${u.firstName} ${u.lastName || ''}`.trim() : '—';
};

// מתי הדרישה הוגשה לאישור (לפי יומן הפעולות)
const submittedAt = (req) => {
  const submits = (req.actionHistory || []).filter(a => a.actionCode === 'SUBMIT');
  return submits.length ? submits[submits.length - 1].actionDate : (req.lastUpdateDate || req.creationDate);
};

// ==========================================
// אישורים ממתינים: דרישות שממתינות למשתמש המחובר - כמאשר יחיד או כחבר בקבוצת מאשרים
// ==========================================
export default function PendingApprovals({ requisitions, currentUser, selectedId, onSelect, onApprove, onReject, onBackToHome }) {
  const selectedReq = selectedId ? requisitions.find(r => r.id === selectedId) : null;

  if (selectedReq) {
    const steps = getActionableSteps(selectedReq, currentUser.id);
    const done = (outcome) => { if (outcome) onSelect(null); };
    return (
      <RequisitionDetails
        requisition={selectedReq}
        backLabel="חזרה לאישורים ממתינים"
        onBack={() => onSelect(null)}
        onAction={() => {}}
        approval={{
          steps,
          onApprove: (note) => done(onApprove(selectedReq.id, note)),
          onReject: (note) => done(onReject(selectedReq.id, note))
        }}
      />
    );
  }

  const pending = requisitions.filter(r => getActionableSteps(r, currentUser.id).length > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-5 md:p-8 mt-6 transition-colors duration-300 border border-gray-100 dark:border-gray-700" dir="rtl">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-5 border-gray-100 dark:border-gray-700 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Icon name="check" className="w-6 h-6" strokeWidth={2.5} />
            </div>
            אישורים ממתינים
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
            דרישות שממתינות לאישורך - אישית או כחבר בקבוצת מאשרים.
          </p>
        </div>
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          <Icon name="back" className="w-4 h-4" strokeWidth={2.5} />
          חזור ללוח הבקרה
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 px-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 animate-fade-in">
          <Icon name="check" className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" strokeWidth={1.5} />
          <p className="text-gray-800 dark:text-gray-200 font-black text-xl">אין דרישות שממתינות לאישורך.</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">כשתגיע דרישה לשלב שבו נדרש האישור שלך, היא תופיע כאן.</p>
        </div>
      ) : (
        <>
          {/* --- טבלה (מסכים רחבים) --- */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-start px-4 py-3">מספר</th>
                  <th className="text-start px-4 py-3">תיאור</th>
                  <th className="text-start px-4 py-3">מבקש</th>
                  <th className="text-start px-4 py-3">ממתין לך בתפקיד</th>
                  <th className="text-start px-4 py-3">הוגשה</th>
                  <th className="text-end px-4 py-3">סה"כ</th>
                  <th className="text-end px-4 py-3"><span className="sr-only">פתיחה</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {pending.map(req => (
                  <tr key={req.id} onClick={() => onSelect(req.id)} className="group cursor-pointer transition-colors hover:bg-blue-50/40 dark:hover:bg-gray-700/40" data-testid="pending-row">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">{req.requisitionNumber}</td>
                    <td className="px-4 py-3.5 max-w-xs"><span className={`truncate block ${req.description ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-400 italic'}`}>{req.description || 'ללא תיאור'}</span></td>
                    <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{userName(req.creatorId)}</td>
                    <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300">{getActionableSteps(req, currentUser.id).map(stepRoleLabel).join(', ')}</td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(submittedAt(req))}</td>
                    <td className="px-4 py-3.5 text-end font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatMoney(req.total)}</td>
                    <td className="px-3 py-2"><Icon name="chevronLeft" className="w-4 h-4 text-gray-300 dark:text-gray-600 ms-auto group-hover:text-blue-500 transition-colors" strokeWidth={2.5} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- כרטיסיות (מובייל) --- */}
          <div className="md:hidden space-y-3">
            {pending.map(req => (
              <div key={req.id} onClick={() => onSelect(req.id)} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/40 active:bg-gray-50 dark:active:bg-gray-700/40 cursor-pointer">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="font-mono font-black text-gray-900 dark:text-white">{req.requisitionNumber}</div>
                    <div className={`text-sm mt-0.5 truncate ${req.description ? 'text-gray-700 dark:text-gray-300 font-semibold' : 'text-gray-400 italic'}`}>{req.description || 'ללא תיאור'}</div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="flex justify-between items-end mt-3 gap-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 min-w-0">
                    <div>מבקש: {userName(req.creatorId)} · {formatDate(submittedAt(req))}</div>
                    <div className="truncate">בתפקיד: {getActionableSteps(req, currentUser.id).map(stepRoleLabel).join(', ')}</div>
                  </div>
                  <div className="font-black text-gray-900 dark:text-white whitespace-nowrap">{formatMoney(req.total)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
