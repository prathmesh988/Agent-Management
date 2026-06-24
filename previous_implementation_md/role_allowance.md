# Role-Hierarchy Salary Visibility & Role-Change Guard

## Background

The system has two interrelated security gaps:

1. **Salary visibility is flat** — every authenticated user who can access employee records sees CTC, gross salary, and net salary for _all_ employees, regardless of the viewer's seniority relative to the subject.
2. **Role assignment has no hierarchy guard** — any user with the `Update` permission on the Admins page can promote a `viewer` to `admin` or demote another `admin`, even if that other user outranks them.

---

## Role Hierarchy

The existing roles form a strict seniority ladder (higher number = more senior):

| Rank | Role       | Symbol |
|------|------------|--------|
| 5    | `admin`    | crown  |
| 4    | `manager`  | office |
| 3    | `hr`       | people |
| 2    | `mvp`      | rocket |
| 1    | `viewer`   | eye    |
| 0    | `new_user` | clock  |

### Visibility rules derived from hierarchy

| Actor vs Target role | See salary? | Change role? |
|---|---|---|
| Actor rank **>** Target rank | YES | YES |
| Actor rank **=** Target rank | NO  | NO  |
| Actor rank **<** Target rank | NO  | NO  |

`admin` is the only role that sees all salaries and can assign all roles (including other admins). This preserves the existing "admin always wins" invariant already in `hasPermission`.

---

## Open Questions

> [!IMPORTANT]
> **Employee to Admin user linkage**: The `Employee` table (Appwrite DB) and the Appwrite Users table (admin users with roles) are separate. An employee's _role_ is only known if their email matches an entry in the admin users list. The plan below assumes a cross-reference by **email**. Confirm this is the correct join key, or supply an alternative (e.g., a stored `appwriteUserId` field on the employee record).

> [!NOTE]
> **Employees with no admin account**: If an employee has no matching admin user entry (i.e., they are not a system user at all), they have no role. For salary visibility purposes these employees are treated as `new_user` (rank 0), so any authenticated user can see their salary. Adjust if this differs from intended behaviour.

---

## Proposed Changes

---

### 1 — Shared Utilities

#### [MODIFY] `src/lib/permissions.ts`

Add a numeric hierarchy map and two pure helper functions used by every layer below.

```ts
// Role Hierarchy
/** Numeric rank. Higher = more senior. */
export const ROLE_RANK: Record<AppRole, number> = {
  admin:    5,
  manager:  4,
  hr:       3,
  mvp:      2,
  viewer:   1,
  new_user: 0,
};

/**
 * Returns true when actorRole outranks targetRole.
 * Equal rank returns false — peers cannot see each other's salaries.
 */
export function canSeeSalaryOf(actorRole: AppRole, targetRole: AppRole): boolean {
  if (actorRole === 'admin') return true;
  return ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
}

/**
 * Returns true when actorRole can assign or change the role of a user
 * currently holding targetRole.
 * Equal rank and upward are both blocked.
 */
export function canChangeRoleOf(actorRole: AppRole, targetRole: AppRole): boolean {
  if (actorRole === 'admin') return true;
  return ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
}
```

---

### 2 — Backend Guards

#### [MODIFY] `src/app/api/admin/users/[userId]/label/route.ts`

The `PATCH /api/admin/users/[userId]/label` endpoint currently applies a role change with zero hierarchy check. Add a server-side guard:

**Steps inside the handler:**

1. Read the requesting user's ID from the `x-user-id` request header (already used by the `current-user` endpoint).
2. Fetch the requester's Appwrite user record to get their current label and derive `actorRole`.
3. Fetch the target user's current label and derive `targetRole`.
4. Call `canChangeRoleOf(actorRole, targetRole)`. If false, return `403 Forbidden`.
5. Additionally, reject any attempt to assign a role **equal to or higher** than the actor's own rank (prevents self-promotion or leapfrog upgrades).

```ts
// pseudo-code
const actorLabels = (await users.get(actorId)).labels ?? [];
const actorRole   = resolveRole(actorLabels); // same logic as /api/admin/users route.ts
const targetUser  = await users.get(userId);
const targetRole  = resolveRole(targetUser.labels ?? []);

if (!canChangeRoleOf(actorRole, targetRole)) {
  return NextResponse.json(
    { error: 'You cannot change the role of a user with equal or higher rank.' },
    { status: 403 }
  );
}

const requestedRank = ROLE_RANK[body.role as AppRole] ?? -1;
if (requestedRank >= ROLE_RANK[actorRole] && actorRole !== 'admin') {
  return NextResponse.json(
    { error: 'You cannot assign a role equal to or higher than your own.' },
    { status: 403 }
  );
}
```

