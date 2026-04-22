import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';
import { ensureOnboardingSchema } from '@/lib/onboarding-init';
import { getAuthenticatedUser } from '@/lib/auth-utils';

const createAdminClient = () =>
  new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

const DB_ID    = () => process.env.APPWRITE_DATABASE_ID || '';
const SUBS_COL = () => process.env.APPWRITE_ONBOARDING_SUBMISSIONS_COLLECTION_ID || 'onboarding_submissions';

/**
 * GET /api/onboarding/submissions?status=&page=
 * Returns paginated list of submissions for HR dashboard.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url    = req.nextUrl;
  const status = url.searchParams.get('status') || '';
  const page   = parseInt(url.searchParams.get('page') || '1', 10);
  const limit  = 20;
  const offset = (page - 1) * limit;

  try {
    await ensureOnboardingSchema();
    const databases = new Databases(createAdminClient());
    const queries: string[] = [
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(offset),
    ];
    if (status) queries.push(Query.equal('status', status));

    const result = await databases.listDocuments({
      databaseId: DB_ID(),
      collectionId: SUBS_COL(),
      queries,
    });

    return NextResponse.json({ submissions: result.documents, total: result.total, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
