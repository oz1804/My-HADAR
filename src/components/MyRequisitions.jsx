import { useMemo, useState } from 'react';
import { canDoAction } from '../hooks/useAppData';
import { STATUS_META, STATUS_ORDER, ACTION_META, formatMoney, formatDate } from './Requisitions/requisitionUi';
import { StatusBadge, Icon } from './Requisitions/RequisitionUiParts';
import RequisitionDetails from './Requisitions/RequisitionDetails';
import RequisitionActionModals from './Requisitions/RequisitionActionModals';

// סדר כפתורי הפעולה בשורה של הטבלה
const ROW_ACTIONS = ['edit', 'copy', 'cancel', 'delete'];

// כפתור אייקון קטן לפעולה בשורה
function RowActionButton({ action, onClick, showLabel = false }) {
  const meta = ACTION_META[action];
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={meta.label}
      aria-label={meta.label}
      className={`flex items-center gap-1.5 p-2 rounded-lg text-gray-400 dark:text-gray-500 transition-colors cursor-pointer ${showLabel ? 'text-xs font-bold text-gray-500 dark:text-gray-400' : ''} ${meta.hover}`}
    >
      <Icon name={meta.icon} className="w-[18px] h-[18px]" />
      {showLabel && meta.label}
    </button>
  );
}

// תגית קטנה לדרישה שפתוחה כרגע בסל
function InCartTag() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-md whitespace-nowrap">
      <Icon name="cart" className="w-3 h-3" strokeWidth={2.5} />
      בעריכה בסל
    </span>
  );
}

