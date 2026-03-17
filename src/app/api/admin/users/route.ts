import { NextRequest, NextResponse } from 'next/server';
import { Client, Users, Query } from 'node-appwrite';

export async function GET(request: NextRequest) {
  try {
    // Initialize Appwrite Admin Client with server-side secret
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

    const users = new Users(client);

    // Fetch all users with pagination
    const response = await users.list([Query.limit(100)]);

    // Transform users to include role/permission information based on labels
    const formattedUsers = response.users.map((user: any) => {
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

      return {
        id: user.$id,
        name: user.name,
        email: user.email,
        role,
        labels: user.labels || [],
        permissions,
        createdAt: user.$createdAt,
        status: user.status === 'active' ? 'active' : 'inactive',
      };
    });

    return NextResponse.json(
      {
        success: true,
        users: formattedUsers,
        total: response.total,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: errorMessage },
      { status: 500 }
    );
  }
}
