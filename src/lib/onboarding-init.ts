/**
 * Lazy Appwrite schema initializer for onboarding.
 * Call `ensureOnboardingSchema()` at the top of any onboarding API route.
 * First call creates collections + bucket; subsequent calls are instant no-ops.
 *
 * ⚠️  Appwrite attribute creation is async — after createStringAttribute
 *     returns 200, the attribute may still be "processing" for ~1–3 s.
 *     We therefore wait 5 s after fresh creation so queries don't fail.
 */

import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';

let initialized = false;
let initializing: Promise<void> | null = null;

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Tries fn(). Silently ignores 409 (already exists).
 * Returns true if resource was newly created.
 */
async function tryCreate(label: string, fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    console.log(`[onboarding-init] ✅ Created ${label}`);
    return true;
  } catch (e: any) {
    if (e?.code === 409) return false; // already exists
    console.warn(`[onboarding-init] ⚠️  ${label}: ${e?.message}`);
    return false;
  }
}

async function _runInit() {
  const client   = createAdminClient();
  const databases = new Databases(client);
  const storage   = new Storage(client);

  const DB_ID     = process.env.APPWRITE_DATABASE_ID || '';
  const TOKENS_ID = process.env.APPWRITE_ONBOARDING_TOKENS_COLLECTION_ID || 'onboarding_tokens';
  const SUBS_ID   = process.env.APPWRITE_ONBOARDING_SUBMISSIONS_COLLECTION_ID || 'onboarding_submissions';
  const BUCKET_ID = process.env.APPWRITE_ONBOARDING_BUCKET_ID || 'onboarding_documents';

  let anyCreated = false;

  // ── 1. Tokens collection ─────────────────────────────────────────────────
  if (await tryCreate('tokens collection', () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: TOKENS_ID,
      name: 'Onboarding Tokens',
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      documentSecurity: false,
    })
  )) anyCreated = true;

  for (const attr of [
    { key: 'token',     size: 64,  required: true  },
    { key: 'label',     size: 255, required: false, xdefault: '' },
    { key: 'expiresAt', size: 32,  required: true   },
    { key: 'status',    size: 32,  required: false, xdefault: 'active' },
    { key: 'createdBy', size: 255, required: false, xdefault: '' },
  ]) {
    if (await tryCreate(`tokens.${attr.key}`, () =>
      databases.createStringAttribute({
        databaseId: DB_ID,
        collectionId: TOKENS_ID,
        key: attr.key,
        size: attr.size,
        required: attr.required,
        xdefault: (attr as any).xdefault,
      })
    )) anyCreated = true;
  }

  for (const attr of [
    { key: 'maxUses',   xdefault: 0 },
    { key: 'usedCount', xdefault: 0 },
  ]) {
    if (await tryCreate(`tokens.${attr.key}`, () =>
      databases.createIntegerAttribute({
        databaseId: DB_ID,
        collectionId: TOKENS_ID,
        key: attr.key,
        required: false,
        xdefault: attr.xdefault,
      })
    )) anyCreated = true;
  }

  // ── 2. Submissions collection ────────────────────────────────────────────
  if (await tryCreate('submissions collection', () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: SUBS_ID,
      name: 'Onboarding Submissions',
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      documentSecurity: false,
    })
  )) anyCreated = true;

  for (const attr of [
    { key: 'tokenId',           size: 64,   required: true  },
    { key: 'fullName',          size: 255,  required: true  },
    { key: 'email',             size: 255,  required: true  },
    { key: 'phone',             size: 20,   required: true  },
    { key: 'dateOfBirth',       size: 20,   required: false },
    { key: 'gender',            size: 20,   required: false },
    { key: 'addressLine1',      size: 500,  required: false },
    { key: 'addressLine2',      size: 500,  required: false },
    { key: 'city',              size: 100,  required: false },
    { key: 'state',             size: 100,  required: false },
    { key: 'pincode',           size: 20,   required: false },
    { key: 'country',           size: 100,  required: false },
    { key: 'bankName',          size: 255,  required: false },
    { key: 'accountNumber',     size: 100,  required: false },
    { key: 'ifscCode',          size: 20,   required: false },
    { key: 'accountHolderName', size: 255,  required: false },
    { key: 'aadharFileId',      size: 100,  required: false },
    { key: 'panFileId',         size: 100,  required: false },
    { key: 'resumeFileId',      size: 100,  required: false },
    { key: 'photoFileId',       size: 100,  required: false },
    { key: 'additionalFileIds', size: 2000, required: false },
    { key: 'status',            size: 32,   required: false, xdefault: 'pending_verification' },
    { key: 'submittedAt',       size: 32,   required: false },
    { key: 'reviewedBy',        size: 255,  required: false },
    { key: 'reviewedAt',        size: 32,   required: false },
    { key: 'reviewNotes',       size: 2000, required: false },
    { key: 'employeeId',        size: 100,  required: false },
  ]) {
    if (await tryCreate(`submissions.${attr.key}`, () =>
      databases.createStringAttribute({
        databaseId: DB_ID,
        collectionId: SUBS_ID,
        key: attr.key,
        size: attr.size,
        required: attr.required,
        xdefault: (attr as any).xdefault,
      })
    )) anyCreated = true;
  }

  // ── 3. Storage bucket ────────────────────────────────────────────────────
  if (await tryCreate('onboarding_documents bucket', () =>
    storage.createBucket({
      bucketId: BUCKET_ID,
      name: 'Onboarding Documents',
      permissions: [
        Permission.create(Role.any()),
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      maximumFileSize: 10 * 1024 * 1024,
      allowedFileExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      antivirus: false,
    })
  )) anyCreated = true;

  if (anyCreated) {
    // Appwrite attribute processing is async — wait for indexes to become ready
    console.log('[onboarding-init] ⏳ Waiting 5 s for Appwrite attribute processing…');
    await sleep(5000);
  }

  console.log('[onboarding-init] 🎉 Schema ready');
}

/**
 * Ensures the onboarding Appwrite schema exists.
 * Safe to call on every request — runs only once per process lifetime.
 */
export async function ensureOnboardingSchema(): Promise<void> {
  if (initialized) return;

  if (!initializing) {
    initializing = _runInit()
      .then(() => { initialized = true; })
      .catch((e) => {
        console.error('[onboarding-init] Fatal error during init:', e);
        initializing = null; // allow retry on next request
      });
  }

  return initializing!;
}
