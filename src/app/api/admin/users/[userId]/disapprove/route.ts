import { NextRequest, NextResponse } from 'next/server';
import { Client, Users } from 'node-appwrite';

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
