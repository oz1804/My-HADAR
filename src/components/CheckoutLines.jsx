import React, { useState } from 'react';
import DocumentsModal from './DocumentsModal';
import CheckoutLineRow from './CheckoutLineRow';

export default function CheckoutLines({ 
  lines = [], 
  selectedLineIds, 
  setSelectedLineIds, 
  onLineOrgChange, 
  onLineFieldChange,
  onRemoveLine, 
  currentUser 
}) {
  const [docsLineId, setDocsLineId] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); 

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  
  const totalPages = Math.max(1, Math.ceil(lines.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentLines = lines.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleToggleSelectLine = (id) => {
    setSelectedLineIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedLineIds.length === lines.length && lines.length > 0) {
      setSelectedLineIds([]);
    } else {
      setSelectedLineIds(lines.map(line => line.id));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      
      <div className="flex gap-6 px-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <button onClick={() => setActiveTab('general')} className={`pb-3 text-sm font-bold border-b-2 ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>מידע כללי ופיננסי</button>
        <button onClick={() => setActiveTab('supplier')} className={`pb-3 text-sm font-bold border-b-2 ${activeTab === 'supplier' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>ספק מומלץ</button>
        <button onClick={() => setActiveTab('additional')} className={`pb-3 text-sm font-bold border-b-2 ${activeTab === 'additional' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>מידע נוסף</button>
      </div>

      <div className="overflow-x-auto custom-scrollbar min-h-[300px]">
        <table className="w-full text-right text-sm border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-400 bg-gray-50/30 dark:bg-gray-900/10">
              <th className="p-4 w-12 text-center"><input type="checkbox" checked={lines.length > 0 && selectedLineIds.length === lines.length} onChange={handleToggleSelectAll} /></th>
              <th className="p-4 w-16 text-center">שורה</th>
              <th className="p-4 w-28">מק"ט</th>
              <th className="p-4 min-w-[200px] max-w-[250px]">תיאור פריט</th>

              {activeTab === 'general' && (
                <>
                  <th className="p-4 w-24">סוג</th>
                  <th className="p-4 w-24">כמות</th>
                  <th className="p-4 w-20">UOM</th>
                  <th className="p-4 w-32">מחיר יחידה</th>
                  <th className="p-4 w-36">תאריך נדרש</th>
                  <th className="p-4 w-32">ארגון מלאי</th>
                </>
              )}

              {activeTab === 'supplier' && (
                <>
                  <th className="p-4 w-40">ספק מומלץ</th>
                  <th className="p-4 w-36">אתר ספק</th>
                  <th className="p-4 w-36">קניין</th>
                </>
              )}

              {activeTab === 'additional' && (
                <>
                  <th className="p-4 w-40">דרישות איכות</th>
                  <th className="p-4 w-40">מאשר שירות</th>
                </>
              )}

              <th className="p-4 w-28 text-center">נספחים</th>
              <th className="p-4 w-32 text-center">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {currentLines.length > 0 ? (
              currentLines.map((line, idx) => (
                <CheckoutLineRow 
                  key={line.id}
                  line={line}
                  index={startIndex + idx + 1}
                  isSelected={selectedLineIds.includes(line.id)}
                  onToggleSelect={handleToggleSelectLine}
                  onLineOrgChange={onLineOrgChange}
                  onLineFieldChange={onLineFieldChange}
                  onRemoveLine={onRemoveLine}
                  currentUser={currentUser}
                  onOpenDocs={setDocsLineId}
                  activeTab={activeTab} 
                />
              ))
            ) : (
              <tr>
                <td colSpan="13" className="p-8 text-center text-gray-500 dark:text-gray-400">אין שורות דרישה להצגה.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            מציג שורות {startIndex + 1} עד {Math.min(startIndex + ITEMS_PER_PAGE, lines.length)} מתוך {lines.length}
          </span>
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={safeCurrentPage === 1} className="p-1.5 px-3 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-white disabled:opacity-40">הקודם</button>
            <div className="px-4 py-1 text-sm font-black">{safeCurrentPage} / {totalPages}</div>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={safeCurrentPage === totalPages} className="p-1.5 px-3 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-white disabled:opacity-40">הבא</button>
          </div>
        </div>
      )}

      <DocumentsModal isOpen={!!docsLineId} onClose={() => setDocsLineId(null)} />
    </div>
  );
}