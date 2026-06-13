import React from 'react';
import data from '../../data/data.json';

export default function CheckoutModals({
  showSaveModal, setShowSaveModal, executeSave,
  showMassUpdateModal, setShowMassUpdateModal,
  selectedLines, massUpdateData, setMassUpdateData, applyMassUpdate
}) {
  return (
    <>
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">שמירת דרישה</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">האם תרצה לרוקן את עגלת הקניות לאחר השמירה?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => executeSave(true)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer">שמור ורוקן סל</button>
              <button onClick={() => executeSave(false)} className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">שמור דרישה בלבד</button>
              <button onClick={() => setShowSaveModal(false)} className="w-full py-3 text-gray-500 font-bold hover:text-gray-700 mt-2 cursor-pointer">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {showMassUpdateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">עדכון גורף ל-{selectedLines.length} שורות</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">תאריך נדרש חדש</label>
                <input type="date" value={massUpdateData.needByDate} onChange={e => setMassUpdateData({...massUpdateData, needByDate: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">יעד הדרישה</label>
                <select value={massUpdateData.destinationType} onChange={e => setMassUpdateData({...massUpdateData, destinationType: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 outline-none">
                  <option value="">ללא שינוי</option>
                  <option value="Expense">הוצאה / מזמין</option>
                  <option value="Inventory">מלאי</option>
                </select>
              </div>
              <div className="col-span-2 mt-2 pt-4 border-t dark:border-gray-700">
                <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400 mb-2 block">נתוני סעיף תקציבי גורפים</span>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">פרויקט</label>
                <select value={massUpdateData.projectId} onChange={e => setMassUpdateData({...massUpdateData, projectId: Number(e.target.value)})} className="w-full p-2 border rounded-lg dark:bg-gray-700 text-sm outline-none">
                  <option value="">ללא שינוי</option>
                  {data.projects.map(p => <option key={p.id} value={p.id}>{p.projectCode}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">ארגון מממן</label>
                <select value={massUpdateData.expenditureOrgId} onChange={e => setMassUpdateData({...massUpdateData, expenditureOrgId: Number(e.target.value)})} className="w-full p-2 border rounded-lg dark:bg-gray-700 text-sm outline-none">
                  <option value="">ללא שינוי</option>
                  {data.expenditureOrganizations.map(eo => <option key={eo.id} value={eo.id}>{eo.name.split('-')[0]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={applyMassUpdate} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer">החל שינויים</button>
              <button onClick={() => setShowMassUpdateModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-xl hover:bg-gray-200 cursor-pointer">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}