/**
 * GET /api/permissions/check?pageId=employees&perm=write
 * Returns whether the current user has a given permission on a page.
 * Used by client-side components to show/hide UI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases } from 'node-appwrite';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { COLLECTION_ID } from '@/lib/permissions-init';
import { DEFAULT_ROLE_PERMS, hasPermission, parsePagePermissions, type AppRole, type Perm } from '@/lib/permissions';

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');
}

const DB_ID = () => process.env.APPWRITE_DATABASE_ID || '';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ allowed: false, reason: 'unauthenticated' });

  const labels: string[] = (user as any).labels ?? [];
  const role = (labels.includes('admin') ? 'admin'
    : labels.includes('manager') ? 'manager'
    : labels.includes('hr')      ? 'hr'
    : labels.includes('viewer')  ? 'viewer'
    : 'new_user') as AppRole;

  const pageId = req.nextUrl.searchParams.get('pageId') ?? '';
  const perm   = (req.nextUrl.searchParams.get('perm') ?? 'r') as Perm;

  try {
    const db  = new Databases(createAdminClient());
    let permissions = null;

    try {
      const doc = await db.getDocument({
        databaseId:   DB_ID(),
        collectionId: COLLECTION_ID(),
        documentId:   pageId,
      });
      permissions = parsePagePermissions(doc as any);
    } catch {
      // Collection or doc missing — fall through to defaults
    }

    const allowed = hasPermission(permissions, role, user.$id, perm);
    return NextResponse.json({ allowed, role, pageId, perm });
  } catch (error: any) {
    // On any server error, fail open for reads, closed for writes
    const safe = perm === 'r';
    return NextResponse.json({ allowed: safe, role, error: error.message });
  }
}
