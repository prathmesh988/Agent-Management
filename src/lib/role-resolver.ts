import type { AppRole } from './permissions';

/** Module-level cache of email → role, built from /api/admin/users */
let roleCache: Map<string, AppRole> | null = null;

/**
 * Resolve an employee's AppRole by looking up their email in the admin users list.
 * Employees with no admin account are treated as 'new_user' (rank 0).
 */
export async function resolveEmployeeRole(email: string): Promise<AppRole> {
  if (!roleCache) {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    roleCache = new Map(
      (data.users ?? []).map((u: { email: string; role: AppRole }) => [u.email, u.role])
    );
  }
  return roleCache.get(email) ?? 'new_user';
}

/**
 * Pre-build the role cache from an already-fetched users array (avoids a second fetch).
 * Call this once when you have all users available, then use resolveEmployeeRole().
 */
export function buildRoleCache(users: { email: string; role: AppRole }[]) {
  roleCache = new Map(users.map((u) => [u.email, u.role]));
}

/** Invalidate the cache — call after a role update so the next lookup re-fetches. */
export function invalidateRoleCache() {
  roleCache = null;
}
