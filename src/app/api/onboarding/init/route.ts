import { NextResponse } from 'next/server';
import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';
import { getAuthenticatedUser } from '@/lib/auth-utils';

/**
 * GET /api/onboarding/init
 * One-time setup: creates Appwrite collections and storage bucket.
 * Protected — requires authenticated session.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

  const databases = new Databases(client);
  const storage = new Storage(client);

  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '';
  const TOKENS_ID = process.env.APPWRITE_ONBOARDING_TOKENS_COLLECTION_ID || 'onboarding_tokens';
  const SUBMISSIONS_ID = process.env.APPWRITE_ONBOARDING_SUBMISSIONS_COLLECTION_ID || 'onboarding_submissions';
  const BUCKET_ID = process.env.APPWRITE_ONBOARDING_BUCKET_ID || 'onboarding_documents';

  const log: string[] = [];

  // ── Helper ──────────────────────────────────────────────────────
  async function tryCreate(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      log.push(`✅ ${name}`);
    } catch (e: any) {
      if (e.code === 409) log.push(`⚠️  ${name} already exists`);
      else log.push(`❌ ${name}: ${e.message}`);
    }
  }

  // ── 1. Tokens collection ────────────────────────────────────────
  await tryCreate('tokens collection', () =>
    databases.createCollection({
      databaseId: DATABASE_ID,
      collectionId: TOKENS_ID,
      name: 'Onboarding Tokens',
      permissions: [Permission.read(Role.any())],
      documentSecurity: false,
    })
  );

  const tokenStringAttrs = [
    { key: 'token', size: 64, required: true },
    { key: 'label', size: 255, required: false },
    { key: 'expiresAt', size: 32, required: true },
    { key: 'status', size: 32, required: false, xdefault: 'active' },
    { key: 'createdBy', size: 255, required: false },
  ];

  for (const attr of tokenStringAttrs) {
    await tryCreate(`tokens.${attr.key}`, () =>
      databases.createStringAttribute({
        databaseId: DATABASE_ID,
        collectionId: TOKENS_ID,
        key: attr.key,
        size: attr.size,
        required: attr.required,
        xdefault: attr.xdefault,
      })
    );
  }

  await tryCreate('tokens.maxUses', () =>
    databases.createIntegerAttribute({
      databaseId: DATABASE_ID,
      collectionId: TOKENS_ID,
      key: 'maxUses',
      required: false,
      xdefault: 0,
    })
  );

  await tryCreate('tokens.usedCount', () =>
    databases.createIntegerAttribute({
      databaseId: DATABASE_ID,
      collectionId: TOKENS_ID,
      key: 'usedCount',
      required: false,
      xdefault: 0,
    })
  );

  // ── 2. Submissions collection ───────────────────────────────────
  await tryCreate('submissions collection', () =>
    databases.createCollection({
      databaseId: DATABASE_ID,
      collectionId: SUBMISSIONS_ID,
      name: 'Onboarding Submissions',
      permissions: [Permission.read(Role.any()), Permission.create(Role.any())],
      documentSecurity: false,
    })
  );

  const subAttrs = [
    { key: 'tokenId', size: 64, required: true },
    { key: 'fullName', size: 255, required: true },
    { key: 'email', size: 255, required: true },
    { key: 'phone', size: 20, required: true },
    { key: 'dateOfBirth', size: 20, required: false },
    { key: 'gender', size: 20, required: false },
    { key: 'addressLine1', size: 500, required: false },
    { key: 'addressLine2', size: 500, required: false },
    { key: 'city', size: 100, required: false },
    { key: 'state', size: 100, required: false },
    { key: 'pincode', size: 20, required: false },
    { key: 'country', size: 100, required: false },
    { key: 'bankName', size: 255, required: false },
    { key: 'accountNumber', size: 100, required: false },
    { key: 'ifscCode', size: 20, required: false },
    { key: 'accountHolderName', size: 255, required: false },
    { key: 'aadharFileId', size: 100, required: false },
    { key: 'panFileId', size: 100, required: false },
    { key: 'resumeFileId', size: 100, required: false },
    { key: 'photoFileId', size: 100, required: false },
    { key: 'additionalFileIds', size: 2000, required: false },
    { key: 'status', size: 32, required: false, xdefault: 'pending_verification' },
    { key: 'submittedAt', size: 32, required: false },
    { key: 'reviewedBy', size: 255, required: false },
    { key: 'reviewedAt', size: 32, required: false },
    { key: 'reviewNotes', size: 2000, required: false },
    { key: 'employeeId', size: 100, required: false },
  ];

  for (const attr of subAttrs) {
    await tryCreate(`submissions.${attr.key}`, () =>
      databases.createStringAttribute({
        databaseId: DATABASE_ID,
        collectionId: SUBMISSIONS_ID,
        key: attr.key,
        size: attr.size,
        required: attr.required,
        xdefault: attr.xdefault,
      })
    );
  }

  // ── 3. Storage bucket ───────────────────────────────────────────
  await tryCreate('onboarding-documents bucket', () =>
    storage.createBucket({
      bucketId: BUCKET_ID,
      name: 'Onboarding Documents',
      permissions: [Permission.create(Role.any()), Permission.read(Role.any())],
      maximumFileSize: 10 * 1024 * 1024,
      allowedFileExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      antivirus: false,
    })
  );

  return NextResponse.json({ success: true, log }, { status: 200 });
}
