import React, { useState, useEffect } from 'react';
import './index.css';
import data from './data/data.json';
import Login from './components/Login';
import Navbar from './components/Navbar';
import MyRequisitions from './components/MyRequisitions';
import UserGuide from './components/UserGuide';
import FAQ from './components/FAQ';
import ProcDocs from './components/ProcDocs';
import PreferredApprovers from './components/PreferredApprovers';
import FavoriteItems from './components/FavoriteItems';
import ItemDetails from './components/ItemDetails';
import SearchResults from './components/SearchResults';
import Checkout from './components/Checkout/Checkout';
import NonCatalogModal from './components/NonCatalogModal';
import WelcomeModal from './components/WelcomeModal'; 

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('home'); 
  const [viewPayload, setViewPayload] = useState(null);
  
  // --- סטייטים גלובליים להעדפות משתמש (מתחילים ריקים בכוונה) ---
  const [globalOrg, setGlobalOrg] = useState(''); 
  const [globalDestType, setGlobalDestType] = useState('Expense');
  const [globalSubInv, setGlobalSubInv] = useState(''); 
  
  const [globalProject, setGlobalProject] = useState('');
  const [globalTask, setGlobalTask] = useState('');
  const [globalExpType, setGlobalExpType] = useState('');
  const [globalExpOrg, setGlobalExpOrg] = useState('');
  // -------------------------------------

  const [cartLines, setCartLines] = useState([]);
  const [isNonCatalogOpen, setIsNonCatalogOpen] = useState(false);
  
  // חלונית ברוך הבא / בחירת ארגון
  const [showOrgPrompt, setShowOrgPrompt] = useState(false);
  
  // --- מערכת Toast גלובלית ואלגנטית ---
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };
  // -------------------------------------

  const [requisitions, setRequisitions] = useState(() => {
    const stored = localStorage.getItem('appRequisitions');
    return stored ? JSON.parse(stored) : (data.requisitions || []);
  });

  // טעינת עגלת הקניות השמורה בעת התחברות
  useEffect(() => {
    if (currentUser) {
      const storedCarts = JSON.parse(localStorage.getItem('appCarts')) || {};
      
      if (storedCarts[currentUser.id]) {
        setCartLines(storedCarts[currentUser.id]);
      } else {
        const userFromData = data.users.find(
          u => String(u.id) === String(currentUser.id) || u.username === currentUser.username
        );
        setCartLines((userFromData && userFromData.cart) ? userFromData.cart : []);
      }
    }
  }, [currentUser]);

  // --- מערכת העדפות משתמש (User Preferences) ---
  
  // 1. טעינת העדפות ברירת המחדל בעת התחברות
  useEffect(() => {
    if (currentUser) {
      const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
      const userPrefs = storedPrefs[currentUser.id] || {};
      
      const userFromData = data.users.find(u => String(u.id) === String(currentUser.id));
      const initialPrefs = userFromData?.preferences; 

      const isOldSave = !userPrefs.hasOwnProperty('defaultProject');
      const hasNoLocalPrefs = Object.keys(userPrefs).length === 0;

      let activeOrg = '';
      let activeDest = 'Expense';
      let activeSubInv = '';
      let activeProject = '';
      let activeTask = '';
      let activeExpType = '';
      let activeExpOrg = '';

      if (hasNoLocalPrefs || isOldSave) {
        if (initialPrefs) {
          activeOrg = initialPrefs.defaultOrg || '';
          activeDest = initialPrefs.defaultDest || 'Expense';
          activeSubInv = initialPrefs.defaultSubInv || '';
          activeProject = initialPrefs.defaultProject || '';
          activeTask = initialPrefs.defaultTask || '';
          activeExpType = initialPrefs.defaultExpType || '';
          activeExpOrg = initialPrefs.defaultExpOrg || '';
        }
      } else {
        activeOrg = userPrefs.defaultOrg || '';
        activeDest = userPrefs.defaultDest || 'Expense';
        activeSubInv = userPrefs.defaultSubInv || '';
        activeProject = userPrefs.defaultProject || '';
        activeTask = userPrefs.defaultTask || '';
        activeExpType = userPrefs.defaultExpType || '';
        activeExpOrg = userPrefs.defaultExpOrg || '';
      }

      setGlobalOrg(activeOrg);
      setGlobalDestType(activeDest);
      setGlobalSubInv(activeSubInv);
      setGlobalProject(activeProject);
      setGlobalTask(activeTask);
      setGlobalExpType(activeExpType);
      setGlobalExpOrg(activeExpOrg);

      // הקפצת חלונית בחירת ארגון למשתמשים ללא העדפות (דיליי קטן לאנימציה חלקה)
      if (activeOrg === '') {
        setTimeout(() => setShowOrgPrompt(true), 300);
      } else {
        setShowOrgPrompt(false);
      }

      storedPrefs[currentUser.id] = {
        defaultOrg: activeOrg,
        defaultDest: activeDest,
        defaultSubInv: activeSubInv,
        defaultProject: activeProject,
        defaultTask: activeTask,
        defaultExpType: activeExpType,
        defaultExpOrg: activeExpOrg
      };
      localStorage.setItem('appPreferences', JSON.stringify(storedPrefs));
    }
  }, [currentUser]);

  // 2. פונקציות שמירה אקטיבית
  const handleSetGlobalOrg = (newVal) => {
    setGlobalOrg(newVal);
    updateUserPref('defaultOrg', newVal);
  };
  const handleSetGlobalDestType = (newVal) => {
    setGlobalDestType(newVal);
    updateUserPref('defaultDest', newVal);
  };
  const handleSetGlobalSubInv = (newVal) => {
    setGlobalSubInv(newVal);
    updateUserPref('defaultSubInv', newVal);
  };
  const handleSetGlobalProject = (newVal) => {
    setGlobalProject(newVal);
    updateUserPref('defaultProject', newVal);
  };
  const handleSetGlobalTask = (newVal) => {
    setGlobalTask(newVal);
    updateUserPref('defaultTask', newVal);
  };
  const handleSetGlobalExpType = (newVal) => {
    setGlobalExpType(newVal);
    updateUserPref('defaultExpType', newVal);
  };
  const handleSetGlobalExpOrg = (newVal) => {
    setGlobalExpOrg(newVal);
    updateUserPref('defaultExpOrg', newVal);
  };

  const updateUserPref = (key, value) => {
    if (currentUser) {
      const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
      storedPrefs[currentUser.id] = {
        ...storedPrefs[currentUser.id],
        [key]: value
      };
      localStorage.setItem('appPreferences', JSON.stringify(storedPrefs));
    }
  };
  // -----------------------------------------------------------

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home'); 
    setViewPayload(null);
    setCartLines([]); 
    setShowOrgPrompt(false);
    
    // איפוס מוחלט בעת התנתקות
    setGlobalOrg(''); 
    setGlobalDestType('Expense'); 
    setGlobalSubInv(''); 
    setGlobalProject('');
    setGlobalTask('');
    setGlobalExpType('');
    setGlobalExpOrg('');
  };

  const handleNavigate = (view, payload = null) => {
    setCurrentView(view);
    setViewPayload(payload);
  };

  const updateCartAndSave = (updaterFn) => {
    setCartLines(prev => {
      const newCart = typeof updaterFn === 'function' ? updaterFn(prev) : updaterFn;
      if (currentUser) {
        const storedCarts = JSON.parse(localStorage.getItem('appCarts')) || {};
        storedCarts[currentUser.id] = newCart;
        localStorage.setItem('appCarts', JSON.stringify(storedCarts));
      }
      return newCart;
    });
  };

  const updateLineQty = (lineId, newQty) => {
    updateCartAndSave(prev => {
      if (newQty === 0) {
        return prev.filter(line => line.id !== lineId);
      }
      return prev.map(line => {
        if (line.id !== lineId) return line;
        
        const updatedLine = { ...line, quantity: newQty };
        if (updatedLine.distributions && updatedLine.distributions.length === 1) {
          updatedLine.distributions[0].quantity = newQty;
          updatedLine.distributions[0].percentage = 100;
          updatedLine.distributions[0].functionalAmount = newQty * (updatedLine.unitPrice || 0) * (updatedLine.distributions[0].rate || 1);
        }
        return updatedLine;
      });
    });
  };

  // הוספת פריט קטלוגי לסל
  const addNewLine = (itemId, initialQty = 1, customDate = null) => {
    const catalogItem = data.catalogItems.find(i => String(i.id) === String(itemId));
    
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const defaultDate = d.toISOString().split('T')[0];
    const price = catalogItem.price || 0;

    const newLine = {
      id: Date.now(),
      lineNumber: cartLines.length + 1,
      lineType: "טובין",
      destinationType: globalDestType,
      itemId: catalogItem.id,
      sku: catalogItem.sku,
      itemDescription: catalogItem.description,
      quantity: initialQty, 
      uom: catalogItem.uom || "EA",
      unitPrice: price,
      needByDate: customDate || defaultDate, 
      inventoryOrg: globalDestType === 'Expense' ? null : (globalOrg || ""), 
      subInventory: globalDestType === 'Expense' ? "" : globalSubInv, 
      buyer: "",
      serviceApprover: "",
      qualityRequirement: "לא נדרשת ביקורת",
      justification: "",
      buyerNotes: "",
      distributions: [
        {
          id: Date.now() + 1, 
          quantity: initialQty, 
          percentage: 100, 
          currency: 'ILS', 
          exchangeDate: '', 
          rate: 1, 
          functionalAmount: price * initialQty, 
          projectId: globalProject, 
          taskId: globalTask, 
          expenditureTypeId: globalDestType === 'Inventory' ? '' : globalExpType, 
          expenditureOrgId: globalDestType === 'Inventory' ? '' : globalExpOrg 
        }
      ]
    };
    
    updateCartAndSave(prev => [...prev, newLine]);
    showToast('הפריט נוסף לסל בהצלחה!');
  };

  const addNonCatalogLine = (lineData) => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const defaultDate = d.toISOString().split('T')[0];
    
    const rate = lineData.rate || 1;

    const newLine = {
      id: Date.now(),
      lineNumber: cartLines.length + 1,
      lineType: lineData.lineType,
      destinationType: lineData.destinationType,
      itemId: null,
      sku: "פריט חופשי",
      itemDescription: lineData.description,
      quantity: lineData.quantity,
      uom: lineData.uom,
      unitPrice: lineData.unitPrice,
      currency: lineData.currency,
      exchangeDate: lineData.exchangeDate,
      rate: rate,
      needByDate: defaultDate, 
      inventoryOrg: lineData.inventoryOrg || (lineData.lineType === 'שירות' ? null : (globalOrg || "")), 
      subInventory: lineData.subInventory || "", 
      buyer: lineData.buyer || "",
      requester: lineData.requester || currentUser.id,
      serviceApprover: lineData.serviceApprover || "",
      qualityRequirement: "לא נדרשת ביקורת",
      justification: "",
      buyerNotes: "",
      distributions: [
        {
          id: Date.now() + 1, 
          quantity: lineData.quantity, 
          percentage: 100, 
          currency: lineData.currency, 
          exchangeDate: lineData.exchangeDate, 
          rate: rate, 
          functionalAmount: lineData.unitPrice * lineData.quantity * rate,
          projectId: globalProject, 
          taskId: globalTask, 
          expenditureTypeId: lineData.destinationType === 'Inventory' ? '' : globalExpType, 
          expenditureOrgId: lineData.destinationType === 'Inventory' ? '' : globalExpOrg 
        }
      ]
    };
    
    updateCartAndSave(prev => [...prev, newLine]);
    showToast('פריט חופשי נוסף לסל בהצלחה!');
  };

  const handleCheckoutSubmit = (headerData, finalLines, emptyCart, routingSteps = [], status = 'Draft') => {
    setRequisitions(prev => {
      const nextId = prev.length > 0 ? Math.max(...prev.map(r => r.id)) + 1 : 1;
      const reqNum = 180000 + (nextId - 1); 
      const now = new Date().toISOString();

      const formattedLines = finalLines.map((line, lIndex) => {
        const lineId = nextId * 1000 + (lIndex + 1);
        return {
          id: lineId,
          requisitionId: nextId,
          lineNumber: lIndex + 1,
          lineType: line.lineType,
          destinationType: line.destinationType,
          itemId: line.itemId ? Number(line.itemId) : null,
          itemDescription: line.itemDescription,
          quantity: Number(line.quantity),
          uom: line.uom,
          unitPrice: Number(line.unitPrice),
          currency: line.currency,
          exchangeDate: line.exchangeDate,
          rate: Number(line.rate),
          needByDate: line.needByDate,
          inventoryOrg: line.inventoryOrg ? Number(line.inventoryOrg) : null,
          subInventory: line.subInventory || "", 
          buyer: line.buyer, 
          requester: line.requester ? Number(line.requester) : null,
          serviceApprover: line.serviceApprover ? Number(line.serviceApprover) : null,
          supplier: line.supplier ? Number(line.supplier) : null,
          qualityRequirement: line.qualityRequirement,
          buyerNotes: line.buyerNotes,
          justification: line.justification,
          distributions: line.distributions.map((dist, dIndex) => ({
            id: lineId * 100 + (dIndex + 1),
            requisitionLineId: lineId,
            quantity: Number(dist.quantity),
            percentage: Number(dist.percentage),
            projectId: dist.projectId ? Number(dist.projectId) : null,
            taskId: dist.taskId ? Number(dist.taskId) : null,
            expenditureTypeId: dist.expenditureTypeId ? Number(dist.expenditureTypeId) : null,
            expenditureOrgId: dist.expenditureOrgId ? Number(dist.expenditureOrgId) : null,
            functionalAmount: Number(dist.functionalAmount)
          }))
        };
      });

      const newRequisition = {
        id: nextId,
        requisitionNumber: String(reqNum),
        description: headerData.description || '',
        creationDate: now,
        lastUpdateDate: now,
        creatorId: currentUser.id,
        total: formattedLines.reduce((sum, item) => sum + (item.unitPrice * item.quantity * item.rate), 0),
        status: status, 
        routingSteps: routingSteps,
        lines: formattedLines
      };

      const updatedList = [newRequisition, ...prev];
      localStorage.setItem('appRequisitions', JSON.stringify(updatedList));
      
      setTimeout(() => {
          if (emptyCart) {
            updateCartAndSave([]); 
          } else {
            updateCartAndSave(finalLines);
          }
          
          if (status === 'IN PROCESS') {
              handleNavigate('success', newRequisition);
          } else {
              handleNavigate('home');
          }
      }, 0);

      return updatedList;
    });
  };

  if (!currentUser) {
    return (
      <div className="relative" dir="rtl">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-4 end-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md text-gray-800 dark:text-yellow-400 z-10 cursor-pointer">
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <Login onLogin={setCurrentUser} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300 relative" dir="rtl">
      
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
        onNavigate={handleNavigate}
        cartLines={cartLines} 
        onUpdateQty={updateLineQty}
        
        globalOrg={globalOrg} setGlobalOrg={handleSetGlobalOrg} 
        globalDestType={globalDestType} setGlobalDestType={handleSetGlobalDestType} 
        globalSubInv={globalSubInv} setGlobalSubInv={handleSetGlobalSubInv} 
        globalProject={globalProject} setGlobalProject={handleSetGlobalProject}
        globalTask={globalTask} setGlobalTask={handleSetGlobalTask}
        globalExpType={globalExpType} setGlobalExpType={handleSetGlobalExpType}
        globalExpOrg={globalExpOrg} setGlobalExpOrg={handleSetGlobalExpOrg}
        
        onOpenNonCatalog={() => setIsNonCatalogOpen(true)}
        showToast={showToast}
      />
      
      <main className="p-6 max-w-7xl mx-auto pb-24">
        {currentView === 'home' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 mt-6">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-4 border-gray-100 dark:border-gray-700">לוח בקרה</h2>
            <p className="text-lg">התחברת בהצלחה בתור <strong dir="ltr">{currentUser.username}</strong>!</p>
          </div>
        )}

        {currentView === 'success' && viewPayload && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-10 mt-12 text-center animate-fade-in max-w-2xl mx-auto border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">הדרישה נשלחה בהצלחה!</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
              דרישה מספר <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{viewPayload.requisitionNumber}</span> הועברה לסבב אישורים.
            </p>
            <button 
              onClick={() => handleNavigate('home')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md hover:shadow-lg cursor-pointer"
            >
              חזרה ללוח הבקרה
            </button>
          </div>
        )}

        {currentView === 'requisitions' && <MyRequisitions onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'user-guide' && <UserGuide onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'faq' && <FAQ onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'proc-docs' && <ProcDocs onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'preferred-approvers' && <PreferredApprovers onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'favorite-items' && <FavoriteItems onBackToHome={() => handleNavigate('home')} />}
        
        {currentView === 'search-results' && (
          <SearchResults 
            query={viewPayload} 
            onBackToHome={() => handleNavigate('home')} 
            onNavigate={handleNavigate}
            onAddToCart={(itemId, quantity) => {
              const existingLine = cartLines.find(line => String(line.itemId) === String(itemId));
              if (existingLine) {
                updateLineQty(existingLine.id, existingLine.quantity + quantity);
                showToast('כמות הפריט עודכנה בסל בהצלחה!');
              } else {
                addNewLine(itemId, quantity); 
              }
            }}
            onQuickOrder={(itemId, quantity) => {
              const existingLine = cartLines.find(line => String(line.itemId) === String(itemId));
              if (existingLine) {
                updateLineQty(existingLine.id, existingLine.quantity + quantity);
              } else {
                addNewLine(itemId, quantity);
              }
              handleNavigate('checkout');
            }}
            favoriteItems={[]}
          />
        )}
        
        {currentView === 'item-details' && (
          <ItemDetails 
            itemId={viewPayload} 
            onBack={() => handleNavigate('home')} 
            cartLines={cartLines}
            onUpdateQty={updateLineQty}
            onAddNewLine={addNewLine}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'checkout' && (
          <Checkout 
            cartLines={cartLines}
            currentUser={currentUser}
            
            globalOrg={globalOrg}
            globalDestType={globalDestType} 
            globalSubInv={globalSubInv} 
            globalProject={globalProject}
            globalTask={globalTask}
            globalExpType={globalExpType}
            globalExpOrg={globalExpOrg}
            
            onBack={() => handleNavigate('home')}
            onSubmit={handleCheckoutSubmit}
            onRemoveFromCart={(id) => updateLineQty(id, 0)} 
            nextRequisitionNumber={String(180000 + (requisitions.length > 0 ? Math.max(...requisitions.map(r => r.id)) : 0))}
            onAddLineToCart={(newLineData) => {
              const newLine = {
                id: Date.now(),
                lineNumber: cartLines.length + 1,
                lineType: newLineData.lineType,
                destinationType: newLineData.destinationType,
                itemId: newLineData.itemId,
                sku: newLineData.sku,
                itemDescription: newLineData.itemDescription,
                quantity: newLineData.quantity,
                uom: newLineData.uom,
                unitPrice: newLineData.unitPrice,
                currency: newLineData.currency,
                exchangeDate: newLineData.exchangeDate,
                rate: newLineData.rate || 1,
                needByDate: newLineData.needByDate,
                inventoryOrg: newLineData.inventoryOrg,
                subInventory: newLineData.subInventory || "", 
                buyer: newLineData.buyer,
                requester: newLineData.requester,
                serviceApprover: newLineData.serviceApprover,
                supplier: newLineData.supplier,
                qualityRequirement: newLineData.qualityRequirement,
                justification: newLineData.justification,
                buyerNotes: newLineData.buyerNotes,
                distributions: newLineData.distributions.map(d => ({
                  ...d,
                  id: d.id || Date.now() + Math.random(),
                  functionalAmount: (newLineData.unitPrice || 0) * d.quantity * (newLineData.rate || 1)
                }))
              };
              updateCartAndSave(prev => [...prev, newLine]);
              showToast('השורה נוספה לסל בהצלחה!');
            }}
          />
        )}
      </main>

      <NonCatalogModal 
        isOpen={isNonCatalogOpen}
        onClose={() => setIsNonCatalogOpen(false)}
        currentUser={currentUser}
        
        globalDestType={globalDestType} 
        globalSubInv={globalSubInv}
        globalProject={globalProject}
        globalTask={globalTask}
        globalExpType={globalExpType}
        globalExpOrg={globalExpOrg}
        
        onAddToCart={(data) => {
          addNonCatalogLine(data);
        }}
        onQuickOrder={(data) => {
          addNonCatalogLine(data);
          handleNavigate('checkout');
        }}
      />

      {/* --- באנר ה-Toast הגלובלי --- */}
      <div 
        className={`fixed bottom-6 left-6 z-[200] bg-gray-900 dark:bg-gray-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
      >
        <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <span className="font-bold text-sm">{toast.message}</span>
      </div>

      <WelcomeModal
        isOpen={showOrgPrompt}
        onSelectOrg={(org) => {
          handleSetGlobalOrg(org.id);
          setShowOrgPrompt(false);
          showToast(`ארגון ${org.name} הוגדר כברירת מחדל בהצלחה!`);
        }}
        organizations={data.inventoryOrganizations || []}
        userOrgs={currentUser?.organizations || []}
        currentUser={currentUser} 
      />

    </div>
  );
}

export default App;