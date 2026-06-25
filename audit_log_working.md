# Audit Log Integration — Implementation Plan

> **Goal:** Wire `auditLog()` from `src/lib/audit-logger.ts` into every meaningful action across the
> application so the audit log page at `/admin/audit-log` shows real data.
>
> **Modules in scope:** `payroll`, `leave`, `attendance`, `roles`, `employee`, `documents`, `reports`, `auth`, `audit`
>
> **Severity auto-assigned** by `audit-logger.ts`; only override when the logger can't infer it.
>
> **Actor context:** Every server action and API route must extract the actor from either
> the `x-user-id` header (API routes) or `requireAuth()` (server actions) before calling `auditLog()`.

---

## Constraints (from constants in `audit-log/page.tsx`)

```ts
MODULES:    payroll | leave | attendance | roles | employee | documents | reports | auth | audit
ACTIONS:    create | read | update | delete | export | login | login_failed | password_reset
SEVERITIES: critical | high | medium | low      (auto-assigned; manual override allowed)
RESULTS:    success | failed
```

---

## Phase 1 — Auth Module

### 1.1 `src/app/api/admin/users/[userId]/check-or-init/route.ts`
**Trigger:** POST — called right after magic-link verification succeeds.
**Events to log:**
- `action_type: 'login'`, `module: 'auth'`, `result: 'success'` — user authenticated via magic link.
- If `initialized: true` (first login), additionally log `action_type: 'create'`, `module: 'employee'` — new account activated.

**Fields to capture:**
```ts
actor_id:            userId            // from params
actor_name_snapshot: user.name
actor_role_snapshot: role              // resolved role string
description:         "Magic link login — first login, assigned new_user" | "Magic link login — existing role: {role}"
```

> Note: No `x-user-id` header is available here (the user is just verifying). Use `userId` from params directly.

---

### 1.2 `src/app/api/admin/users/[userId]/label/route.ts` (PATCH)
**Trigger:** Admin changes another user's role.
**Events to log:**
- `action_type: 'update'`, `module: 'roles'`, `result: 'success' | 'failed'`

**Fields to capture:**
```ts
actor_id:             actorId                    // request.headers.get('x-user-id')
actor_name_snapshot:  actorUser.name
actor_role_snapshot:  actorRole
target_id:            userId                     // the user being changed
target_name_snapshot: targetUser.name
field_changes: [{
  field: 'role',
  old_value: targetRole,                         // resolved from targetUser.labels before change
  new_value: body.role
}]
```

> Severity auto-escalates to `critical` for role upgrades (the logger already handles this for `module: 'roles'`).

---

### 1.3 `src/app/api/admin/users/[userId]/disapprove/route.ts` (POST)
**Trigger:** Admin removes all labels — account locked.
**Events to log:**
- `action_type: 'update'`, `module: 'roles'`, `result: 'success' | 'failed'`

```ts
actor_id:             request.headers.get('x-user-id')
target_id:            userId
target_name_snapshot: currentUser.name
field_changes: [{ field: 'role', old_value: currentRole, new_value: 'none (disapproved)' }]
description:         "Account disapproved — all labels removed"
```

---

### 1.4 `src/app/api/admin/users/[userId]/delete/route.ts` (DELETE)
**Trigger:** Permanent user deletion.
**Events to log:**
- `action_type: 'delete'`, `module: 'employee'`, `result: 'success' | 'failed'`
- `severity: 'critical'` (manual override — user deletion is always critical)

```ts
actor_id:             request.headers.get('x-user-id')
target_id:            userId
target_name_snapshot: deletedUser.name
target_employee_id:   deletedUser.email   // best proxy for employee ID here
description:          "User account permanently deleted"
```

---

## Phase 2 — Employee Module

### 2.1 `src/app/(actions)/employees.ts` → `updateEmployeeAction()`
**Trigger:** Any field update to an employee record.
**Events to log:**
- `action_type: 'update'`, `module: 'employee'`, `result: 'success' | 'failed'`

**Implementation approach:**
1. Before calling `dbUpdateEmployee()`, fetch the current record with `dbFetchEmployee(id)`.
2. Diff the before vs. after objects for changed fields.
3. Call `auditLog()` with `field_changes` containing each changed field.

```ts
field_changes: changedFields.map(key => ({
  field:     key,
  old_value: String(before[key] ?? ''),
  new_value: String(after[key] ?? ''),
}))
```

> Sensitive fields: `ctc`, `accountNumber`, `ifscCode`, `bankName`, `uanNumber` — auto-assigned `critical` by logger when `module: 'payroll'` or manually tagged when `module: 'employee'`.

---

