import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';
import { ensureOnboardingSchema } from '@/lib/onboarding-init';

const createAdminClient = () =>
  new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

const DB_ID = () => process.env.APPWRITE_DATABASE_ID || '';
const TOKENS_COL = () => process.env.APPWRITE_ONBOARDING_TOKENS_COLLECTION_ID || 'onboarding_tokens';

/**
 * GET /api/onboarding/validate?token=<uuid>
 * Returns token metadata if valid, or an error code if expired/used/invalid.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 400 });
  }

  try {
    // Trigger schema init in background (don't block the validate response)
    ensureOnboardingSchema().catch(() => {});

    const databases = new Databases(createAdminClient());
    let result;
    try {
      result = await databases.listDocuments({
      databaseId: DB_ID(),
      collectionId: TOKENS_COL(),
      queries: [Query.equal('token', token), Query.limit(1)],
      });
    } catch (dbErr: any) {
      // Collection doesn't exist yet → token is invalid
      if (dbErr?.code === 404) {
        return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 404 });
      }
      throw dbErr;
    }

    if (result.total === 0) {
      return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 404 });
    }

    const doc = result.documents[0];

    if (doc.status === 'disabled' || doc.status === 'expired') {
      return NextResponse.json({ valid: false, reason: doc.status }, { status: 410 });
    }

    // Check expiry
    if (new Date(doc.expiresAt) < new Date()) {
      // Mark as expired in DB (fire-and-forget)
      databases
        .updateDocument({
          databaseId: DB_ID(),
          collectionId: TOKENS_COL(),
          documentId: doc.$id,
          data: { status: 'expired' },
        })
        .catch(() => {});
      return NextResponse.json({ valid: false, reason: 'expired' }, { status: 410 });
    }

    // Check max uses
    if (doc.maxUses > 0 && doc.usedCount >= doc.maxUses) {
      return NextResponse.json({ valid: false, reason: 'limit_reached' }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      tokenId: doc.$id,
      label: doc.label,
      expiresAt: doc.expiresAt,
      maxUses: doc.maxUses,
      usedCount: doc.usedCount,
    });
  } catch (error: any) {
    console.error('[validate] error:', error);
    return NextResponse.json({ valid: false, reason: 'server_error' }, { status: 500 });
  }
}
