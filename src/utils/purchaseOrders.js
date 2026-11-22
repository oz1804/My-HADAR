import data from '../data/data.json';

// ==========================================
// הזמנות רכש (במבנה Oracle EBS) והקישור שלהן לדרישות
// הקישור נעשה ברמת שורת החלוקה: purchaseOrderDistributions.reqDistributionId -> requisitionDistributions.id
// ==========================================

const indexBy = (rows) => Object.fromEntries((rows || []).map(r => [r.id, r]));
const groupBy = (rows, key) => (rows || []).reduce((acc, r) => {
  (acc[r[key]] = acc[r[key]] || []).push(r);
  return acc;
}, {});

const PO_HEADERS = indexBy(data.purchaseOrders);
const PO_LINES = indexBy(data.purchaseOrderLines);
const PO_SHIPMENTS = indexBy(data.purchaseOrderShipments);
const PO_RELEASES = indexBy(data.purchaseOrderReleases);
const LINES_BY_HEADER = groupBy(data.purchaseOrderLines, 'poHeaderId');
const SHIPMENTS_BY_LINE = groupBy(data.purchaseOrderShipments, 'poLineId');
const DISTS_BY_SHIPMENT = groupBy(data.purchaseOrderDistributions, 'lineLocationId');
const RELEASES_BY_HEADER = groupBy(data.purchaseOrderReleases, 'poHeaderId');
const PO_DISTS_BY_REQ_DIST = groupBy(data.purchaseOrderDistributions, 'reqDistributionId');

const SEEDED_REQS = indexBy(data.requisitions);
const SEEDED_REQ_LINES = indexBy(data.requisitionLines);
const SEEDED_REQ_DISTS = indexBy(data.requisitionDistributions);

