import { useState, useEffect } from 'react';
import data from '../data/data.json';
import { validateCheckout, runScreen } from '../utils/validationEngine';
import { routingContext } from '../utils/validationScreens';
import { loadValidationRulesSync } from '../services/validationService';
import { isReqLineOnPo, requisitionHasPo } from '../utils/purchaseOrders';
import { reserveFunds, releaseFunds, fundsFailureMessage } from '../services/fundsService';
import { applyDecision, getActionableSteps, stepRoleLabel } from '../utils/approvalEngine';
import { makeAction, appendActions } from '../utils/actionHistory';

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

// ==========================================
// דרישה שאושרה והוחזרה מקניין (כמו ב-EBS):
// - השורות שאושרו נעולות: אי אפשר לערוך אותן, רק לבטל שורה שלא מקושרת להזמנה
// - אפשר להוסיף שורות חדשות, והדרישה כולה עוברת סבב אישורים מחדש
// - דרישה כזו לא נמחקת בשום סטטוס (גם אם הסבב החדש נדחה או נמשך)
// ==========================================
const APPROVED_STATUSES = ['APPROVED', 'RETURNED'];
export const isLineApproved = (req, line) =>
  !!line && (line.approvedFlag === 'Y' || (APPROVED_STATUSES.includes(req?.status) && line.approvedFlag !== 'N'));
export const hasApprovedLines = (req) => (req?.lines || []).some(l => isLineApproved(req, l));
// השורות הנעולות שמוצגות בסל לקריאה בלבד (מאושרות ולא מבוטלות)
export const lockedLinesOf = (req) => (req?.lines || []).filter(l => isLineApproved(req, l) && !isLineCancelled(l));

const unapprovedLineIds = (req) => (req?.lines || []).filter(l => !isLineApproved(req, l)).map(l => l.id);
// סטטוס לשמירה בלי שליחה: דרישה שאושרה נשארת בסטטוס שלה, אחרת טיוטה
const draftStatusFor = (req) => (isAmendment(req) && req.status !== REQ_STATUS.IN_PROCESS ? req.status : REQ_STATUS.INCOMPLETE);

// הפעולות המותרות לדרישה מסוימת: לפי הסטטוס, ובדרישה שאושרה - בלי מחיקה, ועם ביטול גם אחרי דחייה
export const getRequisitionActions = (req) => {
  const base = REQ_STATUS_ACTIONS[req?.status] || [];
  if (!hasApprovedLines(req)) return base;
  const actions = base.filter(a => a !== 'delete');
  return req.status === REQ_STATUS.REJECTED ? [...actions, 'cancel'] : actions;
};
// אפשר להעביר דרישה (עדיף) או סטטוס
export const canDoAction = (reqOrStatus, action) =>
  (typeof reqOrStatus === 'object' && reqOrStatus !== null ? getRequisitionActions(reqOrStatus) : (REQ_STATUS_ACTIONS[reqOrStatus] || [])).includes(action);
// "עריכה" של דרישה שאושרה היא הוספת שורות
export const isAmendment = (req) => hasApprovedLines(req);

// ==========================================
// ביטול דרישה / שורת דרישה (כמו ב-EBS):
// - דרישה שאחת מהשורות שלה מקושרת להזמנה - אי אפשר לבטל
// - שורה בודדת - אפשר לבטל רק אם אין לה הזמנה
// - ביטול השורה הפעילה האחרונה מבטל את הדרישה כולה
// ==========================================
export const isLineCancelled = (line) => line?.cancelFlag === 'Y';
export const activeLines = (req) => (req?.lines || []).filter(l => !isLineCancelled(l));

export const canCancelRequisition = (req) => !!req && canDoAction(req, 'cancel') && !requisitionHasPo(req);
export const canCancelRequisitionLine = (req, line) =>
  !!req && !!line && canDoAction(req, 'cancel') && !isLineCancelled(line) && !isReqLineOnPo(req, line);