### 2.2 `src/app/api/upload-employees/route.ts` (POST)
**Trigger:** Bulk Excel upload — creates or updates many employee records.
**Events to log:**
- `action_type: 'create'`, `module: 'employee'`, `result: 'success' | 'failed'`
- Single log entry for the entire batch (not per-row).

```ts
description:  "Bulk employee upload — {created} created, {updated} updated, {failed} failed"
metadata: { created, updated, failed, filename, row_count }
```

> Actor is unavailable (no session in bulk upload). Log `actor_id: null` and `actor_name_snapshot: 'system/upload'`.

---

### 2.3 Onboarding Approval → `src/app/api/onboarding/submissions/[id]/review/route.ts` (PATCH)
**Trigger:** HR approves or rejects a candidate.
**Events to log (on approve):**
- `action_type: 'create'`, `module: 'employee'`, `result: 'success' | 'failed'`

```ts
actor_id:             user.$id
actor_name_snapshot:  user.name
actor_role_snapshot:  user.labels?.[0]
target_name_snapshot: sub.fullName
target_employee_id:   empId          // the generated AIR#### ID
description:          "Onboarding approved — employee created with ID {empId}"
```

**On reject:**
- `action_type: 'update'`, `module: 'employee'`, `result: 'success'`
- `description: "Onboarding rejected — candidate: {sub.fullName}"`

---

### 2.4 Onboarding Invite → `src/app/api/onboarding/invite/route.ts` (POST)
**Trigger:** HR creates a new invite link.
**Events to log:**
- `action_type: 'create'`, `module: 'employee'`, `result: 'success'`

```ts
actor_id:             hrUser.$id
actor_name_snapshot:  hrUser.name
description:          "Onboarding invite created — label: {label}, expires: {expiresAt}"
```

---

## Phase 3 — Leave Module

### 3.1 `src/app/(actions)/leave.ts` → `applyForLeaveAction()`
**Events to log:**
- `action_type: 'create'`, `module: 'leave'`, `result: 'success' | 'failed'`

```ts
target_employee_id:   employeeId
target_name_snapshot: employeeName
description:          "{leaveType} leave applied — {startDate} to {endDate} ({duration} days)"
```

> **Problem:** `applyForLeaveAction` is a server action with no `Request` context, so no IP/user-agent. The actor must be injected by the caller (the page component). **Solution:** Add an optional `actorContext?: { actorId, actorName, actorRole }` parameter to the action signature.

---

### 3.2 `approveLeaveAction()` and `rejectLeaveAction()`
**Events to log:**
- `action_type: 'update'`, `module: 'leave'`, `result: 'success' | 'failed'`
- Approval: `description: "Leave approved — {employeeName}, {duration} days {leaveType}"`
- Rejection: `description: "Leave rejected — {employeeName}"`

Same actor-context pattern as 3.1.

---

## Phase 4 — Payroll Module

### 4.1 `src/app/(actions)/payroll.ts` → `processMonthPayrollAction()`
**Trigger:** Payroll is finalized/processed for a month.
**Events to log:**
- `action_type: 'create'`, `module: 'payroll'`, `severity: 'critical'`, `result: 'success' | 'failed'`

```ts
description: "Payroll processed — {year}-{month}, {count} employees, total net: ₹{totalNet}"
metadata: { year, month, employee_count, total_net_salary }
```

---

### 4.2 `deletePayrollAction()`
**Trigger:** Payroll run deleted/undone.
**Events to log:**
- `action_type: 'delete'`, `module: 'payroll'`, `severity: 'critical'`, `result: 'success' | 'failed'`

```ts
description: "Payroll deleted — {year}-{month}"
```

---

### 4.3 `approveMonthPayrollAction()`
**Events to log:**
- `action_type: 'update'`, `module: 'payroll'`, `severity: 'critical'`, `result: 'success' | 'failed'`
- `description: "Payroll approved — {year}-{month}"`

---

### 4.4 Payroll Page View (`src/app/admin/payroll/page.tsx`)
**Trigger:** User views payroll data (salary is sensitive).
**Events to log:**
- `action_type: 'read'`, `module: 'payroll'`, `severity: 'medium'`
- `description: "Viewed payroll — {year}-{month}"`

> Since this is a client component, use a **useEffect** that calls a lightweight API endpoint `/api/audit-logs/record` (see Phase 6 below) to log the page view.

---

## Phase 5 — Attendance Module

### 5.1 `saveMonthlyAttendanceAction()` / `saveBulkAttendanceAction()`
**Trigger:** Attendance data saved or bulk-imported.
**Events to log:**
- `action_type: 'update'` (or `'create'`), `module: 'attendance'`, `result: 'success' | 'failed'`