// ==========================================
// הגדרות תצוגה
// ==========================================
export const PO_TYPE_META = {
  STANDARD: { label: 'הזמנה רגילה', badge: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  BLANKET:  { label: 'הזמנת מסגרת', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  RELEASE:  { label: 'הוראת משיכה', badge: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300' }
};

export const PO_STATUS_META = {
  'INCOMPLETE':          { label: 'טיוטה',              badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-200', dot: 'bg-gray-400' },
  'IN PROCESS':          { label: 'בתהליך אישור',        badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500' },
  'APPROVED':            { label: 'מאושרת',             badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'REQUIRES REAPPROVAL': { label: 'ממתינה לאישור מחדש', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', dot: 'bg-amber-500' },
  'REJECTED':            { label: 'נדחתה',              badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300', dot: 'bg-red-500' }
};

export const PO_CLOSED_META = {
  'OPEN':                 { label: 'פתוחה' },
  'CLOSED FOR RECEIVING': { label: 'סגורה לקבלה' },
  'CLOSED FOR INVOICE':   { label: 'סגורה לחשבונית' },
  'CLOSED':               { label: 'סגורה' },
  'FINALLY CLOSED':       { label: 'סגורה סופית' }
};

// ==========================================
// "מסמך רכש" = הזמנה רגילה, הזמנת מסגרת או הוראת משיכה
// ==========================================
export const docKey = (poHeaderId, releaseId) => (releaseId ? `R${releaseId}` : `P${poHeaderId}`);

export function getPoDocument(poHeaderId, releaseId = null) {
  const header = PO_HEADERS[poHeaderId];
  if (!header) return null;
  const release = releaseId ? PO_RELEASES[releaseId] : null;
  if (releaseId && !release) return null;
  return {
    key: docKey(poHeaderId, releaseId),
    poHeaderId,
    releaseId: release ? release.id : null,
    kind: release ? 'RELEASE' : header.typeLookupCode,
    number: release ? release.releaseNumber : header.poNumber,
    authorizationStatus: release ? release.authorizationStatus : header.authorizationStatus,
    closedCode: release ? release.closedCode : header.closedCode,
    date: release ? release.releaseDate : header.creationDate,
    description: header.description,
    header,
    release
  };
}

const sortDocs = (docs) => docs.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.number.localeCompare(b.number)));

// הקישור תקף רק לדרישה שהגיעה מהנתונים הסטטיים (אותו מזהה ואותו תאריך יצירה),
// כדי שדרישה מקומית שקיבלה במקרה אותו מזהה לא "תירש" הזמנות שלא שלה
const isLinkedRequisition = (req) => {
  const seeded = req && SEEDED_REQS[req.id];
  return !!seeded && seeded.creationDate === req.creationDate;
};

// כל שורות החלוקה של ההזמנות שמקושרות לשורת חלוקה של דרישה
export function getPoDistsForReqDist(req, reqDistId) {
  if (!isLinkedRequisition(req)) return [];
  return PO_DISTS_BY_REQ_DIST[reqDistId] || [];
}

const docsFromPoDists = (poDists) => {
  const map = new Map();
  poDists.forEach(d => {
    const key = docKey(d.poHeaderId, d.poReleaseId);
    if (!map.has(key)) map.set(key, getPoDocument(d.poHeaderId, d.poReleaseId));
  });
  return sortDocs([...map.values()].filter(Boolean));
};


// שורת דרישה מקושרת להזמנה אחת בלבד (שורת הזמנה + משלוח אחד).
// מחזיר את ההזמנה / הוראת המשיכה ואת שורת ההזמנה, או null אם השורה טרם הוזמנה
export function getPoLinkForReqLine(req, line) {
  const poDist = (line.distributions || []).flatMap(d => getPoDistsForReqDist(req, d.id))[0];
  if (!poDist) return null;
  const poLine = PO_LINES[poDist.poLineId];
  const shipment = PO_SHIPMENTS[poDist.lineLocationId];
  // מספר המשלוח מעניין רק כשלשורת ההזמנה יש כמה משלוחים באותו מסמך
  const shipmentsInDoc = (SHIPMENTS_BY_LINE[poDist.poLineId] || [])
    .filter(s => s.shipmentType !== 'PRICE BREAK' && s.poReleaseId === poDist.poReleaseId);
  return {
    doc: getPoDocument(poDist.poHeaderId, poDist.poReleaseId),
    poLineId: poLine?.id,
    poLineNum: poLine?.lineNum,
    shipmentNum: shipmentsInDoc.length > 1 ? shipment?.shipmentNum : null
  };
}

// האם שורת דרישה / דרישה מקושרות להזמנה (משמש לחסימת ביטול)
export const isReqLineOnPo = (req, line) => (line?.distributions || []).some(d => getPoDistsForReqDist(req, d.id).length > 0);
export const requisitionHasPo = (req) => (req?.lines || []).some(l => isReqLineOnPo(req, l));

// מסמכי הרכש של דרישה שלמה - הראשון במערך הוא ההזמנה הראשונה שקושרה לדרישה
export const getDocsForRequisition = (req) =>
  docsFromPoDists((req.lines || []).flatMap(l => (l.distributions || []).flatMap(d => getPoDistsForReqDist(req, d.id))));

// ==========================================
// מבנה מלא של הזמנה / הוראת משיכה למסך הפרטים
// ==========================================
const sum = (rows, f) => rows.reduce((s, r) => s + (Number(r[f]) || 0), 0);

// מאיזו דרישה הגיעה שורת חלוקה של הזמנה
const requisitionOfPoDist = (poDist) => {
  const rd = SEEDED_REQ_DISTS[poDist.reqDistributionId];
  const rl = rd && SEEDED_REQ_LINES[rd.requisitionLineId];
  const rq = rl && SEEDED_REQS[rl.requisitionId];
  return rq ? { id: rq.id, requisitionNumber: rq.requisitionNumber, creationDate: rq.creationDate, creatorId: rq.creatorId, lineNumber: rl.lineNumber } : null;
};

export function getPurchaseOrderView(poHeaderId, releaseId = null) {
  const doc = getPoDocument(poHeaderId, releaseId);
  if (!doc) return null;
  const { header } = doc;
  const isBlanketHeader = doc.kind === 'BLANKET';
  const rate = header.rate || 1;

  const lines = (LINES_BY_HEADER[poHeaderId] || [])
    .slice()
    .sort((a, b) => a.lineNum - b.lineNum)
    .map(line => {
      const allShipments = SHIPMENTS_BY_LINE[line.id] || [];
      const priceBreaks = allShipments.filter(s => s.shipmentType === 'PRICE BREAK');
      // בהוראת משיכה מציגים רק את המשלוחים שלה; בהזמנת מסגרת את כל המשיכות; ברגילה את כל המשלוחים
      const shipments = allShipments
        .filter(s => s.shipmentType !== 'PRICE BREAK')
        .filter(s => (releaseId ? s.poReleaseId === releaseId : true))
        .map(s => ({
          ...s,
          release: s.poReleaseId ? PO_RELEASES[s.poReleaseId] : null,
          distributions: (DISTS_BY_SHIPMENT[s.id] || [])
            .slice()
            .sort((a, b) => a.distributionNum - b.distributionNum)
            .map(d => ({ ...d, requisition: requisitionOfPoDist(d) }))
        }));
      const quantity = isBlanketHeader || releaseId ? sum(shipments, 'quantity') : line.quantity;
      const amount = shipments.reduce((s, sh) => s + sh.quantity * sh.priceOverride, 0);
      return {
        ...line,
        shipments,
        priceBreaks,
        displayQuantity: quantity,
        amount,                                  // במטבע ההזמנה
        received: sum(shipments, 'quantityReceived'),
        billed: sum(shipments, 'quantityBilled')
      };
    })
    // בהוראת משיכה - רק שורות המסגרת שנמשכו בה
    .filter(l => !releaseId || l.shipments.length > 0);

  const amount = lines.reduce((s, l) => s + l.amount, 0);
  const ordered = lines.reduce((s, l) => s + sum(l.shipments, 'quantity'), 0);

  return {
    doc,
    header,
    release: doc.release,
    blanket: releaseId ? getPoDocument(poHeaderId) : null,
    releases: isBlanketHeader
      ? (RELEASES_BY_HEADER[poHeaderId] || []).map(r => {
          const rv = getPurchaseOrderView(poHeaderId, r.id);
          return { ...getPoDocument(poHeaderId, r.id), amount: rv.amount, functionalAmount: rv.functionalAmount };
        }).sort((a, b) => a.release.releaseNum - b.release.releaseNum)
      : [],
    lines,
    amount,
    functionalAmount: amount * rate,
    quantities: {
      ordered,
      received: lines.reduce((s, l) => s + l.received, 0),
      billed: lines.reduce((s, l) => s + l.billed, 0)
    }
  };
}
