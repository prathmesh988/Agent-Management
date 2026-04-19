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

    // Check if API secret is configured
    const apiSecret = process.env.APPWRITE_PROJECT_ID_API_SECRET;
    if (!apiSecret) {
      console.error('[current-user API] Missing APPWRITE_PROJECT_ID_API_SECRET');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Initialize Appwrite Admin Client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(apiSecret);

    const users = new Users(client);

    // Get current user
    const user = await users.get(userId);

    // Determine role based on labels
    let role = 'new_user'; // default — no label means awaiting approval
    const labels: string[] = user.labels || [];
    if (labels.includes('admin')) {
      role = 'admin';
    } else if (labels.includes('mvp')) {
      role = 'mvp';
    } else if (labels.includes('viewer')) {
      role = 'viewer';
    } else if (labels.includes('new_user')) {
      role = 'new_user';
    }

    // Map role to permissions
    const permissions = role === 'admin'
      ? ['READ', 'WRITE', 'UPDATE', 'DELETE']
      : role === 'new_user'
      ? []
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
  } catch (error: any) {
    console.error('[current-user API] Error fetching user:', error?.message || error);
    
    // Handle specific Appwrite errors
    if (error?.code === 404 || error?.type === 'user_not_found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (error?.code === 401 || error?.type === 'invalid_token' || error?.message?.includes('Invalid token')) {
      return NextResponse.json(
        { error: 'Invalid token or authorization' },
        { status: 401 }
      );
    }
    
    // Generic error
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch current user';
    return NextResponse.json(
      { error: 'Failed to fetch current user', details: errorMessage },
      { status: 500 }
    );
  }
}
