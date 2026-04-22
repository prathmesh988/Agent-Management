import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, ID, Query } from 'node-appwrite';
import { ensureOnboardingSchema } from '@/lib/onboarding-init';
import { getAuthenticatedUser } from '@/lib/auth-utils';

const createAdminClient = () =>
  new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

const DB_ID       = () => process.env.APPWRITE_DATABASE_ID || '';
const TOKENS_COL  = () => process.env.APPWRITE_ONBOARDING_TOKENS_COLLECTION_ID || 'onboarding_tokens';

/**
 * POST /api/onboarding/invite
 * HR creates a new invite token.
 * Body: { label?, expiryDays?, maxUses? }
 */
export async function POST(req: NextRequest) {
  try {
    const hrUser = await getAuthenticatedUser(req);
    if (!hrUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { label = '', expiryDays = 7, maxUses = 0 } = body;

    const days = Math.min(Math.max(Number(expiryDays) || 7, 1), 30);
    const uses = Math.max(Number(maxUses) || 0, 0);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const token = crypto.randomUUID();

    await ensureOnboardingSchema();
    const databases = new Databases(createAdminClient());
    const doc = await databases.createDocument({
      databaseId: DB_ID(),
      collectionId: TOKENS_COL(),
      documentId: ID.unique(),
      data: {
        token,
        label: label || `Invite ${new Date().toLocaleDateString('en-IN')}`,
        expiresAt: expiresAt.toISOString(),
        status: 'active',
        maxUses: uses,
        usedCount: 0,
        createdBy: (hrUser as any).email || (hrUser as any).name || 'HR',
      },
    });

    // Build invite URL — prefer request origin so it works in all environments
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';
    const inviteUrl = `${origin}/onboard/${token}`;

    return NextResponse.json({ success: true, token: doc, inviteUrl });
  } catch (error: any) {
    console.error('[invite] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/onboarding/invite
 * List all tokens for HR dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    const hrUser = await getAuthenticatedUser(req);
    if (!hrUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureOnboardingSchema();
    const databases = new Databases(createAdminClient());
    const result = await databases.listDocuments({
      databaseId: DB_ID(),
      collectionId: TOKENS_COL(),
      queries: [Query.orderDesc('$createdAt'), Query.limit(100)],
    });

    return NextResponse.json({ tokens: result.documents, total: result.total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