export default function MyRequisitions({
  requisitions = [],          // הדרישות של המשתמש המחובר (myRequisitions מה-Hook)
  cartLines = [],
  editingRequisitionId = null,
  onStartEdit,
  onCopy,
  onDelete,
  onCancel,
  onNavigate,
  onBackToHome
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null); // { type, requisition, isEditing }

  const cartCount = cartLines.length;
  const editingReq = requisitions.find(r => r.id === editingRequisitionId) || null;
  const selectedReq = selectedId ? requisitions.find(r => r.id === selectedId) || null : null;

  // ספירה לכל סטטוס (לשבבי הסינון)
  const counts = useMemo(() => {
    const c = { ALL: requisitions.length };
    STATUS_ORDER.forEach(s => { c[s] = 0; });
    requisitions.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [requisitions]);

  // סינון לפי סטטוס וחיפוש חופשי (מספר / תיאור / תיאור פריט)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requisitions.filter(r => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(r.requisitionNumber).includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.lines || []).some(l => (l.itemDescription || '').toLowerCase().includes(q) || String(l.sku || '').toLowerCase().includes(q))
      );
    });
  }, [requisitions, statusFilter, search]);

  // ==========================================
  // ניתוב פעולות - כולל טיפול בהתנגשות עם הסל
  // ==========================================
  const handleAction = (action, req) => {
    if (action === 'view') { setSelectedId(req.id); return; }

    if (action === 'edit') {
      // הדרישה כבר פתוחה בסל - פשוט ממשיכים לעריכה בלי לדרוס שינויים
      if (req.id === editingRequisitionId && cartCount > 0) { onNavigate('checkout'); return; }
      if (cartCount > 0) { setModal({ type: 'edit', requisition: req }); return; }
      if (req.status === 'IN PROCESS') { setModal({ type: 'withdraw', requisition: req }); return; }
      onStartEdit(req.id);
      return;
    }

    if (action === 'copy') {
      if (cartCount > 0) { setModal({ type: 'copy', requisition: req }); return; }
      onCopy(req.id, 'overwrite');
      return;
    }

    if (action === 'delete') { setModal({ type: 'delete', requisition: req, isEditing: req.id === editingRequisitionId && cartCount > 0 }); return; }
    if (action === 'cancel') { setModal({ type: 'cancel', requisition: req }); }
  };

  const closeModal = () => setModal(null);

  const modalElement = (
    <RequisitionActionModals
      modal={modal}
      onClose={closeModal}
      cartCount={cartCount}
      editingNumber={editingReq && modal && editingReq.id !== modal.requisition.id ? editingReq.requisitionNumber : null}
      onConfirmEdit={(saveCartFirst) => { const id = modal.requisition.id; closeModal(); onStartEdit(id, { saveCartFirst }); }}
      onConfirmCopy={(mode) => { const id = modal.requisition.id; closeModal(); onCopy(id, mode); }}
      onConfirmDelete={() => {
        const id = modal.requisition.id;
        closeModal();
        if (onDelete(id) && id === selectedId) setSelectedId(null);
      }}
      onConfirmCancel={() => { const id = modal.requisition.id; closeModal(); onCancel(id); }}
    />
  );

  // ==========================================
  // מסך פרטי דרישה
  // ==========================================
  if (selectedReq) {
    return (
      <>
        <RequisitionDetails
          requisition={selectedReq}
          isEditing={selectedReq.id === editingRequisitionId && cartCount > 0}
          onAction={handleAction}
          onBack={() => setSelectedId(null)}
          onContinueEditing={() => onNavigate('checkout')}
        />
        {modalElement}
      </>
    );
  }

  // ==========================================
  // מסך רשימת הדרישות
  // ==========================================
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-5 md:p-8 mt-6 transition-colors duration-300 border border-gray-100 dark:border-gray-700" dir="rtl">

      {/* --- אזור כותרת --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-5 border-gray-100 dark:border-gray-700 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Icon name="list" className="w-6 h-6" />
            </div>
            הדרישות שלי
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
            מעקב אחר כל הדרישות שיצרת: צפייה, עריכה, העתקה לסל וביטול.
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

      {requisitions.length === 0 ? (
        /* --- מצב ריק --- */
        <div className="text-center py-16 px-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 animate-fade-in">
          <Icon name="list" className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" strokeWidth={1.5} />
          <p className="text-gray-800 dark:text-gray-200 font-black text-xl">עדיין אין לך דרישות.</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
            דרישה נוצרת כשאתה שומר את הסל או שולח אותו לסבב אישורים ממסך הסל המורחב.
          </p>
          {cartCount > 0 && (
            <button onClick={() => onNavigate('checkout')} className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md cursor-pointer">
              מעבר לסל ({cartCount})
            </button>
          )}
        </div>
      ) : (
        <>
          {/* --- סרגל סינון --- */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-5">
            <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 custom-scrollbar lg:flex-wrap lg:overflow-visible">
              {['ALL', ...STATUS_ORDER].map(s => {
                const isActive = statusFilter === s;
                const count = counts[s] || 0;
                const label = s === 'ALL' ? 'הכל' : STATUS_META[s].label;
                const activeClass = s === 'ALL' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : STATUS_META[s].chipActive;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    disabled={count === 0 && s !== 'ALL'}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${isActive ? `${activeClass} shadow-sm` : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700/60 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                  >
                    {s !== 'ALL' && !isActive && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[s].dot}`}></span>}
                    {label}
                    <span className={`text-xs ${isActive ? 'opacity-80' : 'text-gray-400 dark:text-gray-500'}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative lg:ms-auto lg:w-72 shrink-0">
              <Icon name="search" className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש לפי מספר, תיאור או פריט"
                className="w-full ps-9 pe-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <p className="font-bold">לא נמצאו דרישות התואמות לסינון.</p>
              <button onClick={() => { setStatusFilter('ALL'); setSearch(''); }} className="mt-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">נקה סינון</button>
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
                      <th className="text-start px-4 py-3">נוצרה</th>
                      <th className="text-start px-4 py-3">שורות</th>
                      <th className="text-end px-4 py-3">סה"כ</th>
                      <th className="text-start px-4 py-3">סטטוס</th>
                      <th className="text-end px-4 py-3"><span className="sr-only">פעולות</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filtered.map(req => {
                      const isEditing = req.id === editingRequisitionId && cartCount > 0;
                      return (
                        <tr
                          key={req.id}
                          onClick={() => handleAction('view', req)}
                          className={`group cursor-pointer transition-colors hover:bg-blue-50/40 dark:hover:bg-gray-700/40 ${req.status === 'CANCELLED' ? 'opacity-70' : ''}`}
                        >
                          <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">{req.requisitionNumber}</td>
                          <td className="px-4 py-3.5 max-w-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`truncate ${req.description ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-400 italic'}`}>
                                {req.description || 'ללא תיאור'}
                              </span>
                              {isEditing && <InCartTag />}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(req.creationDate)}</td>
                          <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">{(req.lines || []).length}</td>
                          <td className="px-4 py-3.5 text-end font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatMoney(req.total)}</td>
                          <td className="px-4 py-3.5"><StatusBadge status={req.status} /></td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-0.5">
                              {ROW_ACTIONS.filter(a => canDoAction(req.status, a)).map(a => (
                                <RowActionButton key={a} action={a} onClick={() => handleAction(a, req)} />
                              ))}
                              <Icon name="chevronLeft" className="w-4 h-4 text-gray-300 dark:text-gray-600 ms-1 group-hover:text-blue-500 transition-colors" strokeWidth={2.5} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* --- כרטיסיות (מובייל) --- */}
              <div className="md:hidden space-y-3">
                {filtered.map(req => {
                  const isEditing = req.id === editingRequisitionId && cartCount > 0;
                  return (
                    <div
                      key={req.id}
                      onClick={() => handleAction('view', req)}
                      className={`p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/40 active:bg-gray-50 dark:active:bg-gray-700/40 cursor-pointer ${req.status === 'CANCELLED' ? 'opacity-70' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="font-mono font-black text-gray-900 dark:text-white">{req.requisitionNumber}</div>
                          <div className={`text-sm mt-0.5 truncate ${req.description ? 'text-gray-700 dark:text-gray-300 font-semibold' : 'text-gray-400 italic'}`}>
                            {req.description || 'ללא תיאור'}
                          </div>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex justify-between items-end mt-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <div>{formatDate(req.creationDate)} · {(req.lines || []).length} שורות</div>
                          {isEditing && <InCartTag />}
                        </div>
                        <div className="font-black text-gray-900 dark:text-white">{formatMoney(req.total)}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 -mx-1">
                        {ROW_ACTIONS.filter(a => canDoAction(req.status, a)).map(a => (
                          <RowActionButton key={a} action={a} showLabel onClick={() => handleAction(a, req)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {modalElement}
    </div>
  );
}
