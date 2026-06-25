/**
 * GET  /api/permissions/[pageId]  — get permissions for a page
 * PATCH /api/permissions/[pageId] — update role or user permissions (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases } from 'node-appwrite';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { ensurePermissionsSchema, COLLECTION_ID } from '@/lib/permissions-init';
import { DEFAULT_ROLE_PERMS, MANAGED_PAGES, hasPermission, parsePagePermissions, type Perm, type AppRole } from '@/lib/permissions';
import { auditLog, extractActorMeta } from '@/lib/audit-logger';

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');
}

const DB_ID = () => process.env.APPWRITE_DATABASE_ID || '';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;

  // Trigger init in background — don't block reads
  ensurePermissionsSchema().catch(() => {});

  try {
    const db  = new Databases(createAdminClient());
    let doc: any;

    try {
      doc = await db.getDocument({
        databaseId:   DB_ID(),
        collectionId: COLLECTION_ID(),
        documentId:   pageId,
      });
    } catch (e: any) {
      if (e?.code === 404) {
        // Return default permissions if document not found yet
        const page = MANAGED_PAGES.find((p) => p.pageId === pageId);
        return NextResponse.json({
          pageId,
          pageName:      page?.pageName ?? pageId,
          pagePath:      page?.pagePath ?? '',
          rolePerms:     DEFAULT_ROLE_PERMS,
          userOverrides: {},
        });
      }
      throw e;
    }

    return NextResponse.json({
      pageId:        doc.pageId,
      pageName:      doc.pageName,
      pagePath:      doc.pagePath,
      rolePerms:     JSON.parse(doc.rolePerms     || '{}'),
      userOverrides: JSON.parse(doc.userOverrides || '{}'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
/**
 * Body variants:
 *
 * Update role permissions:
 *   { type: 'role', role: 'hr', perms: ['r', 'w'] }
 *
 * Add/update user override:
 *   { type: 'user', userId: '...', name: '...', email: '...', perms: ['r'] }
 *
 * Remove user override:
 *   { type: 'removeUser', userId: '...' }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only admins can change permissions
  const labels: string[] = (user as any).labels ?? [];
  if (!labels.includes('admin')) {
    return NextResponse.json({ error: 'Only admins can modify permissions' }, { status: 403 });
  }

  const { pageId }   = await params;
  const body         = await req.json().catch(() => ({}));
  const { type }     = body;

  await ensurePermissionsSchema();
  const db = new Databases(createAdminClient());

  // Get current doc (for both permission check and updates)
  let current: any;
  let permissions: any = null;
  try {
    current = await db.getDocument({
      databaseId:   DB_ID(),
      collectionId: COLLECTION_ID(),
      documentId:   pageId,
    });
    permissions = parsePagePermissions(current as any);
  } catch (e: any) {
    if (e?.code !== 404) throw e;
    // Doc doesn't exist yet - will create it
    current = null;
  }

  // Check if user has UPDATE permission on this page
  const role = (labels.includes('admin') ? 'admin'
    : labels.includes('manager') ? 'manager'
    : labels.includes('hr')      ? 'hr'
    : labels.includes('viewer')  ? 'viewer'
    : 'new_user') as AppRole;
  
  const canUpdate = hasPermission(permissions, role, user.$id, 'u');
  if (!canUpdate) {
    return NextResponse.json(
      { error: `You don't have permission to update "${pageId}" settings` },
      { status: 403 }
    );
  }

  // Create doc if it doesn't exist
  if (!current) {
    const page = MANAGED_PAGES.find((p) => p.pageId === pageId);
    current = await db.createDocument({
      databaseId:   DB_ID(),
      collectionId: COLLECTION_ID(),
      documentId:   pageId,
      data: {
        pageId,
        pageName:      page?.pageName ?? pageId,
        pagePath:      page?.pagePath ?? '',
        rolePerms:     JSON.stringify(DEFAULT_ROLE_PERMS),
        userOverrides: '{}',
      },
    });
  }

  const rolePerms:     Record<string, Perm[]> = JSON.parse(current.rolePerms     || '{}');
  const userOverrides: Record<string, any>    = JSON.parse(current.userOverrides || '{}');

  if (type === 'role') {
    const { role, perms }: { role: AppRole; perms: Perm[] } = body;
    if (!role) return NextResponse.json({ error: 'role is required' }, { status: 400 });
    const oldPerms: Perm[] = (rolePerms[role] ?? []);
    rolePerms[role] = perms ?? [];

    const updated = await db.updateDocument({
      databaseId:   DB_ID(),
      collectionId: COLLECTION_ID(),
      documentId:   pageId,
      data: {
        rolePerms:     JSON.stringify(rolePerms),
        userOverrides: JSON.stringify(userOverrides),
      },
    });

    const { actor_ip, actor_user_agent } = extractActorMeta(req);
    auditLog({
      actor_id:             user.$id,
      actor_name_snapshot:  user.name,
      actor_role_snapshot:  (user as any).labels?.[0] ?? '',
      actor_ip,
      actor_user_agent,
      module:               'roles',
      action_type:          'update',
      result:               'success',
      description:          `Role permissions updated — page: ${pageId}, role: ${role}`,
      field_changes: [{ field: `${pageId}.${role}`, old_value: oldPerms.join(','), new_value: (perms ?? []).join(',') }],
    });

    return NextResponse.json({ pageId: updated.pageId, rolePerms, userOverrides });

  } else if (type === 'user') {
    const { userId: targetUserId, name, email, perms } = body;
    if (!targetUserId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    const oldPerms = userOverrides[targetUserId]?.perms ?? null;
    userOverrides[targetUserId] = { userId: targetUserId, name: name ?? '', email: email ?? '', perms: perms ?? [] };

    const updated = await db.updateDocument({
      databaseId:   DB_ID(),
      collectionId: COLLECTION_ID(),
      documentId:   pageId,
      data: {
        rolePerms:     JSON.stringify(rolePerms),
        userOverrides: JSON.stringify(userOverrides),
      },
    });

    const { actor_ip, actor_user_agent } = extractActorMeta(req);
    auditLog({
      actor_id:             user.$id,
      actor_name_snapshot:  user.name,
      actor_role_snapshot:  (user as any).labels?.[0] ?? '',
      actor_ip,
      actor_user_agent,
      module:               'roles',
      action_type:          'update',
      result:               'success',
      description:          `User permission override set — page: ${pageId}, user: ${name ?? targetUserId}`,
      field_changes: [{ field: `${pageId}.user.${targetUserId}`, old_value: oldPerms ?? 'none', new_value: (perms ?? []).join(',') }],
    });

    return NextResponse.json({ pageId: updated.pageId, rolePerms, userOverrides });

  } else if (type === 'removeUser') {
    const { userId: targetUserId } = body;
    if (!targetUserId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    delete userOverrides[targetUserId];

    const updated = await db.updateDocument({
      databaseId:   DB_ID(),
      collectionId: COLLECTION_ID(),
      documentId:   pageId,
      data: {
        rolePerms:     JSON.stringify(rolePerms),
        userOverrides: JSON.stringify(userOverrides),
      },
    });

    const { actor_ip, actor_user_agent } = extractActorMeta(req);
    auditLog({
      actor_id:             user.$id,
      actor_name_snapshot:  user.name,
      actor_role_snapshot:  (user as any).labels?.[0] ?? '',
      actor_ip,
      actor_user_agent,
      module:               'roles',
      action_type:          'delete',
      result:               'success',
      description:          `User permission override removed — page: ${pageId}, user: ${targetUserId}`,
    });

    return NextResponse.json({ pageId: updated.pageId, rolePerms, userOverrides });

  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
}
