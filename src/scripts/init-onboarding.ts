/**
 * Initialize Appwrite collections and bucket for onboarding.
 * Run once: npx ts-node -e "require('./src/scripts/init-onboarding.ts')"
 * Or just call this from your admin setup page.
 */
import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';

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

async function init() {
  console.log('🚀 Initializing onboarding schema...');

  // ── 1. Tokens collection ────────────────────────────────────────
  try {
    await databases.createCollection({
      databaseId: DATABASE_ID,
      collectionId: TOKENS_ID,
      name: 'Onboarding Tokens',
      permissions: [Permission.read(Role.any())],
      documentSecurity: false,
    });
    console.log('✅ Created tokens collection');
  } catch (e: any) {
    if (e.code !== 409) throw e;
    console.log('⚠️  Tokens collection already exists');
  }

  const tokenAttrs = [
    { key: 'token', type: 'string', size: 64, required: true },
    { key: 'label', type: 'string', size: 255, required: false },
    { key: 'expiresAt', type: 'string', size: 32, required: true },
    { key: 'status', type: 'string', size: 32, required: true, default: 'active' },
    { key: 'maxUses', type: 'integer', required: true, default: 0 },
    { key: 'usedCount', type: 'integer', required: true, default: 0 },
    { key: 'createdBy', type: 'string', size: 255, required: false },
  ];

  for (const attr of tokenAttrs) {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute({
          databaseId: DATABASE_ID,
          collectionId: TOKENS_ID,
          key: attr.key,
          size: attr.size || 255,
          required: attr.required,
          default: (attr as any).default,
          xdefault: undefined,
        });
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute({
          databaseId: DATABASE_ID,
          collectionId: TOKENS_ID,
          key: attr.key,
          required: attr.required,
          default: (attr as any).default,
          xdefault: undefined,
        });
      }
      console.log(`  ✅ attr: ${attr.key}`);
    } catch (e: any) {
      if (e.code !== 409) console.error(`  ❌ ${attr.key}:`, e.message);
      else console.log(`  ⚠️  ${attr.key} exists`);
    }
  }

  // ── 2. Submissions collection ───────────────────────────────────
  try {
    await databases.createCollection({
      databaseId: DATABASE_ID,
      collectionId: SUBMISSIONS_ID,
      name: 'Onboarding Submissions',
      permissions: [Permission.read(Role.any()), Permission.create(Role.any())],
      documentSecurity: false,
    });
    console.log('✅ Created submissions collection');
  } catch (e: any) {
    if (e.code !== 409) throw e;
    console.log('⚠️  Submissions collection already exists');
  }

  const submissionAttrs = [
    { key: 'tokenId', type: 'string', size: 64, required: true },
    { key: 'fullName', type: 'string', size: 255, required: true },
    { key: 'email', type: 'string', size: 255, required: true },
    { key: 'phone', type: 'string', size: 20, required: true },
    { key: 'dateOfBirth', type: 'string', size: 20, required: false },
    { key: 'gender', type: 'string', size: 20, required: false },
    { key: 'addressLine1', type: 'string', size: 500, required: false },
    { key: 'addressLine2', type: 'string', size: 500, required: false },
    { key: 'city', type: 'string', size: 100, required: false },
    { key: 'state', type: 'string', size: 100, required: false },
    { key: 'pincode', type: 'string', size: 20, required: false },
    { key: 'country', type: 'string', size: 100, required: false },
    { key: 'bankName', type: 'string', size: 255, required: false },
    { key: 'accountNumber', type: 'string', size: 100, required: false },
    { key: 'ifscCode', type: 'string', size: 20, required: false },
    { key: 'accountHolderName', type: 'string', size: 255, required: false },
    { key: 'aadharFileId', type: 'string', size: 100, required: false },
    { key: 'panFileId', type: 'string', size: 100, required: false },
    { key: 'resumeFileId', type: 'string', size: 100, required: false },
    { key: 'photoFileId', type: 'string', size: 100, required: false },
    { key: 'additionalFileIds', type: 'string', size: 2000, required: false },
    { key: 'status', type: 'string', size: 32, required: true, default: 'pending_verification' },
    { key: 'submittedAt', type: 'string', size: 32, required: false },
    { key: 'reviewedBy', type: 'string', size: 255, required: false },
    { key: 'reviewedAt', type: 'string', size: 32, required: false },
    { key: 'reviewNotes', type: 'string', size: 2000, required: false },
    { key: 'employeeId', type: 'string', size: 100, required: false },
  ];

  for (const attr of submissionAttrs) {
    try {
      await databases.createStringAttribute({
        databaseId: DATABASE_ID,
        collectionId: SUBMISSIONS_ID,
        key: attr.key,
        size: attr.size || 255,
        required: attr.required,
        default: (attr as any).default,
        xdefault: undefined,
      });
      console.log(`  ✅ attr: ${attr.key}`);
    } catch (e: any) {
      if (e.code !== 409) console.error(`  ❌ ${attr.key}:`, e.message);
      else console.log(`  ⚠️  ${attr.key} exists`);
    }
  }

  // ── 3. Storage bucket ───────────────────────────────────────────
  try {
    await storage.createBucket({
      bucketId: BUCKET_ID,
      name: 'Onboarding Documents',
      permissions: [Permission.create(Role.any()), Permission.read(Role.any())],
      maximumFileSize: 10 * 1024 * 1024, // 10 MB
      allowedFileExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      antivirus: false,
    });
    console.log('✅ Created onboarding-documents bucket');
  } catch (e: any) {
    if (e.code !== 409) throw e;
    console.log('⚠️  Bucket already exists');
  }

  console.log('🎉 Onboarding schema initialized!');
}

init().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
