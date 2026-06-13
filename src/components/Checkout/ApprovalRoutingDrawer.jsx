import React, { useState, useEffect } from 'react';
import data from '../../data/data.json';

export default function ApprovalRoutingDrawer({ isOpen, onClose, currentUser, lines, headerBuyer, onSubmitApproval }) {
  const [routingSteps, setRoutingSteps] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const initialSteps = [];

      const supervisor = data.users.find(u => u.id === currentUser.supervisor);
      if (supervisor) {
        initialSteps.push({
          id: `supervisor-${supervisor.id}`,
          title: 'אישור ממונה ישיר',
          name: `${supervisor.firstName} ${supervisor.lastName || ''}`.trim(),
          role: supervisor.job || 'ממונה',
          status: 'pending'
        });
      }

      const allBuyerIds = new Set();
      if (headerBuyer && headerBuyer !== 'mixed') allBuyerIds.add(headerBuyer);
      lines.forEach(line => {
        if (line.buyer) allBuyerIds.add(line.buyer);
      });

      allBuyerIds.forEach(bId => {
        const buyerObj = data.buyers.find(b => String(b.id) === String(bId));
        if (buyerObj) {
          initialSteps.push({
            id: `buyer-${bId}`,
            title: 'אישור קניין',
            name: buyerObj.name,
            role: 'מדור רכש',
            status: 'pending'
          });
        }
      });

      setRoutingSteps(initialSteps);
      setSelectedUserToAdd('');
      setDraggedIndex(null);
    }
  }, [isOpen, currentUser, lines, headerBuyer]);

  const handleAddApprover = () => {
    if (!selectedUserToAdd) return;
    
    const userObj = data.users.find(u => String(u.id) === String(selectedUserToAdd));
    if (userObj) {
      setRoutingSteps(prev => {
        const newApprover = {
          id: `adhoc-${Date.now()}`,
          title: 'מאשר נוסף',
          name: `${userObj.firstName} ${userObj.lastName || ''}`.trim(),
          role: userObj.job || 'צוות ארגוני',
          status: 'pending'
        };
        
        const firstBuyerIndex = prev.findIndex(step => step.id.startsWith('buyer-'));
        
        const newSteps = [...prev];
        if (firstBuyerIndex !== -1) {
          newSteps.splice(firstBuyerIndex, 0, newApprover);
        } else {
          newSteps.push(newApprover);
        }
        
        return newSteps;
      });
      setSelectedUserToAdd('');
    }
  };

  const handleRemoveApprover = (stepId) => {
    setRoutingSteps(prev => prev.filter(step => step.id !== stepId));
  };

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

    const draggedItem = routingSteps[draggedIndex];
    const targetItem = routingSteps[index];

    const isDraggedBuyer = draggedItem?.id.startsWith('buyer-');
    const isTargetBuyer = targetItem?.id.startsWith('buyer-');

    if (isDraggedBuyer !== isTargetBuyer) return;

    setRoutingSteps(prevSteps => {
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

  if (!isOpen) return null;

  const drawerAnimation = `
    @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;

  return (
    <div className="fixed inset-0 z-[150] flex" dir="rtl">
      <style>{drawerAnimation}</style>
      
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      <div 
        className="relative flex flex-col w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl h-full border-e border-gray-200 dark:border-gray-700"
        style={{ animation: 'slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">סבב מאשרים</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">גרור את הכרטיסיות כדי לשנות סדר. הקניינים תמיד יחתמו את הסבב.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          
          {routingSteps.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8">
              אין מאשרים בסבב הנוכחי.
            </div>
          ) : (
            <div className="relative border-r-2 border-blue-100 dark:border-blue-900/30 mr-2 pr-8 space-y-6">
              {routingSteps.map((step, idx) => {
                const isBuyer = step.id.startsWith('buyer-');
                
                return (
                  <div 
                    key={step.id} 
                    className="relative group animate-fade-in"
                    draggable 
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragEnter={(e) => handleDragEnter(e, idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                  >
                    <div className={`absolute right-0 -mr-[41px] top-3 flex items-center justify-center w-6 h-6 border-2 rounded-full z-10 shadow-sm transition-colors ${isBuyer ? 'bg-purple-50 border-purple-500 dark:bg-gray-800' : 'bg-white dark:bg-gray-800 border-blue-500'}`}>
                       <span className={`text-[10px] font-black ${isBuyer ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>{idx + 1}</span>
                    </div>
                    
                    <div className={`relative bg-white dark:bg-gray-800/40 border ${draggedIndex === idx ? 'border-blue-400 border-dashed bg-blue-50/50 dark:bg-blue-900/30' : 'border-gray-100 dark:border-gray-700'} p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group-hover:border-blue-200 dark:group-hover:border-blue-800/50`}>
                      
                      <div className="absolute top-1/2 -translate-y-1/2 right-2 text-gray-300 dark:text-gray-600 opacity-50 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6h16.5" />
                        </svg>
                      </div>

                      {!isBuyer && (
                        <button 
                          onClick={() => handleRemoveApprover(step.id)}
                          className="absolute top-3 left-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                          title="הסר מאשר"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}

                      <div className="pr-6 pl-8 pointer-events-none">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isBuyer ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>{step.title}</span>
                        <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1">{step.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.role}</p>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
              הוספת מאשר נוסף לסבב
            </label>
            <div className="flex gap-2">
              <select 
                value={selectedUserToAdd} 
                onChange={(e) => setSelectedUserToAdd(e.target.value)}
                className="flex-1 p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">בחר משתמש...</option>
                {data.users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName || ''} {u.job ? `- ${u.job}` : ''}</option>
                ))}
              </select>
              <button 
                onClick={handleAddApprover}
                disabled={!selectedUserToAdd}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl font-bold text-sm hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              >
                הוסף
              </button>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 shrink-0">
          <button 
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={routingSteps.length === 0}
            onClick={() => { 
              // מעביר את הנתונים למעלה לפני סגירה
              if (onSubmitApproval) onSubmitApproval(routingSteps);
              onClose(); 
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            שלח דרישה לאישור
          </button>
        </div>
      </div>
    </div>
  );
}