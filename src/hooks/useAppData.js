import { useState, useEffect } from 'react';
import data from '../data/data.json';
import { validateBudgetForApproval } from '../utils/budgetValidation';

// ==========================================
// הגדרות קבועות: סטטוסים ופעולות מותרות (State Machine)
// ==========================================
export const REQ_STATUS = {
  INCOMPLETE: 'INCOMPLETE',
  IN_PROCESS: 'IN PROCESS',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED'
};

// אילו פעולות מותרות בכל סטטוס (המסכים ישתמשו בזה כדי להחליט אילו כפתורים להציג)
export const REQ_STATUS_ACTIONS = {
  'INCOMPLETE': ['view', 'edit', 'copy', 'delete'],
  'IN PROCESS': ['view', 'edit', 'copy', 'delete'],
  'REJECTED':   ['view', 'edit', 'copy', 'delete'],
  'APPROVED':   ['view', 'cancel', 'copy'],
  'RETURNED':   ['view', 'edit', 'cancel', 'copy'],
  'CANCELLED':  ['view', 'copy']
};

export const canDoAction = (status, action) => (REQ_STATUS_ACTIONS[status] || []).includes(action);

const REQ_NUMBER_BASE = 180000;

// --- פונקציות עזר טהורות (ללא סטייט) ---

// טעינת דרישות מה-LocalStorage + המרת סטטוס ישן 'Draft' ל-INCOMPLETE
const loadStoredRequisitions = () => {
  const stored = localStorage.getItem('appRequisitions');
  const list = stored ? JSON.parse(stored) : (data.requisitions || []);
  return list.map(r => (r.status === 'Draft' ? { ...r, status: REQ_STATUS.INCOMPLETE } : r));
};

const getNextRequisitionId = (list) => (list.length > 0 ? Math.max(...list.map(r => r.id)) + 1 : 1);

