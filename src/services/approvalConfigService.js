import data from '../data/data.json';
import { respond } from './storage';

// ==========================================
// הגדרות סבב האישורים (מקביל ל-AME: קבוצות מאשרים, חוקים ותנאים)
// בשלב זה נטענות מ-data.json; בשלב מסכי הניהול - יישמרו ויעודכנו דרך השירות הזה
// ==========================================
export const getApprovalConfig = () => respond({
  umxRoles: data.umxRoles || [],
  userRoleAssignments: data.userRoleAssignments || [],
  itemClassifications: data.itemClassifications || [],
  approverGroups: data.approverGroups || [],
  approvalRules: data.approvalRules || [],
  users: data.users.map(({ id, username, firstName, lastName, job }) => ({ id, username, firstName, lastName, job })),
  buyers: data.buyers || [],
  inventoryOrganizations: data.inventoryOrganizations || [],
  // אנשי מפתח בפרויקט (כמו Key Members ב-EBS Projects) - לחוקים שמושכים מאשר מהפרויקט
  projects: (data.projects || []).map(({ id, projectCode, projectName, primaryPlannerUserId }) => ({ id, projectCode, projectName, primaryPlannerUserId })),
  catalogItems: (data.catalogItems || []).map(({ id, hasMemory, hasRadiation, isClassified, hasAcidBattery }) => ({ id, hasMemory, hasRadiation, isClassified, hasAcidBattery }))
});
