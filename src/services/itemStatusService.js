import data from '../data/data.json';
import { respond } from './storage';

// ==========================================
// סטטוס פריט ב-ERP (מקביל ל-Item Master של EBS: MTL_SYSTEM_ITEMS_B.INVENTORY_ITEM_STATUS_CODE לכל ארגון מלאי)
// - הסטטוסים ומשמעותם (רכש / מלאי) - itemStatuses, כמו MTL_ITEM_STATUS
// - הסטטוס בכל ארגון - itemOrgStatuses. פריט שמשויך לארגון ואין לו שורה שם - פעיל (Active)
// בחיבור ל-EBS: קריאה בלבד דרך ה-API (ORDS / SOAP), בלי גישה ישירה ל-DB
// ==========================================
const DEFAULT_STATUS = 'Active';
const norm = (s) => String(s ?? '').trim().toLowerCase();

const statusMeta = (code) => (data.itemStatuses || []).find(s => s.code === code)
  || { code, name: code, purchasingEnabled: false, stockEnabled: false };

const itemSummary = ({ id, sku, description, manufacturer, manufacturerSku, uom }) => ({ id, sku, description, manufacturer, manufacturerSku, uom });

// חיפוש פריטים לפי מק"ט, תיאור, יצרן או מק"ט יצרן
export const searchErpItems = (query, limit = 8) => {
  const q = norm(query);
  if (q.length < 2) return respond([]);
  const words = q.split(/\s+/);
  const hits = (data.catalogItems || []).filter(i => {
    const text = norm(`${i.sku} ${i.description} ${i.manufacturer} ${i.manufacturerSku}`);
    return words.every(w => text.includes(w));
  });
  // התאמה מדויקת למק"ט קודם
  hits.sort((a, b) => (norm(b.sku) === q) - (norm(a.sku) === q));
  return respond(hits.slice(0, limit).map(itemSummary));
};

// הסטטוס של הפריט בכל ארגוני המלאי
export const getItemStatus = (itemId) => {
  const item = (data.catalogItems || []).find(i => String(i.id) === String(itemId));
  if (!item) return respond(null);
  const assigned = new Set((item.inventoryOrgs || []).map(Number));
  const orgs = (data.inventoryOrganizations || []).map(org => {
    if (!assigned.has(Number(org.id))) {
      return { orgId: org.id, orgCode: org.code, orgName: org.name, assigned: false };
    }
    const row = (data.itemOrgStatuses || []).find(r => String(r.itemId) === String(item.id) && String(r.inventoryOrgId) === String(org.id));
    const meta = statusMeta(row?.statusCode || DEFAULT_STATUS);
    return {
      orgId: org.id,
      orgCode: org.code,
      orgName: org.name,
      assigned: true,
      statusCode: meta.code,
      statusName: meta.name,
      purchasingEnabled: !!meta.purchasingEnabled,
      stockEnabled: !!meta.stockEnabled,
      lastUpdateDate: row?.lastUpdateDate || null
    };
  });
  return respond({ item: itemSummary(item), orgs });
};

export const getItemStatuses = () => respond(data.itemStatuses || []);
