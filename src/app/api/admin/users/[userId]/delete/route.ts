import { NextRequest, NextResponse } from 'next/server';
import { Client, Users } from 'node-appwrite';
import { auditLog, extractActorMeta } from '@/lib/audit-logger';

/**
 * DELETE /api/admin/users/[userId]
 * 
 * Permanently deletes a user account from the system.
 * This removes the user and all associated data.
 */
export async function DELETE(
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

    // Get user before deletion (for response data)
    const deletedUser = await users.get(userId);

    // Delete the user
    await users.delete(userId);

    // Audit log — critical: permanent user deletion
    const actorId = request.headers.get('x-user-id');
    const { actor_ip, actor_user_agent } = extractActorMeta(request);
    auditLog({
      actor_id:             actorId ?? undefined,
      actor_ip,
      actor_user_agent,
      module:               'employee',
      action_type:          'delete',
      severity:             'critical',
      result:               'success',
      target_id:            userId,
      target_name_snapshot: deletedUser.name,
      target_employee_id:   deletedUser.email,
      description:          'User account permanently deleted',
    });

    return NextResponse.json(
      {
        success: true,
        message: `User ${deletedUser.email} has been permanently deleted.`,
        deletedUser: {
          id: deletedUser.$id,
          name: deletedUser.name,
          email: deletedUser.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: errorMessage },
      { status: 500 }
    );
  }
}
