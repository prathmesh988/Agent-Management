import { NextRequest, NextResponse } from 'next/server';
import { Client, Users } from 'node-appwrite';

const ROLE_LABELS = ['admin', 'viewer', 'mvp', 'new_user'];

/**
 * POST /api/admin/users/[userId]/check-or-init
 *
 * Called right after a magic-link verification succeeds.
 * If the user has NO role label yet, assigns 'new_user' so they
 * land on the "pending approval" screen.  If they already have a
 * role label, leaves them untouched and returns the current role.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Admin SDK — we need write access to update labels
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

    const users = new Users(client);
    const user = await users.get(userId);

    const currentLabels: string[] = user.labels || [];
    const hasRoleLabel = currentLabels.some((l) => ROLE_LABELS.includes(l));

    if (!hasRoleLabel) {
      // First-ever login — tag as new_user pending admin approval
      const newLabels = [...currentLabels, 'new_user'];
      await users.updateLabels(userId, newLabels);

      return NextResponse.json({
        success: true,
        initialized: true,
        role: 'new_user',
      });
    }

    // Already has a role — determine it
    let role = 'new_user';
    if (currentLabels.includes('admin')) role = 'admin';
    else if (currentLabels.includes('mvp')) role = 'mvp';
    else if (currentLabels.includes('viewer')) role = 'viewer';
    else if (currentLabels.includes('new_user')) role = 'new_user';

    return NextResponse.json({
      success: true,
      initialized: false,
      role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize user';
    console.error('[check-or-init] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