// בניית אובייקט דרישה מלא משורות העגלה (משמש גם לדרישה חדשה וגם לעדכון דרישה קיימת)
const buildRequisition = ({ id, requisitionNumber, creationDate, headerData, lines, status, routingSteps, creatorId }) => {
  const now = new Date().toISOString();

  const formattedLines = lines.map((line, lIndex) => {
    const lineId = id * 1000 + (lIndex + 1);
    const catalogItem = line.itemId ? data.catalogItems.find(i => String(i.id) === String(line.itemId)) : null;
    return {
      ...line, // שומרים את כל השדות (למשל foreignUnitPrice) כדי שלא ילכו לאיבוד בהעתקה/עריכה
      id: lineId,
      requisitionId: id,
      lineNumber: lIndex + 1,
      itemId: line.itemId ? Number(line.itemId) : null,
      sku: line.sku || catalogItem?.sku || 'פריט חופשי', // התיקון: המק"ט נשמר בדרישה
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      currency: line.currency || 'ILS',
      rate: Number(line.rate) || 1,
      inventoryOrg: line.inventoryOrg ? Number(line.inventoryOrg) : null,
      subInventory: line.subInventory || '',
      requester: line.requester ? Number(line.requester) : null,
      serviceApprover: line.serviceApprover ? Number(line.serviceApprover) : null,
      supplier: line.supplier ? Number(line.supplier) : null,
      distributions: (line.distributions || []).map((dist, dIndex) => ({
        ...dist,
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

  return {
    id,
    requisitionNumber: String(requisitionNumber),
    description: headerData?.description || '',
    header: headerData || {}, // שמירת כל נתוני הכותרת לצורך שחזור בעריכה
    creationDate: creationDate || now,
    lastUpdateDate: now,
    creatorId,
    total: formattedLines.reduce((sum, l) => sum + (l.unitPrice * l.quantity * l.rate), 0),
    status,
    routingSteps: routingSteps || [],
    lines: formattedLines
  };
};

// המרת שורת דרישה שמורה בחזרה לשורת עגלה (מזהים חדשים כדי למנוע התנגשויות)
const requisitionLineToCartLine = (line, idx) => {
  const newLineId = Date.now() + idx + Math.random();
  // eslint-disable-next-line no-unused-vars
  const { requisitionId, ...rest } = line;
  return {
    ...rest,
    id: newLineId,
    lineNumber: idx + 1,
    distributions: (line.distributions || []).map((dist, dIdx) => {
      // eslint-disable-next-line no-unused-vars
      const { requisitionLineId, ...distRest } = dist;
      return {
        ...distRest,
        id: newLineId + (dIdx + 1) / 1000,
        projectId: dist.projectId ?? '',
        taskId: dist.taskId ?? '',
        expenditureTypeId: dist.expenditureTypeId ?? '',
        expenditureOrgId: dist.expenditureOrgId ?? ''
      };
    })
  };
};

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
  const [requisitions, setRequisitions] = useState(loadStoredRequisitions);

  // ה-ID של הדרישה שנמצאת כרגע בעריכה בסל. null = סל של דרישה חדשה.
  const [editingRequisitionId, setEditingRequisitionIdState] = useState(null);

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

      // שחזור מצב עריכה (כדי שרענון דף לא יגרום לשמירה כדרישה כפולה)
      const storedEditing = JSON.parse(localStorage.getItem('appEditingRequisition')) || {};
      setEditingRequisitionIdState(storedEditing[currentUser.id] ?? null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const storedPrefs = JSON.parse(localStorage.getItem('appPreferences')) || {};
      const userPrefs = storedPrefs[currentUser.id] || {};
      const userFromData = data.users.find(u => String(u.id) === String(currentUser.id));
      const initialPrefs = userFromData?.preferences; 

      const isOldSave = !('defaultProject' in userPrefs);
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
  // 7. פעולות - עגלה (Cart)
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

  // שמירת מצב העריכה גם ב-LocalStorage (לכל משתמש בנפרד)
  const setEditingRequisitionId = (reqId) => {
    setEditingRequisitionIdState(reqId);
    if (currentUser) {
      const stored = JSON.parse(localStorage.getItem('appEditingRequisition')) || {};
      stored[currentUser.id] = reqId;
      localStorage.setItem('appEditingRequisition', JSON.stringify(stored));
    }
  };

  const updateLineQty = (lineId, newQty) => {
    updateCartAndSave(prev => {
      if (newQty === 0) return prev.filter(line => line.id !== lineId);
      return prev.map(line => {
        if (line.id !== lineId) return line;
        const updatedLine = { ...line, quantity: newQty };
        if (updatedLine.distributions && updatedLine.distributions.length === 1) {
          updatedLine.distributions = [{
            ...updatedLine.distributions[0],
            quantity: newQty,
            functionalAmount: newQty * (updatedLine.unitPrice || 0) * (updatedLine.distributions[0].rate || 1)
          }];
        }
        return updatedLine;
      });
    });
  };

  // ריקון הסל ויציאה ממצב עריכה
  const clearCart = () => {
    updateCartAndSave([]);
    setEditingRequisitionId(null);
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

  // שורה שנוספה מתוך מסך ה-Checkout (הוספה מהירה) - כולל חישוב סכום לכל שורת חלוקה
  const addCheckoutLine = (newLineData) => {
    const rate = newLineData.rate || 1;
    const newLine = {
      ...newLineData,
      id: Date.now(),
      subInventory: newLineData.subInventory || "",
      rate,
      distributions: (newLineData.distributions || []).map(d => ({
        ...d,
        id: d.id || Date.now() + Math.random(),
        functionalAmount: (newLineData.unitPrice || 0) * d.quantity * rate
      }))
    };
    updateCartAndSave(prev => [...prev, { ...newLine, lineNumber: prev.length + 1 }]);
    showToast('השורה נוספה לסל בהצלחה!');
  };

  // ==========================================
  // 8. פעולות - ניהול דרישות (My Requisitions)
  // ==========================================

  // שמירת רשימת הדרישות לסטייט ול-LocalStorage בפעולה אחת
  const persistRequisitions = (list) => {
    setRequisitions(list);
    localStorage.setItem('appRequisitions', JSON.stringify(list));
  };

  // הדרישות של המשתמש המחובר בלבד (מהחדשה לישנה)
  const myRequisitions = currentUser
    ? requisitions
        .filter(r => String(r.creatorId) === String(currentUser.id))
        .sort((a, b) => new Date(b.lastUpdateDate || b.creationDate) - new Date(a.lastUpdateDate || a.creationDate))
    : [];

  // הדרישה שבעריכה כרגע (למשל כדי להציג את המספר והתיאור שלה ב-Checkout)
  const editingRequisition = editingRequisitionId
    ? requisitions.find(r => r.id === editingRequisitionId) || null
    : null;

  // מספר הדרישה שיוצג בכותרת ה-Checkout: המספר הקיים בעריכה, או המספר הבא בתור
  const nextRequisitionNumber = editingRequisition
    ? editingRequisition.requisitionNumber
    : String(REQ_NUMBER_BASE + getNextRequisitionId(requisitions) - 1);

  // הוספה או עדכון של דרישה בתוך רשימה (פונקציה טהורה - מחזירה רשימה חדשה ואת הדרישה)
  const upsertRequisition = (list, { targetId, headerData, lines, status, routingSteps }) => {
    const existing = targetId ? list.find(r => r.id === targetId) : null;

    if (existing) {
      const updatedReq = buildRequisition({
        id: existing.id,
        requisitionNumber: existing.requisitionNumber,
        creationDate: existing.creationDate,
        creatorId: existing.creatorId,
        headerData, lines, status, routingSteps
      });
      return { list: list.map(r => (r.id === existing.id ? updatedReq : r)), requisition: updatedReq };
    }

    const newId = getNextRequisitionId(list);
    const newReq = buildRequisition({
      id: newId,
      requisitionNumber: REQ_NUMBER_BASE + newId - 1,
      creatorId: currentUser.id,
      headerData, lines, status, routingSteps
    });
    return { list: [newReq, ...list], requisition: newReq };
  };

  // שמירת הסל הנוכחי כטיוטה (פונקציה טהורה, משמשת את פעולות העריכה וההעתקה)
  const saveCartAsDraftInList = (list) => {
    if (cartLines.length === 0) return list;
    const existingHeader = editingRequisition?.header;
    return upsertRequisition(list, {
      targetId: editingRequisitionId,
      headerData: existingHeader || { description: 'טיוטה שנשמרה אוטומטית' },
      lines: cartLines,
      status: REQ_STATUS.INCOMPLETE,
      routingSteps: []
    }).list;
  };

  // שליחה/שמירה מתוך ה-Checkout: יוצר דרישה חדשה, או מעדכן את הדרישה שבעריכה
  const handleCheckoutSubmit = (headerData, finalLines, emptyCart, routingSteps = [], status = REQ_STATUS.INCOMPLETE) => {
    // הגנה נוספת: אין העברה לסבב אישורים בלי סעיף תקציבי מלא בכל שורות החלוקה
    if (status === REQ_STATUS.IN_PROCESS && validateBudgetForApproval(finalLines).length > 0) {
      showToast('לא ניתן להעביר לסבב: חסר סעיף תקציבי בחלק משורות החלוקה');
      return false;
    }
    const { list, requisition } = upsertRequisition(requisitions, {
      targetId: editingRequisitionId,
      headerData, lines: finalLines, status, routingSteps
    });
    persistRequisitions(list);

    if (emptyCart) {
      clearCart();
    } else {
      // הסל נשאר - ממשיכים "לערוך" את אותה דרישה, כך ששמירה נוספת תעדכן אותה ולא תיצור כפילות
      updateCartAndSave(finalLines);
      setEditingRequisitionId(requisition.id);
    }

    if (status === REQ_STATUS.IN_PROCESS) handleNavigate('success', requisition);
    else handleNavigate('home');
  };

  // מחיקת דרישה (רק בסטטוסים המותרים)
  const deleteRequisition = (reqId) => {
    const req = requisitions.find(r => r.id === reqId);
    if (!req || !canDoAction(req.status, 'delete')) {
      showToast('לא ניתן למחוק דרישה בסטטוס הנוכחי');
      return false;
    }
    persistRequisitions(requisitions.filter(r => r.id !== reqId));
    // אם מחקנו את הדרישה שבעריכה - הסל הופך לסל של דרישה חדשה
    if (editingRequisitionId === reqId) setEditingRequisitionId(null);
    showToast(`דרישה ${req.requisitionNumber} נמחקה בהצלחה`);
    return true;
  };

  // ביטול דרישה (רק APPROVED / RETURNED)
  const cancelRequisition = (reqId) => {
    const req = requisitions.find(r => r.id === reqId);
    if (!req || !canDoAction(req.status, 'cancel')) {
      showToast('לא ניתן לבטל דרישה בסטטוס הנוכחי');
      return false;
    }
    persistRequisitions(requisitions.map(r =>
      r.id === reqId ? { ...r, status: REQ_STATUS.CANCELLED, lastUpdateDate: new Date().toISOString() } : r
    ));
    showToast(`דרישה ${req.requisitionNumber} בוטלה`);
    return true;
  };

  // עריכת דרישה: טוען אותה לסל ומעביר ל-Checkout.
  // saveCartFirst = true -> הסל הנוכחי נשמר קודם כטיוטה. false -> הסל הנוכחי נדרס.
  const startEditRequisition = (reqId, { saveCartFirst = false } = {}) => {
    const target = requisitions.find(r => r.id === reqId);
    if (!target || !canDoAction(target.status, 'edit')) {
      showToast('לא ניתן לערוך דרישה בסטטוס הנוכחי');
      return false;
    }

    let list = requisitions;
    if (saveCartFirst && editingRequisitionId !== reqId) {
      list = saveCartAsDraftInList(list);
    }

    // דרישה בסבב אישורים נמשכת חזרה לטיוטה וסבב האישורים מתאפס
    if (target.status === REQ_STATUS.IN_PROCESS) {
      list = list.map(r => r.id === reqId
        ? { ...r, status: REQ_STATUS.INCOMPLETE, routingSteps: [], lastUpdateDate: new Date().toISOString() }
        : r
      );
    }
    persistRequisitions(list);

    updateCartAndSave(target.lines.map(requisitionLineToCartLine));
    setEditingRequisitionId(reqId);
    showToast(saveCartFirst ? 'הסל הקודם נשמר כטיוטה, והדרישה נטענה לעריכה' : `דרישה ${target.requisitionNumber} נטענה לעריכה`);
    handleNavigate('checkout');
    return true;
  };

  // העתקת דרישה לסל (תמיד יוצרת דרישה חדשה בהמשך, המקור לא משתנה).
  // mode: 'overwrite' (דריסת הסל) | 'merge' (הוספה לסל הקיים) | 'saveDraft' (שמירת הסל כטיוטה ואז העתקה)
  const copyRequisitionToCart = (reqId, mode = 'overwrite') => {
    const source = requisitions.find(r => r.id === reqId);
    if (!source) return false;

    const copiedLines = source.lines.map(requisitionLineToCartLine);

    if (mode === 'merge') {
      updateCartAndSave(prev => [...prev, ...copiedLines].map((l, i) => ({ ...l, lineNumber: i + 1 })));
      showToast('שורות הדרישה נוספו לסל הקיים');
    } else {
      if (mode === 'saveDraft') {
        persistRequisitions(saveCartAsDraftInList(requisitions));
      }
      updateCartAndSave(copiedLines);
      setEditingRequisitionId(null); // עותק = דרישה חדשה
      showToast(mode === 'saveDraft' ? 'הסל הקודם נשמר כטיוטה, והדרישה הועתקה לסל' : 'הדרישה הועתקה לסל');
    }

    handleNavigate('checkout');
    return true;
  };

  const resetAppData = () => {
    setCartLines([]);
    setFavoriteItems([]);
    setFavoriteNonCatalogItems([]);
    setEditingRequisitionIdState(null); // רק בזיכרון - מצב העריכה השמור נשאר לכניסה הבאה
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
    updateCartAndSave,
    updateLineQty,
    clearCart,
    addNewLine,
    handleAddToCartItem,
    handleQuickOrderItem,
    addNonCatalogLine,
    handleQuickOrderNonCatalog,
    addCheckoutLine,
    requisitions,
    myRequisitions,
    editingRequisitionId,
    editingRequisition,
    nextRequisitionNumber,
    handleCheckoutSubmit,
    deleteRequisition,
    cancelRequisition,
    startEditRequisition,
    copyRequisitionToCart,
    resetAppData
  };
}
