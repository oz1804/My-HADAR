// ==========================================
// תצוגת ערכי LOV של פרויקט ומשימה: מספר, שם ותאריך סיום
// ==========================================

const fmt = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// תאריך הסיום של הפרויקט / המשימה ("31.12.2026"), או "" כשאין תאריך סיום
export const endDateText = (item) => fmt(item?.endDate);

export const projectLovProps = {
  getCode: p => p.projectCode,
  getName: p => p.projectName,
  getMeta: endDateText,
  metaLabel: 'תאריך סיום',
  columns: ['מספר פרויקט', 'שם הפרויקט', 'תאריך סיום']
};

export const taskLovProps = {
  getCode: t => t.taskCode,
  getName: t => t.taskName,
  getMeta: endDateText,
  metaLabel: 'תאריך סיום',
  columns: ['מספר משימה', 'שם המשימה', 'תאריך סיום']
};

// טקסט לאפשרות ב-select רגיל (מסך ברירות המחדל)
export const optionWithEndDate = (code, name, item) => {
  const end = endDateText(item);
  return end ? `${code} - ${name} (סיום: ${end})` : `${code} - ${name}`;
};
