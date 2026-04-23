/**
 * Shared permission types and helpers for the RBAC + ACL system.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type Perm = 'r' | 'w' | 'u' | 'd';

export const PERM_LABELS: Record<Perm, { label: string; icon: string }> = {
  r: { label: 'Read',   icon: '👁'  },
  w: { label: 'Write',  icon: '✏️'  },
  u: { label: 'Update', icon: '🔄'  },
  d: { label: 'Delete', icon: '🗑'  },
};

export const ALL_PERMS: Perm[] = ['r', 'w', 'u', 'd'];

/** App-defined roles that map to Appwrite user labels */
export type AppRole = 'admin' | 'manager' | 'hr' | 'viewer' | 'new_user';

export const APP_ROLES: AppRole[] = ['admin', 'manager', 'hr', 'viewer', 'new_user'];

/** Per-user override stored inside the page document */
export interface UserOverride {
  userId:  string;
  name:    string;
  email:   string;
  perms:   Perm[];
}

/** Page permission document shape (mirrors Appwrite document) */
export interface PagePermissionDoc {
  $id:           string;
  pageId:        string;
  pageName:      string;
  pagePath:      string;
  rolePerms:     string; // JSON: Record<AppRole, Perm[]>
  userOverrides: string; // JSON: Record<userId, UserOverride>
}

/** Parsed runtime representation */
export interface PagePermissions {
  pageId:        string;
  pageName:      string;
  pagePath:      string;
  rolePerms:     Record<AppRole, Perm[]>;
  userOverrides: Record<string, UserOverride>;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_ROLE_PERMS: Record<AppRole, Perm[]> = {
  admin:    ['r', 'w', 'u', 'd'],
  manager:  ['r', 'w', 'u'],
  hr:       ['r', 'w'],
  viewer:   ['r'],
  new_user: [],
};

/** All pages that appear in the sidebar */
export const MANAGED_PAGES: Pick<PagePermissions, 'pageId' | 'pageName' | 'pagePath'>[] = [
  { pageId: 'dashboard',        pageName: 'Dashboard',        pagePath: '/admin/dashboard'       },
  { pageId: 'employees',        pageName: 'Employees',        pagePath: '/admin/employees'        },
  { pageId: 'attendance',       pageName: 'Attendance',       pagePath: '/admin/attendance'       },
  { pageId: 'leave',            pageName: 'Leave',            pagePath: '/admin/leave'            },
  { pageId: 'payroll',          pageName: 'Payroll',          pagePath: '/admin/payroll'          },
  { pageId: 'onboarding',       pageName: 'Onboarding',       pagePath: '/admin/onboarding'       },
  { pageId: 'certificates',     pageName: 'Certificates',     pagePath: '/admin/certificates'     },
  { pageId: 'admins',           pageName: 'Admins',           pagePath: '/admin/admins'           },
  { pageId: 'settings',         pageName: 'Settings',         pagePath: '/admin/settings'         },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function parsePagePermissions(doc: PagePermissionDoc): PagePermissions {
  let rolePerms: Record<AppRole, Perm[]> = { ...DEFAULT_ROLE_PERMS };
  let userOverrides: Record<string, UserOverride> = {};

  try { rolePerms     = JSON.parse(doc.rolePerms);     } catch {}
  try { userOverrides = JSON.parse(doc.userOverrides); } catch {}

  return { pageId: doc.pageId, pageName: doc.pageName, pagePath: doc.pagePath, rolePerms, userOverrides };
}

/**
 * Check if a user has a specific permission on a page.
 * Admin always passes. User overrides take priority over role defaults.
 */
export function hasPermission(
  permissions: PagePermissions | null,
  role: AppRole,
  userId: string,
  perm: Perm,
): boolean {
  // No permissions doc → use defaults
  if (!permissions) return DEFAULT_ROLE_PERMS[role]?.includes(perm) ?? false;

  // User override takes priority
  const override = permissions.userOverrides[userId];
  if (override) return override.perms.includes(perm);

  // Fall back to role-based
  return permissions.rolePerms[role]?.includes(perm) ?? false;
}

export function canRead  (p: PagePermissions | null, role: AppRole, uid: string) { return hasPermission(p, role, uid, 'r'); }
export function canWrite (p: PagePermissions | null, role: AppRole, uid: string) { return hasPermission(p, role, uid, 'w'); }
export function canUpdate(p: PagePermissions | null, role: AppRole, uid: string) { return hasPermission(p, role, uid, 'u'); }
export function canDelete(p: PagePermissions | null, role: AppRole, uid: string) { return hasPermission(p, role, uid, 'd'); }

/**
 * Get pageId from pathname (e.g., "/admin/employees" → "employees")
 * Also returns parent page if child route has no explicit permissions.
 * E.g., "/admin/employees/[id]" falls back to "employees" page
 */
export function getPageIdFromPath(pathname: string): string | null {
  // Find exact match first
  const exactPage = MANAGED_PAGES.find(p => pathname === p.pagePath);
  if (exactPage) return exactPage.pageId;

  // Find parent page (longest matching path that this is a child of)
  const parentPage = MANAGED_PAGES.filter(p => pathname.startsWith(p.pagePath + '/'))
    .sort((a, b) => b.pagePath.length - a.pagePath.length)[0];
  
  return parentPage?.pageId ?? null;
}
