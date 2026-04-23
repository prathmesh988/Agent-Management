import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, ID, Query } from 'node-appwrite';
import { ensureOnboardingSchema } from '@/lib/onboarding-init';
import { getAuthenticatedUser } from '@/lib/auth-utils';

// ── Appwrite admin client ─────────────────────────────────────────────────────

const createAdminClient = () =>
  new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

const DB_ID    = () => process.env.APPWRITE_DATABASE_ID || '';
const SUBS_COL = () => process.env.APPWRITE_ONBOARDING_SUBMISSIONS_COLLECTION_ID || 'onboarding_submissions';
const EMP_COL  = () => process.env.APPWRITE_COLLECTION_ID || '';

// ── Employee ID generation ────────────────────────────────────────────────────

const ID_PREFIX = 'AIR';

/**
 * Page through all employee documents and collect the set of numeric suffixes
 * already used in AIR#### IDs.
 */
async function fetchExistingEmployeeNumbers(databases: Databases): Promise<Set<number>> {
  const used = new Set<number>();
  try {
    let cursor: string | undefined;
    // Paginate in batches of 100 (max Appwrite allows per query)
    for (let page = 0; page < 100; page++) {
      const queries: string[] = [Query.limit(100), Query.select(['employeeId'])];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const result = await databases.listDocuments({
        databaseId:   DB_ID(),
        collectionId: EMP_COL(),
        queries,
      });

      for (const doc of result.documents) {
        const raw: string = doc.employeeId ?? '';
        if (raw.startsWith(ID_PREFIX)) {
          const num = parseInt(raw.slice(ID_PREFIX.length), 10);
          if (!isNaN(num)) used.add(num);
        }
      }

      // No more pages
      if (result.documents.length < 100) break;
      cursor = result.documents[result.documents.length - 1].$id;
    }
  } catch (err) {
    console.warn('[generateEmployeeId] Could not list employees for ID generation:', err);
  }
  return used;
}

/**
 * Generate the next unique AIR#### employee ID.
 *
 * Algorithm:
 *  1. Fetch all existing AIR numeric suffixes from the DB.
 *  2. Start from max + 1.
 *  3. Increment until an unused number is found (self-resolving collision).
 *  4. Zero-pad to at least 4 digits.
 *
 * Example: existing = {1001, 1002, 1004} → candidate = 1003 (fills gap).
 * Next call after that: existing = {1001–1004} → candidate = 1005.
 */
async function generateEmployeeId(databases: Databases): Promise<string> {
  const used = await fetchExistingEmployeeNumbers(databases);

  if (used.size === 0) {
    return `${ID_PREFIX}1001`; // First employee ever
  }

  const max = Math.max(...used);
  let candidate = max + 1;

  // Self-resolving: skip any collision (e.g. manually entered AIR IDs)
  while (used.has(candidate)) {
    candidate++;
  }

  // Zero-pad to at least 4 digits (e.g. AIR1001, AIR9999, AIR10000)
  const padded = String(candidate).padStart(4, '0');
  return `${ID_PREFIX}${padded}`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

/**
 * PATCH /api/onboarding/submissions/[id]/review
 * HR approves or rejects a candidate submission.
 * Body: { action: 'approve' | 'reject', notes?: string }
 *
 * On approval:
 *  - Generates a sequential, collision-free AIR#### employee ID.
 *  - Creates a stub employee record in the employees collection.
 *  - Updates the submission document with status, reviewedBy, and employeeId.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id }                 = await params;
  const body                   = await req.json().catch(() => ({}));
  const { action, notes = '' } = body;

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  try {
    await ensureOnboardingSchema();
    const databases = new Databases(createAdminClient());

    // Fetch the submission
    const sub = await databases.getDocument({
      databaseId:   DB_ID(),
      collectionId: SUBS_COL(),
      documentId:   id,
    });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const reviewData: Record<string, any> = {
      status:      newStatus,
      reviewedBy:  (user as any).email || (user as any).name,
      reviewedAt:  new Date().toISOString(),
      reviewNotes: notes,
    };

    // ── Approval path: generate AIR#### ID and create employee record ──────────
    let employeeId: string | undefined;
    if (action === 'approve') {
      try {
        const empId = await generateEmployeeId(databases);

        await databases.createDocument({
          databaseId:   DB_ID(),
          collectionId: EMP_COL(),
          documentId:   ID.unique(),
          data: {
            employeeId:    empId,
            name:          sub.fullName,
            email:         sub.email         || '',
            designation:   'New Employee',
            process:       '',
            ctc:           0,
            accountNumber: sub.accountNumber || '',
            ifscCode:      sub.ifscCode      || '',
            bankName:      sub.bankName      || '',
            paymentMode:   'bank',
            uanNumber:     '',
          },
        });

        reviewData.employeeId = empId;
        employeeId = empId;
        console.log(`[review] Created employee ${empId} for submission ${id}`);
      } catch (empErr: any) {
        // Non-fatal — submission is still marked approved
        console.warn('[review] Could not auto-create employee record:', empErr.message);
      }
    }

    // Update the submission document
    await databases.updateDocument({
      databaseId:   DB_ID(),
      collectionId: SUBS_COL(),
      documentId:   id,
      data:         reviewData,
    });

    return NextResponse.json({ success: true, status: newStatus, employeeId });
  } catch (error: any) {
    console.error('[review] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
