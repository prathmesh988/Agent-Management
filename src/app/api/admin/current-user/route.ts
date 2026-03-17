import { NextRequest, NextResponse } from 'next/server';
import { Client, Users } from 'node-appwrite';

export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the session/auth header if available
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Initialize Appwrite Admin Client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

    const users = new Users(client);

    // Get current user
    const user = await users.get(userId);

    // Determine role based on labels
    let role = 'mvp'; // default role
    if (user.labels?.includes('admin')) {
      role = 'admin';
    } else if (user.labels?.includes('mvp')) {
      role = 'mvp';
    }

    // Map role to permissions
    const permissions = role === 'admin'
      ? ['READ', 'WRITE', 'UPDATE', 'DELETE']
      : ['READ'];

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.$id,
          name: user.name,
          email: user.email,
          role,
          labels: user.labels || [],
          permissions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch current user';
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current user', details: errorMessage },
      { status: 500 }
    );
  }
}
