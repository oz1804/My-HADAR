import { useState, useEffect } from 'react';
import data from '../data/data.json';

export function useAppData(currentUser, showToast, handleNavigate, setShowOrgPrompt) {
  
  // ==========================================
  // 1. סטייטים גלובליים (העדפות)
  // ==========================================
  const [globalOrg, setGlobalOrg] = useState(''); 
  const [globalDestType, setGlobalDestType] = useState('Expense');
  const [globalSubInv, setGlobalSubInv] = useState(''); 
  const [globalProject, setGlobalProject] = useState('');
  const [globalTask, setGlobalTask] = useState('');
  const [globalExpType, setGlobalExpType] = useState('');
  const [globalExpOrg, setGlobalExpOrg] = useState('');

  // ==========================================
  // 2. פריטים מועדפים
  // ==========================================
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [favoriteNonCatalogItems, setFavoriteNonCatalogItems] = useState([]);

  // ==========================================
  // 3. עגלת קניות ודרישות
  // ==========================================
  const [cartLines, setCartLines] = useState([]);
  const [requisitions, setRequisitions] = useState(() => {
    const stored = localStorage.getItem('appRequisitions');
    return stored ? JSON.parse(stored) : (data.requisitions || []);
  });

  // ==========================================
  // 4. Effects: טעינת נתונים
  // ==========================================
  useEffect(() => {
    if (currentUser) {
      const storedCarts = JSON.parse(localStorage.getItem('appCarts')) || {};
      if (storedCarts[currentUser.id]) {
        setCartLines(storedCarts[currentUser.id]);
      } else {
        const userFromData = data.users.find(u => String(u.id) === String(currentUser.id) || u.username === currentUser.username);
        setCartLines((userFromData && userFromData.cart) ? userFromData.cart : []);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
      const userPrefs = storedPrefs[currentUser.id] || {};
      const userFromData = data.users.find(u => String(u.id) === String(currentUser.id));
      const initialPrefs = userFromData?.preferences; 

      const isOldSave = !userPrefs.hasOwnProperty('defaultProject');
      const hasNoLocalPrefs = Object.keys(userPrefs).length === 0;

      let activeOrg = userPrefs.defaultOrg || '';
      let activeDest = userPrefs.defaultDest || 'Expense';
      let activeSubInv = userPrefs.defaultSubInv || '';
      let activeProject = userPrefs.defaultProject || '';
      let activeTask = userPrefs.defaultTask || '';
      let activeExpType = userPrefs.defaultExpType || '';
      let activeExpOrg = userPrefs.defaultExpOrg || '';

      if ((hasNoLocalPrefs || isOldSave) && initialPrefs) {
        activeOrg = activeOrg || initialPrefs.defaultOrg || '';
        activeDest = activeDest || initialPrefs.defaultDest || 'Expense';
        activeSubInv = activeSubInv || initialPrefs.defaultSubInv || '';
        activeProject = activeProject || initialPrefs.defaultProject || '';
        activeTask = activeTask || initialPrefs.defaultTask || '';
        activeExpType = activeExpType || initialPrefs.defaultExpType || '';
        activeExpOrg = activeExpOrg || initialPrefs.defaultExpOrg || '';
      }

      setGlobalOrg(activeOrg);
      setGlobalDestType(activeDest);
      setGlobalSubInv(activeSubInv);
      setGlobalProject(activeProject);
      setGlobalTask(activeTask);
      setGlobalExpType(activeExpType);
      setGlobalExpOrg(activeExpOrg);

      setFavoriteItems(userPrefs.favoriteItems || []);
      setFavoriteNonCatalogItems(userPrefs.favoriteNonCatalogItems || []);

      if (activeOrg === '') {
        setTimeout(() => setShowOrgPrompt(true), 300);
      } else {
        setShowOrgPrompt(false);
      }

      storedPrefs[currentUser.id] = {
        ...(storedPrefs[currentUser.id] || {}),
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
  }, [currentUser, setShowOrgPrompt]);

  // ==========================================
  // 5. פעולות - העדפות משתמש
  // ==========================================
  const updateUserPref = (key, value) => {
    if (!currentUser) return;
    const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
    storedPrefs[currentUser.id] = {
      ...storedPrefs[currentUser.id],
      [key]: value
    };
    localStorage.setItem('appPreferences', JSON.stringify(storedPrefs));
  };

  const handleSetGlobalOrg = (v) => { setGlobalOrg(v); updateUserPref('defaultOrg', v); };
  const handleSetGlobalDestType = (v) => { setGlobalDestType(v); updateUserPref('defaultDest', v); };
  const handleSetGlobalSubInv = (v) => { setGlobalSubInv(v); updateUserPref('defaultSubInv', v); };
  const handleSetGlobalProject = (v) => { setGlobalProject(v); updateUserPref('defaultProject', v); };
  const handleSetGlobalTask = (v) => { setGlobalTask(v); updateUserPref('defaultTask', v); };
  const handleSetGlobalExpType = (v) => { setGlobalExpType(v); updateUserPref('defaultExpType', v); };
  const handleSetGlobalExpOrg = (v) => { setGlobalExpOrg(v); updateUserPref('defaultExpOrg', v); };

  // ==========================================
  // 6. פעולות - מועדפים
  // ==========================================
  const toggleFavorite = (itemId) => {
    if (!currentUser) return;
    setFavoriteItems(prev => {
      let newFavorites;
      if (prev.includes(itemId)) {
        newFavorites = prev.filter(id => id !== itemId);
        showToast('הפריט הוסר מהמועדפים');
      } else {
        newFavorites = [...prev, itemId];
        showToast('הפריט נוסף למועדפים בהצלחה!');
      }
      const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
      storedPrefs[currentUser.id] = { ...(storedPrefs[currentUser.id] || {}), favoriteItems: newFavorites };
      localStorage.setItem('appPreferences', JSON.stringify(storedPrefs));
      return newFavorites;
    });
  };

  const handleSaveNonCatalogFavorite = (itemData) => {
    if (!currentUser) return;
    setFavoriteNonCatalogItems(prev => {
      const newFavs = [...prev, itemData];
      const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
      storedPrefs[currentUser.id] = { ...(storedPrefs[currentUser.id] || {}), favoriteNonCatalogItems: newFavs };
      localStorage.setItem('appPreferences', JSON.stringify(storedPrefs));
      return newFavs;
    });
    showToast('תבנית פריט חופשי נשמרה במועדפים בהצלחה!');
  };

  const handleRemoveNonCatalogFavorite = (itemId) => {
    if (!currentUser) return;
    setFavoriteNonCatalogItems(prev => {
      const newFavs = prev.filter(item => item.id !== itemId);
      const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
      storedPrefs[currentUser.id] = { ...(storedPrefs[currentUser.id] || {}), favoriteNonCatalogItems: newFavs };
      localStorage.setItem('appPreferences', JSON.stringify(storedPrefs));
      return newFavs;
    });
    showToast('הפריט החופשי הוסר מהמועדפים');
  };

  // ==========================================
  // 7. פעולות - עגלה ורכש
  // ==========================================
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
      if (newQty === 0) return prev.filter(line => line.id !== lineId);
      return prev.map(line => {
        if (line.id !== lineId) return line;
        const updatedLine = { ...line, quantity: newQty };
        if (updatedLine.distributions && updatedLine.distributions.length === 1) {
          updatedLine.distributions[0].quantity = newQty;
          updatedLine.distributions[0].functionalAmount = newQty * (updatedLine.unitPrice || 0) * (updatedLine.distributions[0].rate || 1);
        }
        return updatedLine;
      });
    });
  };

  const addNewLine = (itemId, initialQty = 1, customDate = null) => {
    const catalogItem = data.catalogItems.find(i => String(i.id) === String(itemId));
    const d = new Date(); d.setMonth(d.getMonth() + 1);
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
      needByDate: customDate || d.toISOString().split('T')[0], 
      inventoryOrg: globalDestType === 'Expense' ? null : (globalOrg || ""), 
      subInventory: globalDestType === 'Expense' ? "" : globalSubInv, 
      buyer: "",
      serviceApprover: "",
      qualityRequirement: "לא נדרשת ביקורת",
      justification: "",
      buyerNotes: "",
      distributions: [{
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
      }]
    };
    updateCartAndSave(prev => [...prev, newLine]);
    showToast('הפריט נוסף לסל בהצלחה!');
  };

  const handleAddToCartItem = (itemId, quantity) => {
    const existingLine = cartLines.find(line => String(line.itemId) === String(itemId));
    if (existingLine) {
      updateLineQty(existingLine.id, existingLine.quantity + quantity);
      showToast('כמות הפריט עודכנה בסל בהצלחה!');
    } else {
      addNewLine(itemId, quantity); 
    }
  };

  const handleQuickOrderItem = (itemId, quantity) => {
    handleAddToCartItem(itemId, quantity);
    handleNavigate('checkout');
  };

  const addNonCatalogLine = (lineData) => {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
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
      needByDate: d.toISOString().split('T')[0], 
      inventoryOrg: lineData.inventoryOrg || (lineData.lineType === 'שירות' ? null : (globalOrg || "")), 
      subInventory: lineData.subInventory || "", 
      buyer: lineData.buyer || "",
      requester: lineData.requester || currentUser.id,
      serviceApprover: lineData.serviceApprover || "",
      qualityRequirement: "לא נדרשת ביקורת",
      justification: "",
      buyerNotes: "",
      distributions: [{
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
      }]
    };
    updateCartAndSave(prev => [...prev, newLine]);
    showToast('פריט חופשי נוסף לסל בהצלחה!');
  };

  const handleQuickOrderNonCatalog = (lineData) => {
    addNonCatalogLine(lineData);
    handleNavigate('checkout');
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
          if (emptyCart) updateCartAndSave([]); 
          else updateCartAndSave(finalLines);
          
          if (status === 'IN PROCESS') handleNavigate('success', newRequisition);
          else handleNavigate('home');
      }, 0);

      return updatedList;
    });
  };

  const resetAppData = () => {
    setCartLines([]);
    setFavoriteItems([]);
    setFavoriteNonCatalogItems([]);
    setGlobalOrg('');
    setGlobalDestType('Expense');
    setGlobalSubInv('');
    setGlobalProject('');
    setGlobalTask('');
    setGlobalExpType('');
    setGlobalExpOrg('');
  };

  // מחזירים את כל הסטייטים והפונקציות כדי שה-App יוכל להשתמש בהם
  return {
    globalOrg, handleSetGlobalOrg,
    globalDestType, handleSetGlobalDestType,
    globalSubInv, handleSetGlobalSubInv,
    globalProject, handleSetGlobalProject,
    globalTask, handleSetGlobalTask,
    globalExpType, handleSetGlobalExpType,
    globalExpOrg, handleSetGlobalExpOrg,
    favoriteItems,
    favoriteNonCatalogItems,
    toggleFavorite,
    handleSaveNonCatalogFavorite,
    handleRemoveNonCatalogFavorite,
    cartLines,
    updateLineQty,
    addNewLine,
    handleAddToCartItem,
    handleQuickOrderItem,
    addNonCatalogLine,
    handleQuickOrderNonCatalog,
    requisitions,
    handleCheckoutSubmit,
    resetAppData
  };
}