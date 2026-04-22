import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, ID } from 'node-appwrite';
import { ensureOnboardingSchema } from '@/lib/onboarding-init';
import { getAuthenticatedUser } from '@/lib/auth-utils';

const createAdminClient = () =>
  new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

const DB_ID    = () => process.env.APPWRITE_DATABASE_ID || '';
const SUBS_COL = () => process.env.APPWRITE_ONBOARDING_SUBMISSIONS_COLLECTION_ID || 'onboarding_submissions';
const EMP_COL  = () => process.env.APPWRITE_COLLECTION_ID || '';

/**
 * PATCH /api/onboarding/submissions/[id]/review
 * HR approves or rejects a submission.
 * Body: { action: 'approve' | 'reject', notes?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id }           = await params;
  const body             = await req.json().catch(() => ({}));
  const { action, notes = '' } = body;

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  try {
    await ensureOnboardingSchema();
    const databases = new Databases(createAdminClient());

    // Fetch submission
    const sub = await databases.getDocument({
      databaseId: DB_ID(),
      collectionId: SUBS_COL(),
      documentId: id,
    });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const reviewData: Record<string, any> = {
      status:     newStatus,
      reviewedBy: (user as any).email || (user as any).name,
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes,
    };

    // On approval — create a stub employee record
    let employeeId: string | undefined;
    if (action === 'approve') {
      try {
        const empId = `EMP-${Date.now()}`;
        await databases.createDocument({
          databaseId:   DB_ID(),
          collectionId: EMP_COL(),
          documentId:   ID.unique(),
          data: {
            employeeId:    empId,
            name:          sub.fullName,
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
      } catch (empErr: any) {
        // Non-fatal — still mark as approved even if employee record creation fails
        console.warn('[review] Could not auto-create employee record:', empErr.message);
      }
    }

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
