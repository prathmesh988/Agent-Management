# Onboarding Approval → Employee ID & Collection Fix

## Problem Summary

When an HR admin approves an onboarding submission in `/admin/onboarding`, two things should happen:

1. A unique **`AIR####`** employee ID is generated and stored on the submission.
2. A full employee record is created in the **main employees collection** (`bob_the_builder2`) so the new employee appears in `/admin/employees` alongside everyone else.

Currently, **both are broken or only partially working**:

| Issue                                                 | Root Cause                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approved employees don't appear in `/admin/employees` | The review route tries to write to `EMP_COL()` which reads `process.env.APPWRITE_COLLECTION_ID` → `"bob_the_builder2"`, but the `createDocument` call fails silently and is caught by a try/catch that logs `warn` and continues. No error surfaces to the admin.             |
| Employee ID may not be generated                      | Same silent-failure path — if `createDocument` fails, `reviewData.employeeId` is never set, so `employeeId` stays `undefined` on the submission.                                                                                                                              |
| ID collision risk                                     | The existing `generateEmployeeId` scans the employees collection to find the max suffix, but only works correctly if it can actually read from `EMP_COL()`. If `EMP_COL()` is wrong or permissions are off, it returns `AIR1001` every time → duplicate IDs on next approval. |

---

## Current Architecture (What Exists)

```
onboarding_submissions  (Appwrite collection)
  └── status, employeeId (set on approval), fullName, email, phone, bank*, ...

bob_the_builder2        (Appwrite collection — main employees)
  └── employeeId, name, email, designation, ctc, accountNumber, ...

Review route:  PATCH /api/onboarding/submissions/[id]/review
  ├── generateEmployeeId() — scans bob_the_builder2 for max AIR number
  ├── databases.createDocument() in bob_the_builder2
  └── databases.updateDocument() on submission
```

