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

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('home'); 
  const [viewPayload, setViewPayload] = useState(null);
  
  const [globalOrg, setGlobalOrg] = useState(1); 
  const [cartLines, setCartLines] = useState([]);
  
  const [requisitions, setRequisitions] = useState(() => {
    const stored = localStorage.getItem('appRequisitions');
    return stored ? JSON.parse(stored) : (data.requisitions || []);
  });

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
      inventoryOrg: globalOrg, 
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
      
      console.log("====== REQUISITION SAVED SUCCESSFULLY ======");
      console.log(JSON.stringify(newRequisition, null, 2));
      console.log("============================================");
      
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
      // אם הפריט כבר קיים בסל, מעדכנים כמות. אם לא, מוסיפים שורה חדשה.
      const exists = cartLines.find(l => String(l.itemId) === String(itemId));
      if (exists) {
        updateLineQty(exists.id, exists.quantity + quantity);
      } else {
        addNewLine(itemId); // הפונקציה הקיימת שלך ב-App.jsx שמטפלת בהוספה
      }
      alert("הפריט נוסף לסל בהצלחה!"); // או הודעת Toast נחמדה
    }}
    onQuickOrder={(itemId, quantity) => {
      const exists = cartLines.find(l => String(l.itemId) === String(itemId));
      if (exists) {
        updateLineQty(exists.id, exists.quantity + quantity);
      } else {
        addNewLine(itemId);
      }
      handleNavigate('checkout'); // מעביר ישירות לקופה
    }}
    favoriteItems={[]} // בהמשך נוכל לחבר פה את ה-State של המועדפים
  />
)}
        
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
            onRemoveFromCart={(id) => updateLineQty(id, 0)} 
            nextRequisitionNumber={String(180000 + (requisitions.length > 0 ? Math.max(...requisitions.map(r => r.id)) : 0))}
          />
        )}
      </main>
    </div>
  );
}

export default App;