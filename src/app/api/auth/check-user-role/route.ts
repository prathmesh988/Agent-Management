import { NextRequest, NextResponse } from 'next/server';
import { Client, Users, Query } from 'node-appwrite';

/**
 * POST /api/auth/check-user-role
 * 
 * Check if a user exists and has an approved role (mvp or admin).
 * This is called before sending a magic link to validate that the user
 * has been approved by an admin.
 * 
 * Body: { email: string }
 * 
 * Returns:
 * - { exists: false } - User doesn't exist
 * - { exists: true, hasApprovedRole: false } - User exists but needs approval
 * - { exists: true, hasApprovedRole: true, role: 'mvp' | 'admin' } - User approved
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Initialize Appwrite Admin Client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

    const users = new Users(client);

    // Search for user by email
    const response = await users.list([
      Query.equal('email', email)
    ]);

    if (response.users.length === 0) {
      // User doesn't exist yet
      return NextResponse.json({
        exists: false,
        hasApprovedRole: false,
      });
    }

    const user = response.users[0];
    const labels = user.labels || [];

    // Check if user has an approved role (mvp or admin)
    const hasApprovedRole = labels.includes('mvp') || labels.includes('admin');
    const isNewUser = labels.includes('new_user');

    // Determine the current role
    let role = 'new_user';
    if (labels.includes('admin')) {
      role = 'admin';
    } else if (labels.includes('mvp')) {
      role = 'mvp';
    } else if (labels.includes('viewer')) {
      role = 'viewer';
    }

    return NextResponse.json({
      exists: true,
      hasApprovedRole,
      isNewUser,
      role,
      userId: user.$id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check user role';
    console.error('[check-user-role] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
