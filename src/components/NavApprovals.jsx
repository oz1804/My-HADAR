// כפתור "אישורים ממתינים" ב-Navbar - אייקון עם מונה, באותו סגנון של עגלת הקניות.
// variant="row": שורה מלאה בתפריט הנייד (באותו סגנון של "הדרישות שלי")
export default function NavApprovals({ onNavigate, count = 0, variant = 'icon' }) {
  if (variant === 'row') {
    return (
      <button
        onClick={onNavigate}
        className="shrink-0 flex items-center gap-1.5 px-2 py-2 text-base font-bold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="underline-offset-4 group-hover:underline whitespace-nowrap">אישורים ממתינים</span>
        {count > 0 && <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center">{count}</span>}
      </button>
    );
  }
  return (
    <button
      onClick={onNavigate}
      className="flex flex-col items-center justify-center gap-1 p-1 md:p-1.5 xl:px-2 xl:py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group shrink-0"
      title="אישורים ממתינים"
      aria-label={count > 0 ? `אישורים ממתינים: ${count}` : 'אישורים ממתינים'}
    >
      <div className="relative mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {count > 0 && (
          <span data-testid="pending-count" className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-gradient-to-br from-rose-500 to-red-600 border-2 border-white dark:border-gray-800 rounded-full shadow-sm z-10">
            {count}
          </span>
        )}
      </div>
      <span className="hidden xl:block text-[10px] font-bold text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-none">אישורים</span>
    </button>
  );
}