```ts
description: "Attendance saved — {employeeId}, {month}/{year}"
// For bulk:
description: "Bulk attendance import — {count} employees, {month}/{year}"
metadata: { employee_count, month, year }
```

---

### 5.2 `deleteMonthlyAttendanceAction()`
**Events to log:**
- `action_type: 'delete'`, `module: 'attendance'`, `result: 'success' | 'failed'`

---

## Phase 6 — Roles & Permissions Module

### 6.1 `src/app/api/permissions/[pageId]/route.ts` (PATCH)
**Trigger:** Admin changes role permissions or user permission overrides for a page.
**Events to log:**
- `action_type: 'update'`, `module: 'roles'`, `result: 'success' | 'failed'`

**For `type: 'role'` patch:**
```ts
description:  "Role permissions updated — page: {pageId}, role: {role}"
field_changes: [{ field: `${pageId}.${role}`, old_value: oldPerms.join(','), new_value: newPerms.join(',') }]
```

**For `type: 'user'` patch:**
```ts
description:  "User permission override set — page: {pageId}, user: {name}"
field_changes: [{ field: `${pageId}.user.${userId}`, old_value: oldPerms ?? 'none', new_value: newPerms.join(',') }]
```

**For `type: 'removeUser'`:**
```ts
description:  "User permission override removed — page: {pageId}, user: {userId}"
action_type:  'delete'
```

---

## Phase 7 — Documents Module

### 7.1 Certificate Generation → `src/app/api/certificates/download-all/route.ts` (POST)
**Trigger:** Bulk certificate PDF download.
**Events to log:**
- `action_type: 'export'`, `module: 'documents'`, `result: 'success' | 'failed'`

```ts
description: "Bulk certificate download — {count} certificates"
metadata: { count: certificates.length }
```

### 7.2 Leave Document Upload → `src/app/api/leave/upload/route.ts` (POST)
**Trigger:** Employee uploads leave evidence document.
**Events to log:**
- `action_type: 'create'`, `module: 'documents'`, `result: 'success' | 'failed'`

```ts
description: "Leave document uploaded — leaveId: {leaveId}, {fileCount} file(s)"
```

---

## Phase 8 — Audit Log Self-Logging

### 8.1 Viewing Audit Log Page (`src/app/admin/audit-log/page.tsx`)
**Trigger:** Authorized user views the audit log page.
**Events to log (once on mount):**
- `action_type: 'read'`, `module: 'audit'`, `severity: 'low'`

**Implementation:** Call a new lightweight internal endpoint `POST /api/audit-logs/record` from a `useEffect` on mount.

### 8.2 Export Already Logged
The export route (`/api/audit-logs/export/route.ts`) already logs itself as `critical`. ✅

---

## Phase 9 — New Helper Endpoint

### 9.1 Create `src/app/api/audit-logs/record/route.ts`
A lightweight `POST` endpoint that client components can call to log events that happen purely on the client side (page views, downloads, exports triggered from buttons).

```ts
// POST /api/audit-logs/record
// Body: Partial<AuditEntry> — actor extracted from x-user-id header
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const body = await req.json();
  await auditLog({
    ...body,
    actor_id:            user?.$id,
    actor_name_snapshot: user?.name,
    actor_role_snapshot: user?.labels?.[0],
    actor_ip:            extractActorMeta(req).actor_ip,
    actor_user_agent:    req.headers.get('user-agent') ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
```

This allows all `"use client"` components to log events without leaking server credentials.

---

## File-by-File Modification Summary

