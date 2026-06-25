import { NextRequest, NextResponse } from 'next/server';
import { Client, Users } from 'node-appwrite';
import { auditLog, extractActorMeta } from '@/lib/audit-logger';

/**
 * POST /api/admin/users/[userId]/disapprove
 * 
 * Disapproves a user by removing ALL labels.
 * This locks the account and prevents login until re-approved.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Initialize Appwrite Admin Client with server-side secret
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

    const users = new Users(client);

    // Get current user
    const currentUser = await users.get(userId);

    // Remove ALL labels to lock the account
    const updatedUser = await users.updateLabels(userId, []);

    // Audit log — account disapproval
    const actorId = request.headers.get('x-user-id');
    const { actor_ip, actor_user_agent } = extractActorMeta(request);
    const actorUser = actorId ? await users.get(actorId).catch(() => null) : null;
    const currentRole = (currentUser.labels ?? []).find(l =>
      ['admin','manager','hr','mvp','viewer','new_user'].includes(l)
    ) ?? 'unknown';
    auditLog({
      actor_id:             actorId ?? undefined,
      actor_name_snapshot:  actorUser?.name ?? '',
      actor_email_snapshot: actorUser?.email ?? '',
      actor_ip,
      actor_user_agent,
      module:               'roles',
      action_type:          'update',
      result:               'success',
      target_id:            userId,
      target_name_snapshot: currentUser.name,
      field_changes: [{ field: 'role', old_value: currentRole, new_value: 'none (disapproved)' }],
      description:          'Account disapproved — all labels removed',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User account has been disapproved. All labels removed.',
        user: {
          id: updatedUser.$id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: 'new_user',
          labels: [],
          permissions: [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to disapprove user';
    console.error('Error disapproving user:', error);
    return NextResponse.json(
      { error: 'Failed to disapprove user', details: errorMessage },
      { status: 500 }
    );
  }
}