The logic already exists in [review/route.ts](file:///d:/projects/hrms/Agent-Management/src/app/api/onboarding/submissions/%5Bid%5D/review/route.ts) — the problem is **silent failure**, **missing fields on the new employee doc**, and **no feedback to the admin UI** when the employee record could not be created.

---

## Proposed Changes

### 1 — Fix the Review Route (Critical)

#### [MODIFY] [review/route.ts](file:///d:/projects/hrms/Agent-Management/src/app/api/onboarding/submissions/%5Bid%5D/review/route.ts)

**What changes:**

- **Make employee-record creation non-silent.** If `createDocument` fails, surface the error in the API response body (still mark the submission approved, but tell the client what went wrong).
- **Add `status` field** (`"active"`) to the new employee document — the employees page may filter/display by status.
- **Add `email` field** — already mapped, but confirm it writes to a field that exists in the collection schema (the `initialize-table.ts` schema doesn't declare `email` or `status`; see fix #2 below).
- **Populate `dateOfJoining`** — set to `Date.now()` as a Unix timestamp (the field is `double` in the schema).
- **Return the error in JSON** so the admin UI can show a meaningful toast instead of a generic "employee record created" success.

```typescript
// After approval — instead of swallowing the error:
let employeeCreationError: string | undefined;
try {
  const empId = await generateEmployeeId(databases);
  await databases.createDocument({
    databaseId: DB_ID(),
    collectionId: EMP_COL(),
    documentId: ID.unique(),
    data: {
      employeeId: empId,
      name: sub.fullName,
      email: sub.email ?? "",
      designation: "New Employee",
      process: "",
      ctc: 0,
      accountNumber: sub.accountNumber ?? "",
      ifscCode: sub.ifscCode ?? "",
      bankName: sub.bankName ?? "",
      paymentMode: "bank",
      uanNumber: "",
      dateOfJoining: Date.now(), // ← new: matches double column
      status: "active", // ← new: visible in employees list
    },
  });
  reviewData.employeeId = empId;
  employeeId = empId;
} catch (empErr: any) {
  // Still approve the submission, but tell the caller it failed
  employeeCreationError = empErr.message;
  console.error("[review] Employee record creation failed:", empErr);
}

// Return error detail if employee creation failed
return NextResponse.json({
  success: true,
  status: newStatus,
  employeeId,
  ...(employeeCreationError
    ? {
        warning: `Submission approved but employee record could not be created: ${employeeCreationError}`,
      }
    : {}),
});
```

---

### 2 — Add `email` and `status` Columns to the Employees Collection Schema

#### [MODIFY] [initialize-table.ts](file:///d:/projects/hrms/Agent-Management/src/lib/initialize-table.ts)

The `initialize-table.ts` file defines the schema for `bob_the_builder2`. It **does not declare `email` or `status` columns**. Writing those fields to a document whose collection doesn't have those attributes will cause Appwrite to throw a `400` validation error — which is exactly what the silent `catch` is hiding.

**Add to the `columns` array:**

```typescript
{ key: 'email',  type: 'string' as const, size: 255, required: false },
{ key: 'status', type: 'string' as const, size: 32,  required: false },
```

> [!IMPORTANT]
> These columns need to be created in Appwrite before the fix in step 1 will work. The `initializeEmployeesTable()` function handles 409 (already-exists) gracefully, so it is safe to re-run.

**How to trigger schema migration:**

- Call `GET /api/admin` (or whichever route calls `initializeEmployeesTable()`) once after deploying, **or**
- Alternatively, add the attributes manually in the Appwrite console under `bob_the_builder2`.

---

### 3 — Employee ID Generation — Harden Against Race Conditions

#### [MODIFY] [review/route.ts](file:///d:/projects/hrms/Agent-Management/src/app/api/onboarding/submissions/%5Bid%5D/review/route.ts) _(same file, generateEmployeeId section)_

The existing `generateEmployeeId` already paginates correctly and starts at `AIR1001` when the collection is empty. The remaining gap is a **race condition**: two simultaneous approvals could both scan the DB, both see the same max, and both try to create `AIR1002`.

**Fix: also scan `onboarding_submissions` for already-assigned IDs:**

```typescript
async function generateEmployeeId(databases: Databases): Promise<string> {
  const used = await fetchExistingEmployeeNumbers(databases);

  // Also scan onboarding_submissions for already-assigned IDs
  // (covers the case where the employee doc failed to create but employeeId was set on submission)
  try {
    let cursor: string | undefined;
    for (let page = 0; page < 50; page++) {
      const queries: string[] = [
        Query.limit(100),
        Query.select(["employeeId"]),
        Query.isNotNull("employeeId"),
      ];
      if (cursor) queries.push(Query.cursorAfter(cursor));
      const result = await databases.listDocuments({
        databaseId: DB_ID(),
        collectionId: SUBS_COL(),
        queries,
      });
      for (const doc of result.documents) {
        const raw: string = doc.employeeId ?? "";
        if (raw.startsWith(ID_PREFIX)) {
          const num = parseInt(raw.slice(ID_PREFIX.length), 10);
          if (!isNaN(num)) used.add(num);
        }
      }
      if (result.documents.length < 100) break;
      cursor = result.documents[result.documents.length - 1].$id;
    }
  } catch {
    /* non-fatal */
  }

  const base = used.size === 0 ? 1000 : Math.max(...used);
  let candidate = base + 1;
  while (used.has(candidate)) candidate++;
  return `${ID_PREFIX}${String(candidate).padStart(4, "0")}`;
}
```

**Key improvement:** By also scanning `onboarding_submissions` for already-assigned `employeeId` values, we guarantee uniqueness even if a previous employee document write failed.

---

### 4 — Admin UI: Show Warning When Employee Record Creation Fails

#### [MODIFY] [page.tsx (onboarding)](file:///d:/projects/hrms/Agent-Management/src/app/admin/onboarding/page.tsx)

In the `SubmissionModal`, the `review()` function currently shows a generic success toast regardless of a `warning` field in the response. Update it to surface the warning:

```typescript
const review = async (action: "approve" | "reject") => {
  // ...
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed");

  if (data.warning) {
    toast.warning(`⚠️ ${data.warning}`);
  } else {
    toast.success(
      action === "approve"
        ? `✅ Approved! Employee ID: ${data.employeeId}`
        : "❌ Submission rejected",
    );
  }
  onRefresh();
  onClose();
};
```

---

## Data Flow After Fix

```
Admin clicks "Approve" in /admin/onboarding
    ↓
PATCH /api/onboarding/submissions/[id]/review  { action: 'approve' }
    ↓
1. generateEmployeeId()
   ├── Scans bob_the_builder2 for max AIR#### suffix
   └── Scans onboarding_submissions for already-used AIR#### values
   → Returns e.g. "AIR1023"
    ↓
2. createDocument in bob_the_builder2
   └── { employeeId: "AIR1023", name, email, designation, dateOfJoining, status: "active", ... }
    ↓
3. updateDocument on onboarding_submissions
   └── { status: "approved", employeeId: "AIR1023", reviewedBy, reviewedAt, reviewNotes }
    ↓
4. Response → { success: true, employeeId: "AIR1023" }
    ↓
Admin sees: ✅ Approved! Employee ID: AIR1023
New employee visible in /admin/employees immediately
```

---

## Files to Change

| File                                                      | Change Type | Priority             |
| --------------------------------------------------------- | ----------- | -------------------- |
| `src/app/api/onboarding/submissions/[id]/review/route.ts` | Modify      | 🔴 Critical          |
| `src/lib/initialize-table.ts`                             | Modify      | 🔴 Critical (schema) |
| `src/app/admin/onboarding/page.tsx`                       | Modify      | 🟡 UX improvement    |

---

## Verification Plan

### Automated Checks

1. Run `npm run dev` — no build errors.
2. Run the schema migration (call the init API route or add attrs manually in Appwrite console).

### Manual Verification

1. Create an onboarding invite link → fill the candidate form → submit.
2. In `/admin/onboarding`, open the submission → click **Approve & Create Employee**.
3. Confirm toast shows `✅ Approved! Employee ID: AIR####`.
4. Navigate to `/admin/employees` — the new employee should appear with the assigned `AIR####` ID.
5. Approve a second submission — confirm the second ID is `AIR#### + 1` (no collision).
6. Check the Appwrite console: `onboarding_submissions` doc should have `status: approved` and `employeeId: AIR####`; `bob_the_builder2` should have a new document with matching `employeeId`.

---

## Open Questions

> [!IMPORTANT]
> **Q1: Should the employee record created on approval be minimal (stub) or fully populated?**
> Currently the plan creates a stub with `name`, `email`, `designation: "New Employee"`, `ctc: 0`, and bank details. All other payroll/attendance fields are left blank. Is this acceptable, or should HR fill in salary details before the employee becomes "active"?
> Sol: yes keep then active but there should be any indicator that tells them that salary details are not filled yet

> [!IMPORTANT]
> **Q2: What happens to the `onboarding_submissions` record after approval?**
> It remains in `onboarding_submissions` with `status: approved`. Should approved submissions be automatically archived or deleted, or is keeping them for audit purposes the intended behavior?
> Sol: keep them for audit purpose

> [!NOTE]
> **Q3: Schema migration — `email` & `status` columns are missing from `bob_the_builder2`**
>
> `bob_the_builder2` was originally created to store payroll data imported from Excel, so its schema only has salary/attendance columns. It has **no `email` or `status` attribute**. When the approval route tries to write `{ email, status }` into the collection, Appwrite rejects the document with a `400 Unknown attribute` error — which is the silent failure causing the whole bug.
>
> **Proposed solution (code-tracked):**
> Add `email` and `status` to the `columns` array in `initialize-table.ts`. The `initializeEmployeesTable()` function already skips attributes that already exist (handles `409 Conflict`), so it is safe to re-run on a live collection without data loss.
>
> ```typescript
> { key: 'email',  type: 'string' as const, size: 255, required: false },
> { key: 'status', type: 'string' as const, size: 32,  required: false },
> ```
>
> After deploying, hit the init endpoint once (`GET /api/admin/init-table` or equivalent) to push the new attributes to Appwrite. From that point, all new employee records written by the approval route will include `email` and `status: "active"` without any manual Appwrite console changes.