| File | Changes Required | Priority |
|---|---|---|
| `src/app/api/admin/users/[userId]/check-or-init/route.ts` | Add `auditLog` for login event | 🔴 High |
| `src/app/api/admin/users/[userId]/label/route.ts` | Add `auditLog` for role change (with field diff) | 🔴 High |
| `src/app/api/admin/users/[userId]/disapprove/route.ts` | Add `auditLog` for disapproval | 🔴 High |
| `src/app/api/admin/users/[userId]/delete/route.ts` | Add `auditLog` for deletion | 🔴 High |
| `src/app/api/onboarding/submissions/[id]/review/route.ts` | Add `auditLog` for approval/rejection | 🔴 High |
| `src/app/api/onboarding/invite/route.ts` | Add `auditLog` for invite creation | 🟡 Medium |
| `src/app/api/permissions/[pageId]/route.ts` | Add `auditLog` for PATCH (role/user/remove) | 🔴 High |
| `src/app/api/upload-employees/route.ts` | Add `auditLog` for bulk upload | 🟡 Medium |
| `src/app/api/leave/upload/route.ts` | Add `auditLog` for document upload | 🟢 Low |
| `src/app/api/certificates/download-all/route.ts` | Add `auditLog` for bulk download | 🟡 Medium |
| `src/app/(actions)/leave.ts` — `applyForLeaveAction` | Add actor param + `auditLog` | 🟡 Medium |
| `src/app/(actions)/leave.ts` — `approveLeaveAction` | Add `auditLog` | 🔴 High |
| `src/app/(actions)/leave.ts` — `rejectLeaveAction` | Add `auditLog` | 🔴 High |
| `src/app/(actions)/employees.ts` — `updateEmployeeAction` | Add diff + `auditLog` | 🔴 High |
| `src/app/(actions)/payroll.ts` — `processMonthPayrollAction` | Add `auditLog` critical | 🔴 High |
| `src/app/(actions)/payroll.ts` — `deletePayrollAction` | Add `auditLog` critical | 🔴 High |
| `src/app/(actions)/payroll.ts` — `approveMonthPayrollAction` | Add `auditLog` critical | 🔴 High |
| `src/app/(actions)/attendance.ts` — `saveMonthlyAttendanceAction` | Add `auditLog` | 🟡 Medium |
| `src/app/(actions)/attendance.ts` — `saveBulkAttendanceAction` | Add `auditLog` | 🟡 Medium |
| `src/app/(actions)/attendance.ts` — `deleteMonthlyAttendanceAction` | Add `auditLog` | 🟡 Medium |
| `src/app/admin/audit-log/page.tsx` | Add `useEffect` to log page view | 🟢 Low |
| `src/app/api/audit-logs/record/route.ts` | **NEW** — lightweight client-side log endpoint | 🔴 High |

---

## Implementation Checkpoints

- [ ] **C1** — Create `src/app/api/audit-logs/record/route.ts` (needed by all client-side logs)
- [ ] **C2** — Auth: `check-or-init` login log
- [ ] **C3** — Auth: `label` route — role change with field diff
- [ ] **C4** — Auth: `disapprove` route
- [ ] **C5** — Auth: `delete` route
- [ ] **C6** — Permissions: PATCH `/api/permissions/[pageId]` (role, user, removeUser)
- [ ] **C7** — Employee: `updateEmployeeAction` with field diff
- [ ] **C8** — Employee: bulk upload (`/api/upload-employees`)
- [ ] **C9** — Onboarding: review route (approve + reject)
- [ ] **C10** — Onboarding: invite route
- [ ] **C11** — Leave: `applyForLeaveAction` (add actor param)
- [ ] **C12** — Leave: `approveLeaveAction`
- [ ] **C13** — Leave: `rejectLeaveAction`
- [ ] **C14** — Payroll: `processMonthPayrollAction`
- [ ] **C15** — Payroll: `deletePayrollAction`
- [ ] **C16** — Payroll: `approveMonthPayrollAction`
- [ ] **C17** — Attendance: `saveMonthlyAttendanceAction` + `saveBulkAttendanceAction`
- [ ] **C18** — Attendance: `deleteMonthlyAttendanceAction`
- [ ] **C19** — Documents: certificate download + leave upload
- [ ] **C20** — Self-log: audit log page view

---

## Implementation Notes

### Server Actions (no Request object)
Server actions (`"use server"`) in `src/app/(actions)/` don't receive a `NextRequest`, so there is no IP or user-agent available. Use `requireAuth()` to get the actor user object and pass `actor_ip: 'server-action'` as a placeholder. For actor context in functions like `applyForLeaveAction` that take only data params, add an optional `actorContext` argument:

```ts
interface ActorContext {
  actorId?: string;
  actorName?: string;
  actorRole?: string;
}
```

### Fire-and-Forget Pattern
Always call `auditLog()` **after** the primary operation succeeds, and **never** `await` it in the hot path unless you need to log failures:

```ts
// ✅ Correct — fire and forget after success
const result = await doTheThing();
auditLog({ ... result: 'success' }); // no await — non-blocking
return result;

// ✅ Also correct — log failure in catch
} catch (err) {
  auditLog({ ... result: 'failed', description: err.message }); // no await
  throw err;
}
```

### Field Diff Helper
Add a small utility to `src/lib/audit-logger.ts`:

```ts
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
  watchKeys: (keyof T)[],
): FieldChange[] {
  return watchKeys
    .filter(k => String(before[k] ?? '') !== String(after[k] ?? ''))
    .map(k => ({
      field:     String(k),
      old_value: String(before[k] ?? ''),
      new_value: String(after[k] ?? ''),
    }));
}
```
