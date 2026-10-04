import React, { useState, useEffect } from 'react';
import data from '../data/data.json';

export default function PreferredApprovers({ currentUser, onBackToHome, showToast }) {
  const [steps, setSteps] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  
  // סטייטים עבור מנגנון הגרירה (Drag & Drop)
  const [draggedIndex, setDraggedIndex] = useState(null);

  // טעינת רשימת המאשרים המועדפת בעת פתיחת המסך
  useEffect(() => {
    if (currentUser) {
      const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
      const userPrefs = storedPrefs[currentUser.id] || {};
      const savedApprovers = userPrefs.preferredApprovers || [];
      
      const loadedSteps = savedApprovers.map((userId, idx) => ({
        id: Date.now() + idx + Math.random(),
        approverId: Number(userId)
      }));
      
      setSteps(loadedSteps);
    }
  }, [currentUser]);

  const handleAddStep = () => {
    if (!selectedUser) return;
    
    if (steps.length > 0 && steps[steps.length - 1].approverId === Number(selectedUser)) {
      if (showToast) showToast('שגיאה: לא ניתן להוסיף את אותו מאשר פעמיים ברצף.');
      return;
    }

    setSteps([...steps, { id: Date.now() + Math.random(), approverId: Number(selectedUser) }]);
    setSelectedUser('');
  };

  const handleRemoveStep = (idToRemove) => {
    setSteps(steps.filter(step => step.id !== idToRemove));
  };

  // --- פונקציות מנגנון הגרירה (Drag & Drop) ---
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
    setTimeout(() => {
      if (e.target) e.target.classList.add('opacity-30');
    }, 0);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      newSteps.splice(draggedIndex, 1);
      newSteps.splice(index, 0, prevSteps[draggedIndex]);
      return newSteps;
    });
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-30');
    setDraggedIndex(null);
  };
  // ---------------------------------------------

  const handleSave = () => {
    if (!currentUser) return;
    
    const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
    storedPrefs[currentUser.id] = {
      ...(storedPrefs[currentUser.id] || {}),
      preferredApprovers: steps.map(s => s.approverId)
    };
    
    localStorage.setItem('appPreferences', JSON.stringify(storedPrefs));
    if (showToast) showToast('רשימת המאשרים המועדפת נשמרה בהצלחה!');
  };

  // סינון המשתמש הנוכחי מהרשימה כדי שלא יוכל להוסיף את עצמו לסבב
  const availableUsers = data.users?.filter(u => String(u.id) !== String(currentUser?.id)) || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 sm:p-8 mt-6 transition-colors duration-300 max-w-4xl mx-auto border border-gray-100 dark:border-gray-700" dir="rtl">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-5 border-gray-100 dark:border-gray-700 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            רשימת מאשרים מועדפת
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
            המאשרים שיוגדרו כאן יתווספו אוטומטית לתחילת סבב האישורים בכל דרישת רכש חדשה. <br/>
            <span className="text-indigo-500 dark:text-indigo-400 font-bold">גרור את הכרטיסיות כדי לקבוע את סדר האישורים.</span>
          </p>
        </div>
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors cursor-pointer shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
          חזור ללוח הבקרה
        </button>
      </div>

      <div className="mb-10">
        {steps.length === 0 ? (
          <div className="text-center py-12 px-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">לא הוגדרו מאשרים מועדפים.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              כאשר הרשימה ריקה, המערכת תשתמש אוטומטית בממונה הישיר שלך כמאשר הראשון בסבב.
            </p>
          </div>
        ) : (
          <div className="relative border-r-2 border-indigo-100 dark:border-indigo-900/30 mr-2 pr-8 space-y-6">
            {steps.map((step, index) => {
              const userObj = data.users?.find(u => String(u.id) === String(step.approverId));
              const userName = userObj ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : 'משתמש לא ידוע';
              const userJob = userObj?.job || 'תפקיד לא מוגדר';

              return (
                <div 
                  key={step.id} 
                  className="relative group animate-fade-in"
                  draggable 
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                >
                  {/* המספר על ציר הזמן */}
                  <div className="absolute right-0 -mr-[41px] top-3 flex items-center justify-center w-6 h-6 border-2 border-indigo-500 rounded-full z-10 shadow-sm bg-white dark:bg-gray-800 transition-colors">
                     <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                  </div>
                  
                  {/* הכרטיסייה הנגררת */}
                  <div className={`relative bg-white dark:bg-gray-800/40 border ${draggedIndex === index ? 'border-indigo-400 border-dashed bg-indigo-50/50 dark:bg-indigo-900/30' : 'border-gray-100 dark:border-gray-700'} p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group-hover:border-indigo-200 dark:group-hover:border-indigo-800/50 flex justify-between items-center`}>
                    
                    <div className="flex items-center gap-4 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-sm border border-indigo-200 dark:border-indigo-800/50 shrink-0">
                        {userObj ? userObj.firstName.charAt(0) : '?'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-base">
                          {userName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {userJob}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveStep(step.id); }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                        title="הסר מאשר"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <div className="text-gray-300 dark:text-gray-600 opacity-50 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6h16.5" />
                        </svg>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- הוספת שלב חדש --- */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-gray-50/80 dark:bg-gray-900/50 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl mb-8">
        <div className="flex-1 w-full relative">
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-800 dark:text-gray-200 appearance-none"
          >
            <option value="">בחר משתמש כדי להוסיף לסבב...</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName || ''} {u.job ? `- ${u.job}` : ''}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
        
        <button 
          onClick={handleAddStep}
          disabled={!selectedUser}
          className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          הוסף מאשר
        </button>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 pt-6 flex justify-end">
        <button 
          onClick={handleSave}
          className="w-full sm:w-auto px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          שמור שינויים
        </button>
      </div>

    </div>
  );
}