import React, { useState, useEffect } from 'react';
import './index.css';
import data from './data/data.json';
import { useAppData } from './hooks/useAppData'; // <-- ייבוא ה-Hook שיצרנו

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
  // סטייטים של תצוגה בלבד
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('home'); 
  const [viewPayload, setViewPayload] = useState(null);
  const [isNonCatalogOpen, setIsNonCatalogOpen] = useState(false);
  const [showOrgPrompt, setShowOrgPrompt] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleNavigate = (view, payload = null) => {
    setCurrentView(view);
    setViewPayload(payload);
  };

  // "שואבים" את כל הלוגיקה העסקית מה-Hook שלנו!
  const appData = useAppData(currentUser, showToast, handleNavigate, setShowOrgPrompt);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home'); 
    setViewPayload(null);
    setShowOrgPrompt(false);
    appData.resetAppData(); // מנקה את הנתונים ב-Hook
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
        cartLines={appData.cartLines} 
        onUpdateQty={appData.updateLineQty}
        
        globalOrg={appData.globalOrg} setGlobalOrg={appData.handleSetGlobalOrg} 
        globalDestType={appData.globalDestType} setGlobalDestType={appData.handleSetGlobalDestType} 
        globalSubInv={appData.globalSubInv} setGlobalSubInv={appData.handleSetGlobalSubInv} 
        globalProject={appData.globalProject} setGlobalProject={appData.handleSetGlobalProject}
        globalTask={appData.globalTask} setGlobalTask={appData.handleSetGlobalTask}
        globalExpType={appData.globalExpType} setGlobalExpType={appData.handleSetGlobalExpType}
        globalExpOrg={appData.globalExpOrg} setGlobalExpOrg={appData.handleSetGlobalExpOrg}
        
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
        
        {currentView === 'preferred-approvers' && (
          <PreferredApprovers currentUser={currentUser} showToast={showToast} onBackToHome={() => handleNavigate('home')} />
        )}
        
        {currentView === 'favorite-items' && (
          <FavoriteItems 
            favoriteItems={appData.favoriteItems}
            favoriteNonCatalogItems={appData.favoriteNonCatalogItems}
            toggleFavorite={appData.toggleFavorite}
            onRemoveNonCatalogFavorite={appData.handleRemoveNonCatalogFavorite}
            onAddToCart={appData.handleAddToCartItem}
            onAddNonCatalogToCart={appData.addNonCatalogLine}
            onQuickOrder={appData.handleQuickOrderItem}
            onQuickOrderNonCatalog={appData.handleQuickOrderNonCatalog}
            onNavigate={handleNavigate}
            onBackToHome={() => handleNavigate('home')} 
          />
        )}
        
        {currentView === 'search-results' && (
          <SearchResults 
            query={viewPayload} 
            favoriteItems={appData.favoriteItems}
            toggleFavorite={appData.toggleFavorite}
            onAddToCart={appData.handleAddToCartItem}
            onQuickOrder={appData.handleQuickOrderItem}
            onNavigate={handleNavigate}
            onBackToHome={() => handleNavigate('home')} 
          />
        )}
        
        {currentView === 'item-details' && (
          <ItemDetails 
            itemId={viewPayload} 
            favoriteItems={appData.favoriteItems}
            toggleFavorite={appData.toggleFavorite}
            cartLines={appData.cartLines}
            onUpdateQty={appData.updateLineQty}
            onAddNewLine={appData.addNewLine}
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('home')} 
          />
        )}

        {currentView === 'checkout' && (
          <Checkout 
            cartLines={appData.cartLines}
            currentUser={currentUser}
            globalOrg={appData.globalOrg}
            globalDestType={appData.globalDestType} 
            globalSubInv={appData.globalSubInv} 
            globalProject={appData.globalProject}
            globalTask={appData.globalTask}
            globalExpType={appData.globalExpType}
            globalExpOrg={appData.globalExpOrg}
            onBack={() => handleNavigate('home')}
            onSubmit={appData.handleCheckoutSubmit}
            onRemoveFromCart={(id) => appData.updateLineQty(id, 0)} 
            nextRequisitionNumber={String(180000 + (appData.requisitions.length > 0 ? Math.max(...appData.requisitions.map(r => r.id)) : 0))}
            onAddLineToCart={(newLineData) => {
              const newLine = {
                id: Date.now(),
                lineNumber: appData.cartLines.length + 1,
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
              appData.updateCartAndSave(prev => [...prev, newLine]);
              showToast('השורה נוספה לסל בהצלחה!');
            }}
          />
        )}
      </main>

      <NonCatalogModal 
        isOpen={isNonCatalogOpen}
        onClose={() => setIsNonCatalogOpen(false)}
        currentUser={currentUser}
        globalDestType={appData.globalDestType} 
        globalSubInv={appData.globalSubInv}
        globalProject={appData.globalProject}
        globalTask={appData.globalTask}
        globalExpType={appData.globalExpType}
        globalExpOrg={appData.globalExpOrg}
        onAddToCart={appData.addNonCatalogLine}
        onQuickOrder={appData.handleQuickOrderNonCatalog}
        onSaveFavorite={appData.handleSaveNonCatalogFavorite}
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
          appData.handleSetGlobalOrg(org.id);
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