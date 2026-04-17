import { NextRequest, NextResponse } from 'next/server';
import { Client, Users } from 'node-appwrite';

interface UpdateLabelRequest {
  role: 'admin' | 'viewer';
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

    // Get current user to preserve other labels
    const currentUser = await users.get(userId);
    const currentLabels = currentUser.labels || [];

    // Remove old role labels
    let newLabels = currentLabels.filter(
      (label: string) => !['admin', 'viewer'].includes(label)
    );

    // Add new role label
    newLabels = [...newLabels, body.role];

    // Update user labels
    const updatedUser = await users.updateLabels(userId, newLabels);

    // Map role to permissions
    const permissions = body.role === 'admin'
      ? ['READ', 'WRITE', 'UPDATE', 'DELETE']
      : ['READ'];

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
