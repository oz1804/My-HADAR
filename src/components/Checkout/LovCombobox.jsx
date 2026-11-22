import { useId, useMemo, useRef, useState } from 'react';

// ==========================================
// שדה טקסט חופשי עם רשימת ערכים (LOV) שנפתחת תוך כדי הקלדה.
// - הרשימה מציגה רק ערכים תקינים (validItems).
// - בסיום הקלדה (Enter / יציאה מהשדה) הטקסט מזוהה מול *כל* הערכים (items):
//   נמצא ערך -> נשמר המזהה שלו (גם אם הוא לא תקין, כדי שהמשתמש יראה את השגיאה);
//   לא נמצא -> נשמר הטקסט כפי שהוקלד (onCommit עם value ריק ו-text).
// ==========================================

const norm = (s) => String(s ?? '').trim().toLowerCase();

const SIZES = {
  sm: { input: 'p-1 ps-1.5 pe-6 text-xs rounded', chevron: 'w-3.5 h-3.5', list: 'text-xs', option: 'px-2 py-1.5' },
  md: { input: 'p-2.5 pe-9 text-sm rounded-xl', chevron: 'w-4 h-4', list: 'text-sm', option: 'px-3 py-2' },
  form: { input: 'p-2.5 pe-8 text-xs rounded-lg', chevron: 'w-3.5 h-3.5', list: 'text-xs', option: 'px-2.5 py-1.5' }
};

export default function LovCombobox({
  items = [],            // כל הערכים (לזיהוי טקסט שהוקלד)
  validItems = [],       // הערכים שמוצגים ברשימה
  value,                 // מזהה הערך השמור
  text = '',             // טקסט שהוקלד ולא זוהה (lovText)
  getCode,               // קוד הערך (למשל projectCode)
  getName = () => '',    // שם הערך
  getDisplay,            // מה מוצג בשדה כשנבחר ערך
  prefer,                // (item) => boolean - עדיפות כשכמה ערכים עם אותו קוד (למשל משימה של הפרויקט שנבחר)
  onCommit,              // ({ value, text }) => void
  placeholder = '',
  invalid = false,
  size = 'sm',
  ariaLabel
}) {
  const sz = SIZES[size] || SIZES.sm;
  const listId = useId();
  const inputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const display = getDisplay || ((item) => getCode(item));
  const selectedItem = value === null || value === undefined || value === ''
    ? null
    : items.find(i => String(i.id) === String(value)) || null;
  const committedText = selectedItem ? display(selectedItem) : (text || (value ? String(value) : ''));
  const shownValue = isEditing ? query : committedText;

  // סינון הרשימה לפי מה שהוקלד (קוד או שם). אם הטקסט לא השתנה - כל הרשימה
  const options = useMemo(() => {
    const q = norm(query);
    if (!q || q === norm(committedText)) return validItems;
    return validItems.filter(i => norm(getCode(i)).includes(q) || norm(getName(i)).includes(q));
  }, [query, committedText, validItems, getCode, getName]);

  // זיהוי טקסט מול כל הערכים - התאמה מלאה לקוד, לשם או לתצוגה
  const resolve = (raw) => {
    const q = norm(raw);
    const matches = items.filter(i => [getCode(i), getName(i), display(i), `${getCode(i)} - ${getName(i)}`].some(x => norm(x) === q));
    if (matches.length <= 1) return matches[0] || null;
    return matches.find(i => validItems.includes(i)) || (prefer && matches.find(prefer)) || matches[0];
  };

  const commit = (raw) => {
    const q = String(raw ?? '').trim();
    setIsEditing(false);
    setIsOpen(false);
    if (norm(q) === norm(committedText)) return;           // לא השתנה
    if (!q) { onCommit({ value: '', text: '' }); return; }  // נמחק
    const item = resolve(q);
    onCommit(item ? { value: item.id, text: '' } : { value: '', text: q });
  };

  const choose = (item) => {
    setIsEditing(false);
    setIsOpen(false);
    onCommit({ value: item.id, text: '' });
  };

  const startEditing = () => {
    if (!isEditing) { setQuery(committedText); setIsEditing(true); }
  };

  const openList = () => {
    startEditing();
    setHighlight(Math.max(0, options.findIndex(o => selectedItem && o.id === selectedItem.id)));
    setIsOpen(true);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) openList();
      else setHighlight(h => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && options[highlight] && norm(query) !== norm(committedText)) choose(options[highlight]);
      else commit(query);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setIsEditing(false);
    }
  };

  const borderClass = invalid
    ? 'border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-200 dark:ring-rose-900/40'
    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';
  const activeId = isOpen && options[highlight] ? `${listId}-opt-${options[highlight].id}` : undefined;

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-invalid={invalid}
        autoComplete="off"
        spellCheck={false}
        value={shownValue}
        placeholder={placeholder}
        onFocus={(e) => {
          startEditing();
          // סימון הטקסט הקיים להחלפה מהירה - רק אם המשתמש עדיין לא התחיל להקליד
          const el = e.target;
          const before = el.value;
          requestAnimationFrame(() => { if (document.activeElement === el && el.value === before) el.select(); });
        }}
        onChange={(e) => { setIsEditing(true); setQuery(e.target.value); setIsOpen(true); setHighlight(0); }}
        onBlur={() => { if (isEditing) commit(query); }}
        onKeyDown={onKeyDown}
        className={`w-full border outline-none focus:border-blue-500 transition-colors ${sz.input} ${borderClass}`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="פתח רשימת ערכים"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { if (isOpen) setIsOpen(false); else { inputRef.current?.focus(); openList(); } }}
        className="absolute inset-y-0 end-0 flex items-center px-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`${sz.chevron} transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute z-40 top-full mt-1 start-0 min-w-full w-max max-w-[min(22rem,85vw)] max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1 ${sz.list}`}
        >
          {options.length === 0 ? (
            <li className={`${sz.option} text-gray-500 dark:text-gray-400`}>אין ערך תואם ברשימה</li>
          ) : (
            options.map((item, idx) => {
              const isSelected = selectedItem && item.id === selectedItem.id;
              return (
                <li
                  key={item.id}
                  id={`${listId}-opt-${item.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => { e.preventDefault(); choose(item); }}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`${sz.option} flex items-baseline gap-2 cursor-pointer ${idx === highlight ? 'bg-blue-50 dark:bg-blue-900/30' : ''} ${isSelected ? 'font-bold' : ''}`}
                >
                  <span className="font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">{getCode(item)}</span>
                  {getName(item) && getName(item) !== getCode(item) && (
                    <span className="text-gray-500 dark:text-gray-400 truncate">{getName(item)}</span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