// סכום הדרישה: שורות פעילות בלבד. בדרישה שכל שורותיה בוטלו - הסכום המקורי (לתיעוד)
const lineAmount = (l) => (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0) * (Number(l.rate) || 1);
export const computeRequisitionTotal = (lines = []) => {
  const active = lines.filter(l => !isLineCancelled(l));
  return (active.length ? active : lines).reduce((sum, l) => sum + lineAmount(l), 0);
};

const REQ_NUMBER_BASE = 180000;

// --- פונקציות עזר טהורות (ללא סטייט) ---

// הרכבת הדרישות מהטבלאות הנפרדות ב-data.json (כותרת / שורות / חלוקות) למבנה המקונן שהמערכת עובדת איתו
const buildSeedRequisitions = () => {
  const distsByLine = {};
  (data.requisitionDistributions || []).forEach(d => {
    (distsByLine[d.requisitionLineId] = distsByLine[d.requisitionLineId] || []).push(d);
  });
  const linesByReq = {};
  (data.requisitionLines || []).forEach(l => {
    (linesByReq[l.requisitionId] = linesByReq[l.requisitionId] || []).push({ ...l, distributions: distsByLine[l.id] || [] });
  });
  return (data.requisitions || []).map(r => ({
    ...r,
    header: { description: r.description, justification: r.justification || '', buyerNotes: r.buyerNotes || '' },
    // דרישה שאושרה (או הוחזרה מקניין אחרי אישור) - כל השורות שלה מאושרות
    lines: (linesByReq[r.id] || []).sort((a, b) => a.lineNumber - b.lineNumber)
      .map(l => (APPROVED_STATUSES.includes(r.status) ? { ...l, approvedFlag: 'Y' } : l))
  }));
};

// דרישה מהנתונים הסטטיים שנוספה אחרי שכבר נשמרו דרישות בדפדפן - מקבלת מספר פנוי (ומזהי שורות וחלוקות בהתאם)
const withNewId = (req, id) => ({
  ...req,
  id,
  requisitionNumber: String(REQ_NUMBER_BASE + id - 1),
  lines: req.lines.map(l => ({
    ...l,
    id: id * 1000 + l.lineNumber,
    requisitionId: id,
    distributions: (l.distributions || []).map((d, i) => ({ ...d, id: (id * 1000 + l.lineNumber) * 100 + i + 1, requisitionLineId: id * 1000 + l.lineNumber }))
  }))
});

// טעינת דרישות מה-LocalStorage (או מהנתונים הסטטיים בהפעלה ראשונה) + המרת סטטוס ישן 'Draft' ל-INCOMPLETE
// דרישות חדשות בנתונים הסטטיים (מזוהות לפי תיאור ותאריך יצירה) מצטרפות גם לרשימה שכבר שמורה
const loadStoredRequisitions = () => {
  const stored = localStorage.getItem('appRequisitions');
  const seed = buildSeedRequisitions();
  let list = stored ? JSON.parse(stored) : seed;
  if (stored) {
    const seedKey = (r) => `${r.header?.description ?? r.description}|${r.creationDate}`;
    seed.filter(r => !list.some(x => seedKey(x) === seedKey(r))).forEach(r => {
      list = [...list, list.some(x => x.id === r.id) ? withNewId(r, getNextRequisitionId(list)) : r];
    });
  }
  return list.map(r => (r.status === 'Draft' ? { ...r, status: REQ_STATUS.INCOMPLETE } : r));
};

const getNextRequisitionId = (list) => (list.length > 0 ? Math.max(...list.map(r => r.id)) + 1 : 1);

