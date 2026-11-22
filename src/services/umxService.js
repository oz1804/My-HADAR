import data from '../data/data.json';
import { isEffective, respond, todayIso } from './storage';

// ==========================================
// תפקידי UMX ושיוכי משתמשים (מקביל ל-WF_ROLES / WF_USER_ROLES ב-EBS)
// ==========================================
export const ADMIN_ROLE = 'UMX|HADAR_ADMIN';

const activeAssignments = (date) =>
  (data.userRoleAssignments || []).filter(a => isEffective(a, date));

// התפקידים הפעילים של משתמש
export const getUserRoles = (userId, date = todayIso()) => {
  const codes = activeAssignments(date).filter(a => String(a.userId) === String(userId)).map(a => a.roleCode);
  return respond((data.umxRoles || []).filter(r => codes.includes(r.code) && isEffective(r, date)));
};

export const hasRole = (roles, roleCode) => (roles || []).some(r => r.code === roleCode);
