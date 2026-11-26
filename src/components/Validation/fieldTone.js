import { worstSeverity } from '../../utils/validationEngine';

// צבע הטקסט של הודעה לפי סוגה
export const SEVERITY_TEXT = {
  ERROR: 'text-rose-600 dark:text-rose-400',
  WARNING: 'text-amber-600 dark:text-amber-400',
  INFO: 'text-sky-600 dark:text-sky-400'
};

// מסגרת השדה לפי ההודעה החמורה ביותר שלו
const TONE = {
  ERROR: 'border-rose-400! dark:border-rose-600! bg-rose-50! dark:bg-rose-900/20! ring-1 ring-rose-200 dark:ring-rose-900/40',
  WARNING: 'border-amber-400! dark:border-amber-600! ring-1 ring-amber-200 dark:ring-amber-900/40',
  INFO: 'border-sky-300! dark:border-sky-700!'
};

export const fieldToneClass = (messages) => TONE[worstSeverity(messages)] || '';

// הגלילה לשדה הראשון עם הודעה חוסמת (data-validation-field על עטיפת השדה)
export const focusFirstBlocking = (root = document) => {
  requestAnimationFrame(() => {
    // ההודעה מופיעה פעמיים (ליד השדה במחשב / מתחתיו בנייד) - לוקחים את הגלויה
    const el = [...root.querySelectorAll('[data-validation-severity="ERROR"]')].find(e => e.getClientRects().length);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = el.closest('[data-validation-field]')?.querySelector('input, select, textarea');
    input?.focus({ preventScroll: true });
  });
};
