import { useEffect } from 'react';
import { Icon } from './RequisitionUiParts';

// מעטפת אחידה לכל החלונות - זהה בעיצוב לחלונות של מסך ה-Checkout
function ModalShell({ onClose, iconName, iconClass, title, children }) {
  // סגירה במקש Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${iconClass}`}>
          <Icon name={iconName} className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

const btnPrimary = 'w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer';
const btnSecondary = 'w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer';
const btnGhost = 'w-full py-3 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-700 dark:hover:text-gray-200 mt-1 cursor-pointer';

// כפתור בחירה עם כותרת והסבר (לחלון ההעתקה עם 3 האפשרויות)
function ChoiceButton({ onClick, title, description, accent }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-start p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group ${accent}`}
    >
      <div className="font-bold text-gray-900 dark:text-white">{title}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</div>
    </button>
  );
}

// שורת הסבר על מה שיש כרגע בסל
function CartNotice({ cartCount, editingNumber }) {
  return (
    <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
      <Icon name="cart" className="w-5 h-5 text-gray-400 shrink-0" />
      <span>
        בסל שלך <strong className="text-gray-900 dark:text-white">{cartCount} {cartCount === 1 ? 'שורה' : 'שורות'}</strong>
        {editingNumber && <> של דרישה <span className="font-mono font-bold text-gray-900 dark:text-white">{editingNumber}</span> שנמצאת בעריכה</>}
        .
      </span>
    </div>
  );
}

export default function RequisitionActionModals({ modal, onClose, cartCount, editingNumber, onConfirmEdit, onConfirmCopy, onConfirmDelete, onConfirmCancel }) {
  if (!modal) return null;
  const { type, requisition } = modal;
  const reqNumber = <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{requisition.requisitionNumber}</span>;

  // --- עריכה כשהסל לא ריק ---
  if (type === 'edit') {
    return (
      <ModalShell onClose={onClose} iconName="edit" iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" title="יש פריטים בסל">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          כדי לערוך את דרישה {reqNumber} היא תיטען לסל. האם לשמור את הסל הנוכחי כטיוטה לעריכה בפעם אחרת?
        </p>
        <CartNotice cartCount={cartCount} editingNumber={editingNumber} />
        {requisition.status === 'IN PROCESS' && (
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-6 flex gap-2">
            <Icon name="warning" className="w-4 h-4 shrink-0 mt-0.5" />
            הדרישה תימשך מסבב האישורים ותחזור לסטטוס טיוטה.
          </p>
        )}
        <div className="flex flex-col gap-3">
          <button onClick={() => onConfirmEdit(true)} className={btnPrimary}>כן, שמור את הסל כטיוטה</button>
          <button onClick={() => onConfirmEdit(false)} className={btnSecondary}>לא, דרוס את הסל</button>
          <button onClick={onClose} className={btnGhost}>ביטול</button>
        </div>
      </ModalShell>
    );
  }

  // --- עריכה של דרישה בסבב אישורים (כשהסל ריק) - אישור משיכה ---
  if (type === 'withdraw') {
    return (
      <ModalShell onClose={onClose} iconName="warning" iconClass="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" title="משיכת הדרישה מהסבב">
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          דרישה {reqNumber} נמצאת כרגע בסבב אישורים. עריכה תמשוך אותה מהסבב ותחזיר אותה לסטטוס טיוטה. לאחר העריכה יהיה צורך לשלוח אותה לסבב מחדש.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => onConfirmEdit(false)} className={btnPrimary}>משוך וערוך</button>
          <button onClick={onClose} className={btnGhost}>ביטול</button>
        </div>
      </ModalShell>
    );
  }

  // --- העתקה כשהסל לא ריק (3 אפשרויות) ---
  if (type === 'copy') {
    return (
      <ModalShell onClose={onClose} iconName="copy" iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" title="העתקת דרישה לסל">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          מה לעשות עם הפריטים שכבר נמצאים בסל לפני העתקת דרישה {reqNumber}?
        </p>
        <CartNotice cartCount={cartCount} editingNumber={editingNumber} />
        <div className="flex flex-col gap-3">
          <ChoiceButton
            onClick={() => onConfirmCopy('saveDraft')}
            title="שמור את הסל כטיוטה"
            description="הסל הנוכחי יישמר כדרישה בסטטוס טיוטה, והעותק ייטען לסל ריק."
            accent="hover:border-blue-300 dark:hover:border-blue-700"
          />
          <ChoiceButton
            onClick={() => onConfirmCopy('merge')}
            title="הוסף לסל הקיים"
            description="שורות הדרישה יתווספו לפריטים שכבר נמצאים בסל."
            accent="hover:border-indigo-300 dark:hover:border-indigo-700"
          />
          <ChoiceButton
            onClick={() => onConfirmCopy('overwrite')}
            title="דרוס את הסל"
            description="תוכן הסל הנוכחי יימחק ויוחלף בשורות הדרישה."
            accent="hover:border-red-300 dark:hover:border-red-800"
          />
          <button onClick={onClose} className={btnGhost}>ביטול</button>
        </div>
      </ModalShell>
    );
  }

  // --- מחיקה ---
  if (type === 'delete') {
    const isInCart = modal.isEditing;
    return (
      <ModalShell onClose={onClose} iconName="delete" iconClass="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" title="מחיקת דרישה">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          האם למחוק את דרישה {reqNumber} לצמיתות? לא ניתן לשחזר את הפעולה.
        </p>
        {isInCart && (
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-4 flex gap-2">
            <Icon name="warning" className="w-4 h-4 shrink-0 mt-0.5" />
            הדרישה פתוחה כרגע לעריכה בסל. הפריטים יישארו בסל וייחשבו כדרישה חדשה.
          </p>
        )}
        <div className="flex flex-col gap-3 mt-4">
          <button onClick={onConfirmDelete} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors cursor-pointer">מחק דרישה</button>
          <button onClick={onClose} className={btnGhost}>ביטול</button>
        </div>
      </ModalShell>
    );
  }

  // --- ביטול דרישה ---
  if (type === 'cancel') {
    return (
      <ModalShell onClose={onClose} iconName="cancel" iconClass="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" title="ביטול דרישה">
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          האם לבטל את דרישה {reqNumber}? הסטטוס ישתנה ל"בוטלה", ולאחר מכן ניתן יהיה רק לצפות בה או להעתיק אותה.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirmCancel} className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors cursor-pointer">בטל דרישה</button>
          <button onClick={onClose} className={btnGhost}>חזור</button>
        </div>
      </ModalShell>
    );
  }

  return null;
}