> [!CAUTION]
> The `x-user-id` header must be sent by the client. It is **not** verified cryptographically in the current codebase — the backend trusts the client-supplied ID. This is pre-existing behaviour (used by `/api/admin/current-user`). For a production hardening pass, derive the actor ID from the Appwrite session cookie instead.

---

### 3 — New Utility Hook

#### [NEW] `src/hooks/useRoleGuard.ts`

A thin client-side hook that exposes the hierarchy helpers pre-wired to the current user's role.

```ts
import { useCurrentUser } from './useCurrentUser';
import { canSeeSalaryOf, canChangeRoleOf, AppRole } from '@/lib/permissions';

export function useRoleGuard() {
  const { currentUser } = useCurrentUser();
  const myRole = (currentUser?.role ?? 'new_user') as AppRole;

  return {
    canSeeSalaryOf:  (targetRole: AppRole) => canSeeSalaryOf(myRole, targetRole),
    canChangeRoleOf: (targetRole: AppRole) => canChangeRoleOf(myRole, targetRole),
    myRole,
  };
}
```

---

### 4 — Employee Role Resolver

#### [NEW] `src/lib/role-resolver.ts`

Because `Employee` records do not carry a role field directly, the viewer must resolve the employee's role by looking up their `email` in the admin users list.

```ts
import type { AppRole } from './permissions';

/** Module-level cache of email to role, built from /api/admin/users */
let roleCache: Map<string, AppRole> | null = null;

export async function resolveEmployeeRole(email: string): Promise<AppRole> {
  if (!roleCache) {
    const res  = await fetch('/api/admin/users');
    const data = await res.json();
    roleCache  = new Map((data.users ?? []).map((u: any) => [u.email, u.role]));
  }
  return roleCache.get(email) ?? 'new_user';
}

export function invalidateRoleCache() {
  roleCache = null;
}
```

For table views where many employees render at once, pre-fetch all roles in a single call and pass a `Map<email, AppRole>` as a prop — avoiding N individual requests per row.

---

### 5 — Salary Field Masking in the UI

The `SalaryCensor` helper component is the single rendering primitive used in all salary-displaying views:

```tsx
function SalaryCensor({ allowed, children }: { allowed: boolean; children: React.ReactNode }) {
  if (allowed) return <>{children}</>;
  return (
    <span
      className="inline-flex items-center gap-1 text-muted-foreground text-sm select-none"
      title="You do not have permission to view this field"
    >
      <Lock className="h-3 w-3" /> Restricted
    </span>
  );
}
```

#### [MODIFY] `src/components/admin/employee-detail-panel.tsx`

- Import `useRoleGuard` and `resolveEmployeeRole`.
- On mount, resolve the displayed employee's role via their `email`.
- Wrap every salary-related field in `<SalaryCensor allowed={canSeeSalaryOf(targetRole)}>`.

Fields to gate: `ctc`, `attendanceAllowance`, `shiftAllowance`, `grossSalary`, `attendanceDeduction`, `employeeContribution`, `employeeEsic`, `employerContribution`, `employerEsic`, `tds5perc`, `netSalary`, `paidAmount`, `arrear`, `advance`, `penalty`, and all incentive/bonus fields.

#### [MODIFY] `src/components/admin/payroll-table.tsx`

The payroll table shows `grossSalary`, `deductedAmount`, `tdsDeducted`, and `netSalary` per record.

- Pre-fetch employee roles for all visible rows before rendering.
- For each row, call `canSeeSalaryOf(targetRole)` and render a lock indicator instead of numeric values when restricted.

```tsx
<td className="py-3 px-4 text-right font-semibold text-green-600">
  {canSeeThisRow
    ? `${Number(record.netSalary).toLocaleString('en-IN')}`
    : <span className="text-muted-foreground text-xs flex items-center justify-end gap-1">
        <Lock className="h-3 w-3" /> Restricted
      </span>
  }
</td>
```

#### [NO CHANGE] `src/components/admin/employee-table.tsx`

The main employee listing does not currently display salary columns — no changes needed. If CTC is added as a column in future, apply the same `SalaryCensor` pattern and strip the field server-side as well.

---

### 6 — Role-Change Guard in the UI

#### [MODIFY] `src/components/admin/edit-role-modal.tsx`

Two changes:

1. **Visually disable out-of-reach roles** — roles at or above the actor's rank render with a lock badge and `cursor-not-allowed`. They remain visible so actors can understand the full hierarchy, but cannot be selected.
2. **Prevent the Save button** from firing if the selected role is out of reach.