// בניית אובייקט דרישה מלא משורות העגלה (משמש גם לדרישה חדשה וגם לעדכון דרישה קיימת)
// preservedLines: שורות קיימות שנשמרות כמו שהן (מאושרות ומבוטלות בדרישה שאושרה), עם המזהים והמספרים שלהן,
// כדי שהקישור להזמנות ולשריון לא ישבר. השורות החדשות ממוספרות אחריהן.
const buildRequisition = ({ id, requisitionNumber, creationDate, headerData, lines, status, routingSteps, creatorId, actionHistory, preservedLines = [] }) => {
  const now = new Date().toISOString();
  const firstNumber = preservedLines.reduce((m, l) => Math.max(m, Number(l.lineNumber) || 0), 0);

  const formattedNewLines = lines.map((line, idx) => {
    const lIndex = firstNumber + idx;
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
  const formattedLines = [...preservedLines, ...formattedNewLines].sort((a, b) => a.lineNumber - b.lineNumber);

  return {
    id,
    requisitionNumber: String(requisitionNumber),
    description: headerData?.description || '',
    header: headerData || {}, // שמירת כל נתוני הכותרת לצורך שחזור בעריכה
    creationDate: creationDate || now,
    lastUpdateDate: now,
    creatorId,
    total: computeRequisitionTotal(formattedLines),
    status,
    routingSteps: routingSteps || [],
    actionHistory: actionHistory || [],
    lines: formattedLines
  };
};

// המרת שורת דרישה שמורה בחזרה לשורת עגלה (מזהים חדשים כדי למנוע התנגשויות)
const requisitionLineToCartLine = (line, idx) => {
  const newLineId = Date.now() + idx + Math.random();
  // eslint-disable-next-line no-unused-vars
  const { requisitionId, cancelFlag, cancelDate, approvedFlag, ...rest } = line;
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
    showToast(editingRequisition ? `הפריט נוסף לדרישה ${editingRequisition.requisitionNumber}` : 'הפריט נוסף לסל בהצלחה!');
  };

  const handleAddToCartItem = (itemId, quantity) => {
    const existingLine = cartLines.find(line => String(line.itemId) === String(itemId));
    if (existingLine) {
      updateLineQty(existingLine.id, existingLine.quantity + quantity);
      showToast(editingRequisition ? `כמות הפריט עודכנה בדרישה ${editingRequisition.requisitionNumber}` : 'כמות הפריט עודכנה בסל בהצלחה!');
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
    showToast(editingRequisition ? `פריט חופשי נוסף לדרישה ${editingRequisition.requisitionNumber}` : 'פריט חופשי נוסף לסל בהצלחה!');
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

  // עדכון דרישה אחת על בסיס המצב העדכני (לפעולות שמסתיימות אחרי קריאה אסינכרונית לשירות)
  const patchRequisition = (reqId, fn) => {
    setRequisitions(prev => {
      const next = prev.map(r => (r.id === reqId ? fn(r) : r));
      localStorage.setItem('appRequisitions', JSON.stringify(next));
      return next;
    });
  };

  // שחרור שריון התקציב של דרישה + רישום ביומן (אם שוחרר סכום)
  const releaseAndLog = async (reqId, reason, lineIds = null) => {
    const { releasedAmount } = await releaseFunds(reqId, { userId: currentUser?.id, reason, lineIds });
    if (releasedAmount > 0) {
      patchRequisition(reqId, r => appendActions(r, [makeAction('FUNDS_RELEASE', { userId: currentUser?.id, note: reason, amount: releasedAmount })]));
    }
    return releasedAmount;
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

  // דרישה שאושרה בעריכה: השורות המאושרות מוצגות בסל לקריאה בלבד
  const editingLockedLines = isAmendment(editingRequisition) ? lockedLinesOf(editingRequisition) : [];

  // מספר הדרישה שיוצג בכותרת ה-Checkout: המספר הקיים בעריכה, או המספר הבא בתור
  const nextRequisitionNumber = editingRequisition
    ? editingRequisition.requisitionNumber
    : String(REQ_NUMBER_BASE + getNextRequisitionId(requisitions) - 1);

  // הוספה או עדכון של דרישה בתוך רשימה (פונקציה טהורה - מחזירה רשימה חדשה ואת הדרישה)
  const upsertRequisition = (list, { targetId, headerData, lines, status, routingSteps }) => {
    const existing = targetId ? list.find(r => r.id === targetId) : null;

    if (existing) {
      const common = {
        id: existing.id,
        requisitionNumber: existing.requisitionNumber,
        creationDate: existing.creationDate,
        creatorId: existing.creatorId,
        actionHistory: existing.actionHistory,
        headerData, status, routingSteps
      };
      // דרישה שאושרה: השורות המאושרות והמבוטלות נשמרות כמו שהן, והסל מכיל רק את השורות החדשות
      // דרישה רגילה: שורות שבוטלו לא נטענות לסל - שומרים אותן בדרישה כדי לא לאבד את ההיסטוריה
      const updatedReq = hasApprovedLines(existing)
        ? buildRequisition({
          ...common,
          lines,
          preservedLines: (existing.lines || [])
            .filter(l => isLineApproved(existing, l) || isLineCancelled(l))
            .map(l => (isLineApproved(existing, l) ? { ...l, approvedFlag: 'Y' } : l))
        })
        : buildRequisition({ ...common, lines: [...lines, ...(existing.lines || []).filter(isLineCancelled)] });
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
      status: draftStatusFor(editingRequisition),
      routingSteps: []
    }).list;
  };

  // שליחה/שמירה מתוך ה-Checkout: יוצר דרישה חדשה, או מעדכן את הדרישה שבעריכה.
  // בשליחה לאישור: בדיקת תקציב ושריון. אם השריון נכשל - הדרישה לא נשמרת ומוחזרת שגיאה
  const handleCheckoutSubmit = async (headerData, finalLines, emptyCart, routingSteps = [], status = REQ_STATUS.INCOMPLETE, { validationWarnings = [] } = {}) => {
    // הגנה נוספת: אין העברה לסבב אישורים כשיש הודעה חוסמת (סעיף תקציבי חסר או לא תקין וכו')
    if (status === REQ_STATUS.IN_PROCESS && validateCheckout({ rules: loadValidationRulesSync(), header: headerData, lines: finalLines }).all.some(m => m.severity === 'ERROR')) {
      showToast('לא ניתן להעביר לסבב: יש בדרישה שדות שצריך לתקן');
      return { ok: false, message: 'יש בדרישה שדות שצריך לתקן' };
    }
    // סבב המאשרים: ממונה כספים חובה וחבר בקבוצת ממוני הכספים (ולידציות "סבב מאשרים")
    if (status === REQ_STATUS.IN_PROCESS) {
      const routingBlock = runScreen('APPROVAL_ROUTING', routingContext({ steps: routingSteps, lines: finalLines }), loadValidationRulesSync()).filter(m => m.severity === 'ERROR');
      if (routingBlock.length > 0) return { ok: false, message: 'לא ניתן לשלוח לאישור', errors: routingBlock.map(m => m.message) };
    }
    const isNew = !editingRequisitionId || !requisitions.some(r => r.id === editingRequisitionId);
    const editing = isNew ? null : requisitions.find(r => r.id === editingRequisitionId);
    // דרישה שאושרה: שמירה בלי שליחה משאירה אותה בסטטוס שלה (הוחזרה מקניין / נדחתה), לא טיוטה
    const finalStatus = status === REQ_STATUS.INCOMPLETE ? draftStatusFor(editing) : status;
    if (status === REQ_STATUS.IN_PROCESS && isAmendment(editing) && finalLines.length === 0) {
      return { ok: false, message: 'יש להוסיף לפחות שורה חדשה לפני שליחה לסבב' };
    }
    const { list, requisition } = upsertRequisition(requisitions, {
      targetId: editingRequisitionId,
      headerData, lines: finalLines, status: finalStatus, routingSteps
    });

    const actions = [];
    if (isNew) actions.push(makeAction('CREATE', { userId: currentUser.id }));
    if (status === REQ_STATUS.IN_PROCESS) {
      const funds = await reserveFunds(requisition, currentUser.id);
      if (!funds.ok) {
        const failed = funds.check.accounts.filter(a => !a.ok);
        return { ok: false, message: 'לא ניתן לשריין תקציב', errors: failed.map(fundsFailureMessage) };
      }
      // אזהרות מהוולידציות שהיו בדרישה בזמן ההגשה - נרשמות ביומן הפעולות
      if (validationWarnings.length > 0) {
        actions.push(makeAction('VALIDATION_WARNING', { userId: currentUser.id, note: validationWarnings.join(' | ') }));
      }
      actions.push(makeAction('SUBMIT', { userId: currentUser.id }));
      actions.push(makeAction('FUNDS_RESERVE', { userId: null, amount: funds.reservedAmount }));
    }
    const finalReq = appendActions(requisition, actions);
    persistRequisitions(list.map(r => (r.id === finalReq.id ? finalReq : r)));

    if (emptyCart) {
      clearCart();
    } else {
      // הסל נשאר - ממשיכים "לערוך" את אותה דרישה, כך ששמירה נוספת תעדכן אותה ולא תיצור כפילות
      updateCartAndSave(finalLines);
      setEditingRequisitionId(finalReq.id);
    }

    if (status === REQ_STATUS.IN_PROCESS) handleNavigate('success', finalReq);
    else handleNavigate('home');
    return { ok: true, requisition: finalReq };
  };

  // מחיקת דרישה (רק בסטטוסים המותרים)
  const deleteRequisition = (reqId) => {
    const req = requisitions.find(r => r.id === reqId);
    if (!req || !canDoAction(req, 'delete')) {
      showToast('לא ניתן למחוק דרישה בסטטוס הנוכחי');
      return false;
    }
    persistRequisitions(requisitions.filter(r => r.id !== reqId));
    if (req.status === REQ_STATUS.IN_PROCESS) releaseFunds(reqId, { userId: currentUser?.id, reason: 'מחיקת דרישה' });
    // אם מחקנו את הדרישה שבעריכה - הסל הופך לסל של דרישה חדשה
    if (editingRequisitionId === reqId) setEditingRequisitionId(null);
    showToast(`דרישה ${req.requisitionNumber} נמחקה בהצלחה`);
    return true;
  };

  // ביטול דרישה (רק APPROVED / RETURNED)
  const cancelRequisition = (reqId) => {
    const req = requisitions.find(r => r.id === reqId);
    if (!req || !canDoAction(req, 'cancel')) {
      showToast('לא ניתן לבטל דרישה בסטטוס הנוכחי');
      return false;
    }
    if (requisitionHasPo(req)) {
      showToast('לא ניתן לבטל דרישה שקיימת לה הזמנה. ניתן לבטל רק שורות שטרם הוזמנו');
      return false;
    }
    const now = new Date().toISOString();
    persistRequisitions(requisitions.map(r => (r.id === reqId ? {
      ...r,
      status: REQ_STATUS.CANCELLED,
      lastUpdateDate: now,
      lines: (r.lines || []).map(l => (isLineCancelled(l) ? l : { ...l, cancelFlag: 'Y', cancelDate: now }))
    } : r)).map(r => (r.id === reqId ? appendActions(r, [makeAction('CANCEL', { userId: currentUser?.id })]) : r)));
    releaseAndLog(reqId, 'ביטול דרישה');
    showToast(`דרישה ${req.requisitionNumber} בוטלה`);
    return true;
  };

  // ביטול שורת דרישה אחת (רק שורה שאין לה הזמנה). מחזיר { requisitionCancelled } או false
  const cancelRequisitionLine = (reqId, lineId) => {
    const req = requisitions.find(r => r.id === reqId);
    const line = req?.lines?.find(l => l.id === lineId);
    if (!req || !line || !canDoAction(req, 'cancel')) {
      showToast('לא ניתן לבטל שורות בדרישה בסטטוס הנוכחי');
      return false;
    }
    if (isLineCancelled(line)) return false;
    if (isReqLineOnPo(req, line)) {
      showToast('לא ניתן לבטל שורה שקיימת לה הזמנה');
      return false;
    }
    const now = new Date().toISOString();
    const lines = req.lines.map(l => (l.id === lineId ? { ...l, cancelFlag: 'Y', cancelDate: now } : l));
    const requisitionCancelled = lines.every(isLineCancelled);
    persistRequisitions(requisitions.map(r => (r.id === reqId ? {
      ...r,
      lines,
      total: computeRequisitionTotal(lines),
      status: requisitionCancelled ? REQ_STATUS.CANCELLED : r.status,
      lastUpdateDate: now
    } : r)).map(r => (r.id === reqId ? appendActions(r, [
      makeAction('CANCEL_LINE', { userId: currentUser?.id, lineNumbers: [line.lineNumber] }),
      requisitionCancelled ? makeAction('CANCEL', { userId: null, note: 'כל שורות הדרישה בוטלו' }) : null
    ]) : r)));
    releaseAndLog(reqId, `ביטול שורה ${line.lineNumber}`, [lineId]);
    showToast(requisitionCancelled
      ? `כל השורות בוטלו - דרישה ${req.requisitionNumber} בוטלה`
      : `שורה ${line.lineNumber} בדרישה ${req.requisitionNumber} בוטלה`);
    return { requisitionCancelled };
  };

  // עריכת דרישה: טוען אותה לסל ומעביר ל-Checkout.
  // saveCartFirst = true -> הסל הנוכחי נשמר קודם כטיוטה. false -> הסל הנוכחי נדרס.
  const startEditRequisition = (reqId, { saveCartFirst = false } = {}) => {
    const target = requisitions.find(r => r.id === reqId);
    if (!target || !canDoAction(target, 'edit')) {
      showToast('לא ניתן לערוך דרישה בסטטוס הנוכחי');
      return false;
    }

    let list = requisitions;
    if (saveCartFirst && editingRequisitionId !== reqId) {
      list = saveCartAsDraftInList(list);
    }

    // דרישה בסבב אישורים נמשכת חזרה לטיוטה וסבב האישורים מתאפס
    // (דרישה שאושרה חוזרת ל"הוחזרה מקניין", ומשתחרר רק השריון של השורות החדשות)
    const isWithdraw = target.status === REQ_STATUS.IN_PROCESS;
    const amend = isAmendment(target);
    if (isWithdraw) {
      list = list.map(r => r.id === reqId
        ? appendActions({ ...r, status: amend ? REQ_STATUS.RETURNED : REQ_STATUS.INCOMPLETE, routingSteps: amend ? r.routingSteps : [], lastUpdateDate: new Date().toISOString() }, [makeAction('WITHDRAW', { userId: currentUser?.id })])
        : r
      );
    }
    persistRequisitions(list);
    if (isWithdraw) releaseAndLog(reqId, 'משיכת הדרישה מסבב האישורים', amend ? unapprovedLineIds(target) : null);

    // בדרישה שאושרה נטענות לסל רק השורות שעוד לא אושרו (השורות המאושרות מוצגות בסל לקריאה בלבד)
    updateCartAndSave(activeLines(target).filter(l => !amend || !isLineApproved(target, l)).map(requisitionLineToCartLine));
    setEditingRequisitionId(reqId);
    showToast(saveCartFirst
      ? 'הסל הקודם נשמר כטיוטה, והדרישה נטענה לעריכה'
      : amend ? `דרישה ${target.requisitionNumber} נטענה להוספת שורות` : `דרישה ${target.requisitionNumber} נטענה לעריכה`);
    handleNavigate('checkout');
    return true;
  };

  // העתקת דרישה לסל (תמיד יוצרת דרישה חדשה בהמשך, המקור לא משתנה).
  // mode: 'overwrite' (דריסת הסל) | 'merge' (הוספה לסל הקיים) | 'saveDraft' (שמירת הסל כטיוטה ואז העתקה)
  const copyRequisitionToCart = (reqId, mode = 'overwrite') => {
    const source = requisitions.find(r => r.id === reqId);
    if (!source) return false;

    // מעתיקים רק שורות פעילות; בדרישה שכל שורותיה בוטלו - את כולן
    const sourceLines = activeLines(source).length ? activeLines(source) : (source.lines || []);
    const copiedLines = sourceLines.map(requisitionLineToCartLine);

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

  // ==========================================
  // 9. סבב אישורים - פעולות המאשר
  // ==========================================
  // דרישות שממתינות למשתמש המחובר (כמאשר יחיד או כחבר בקבוצת מאשרים)
  const pendingApprovals = currentUser
    ? requisitions.filter(r => getActionableSteps(r, currentUser.id).length > 0)
        .sort((a, b) => new Date(a.lastUpdateDate || a.creationDate) - new Date(b.lastUpdateDate || b.creationDate))
    : [];

  const decideRequisition = (reqId, decision, note = '') => {
    const req = requisitions.find(r => r.id === reqId);
    const result = req && currentUser ? applyDecision(req, currentUser.id, decision, note) : null;
    if (!result) {
      showToast('הדרישה אינה ממתינה לאישורך');
      return false;
    }
    // לקבוצה - שם הקבוצה; למאשר יחיד - התפקיד בסבב (שמו כבר מופיע ברישום)
    const stepTitle = result.steps.filter(s => result.actedStepIds.includes(s.id)).map(stepRoleLabel).join(', ');
    const now = new Date().toISOString();
    const finalStatus = result.outcome === 'APPROVED' ? REQ_STATUS.APPROVED : result.outcome === 'REJECTED' ? REQ_STATUS.REJECTED : REQ_STATUS.IN_PROCESS;
    // באישור סופי כל השורות הפעילות נעשות מאושרות (ונעולות אם הדרישה תוחזר מקניין)
    const lines = finalStatus === REQ_STATUS.APPROVED
      ? (req.lines || []).map(l => (isLineCancelled(l) ? l : { ...l, approvedFlag: 'Y' }))
      : req.lines;
    const updated = appendActions({ ...req, lines, routingSteps: result.steps, status: finalStatus, lastUpdateDate: now }, [
      makeAction(decision === 'approve' ? 'APPROVE' : 'REJECT', { userId: currentUser.id, note, stepTitle }),
      result.outcome === 'APPROVED' ? makeAction('FINAL_APPROVE', { userId: null, note: 'כל המאשרים אישרו. השריון נשאר בתוקף.' }) : null
    ]);
    persistRequisitions(requisitions.map(r => (r.id === reqId ? updated : r)));
    // דחייה: בדרישה שאושרה משתחרר רק השריון של השורות החדשות
    if (result.outcome === 'REJECTED') releaseAndLog(reqId, 'דחיית הדרישה', isAmendment(req) ? unapprovedLineIds(req) : null);
    showToast(result.outcome === 'APPROVED'
      ? `דרישה ${req.requisitionNumber} אושרה סופית`
      : result.outcome === 'REJECTED' ? `דרישה ${req.requisitionNumber} נדחתה והשריון שוחרר` : `אישרת את דרישה ${req.requisitionNumber}`);
    return result.outcome;
  };
  const approveRequisition = (reqId, note) => decideRequisition(reqId, 'approve', note);
  const rejectRequisition = (reqId, note) => decideRequisition(reqId, 'reject', note);

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
    editingLockedLines,
    nextRequisitionNumber,
    handleCheckoutSubmit,
    deleteRequisition,
    cancelRequisition,
    cancelRequisitionLine,
    startEditRequisition,
    copyRequisitionToCart,
    pendingApprovals,
    approveRequisition,
    rejectRequisition,
    resetAppData
  };
}
