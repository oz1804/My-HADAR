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
import Checkout from './components/Checkout';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('home'); 
  const [viewPayload, setViewPayload] = useState(null);
  
  // ניהול ארגון מלאי גלובלי (Session Context)
  const [globalOrg, setGlobalOrg] = useState(1); 

  const [cartLines, setCartLines] = useState([]);

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home'); 
    setViewPayload(null);
    setCartLines([]); 
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

  const addNewLine = (itemId) => {
    const catalogItem = data.catalogItems.find(i => String(i.id) === String(itemId));
    
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const defaultDate = d.toISOString().split('T')[0];
    const price = catalogItem.price || 0;

    const newLine = {
      id: Date.now(),
      lineNumber: cartLines.length + 1,
      lineType: "טובין",
      destinationType: "Inventory", 
      itemId: catalogItem.id,
      sku: catalogItem.sku,
      itemDescription: catalogItem.description,
      quantity: 1,
      uom: catalogItem.uom || "EA",
      unitPrice: price,
      needByDate: defaultDate, 
      inventoryOrg: globalOrg, // שימוש בארגון הגלובלי
      buyer: "",
      serviceApprover: "",
      qualityRequirement: "לא נדרשת ביקורת",
      justification: "",
      buyerNotes: "",
      distributions: [
        {
          id: Date.now() + 1, 
          quantity: 1, 
          percentage: 100, 
          currency: 'ILS', 
          exchangeDate: '', 
          rate: 1, 
          functionalAmount: price,
          projectId: '', 
          taskId: '', 
          expenditureTypeId: '', 
          expenditureOrgId: '' 
        }
      ]
    };
    
    updateCartAndSave(prev => [...prev, newLine]);
  };

  const handleCheckoutSubmit = (headerData, finalLines, emptyCart) => {
    console.log("הדרישה נשמרת/נשלחת:", { headerData, finalLines });
    alert("הדרישה עברה ולידציה ונשמרה בהצלחה! (ראה קונסול לנתונים המלאים)");
    
    if (emptyCart) {
      updateCartAndSave([]); 
      handleNavigate('home');
    } else {
      updateCartAndSave(finalLines); 
    }
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
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300" dir="rtl">
      
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
        onNavigate={handleNavigate}
        cartLines={cartLines} 
        onUpdateQty={updateLineQty}
        globalOrg={globalOrg}
        setGlobalOrg={setGlobalOrg}
      />
      
      <main className="p-6 max-w-7xl mx-auto">
        {currentView === 'home' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 mt-6">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-4 border-gray-100 dark:border-gray-700">לוח בקרה</h2>
            <p className="text-lg">התחברת בהצלחה בתור <strong dir="ltr">{currentUser.username}</strong>!</p>
          </div>
        )}
        {currentView === 'requisitions' && <MyRequisitions onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'user-guide' && <UserGuide onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'faq' && <FAQ onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'proc-docs' && <ProcDocs onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'preferred-approvers' && <PreferredApprovers onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'favorite-items' && <FavoriteItems onBackToHome={() => handleNavigate('home')} />}
        {currentView === 'search-results' && <SearchResults query={viewPayload} onBackToHome={() => handleNavigate('home')} />}
        
        {currentView === 'item-details' && (
          <ItemDetails 
            itemId={viewPayload} 
            onBack={() => handleNavigate('home')} 
            cartLines={cartLines}
            onUpdateQty={updateLineQty}
            onAddNewLine={addNewLine}
          />
        )}

        {currentView === 'checkout' && (
          <Checkout 
            cartLines={cartLines}
            currentUser={currentUser}
            globalOrg={globalOrg}
            onBack={() => handleNavigate('home')}
            onSubmit={handleCheckoutSubmit}
            onRemoveFromCart={(id) => updateLineQty(id, 0)} /* התווסף: מעדכן את העגלה הראשית שמסירים את השורה */
          />
        )}
      </main>
    </div>
  );
}

export default App;