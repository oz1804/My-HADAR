import React, { useState, useEffect, useRef } from 'react';
import data from '../data/data.json';

export default function DefaultsModal({ 
  isOpen, 
  onClose, 
  globalOrg, 
  setGlobalOrg, 
  globalDestType, 
  setGlobalDestType,
  globalSubInv,      
  setGlobalSubInv,
  globalProject,     
  setGlobalProject,  
  globalTask,        
  setGlobalTask,     
  globalExpType,     
  setGlobalExpType,  
  globalExpOrg,      
  setGlobalExpOrg,
  showToast // <--- קבלת הפונקציה מה-Navbar
}) {
  // סטייט לשמירת הערכים (Grid 1)
  const [defaultOrg, setDefaultOrg] = useState('');
  const [defaultDest, setDefaultDest] = useState('Expense'); 
  const [defaultSubInv, setDefaultSubInv] = useState(''); 
  
  // סטייט לשמירת הערכים (Grid 2 - סעיף תקציבי)
  const [defaultProject, setDefaultProject] = useState('');
  const [defaultTask, setDefaultTask] = useState('');
  const [defaultExpType, setDefaultExpType] = useState('');
  const [defaultExpOrg, setDefaultExpOrg] = useState('');

  // ניהול רשימת הערכים החכמה (LOV) עבור ארגון מלאי
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // סנכרון ראשוני: כשהמודל נפתח, נטען את הנתונים מהסטייט הגלובלי
  useEffect(() => {
    if (isOpen) {
      // טעינת הגדרות Grid 1
      setDefaultOrg(globalOrg || '');
      if (globalOrg) {
        const org = data.inventoryOrganizations?.find(o => Number(o.id) === Number(globalOrg));
        if (org) {
          setOrgSearchTerm(`${org.code} - ${org.name}`);
        } else {
          setOrgSearchTerm('');
        }
      } else {
        setOrgSearchTerm('');
      }
      setDefaultDest(globalDestType || 'Expense');
      setDefaultSubInv(globalSubInv || '');

      // טעינת הגדרות Grid 2
      setDefaultProject(globalProject || '');
      setDefaultTask(globalTask || '');
      setDefaultExpType(globalExpType || '');
      setDefaultExpOrg(globalExpOrg || '');
    }
  }, [isOpen, globalOrg, globalDestType, globalSubInv, globalProject, globalTask, globalExpType, globalExpOrg]);

  // סגירת הרשימה של ארגון המלאי כשלוחצים מחוץ אליה
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOrgDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // פונקציית עזר לבדיקת תוקף תאריכים
  const today = new Date().toISOString().split('T')[0];
  const isItemActive = (item) => (!item?.startDate || item.startDate <= today) && (!item?.endDate || item.endDate >= today);

  // סינונים ל-Grid 1
  const inventoryOrganizations = data.inventoryOrganizations || [];
  const filteredOrgs = inventoryOrganizations.filter(org => 
    org.name.toLowerCase().includes(orgSearchTerm.toLowerCase()) || 
    org.code.toLowerCase().includes(orgSearchTerm.toLowerCase())
  );

  const handleSelectOrg = (org) => {
    setDefaultOrg(org.id);
    setOrgSearchTerm(`${org.code} - ${org.name}`);
    setIsOrgDropdownOpen(false);
    
    // ניקוי אוטומטי של שדות שתלויים בארגון שהשתנה
    setDefaultSubInv(''); 
    setDefaultProject(''); 
    setDefaultTask('');
    setDefaultExpType('');
  };

  // ----- לוגיקת סינונים עבור Grid 2 (סעיף תקציבי) -----
  const isInventory = defaultDest === 'Inventory';

  const availableProjects = data.projects?.filter(p => {
    if (!isItemActive(p)) return false;
    // אם נבחר ארגון, הפרויקט חייב להיות משויך אליו
    if (defaultOrg && !p.inventoryOrgIds?.includes(Number(defaultOrg))) return false;
    // אם היעד הוא מלאי, הפרויקט חייב לתמוך בסוג הוצאה למלאי (ID 4)
    if (isInventory && !p.allowedExpenditureTypeIds?.includes(4)) return false;
    return true;
  });

  const selectedProj = defaultProject ? data.projects?.find(p => p.id === Number(defaultProject)) : null;

  const availableTasks = data.tasks?.filter(t => {
    if (!isItemActive(t)) return false;
    if (defaultProject && t.projectId !== Number(defaultProject)) return false;
    return true;
  });

  const availableExpTypes = data.expenditureTypes?.filter(et => {
    if (!isItemActive(et)) return false;
    if (selectedProj?.allowedExpenditureTypeIds && !selectedProj.allowedExpenditureTypeIds.includes(et.id)) return false;
    return true;
  });

  const availableExpOrgs = data.expenditureOrganizations?.filter(isItemActive);
  // ---------------------------------------------------

  const handleSave = () => {
    if (setGlobalOrg) setGlobalOrg(defaultOrg);
    if (setGlobalDestType) setGlobalDestType(defaultDest);
    if (setGlobalSubInv) setGlobalSubInv(defaultSubInv);
    
    if (setGlobalProject) setGlobalProject(defaultProject);
    if (setGlobalTask) setGlobalTask(defaultTask);
    if (setGlobalExpType) setGlobalExpType(defaultExpType);
    if (setGlobalExpOrg) setGlobalExpOrg(defaultExpOrg);
    
    // הפעלת ה-Toast במקום ה-alert הישן
    if (showToast) {
      showToast('הגדרות המשתמש נשמרו בהצלחה!');
    } else {
      alert('הגדרות נשמרו בהצלחה!'); // Fallback למקרה שאין Toast
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-4xl transform transition-all flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-700" 
        dir="rtl"
      >
        {/* --- כותרת החלון --- */}
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-5 mb-6 shrink-0">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
            ברירות מחדל והעדפות משתמש
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* --- אזור התוכן הנגלל --- */}
        <div className="overflow-y-auto flex-1 pr-2 pl-4 -ml-4 custom-scrollbar">
          
          {/* ----- Grid 1: הגדרות ארגוניות ----- */}
          <div className="mb-10">
             <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-5 border-b border-gray-100 dark:border-gray-700/50 pb-2">הגדרות ארגוניות</h4>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               
               <div className="relative" ref={dropdownRef}>
                 <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                   ארגון מלאי (ברירת מחדל)
                 </label>
                 <div className="relative">
                   <input
                     type="text"
                     value={orgSearchTerm}
                     onChange={(e) => {
                       setOrgSearchTerm(e.target.value);
                       setIsOrgDropdownOpen(true);
                       if(e.target.value === '') {
                         setDefaultOrg('');
                         setDefaultSubInv(''); 
                         setDefaultProject(''); // איפוס במחיקת ארגון
                         setDefaultTask('');
                         setDefaultExpType('');
                       }
                     }}
                     onFocus={() => setIsOrgDropdownOpen(true)}
                     placeholder="הקלד לחיפוש ארגון מלאי..."
                     className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none pl-10"
                   />
                   <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                     </svg>
                   </div>
                 </div>

                 {isOrgDropdownOpen && (
                   <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl max-h-60 overflow-y-auto custom-scrollbar">
                     {filteredOrgs.length > 0 ? (
                       filteredOrgs.map(org => (
                         <li 
                           key={org.id} 
                           onClick={() => handleSelectOrg(org)}
                           className={`p-3.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${Number(defaultOrg) === Number(org.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                         >
                           <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">{org.code}</div>
                           <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{org.name}</div>
                         </li>
                       ))
                     ) : (
                       <li className="p-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                         לא נמצאו ארגונים התואמים לחיפוש
                       </li>
                     )}
                   </ul>
                 )}
               </div>

               <div>
                 <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                   יעד דרישה (ברירת מחדל)
                 </label>
                 <select
                   value={defaultDest}
                   onChange={(e) => {
                     const val = e.target.value;
                     setDefaultDest(val);
                     
                     // מנקים פרויקט כדי לוודא שאין סתירות מול סוג הוצאה למלאי
                     setDefaultProject(''); 
                     setDefaultTask('');
                     
                     if (val === 'Expense') {
                       setDefaultSubInv(''); 
                     } else if (val === 'Inventory') {
                       setDefaultExpType('');
                       setDefaultExpOrg('');
                     }
                   }}
                   className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                 >
                   <option value="Expense">הוצאה (Expense)</option>
                   <option value="Inventory">מלאי (Inventory)</option>
                 </select>
               </div>

               {defaultDest === 'Inventory' && (
                 <div className="animate-fade-in">
                   <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                     מחסן (ברירת מחדל)
                   </label>
                   <select
                     value={defaultSubInv}
                     onChange={(e) => setDefaultSubInv(e.target.value)}
                     disabled={!defaultOrg}
                     className={`w-full p-3.5 border rounded-xl text-sm transition-all outline-none ${!defaultOrg ? 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'}`}
                   >
                     <option value="">בחר מחסן...</option>
                     {data.subInventories?.filter(s => String(s.inventoryOrgId) === String(defaultOrg)).map(sub => (
                       <option key={sub.id} value={sub.code}>{sub.name} ({sub.code})</option>
                     ))}
                   </select>
                 </div>
               )}

             </div>
          </div>

          {/* ----- Grid 2: סעיף תקציבי ----- */}
          <div className="mb-4">
             <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-5 border-b border-gray-100 dark:border-gray-700/50 pb-2">סעיף תקציבי (ברירת מחדל)</h4>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               
               <div>
                 <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">פרויקט</label>
                 <select
                   value={defaultProject}
                   onChange={(e) => {
                     setDefaultProject(e.target.value);
                     setDefaultTask(''); // מנקה משימה התלויה בפרויקט
                     setDefaultExpType(''); // מנקה סוג הוצאה התלוי בפרויקט
                   }}
                   className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                 >
                   <option value="">בחר פרויקט...</option>
                   {availableProjects?.map(p => (
                     <option key={p.id} value={p.id}>{p.projectCode} - {p.projectName}</option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">משימה</label>
                 <select
                   value={defaultTask}
                   onChange={(e) => setDefaultTask(e.target.value)}
                   className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                 >
                   <option value="">בחר משימה...</option>
                   {availableTasks?.map(t => (
                     <option key={t.id} value={t.id}>{t.taskCode} - {t.taskName}</option>
                   ))}
                 </select>
               </div>

               {/* שדות המוצגים אך ורק אם יעד הדרישה הוא הוצאה */}
               {defaultDest === 'Expense' && (
                 <>
                   <div className="animate-fade-in">
                     <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">סוג הוצאה</label>
                     <select
                       value={defaultExpType}
                       onChange={(e) => setDefaultExpType(e.target.value)}
                       className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                     >
                       <option value="">בחר סוג הוצאה...</option>
                       {availableExpTypes?.map(et => (
                         <option key={et.id} value={et.id}>{et.name}</option>
                       ))}
                     </select>
                   </div>

                   <div className="animate-fade-in">
                     <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">יחידה מממנת</label>
                     <select
                       value={defaultExpOrg}
                       onChange={(e) => setDefaultExpOrg(e.target.value)}
                       className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                     >
                       <option value="">בחר יחידה...</option>
                       {availableExpOrgs?.map(eo => (
                         <option key={eo.id} value={eo.id}>{eo.name}</option>
                       ))}
                     </select>
                   </div>
                 </>
               )}

             </div>
          </div>

        </div>
        
        {/* --- אזור הפעולות בתחתית החלון --- */}
        <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors cursor-pointer"
          >
            ביטול
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-2.5 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            שמור הגדרות
          </button>
        </div>
      </div>
    </div>
  );
}