import React, { useState, useEffect } from 'react';
import CheckoutLineRow from './CheckoutLineRow';
import DocumentsModal from './DocumentsModal'; 
import BulkEditForm from './BulkEditForm';
import QuickAddForm from './QuickAddForm';

const PAGE_SIZE = 10;

export default function CheckoutLines({
  lines = [],
  selectedLineIds = [],
  setSelectedLineIds = () => {},
  onLineOrgChange = () => {},
  onLineFieldChange = () => {},
  onRemoveLine = () => {},
  currentUser,
  onAddDist = () => {},
  onDistFieldChange = () => {},
  onRemoveDist = () => {},
  onApplyBulkEdit = () => {},
  onAddNewLine = () => {},
  
  buyerNotes = '',
  justification = '',
  headerProjectId = '',
  headerTaskId = '',
  headerExpTypeId = '',
  headerExpOrgId = '',
  isBudgetMixed = false,
  headerOrg = '',
  headerBuyer = '',
  headerRequester = ''
}) {
  const [openDocsLineId, setOpenDocsLineId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [prevLinesLength, setPrevLinesLength] = useState(lines.length);
  
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(lines.length / PAGE_SIZE));

  // ודא שהעמוד הנוכחי תקין אם מוחקים שורות
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [lines.length, totalPages, currentPage]);

  // התיקון לקפיצת הפגינציה: קופץ לעמוד האחרון רק אם *הוספנו* שורה חדשה אקטיבית
  useEffect(() => {
    if (prevLinesLength > 0 && lines.length > prevLinesLength) {
      setCurrentPage(Math.max(1, Math.ceil(lines.length / PAGE_SIZE)));
    }
    setPrevLinesLength(lines.length);
  }, [lines.length, prevLinesLength]);

  const pagedLines = lines.filter(Boolean).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleToggleSelect = (lineId) => {
    setSelectedLineIds(prev => prev.includes(lineId) ? prev.filter(id => id !== lineId) : [...prev, lineId]);
  };

  const handleToggleSelectAll = () => {
    if (selectedLineIds.length === lines.length) setSelectedLineIds([]);
    else setSelectedLineIds(lines.filter(Boolean).map(l => l.id));
  };

  const selectedLinesData = lines.filter(l => l && selectedLineIds.includes(l.id));

  // הגדרת אנימציית החלקה רכה לטפסים שתיטען ישירות ל-CSS
  const slideDownAnimation = `
    @keyframes slideDownFade {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  // --- מצב בו הסל ריק ---
  if (!lines || lines.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <style>{slideDownAnimation}</style>
        <div className="text-center py-12 text-gray-400 dark:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 opacity-40">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <p className="font-semibold text-lg">הסל ריק</p>
          <p className="text-sm mt-1">הקלק על הכפתור מטה כדי להוסיף שורה ראשונה</p>
        </div>

        {!isQuickAddOpen ? (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-300 dark:border-emerald-700/50 rounded-2xl text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              הוסף שורה מהירה
            </button>
          </div>
        ) : (
          <div style={{ animation: 'slideDownFade 0.35s ease-out' }}>
            <QuickAddForm 
              onAddNewLine={onAddNewLine}
              onClose={() => setIsQuickAddOpen(false)}
              hasLines={lines.length > 0}
              currentUser={currentUser}
              buyerNotes={buyerNotes}
              justification={justification}
              headerProjectId={headerProjectId}
              headerTaskId={headerTaskId}
              headerExpTypeId={headerExpTypeId}
              headerExpOrgId={headerExpOrgId}
              isBudgetMixed={isBudgetMixed}
              headerOrg={headerOrg}
              headerBuyer={headerBuyer} 
              headerRequester={headerRequester} 
            />
          </div>
        )}
      </div>
    );
  }

  // --- מצב בו יש שורות ---
  return (
    <div className="flex flex-col gap-3">
      <style>{slideDownAnimation}</style>

      {/* --- בר ניווט עליון (בחירת שורות ועריכה מרובה) --- */}
      <div className="flex items-center justify-between px-1 mb-1 mt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={lines.length > 0 && selectedLineIds.length === lines.length} onChange={handleToggleSelectAll} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"/>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {selectedLineIds.length > 0 ? `${selectedLineIds.length} שורות נבחרו (מתוך ${lines.length})` : 'בחר הכל'}
            </span>
          </div>

          {selectedLineIds.length > 0 && (
            <button 
              onClick={() => setIsBulkEditOpen(!isBulkEditOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isBulkEditOpen ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
              {isBulkEditOpen ? 'בטל עריכה מרובה' : 'עריכה מרובה'}
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-600 font-mono">
          סה"כ {lines.length} שורות
        </span>
      </div>

      {/* --- טופס עריכה מרובה (עם אנימציה) --- */}
      {selectedLineIds.length > 0 && isBulkEditOpen && (
        <div style={{ animation: 'slideDownFade 0.3s ease-out forwards' }}>
          <BulkEditForm 
            selectedLineIds={selectedLineIds}
            selectedLinesData={selectedLinesData}
            onApplyBulkEdit={onApplyBulkEdit}
            onClose={() => setIsBulkEditOpen(false)}
          />
        </div>
      )}

      {/* --- רינדור השורות --- */}
      {pagedLines.map((line, idx) => (
        <CheckoutLineRow
          key={line.id}
          line={line}
          index={(currentPage - 1) * PAGE_SIZE + idx + 1}
          isSelected={selectedLineIds.includes(line.id)}
          onToggleSelect={handleToggleSelect}
          onLineOrgChange={onLineOrgChange}
          onLineFieldChange={onLineFieldChange}
          onRemoveLine={onRemoveLine}
          currentUser={currentUser}
          onOpenDocs={(lineId) => setOpenDocsLineId(openDocsLineId === lineId ? null : lineId)}
          onAddDist={onAddDist}
          onDistFieldChange={onDistFieldChange}
          onRemoveDist={onRemoveDist}
        />
      ))}

      {/* --- עיצוב מחדש של הפגינציה (Pagination) --- */}
      {totalPages > 1 && lines.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            מציג <span className="text-gray-900 dark:text-gray-200">{(currentPage - 1) * PAGE_SIZE + 1}</span> עד <span className="text-gray-900 dark:text-gray-200">{Math.min(currentPage * PAGE_SIZE, lines.length)}</span> מתוך <span className="text-gray-900 dark:text-gray-200">{lines.length}</span> שורות
          </span>
          
          <div className="flex items-center gap-1.5 p-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              הקודם
            </button>
            
            <div className="hidden sm:flex items-center gap-1 px-2 border-x border-gray-200 dark:border-gray-700">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((item, i, arr) => (
                  <React.Fragment key={item}>
                    {i > 0 && arr[i - 1] !== item - 1 && <span className="text-gray-400 px-1 font-bold">...</span>}
                    <button 
                      onClick={() => setCurrentPage(item)} 
                      className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                        currentPage === item 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                      }`}
                    >
                      {item}
                    </button>
                  </React.Fragment>
              ))}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages} 
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
            >
              הבא
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* --- טופס הוספה מהירה מתחת לניווט (מוסתר כברירת מחדל, מוצג עם אנימציה) --- */}
      <div className="mt-8 mb-4">
        {!isQuickAddOpen ? (
          <div className="flex justify-center">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-300 dark:border-emerald-700/50 rounded-2xl text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              הוסף שורה חדשה
            </button>
          </div>
        ) : (
          <div style={{ animation: 'slideDownFade 0.35s ease-out forwards' }}>
            <QuickAddForm 
              onAddNewLine={onAddNewLine}
              onClose={() => setIsQuickAddOpen(false)}
              hasLines={lines.length > 0}
              currentUser={currentUser}
              buyerNotes={buyerNotes}
              justification={justification}
              headerProjectId={headerProjectId}
              headerTaskId={headerTaskId}
              headerExpTypeId={headerExpTypeId}
              headerExpOrgId={headerExpOrgId}
              isBudgetMixed={isBudgetMixed}
              headerOrg={headerOrg}
              headerBuyer={headerBuyer} 
              headerRequester={headerRequester} 
            />
          </div>
        )}
      </div>

      <DocumentsModal 
        isOpen={openDocsLineId !== null} 
        onClose={() => setOpenDocsLineId(null)} 
      />

    </div>
  );
}