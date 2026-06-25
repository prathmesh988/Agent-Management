import { NextRequest, NextResponse } from 'next/server';
import { Client, Users } from 'node-appwrite';
import { canChangeRoleOf, ROLE_RANK, type AppRole } from '@/lib/permissions';
import { auditLog, extractActorMeta } from '@/lib/audit-logger';

type AssignableRole = 'admin' | 'manager' | 'hr' | 'mvp' | 'viewer' | 'new_user';

interface UpdateLabelRequest {
  role: AssignableRole;
}

/** All known role labels — used to strip old role from labels array. */
const ALL_ROLE_LABELS: AssignableRole[] = ['admin', 'manager', 'hr', 'mvp', 'viewer', 'new_user'];

/** Derive AppRole from an Appwrite labels array (highest-priority label wins). */
function resolveRole(labels: string[]): AppRole {
  if (labels.includes('admin'))   return 'admin';
  if (labels.includes('manager')) return 'manager';
  if (labels.includes('hr'))      return 'hr';
  if (labels.includes('mvp'))     return 'mvp';
  if (labels.includes('viewer'))  return 'viewer';
  return 'new_user';
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const body: UpdateLabelRequest = await request.json();

    if (!userId || !body.role) {
      return NextResponse.json(
        { error: 'Missing userId or role' },
        { status: 400 }
      );
    }

    // Initialize Appwrite Admin Client with server-side secret
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

    const users = new Users(client);

    // ── Server-side hierarchy guard ──────────────────────────────────────────

    // Identify the requesting actor from the x-user-id header
    const actorId = request.headers.get('x-user-id');
    if (actorId && actorId !== userId) {
      // Only enforce the guard when an actor ID is supplied and it's not the same user
      const [actorUser, targetUser] = await Promise.all([
        users.get(actorId),
        users.get(userId),
      ]);

      const actorRole  = resolveRole(actorUser.labels  ?? []);
      const targetRole = resolveRole(targetUser.labels ?? []);

      // Guard 1: actor must outrank the target's current role
      if (!canChangeRoleOf(actorRole, targetRole)) {
        return NextResponse.json(
          { error: 'You cannot change the role of a user with equal or higher rank.' },
          { status: 403 }
        );
      }

      // Guard 2: actor cannot assign a role equal to or above their own rank
      const requestedRank = ROLE_RANK[body.role as AppRole] ?? -1;
      if (requestedRank >= ROLE_RANK[actorRole] && actorRole !== 'admin') {
        return NextResponse.json(
          { error: 'You cannot assign a role equal to or higher than your own.' },
          { status: 403 }
        );
      }
    }

    // ── Apply the label change ────────────────────────────────────────────────

    const currentUser = await users.get(userId);
    const currentLabels: string[] = currentUser.labels || [];

    // Strip old role labels, then append the new one
    const newLabels = [
      ...currentLabels.filter((label) => !ALL_ROLE_LABELS.includes(label as AssignableRole)),
      body.role,
    ];

    const updatedUser = await users.updateLabels(userId, newLabels);

    // Map role to legacy permissions array expected by the client
    const permissions =
      body.role === 'admin'    ? ['READ', 'WRITE', 'UPDATE', 'DELETE'] :
      body.role === 'manager'  ? ['READ', 'WRITE', 'UPDATE'] :
      body.role === 'hr'       ? ['READ', 'WRITE'] :
      body.role === 'new_user' ? [] :
      ['READ']; // mvp + viewer

    // ── Audit log — role change with field diff ──────────────────────────────
    const actorUserForLog = actorId ? await users.get(actorId).catch(() => null) : null;
    const targetUserForLog = await users.get(userId).catch(() => currentUser);
    const oldRole = resolveRole((currentUser as any).labels ?? []);
    const { actor_ip, actor_user_agent } = extractActorMeta(request);
    auditLog({
      actor_id:             actorId ?? undefined,
      actor_name_snapshot:  actorUserForLog?.name ?? '',
      actor_role_snapshot:  actorId ? resolveRole((actorUserForLog as any)?.labels ?? []) : '',
      actor_ip,
      actor_user_agent,
      module:               'roles',
      action_type:          'update',
      result:               'success',
      target_id:            userId,
      target_name_snapshot: currentUser.name,
      field_changes: [{
        field:     'role',
        old_value: oldRole,
        new_value: body.role,
      }],
      description: `Role changed: ${currentUser.name} — ${oldRole} → ${body.role}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User role updated successfully',
        user: {
          id: updatedUser.$id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: body.role,
          labels: updatedUser.labels,
          permissions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user role';
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role', details: errorMessage },
      { status: 500 }
    );
  }
}
