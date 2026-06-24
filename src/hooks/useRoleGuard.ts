'use client';

import { useCurrentUser } from './useCurrentUser';
import { canSeeSalaryOf, canChangeRoleOf, type AppRole } from '@/lib/permissions';

/**
 * Pre-wired hierarchy hook.
 * Exposes canSeeSalaryOf and canChangeRoleOf bound to the currently logged-in user's role.
 */
export function useRoleGuard() {
  const { currentUser } = useCurrentUser();
  const myRole = ((currentUser?.role ?? 'new_user') as AppRole);

  return {
    /** Can the current user see the salary of a user holding targetRole? */
    canSeeSalaryOf:  (targetRole: AppRole) => canSeeSalaryOf(myRole, targetRole),
    /** Can the current user change the role of a user currently holding targetRole? */
    canChangeRoleOf: (targetRole: AppRole) => canChangeRoleOf(myRole, targetRole),
    myRole,
  };
}
