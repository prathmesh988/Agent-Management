import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Storage, ID, Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { ensureOnboardingSchema } from '@/lib/onboarding-init';

const createAdminClient = () =>
  new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

const DB_ID = () => process.env.APPWRITE_DATABASE_ID || '';
const TOKENS_COL = () => process.env.APPWRITE_ONBOARDING_TOKENS_COLLECTION_ID || 'onboarding_tokens';
const SUBS_COL = () => process.env.APPWRITE_ONBOARDING_SUBMISSIONS_COLLECTION_ID || 'onboarding_submissions';
const BUCKET_ID = () => process.env.APPWRITE_ONBOARDING_BUCKET_ID || 'onboarding_documents';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const FILE_FIELDS = ['aadharFile', 'panFile', 'resumeFile', 'photoFile', 'additionalFiles'];

/**
 * POST /api/onboarding/submit
 * Accepts multipart form data (files + JSON fields).
 * No authentication required — validated via token.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get('token') as string;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await ensureOnboardingSchema();
    const databases = new Databases(createAdminClient());
    const storage = new Storage(createAdminClient());

    // ── 1. Validate token ──────────────────────────────────────────
    const tokenResult = await databases.listDocuments({
      databaseId: DB_ID(),
      collectionId: TOKENS_COL(),
      queries: [Query.equal('token', token), Query.limit(1)],
    });

    if (tokenResult.total === 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const tokenDoc = tokenResult.documents[0];

    if (tokenDoc.status === 'expired' || tokenDoc.status === 'disabled') {
      return NextResponse.json({ error: 'This invite link is no longer valid.' }, { status: 410 });
    }
    if (new Date(tokenDoc.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired.' }, { status: 410 });
    }
    if (tokenDoc.maxUses > 0 && tokenDoc.usedCount >= tokenDoc.maxUses) {
      return NextResponse.json({ error: 'This invite link has reached its maximum uses.' }, { status: 410 });
    }

    // ── 2. Check for existing draft for this token (allow re-edit) ─
    const existingSubs = await databases.listDocuments({
      databaseId: DB_ID(),
      collectionId: SUBS_COL(),
      queries: [
        Query.equal('tokenId', tokenDoc.$id),
        Query.equal('email', (formData.get('email') as string) || ''),
        Query.limit(1),
      ],
    });
    const existingDoc = existingSubs.total > 0 ? existingSubs.documents[0] : null;

    // ── 3. Upload files ────────────────────────────────────────────
    const uploadedFileIds: Record<string, string> = {};
    const additionalFileIds: string[] = [];

    for (const fieldName of FILE_FIELDS) {
      const files = formData.getAll(fieldName) as File[];
      for (const file of files) {
        if (!file || file.size === 0) continue;

        // Validate
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: `File "${file.name}" exceeds 10 MB limit.` }, { status: 400 });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          return NextResponse.json({ error: `File type "${file.type}" is not allowed.` }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeFileName = `${tokenDoc.$id}_${fieldName}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        const uploaded = await storage.createFile({
          bucketId: BUCKET_ID(),
          fileId: ID.unique(),
          file: InputFile.fromBuffer(buffer, safeFileName),
        });

        if (fieldName === 'additionalFiles') {
          additionalFileIds.push(uploaded.$id);
        } else {
          // Map: aadharFile → aadharFileId
          uploadedFileIds[`${fieldName}Id`] = uploaded.$id;
        }
      }
    }

    // ── 4. Build submission data ───────────────────────────────────
    const submissionData = {
      tokenId: tokenDoc.$id,
      fullName: formData.get('fullName') as string || '',
      email: formData.get('email') as string || '',
      phone: formData.get('phone') as string || '',
      dateOfBirth: formData.get('dateOfBirth') as string || '',
      gender: formData.get('gender') as string || '',
      addressLine1: formData.get('addressLine1') as string || '',
      addressLine2: formData.get('addressLine2') as string || '',
      city: formData.get('city') as string || '',
      state: formData.get('state') as string || '',
      pincode: formData.get('pincode') as string || '',
      country: formData.get('country') as string || 'India',
      bankName: formData.get('bankName') as string || '',
      accountNumber: formData.get('accountNumber') as string || '',
      ifscCode: formData.get('ifscCode') as string || '',
      accountHolderName: formData.get('accountHolderName') as string || '',
      ...uploadedFileIds,
      additionalFileIds: additionalFileIds.join(','),
      status: 'pending_verification',
      submittedAt: new Date().toISOString(),
    };

    // ── 5. Upsert submission ───────────────────────────────────────
    let submissionDoc;
    if (existingDoc && existingDoc.status === 'pending_verification') {
      // Allow editing until HR starts review
      submissionDoc = await databases.updateDocument({
        databaseId: DB_ID(),
        collectionId: SUBS_COL(),
        documentId: existingDoc.$id,
        data: submissionData,
      });
    } else if (!existingDoc) {
      submissionDoc = await databases.createDocument({
        databaseId: DB_ID(),
        collectionId: SUBS_COL(),
        documentId: ID.unique(),
        data: submissionData,
      });
      // Increment token use count
      await databases.updateDocument({
        databaseId: DB_ID(),
        collectionId: TOKENS_COL(),
        documentId: tokenDoc.$id,
        data: { usedCount: tokenDoc.usedCount + 1 },
      });
    } else {
      return NextResponse.json({ error: 'Your submission is already under review and cannot be edited.' }, { status: 409 });
    }

    return NextResponse.json({ success: true, submissionId: submissionDoc.$id });
  } catch (error: any) {
    console.error('[submit] error:', error);
    return NextResponse.json({ error: error.message || 'Submission failed' }, { status: 500 });
  }
}