```
Example: HR user editing a Viewer's role sees:
  [crown] Admin    — locked (above your rank)
  [office] Manager — locked (above your rank)
  [people] HR      — locked (same rank)
  [rocket] MVP     — selectable
  [eye]  Viewer    — selectable (current)
  [clock] New User — selectable
```

#### [MODIFY] `src/components/admin/admin-table.tsx`

- Import `useRoleGuard`.
- For each row compute `canEdit = canChangeRoleOf(row.role)`.
- When `canEdit` is false: Edit Role button and Delete button render with reduced opacity and `cursor-not-allowed` plus a tooltip.

#### [MODIFY] `src/app/admin/admins/page.tsx`

Add a client-side pre-check in `handleUpdateRole` before the API call:

```ts
const { canChangeRoleOf } = useRoleGuard();

const handleUpdateRole = async (adminId: string, role: AssignableRole) => {
  const target = admins.find(a => a.id === adminId);
  if (!target) return;

  if (!canChangeRoleOf(target.role as AppRole)) {
    toast.error('Permission denied', {
      description: 'You cannot change the role of a user with equal or higher rank.',
    });
    return;
  }
  // ... existing logic unchanged
};
```

This is a UX guard only. The authoritative enforcement is the server-side 403 in Step 2.

---

## Data Flow Summary

```
User opens Employee Detail / Payroll page
  |
  +-- useCurrentUser()              --> actorRole (e.g. "hr")
  |
  +-- resolveEmployeeRole(email)    --> targetRole (e.g. "manager")
  |
  +-- canSeeSalaryOf(actor, target)
        |
        +-- true  --> render currency value
        +-- false --> render lock + "Restricted"

User clicks Edit Role in Admin table
  |
  +-- useRoleGuard().canChangeRoleOf(target.role)
  |     +-- false --> toast error, return (client guard)
  |
  +-- PATCH /api/admin/users/[id]/label
        +-- server checks actorRole vs targetRole
              +-- 403 if blocked  (server guard, source of truth)
              +-- 200 if allowed  (labels updated in Appwrite)
```

---

## Files Changed Summary

| File | Change | Why |
|------|--------|-----|
| `src/lib/permissions.ts` | Add `ROLE_RANK`, `canSeeSalaryOf`, `canChangeRoleOf` | Single source of truth for hierarchy logic |
| `src/lib/role-resolver.ts` **[NEW]** | Email to AppRole lookup with module-level cache | Cross-reference employees with admin users |
| `src/hooks/useRoleGuard.ts` **[NEW]** | Pre-wired hierarchy hook | Clean component-level API |
| `src/app/api/admin/users/[userId]/label/route.ts` | Server-side 403 guard | Authoritative enforcement — UI cannot bypass |
| `src/components/admin/employee-detail-panel.tsx` | SalaryCensor on all pay fields | Per-field salary masking for restricted viewers |
| `src/components/admin/payroll-table.tsx` | Per-row salary masking | Hide payroll figures for restricted viewers |
| `src/components/admin/edit-role-modal.tsx` | Disable out-of-reach role options | Prevent assigning equal or higher roles |
| `src/components/admin/admin-table.tsx` | Disable Edit/Delete for equal or higher rows | Visual signal and prevent accidental clicks |
| `src/app/admin/admins/page.tsx` | Client-side pre-check in handleUpdateRole | Fast UX feedback before the API call |

---

## Verification Plan

### Automated

- `tsc --noEmit` — zero type errors after adding new exports to `permissions.ts`.
- Unit tests for `canSeeSalaryOf` and `canChangeRoleOf` covering all rank-pair combinations.

### Manual Role Matrix

| Logged-in as | Target user role | See salary? | Change role? |
|---|---|---|---|
| `admin` | `admin` | YES | YES |
| `admin` | `viewer` | YES | YES |
| `manager` | `admin` | NO - Restricted | NO - Disabled |
| `manager` | `manager` | NO - Restricted | NO - Disabled |
| `manager` | `hr` | YES | YES |
| `hr` | `manager` | NO - Restricted | NO - Disabled |
| `hr` | `hr` | NO - Restricted | NO - Disabled |
| `hr` | `viewer` | YES | YES |
| `viewer` | `viewer` | NO - Restricted | NO - Disabled |

### API-level Test

Direct `PATCH /api/admin/users/[id]/label` with a forged `x-user-id` of a `viewer` trying to assign a `manager` role must return HTTP `403`.
