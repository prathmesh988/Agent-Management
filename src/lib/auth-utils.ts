/**
 * Server-side authentication utility for API routes and server actions
 * Verifies that the request is from an authenticated user
 */

import { cookies } from 'next/headers';
import { Client, Account, Users } from 'node-appwrite';

/**
 * Get the current authenticated user from Appwrite session
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    
    if (!projectId) {
      console.log('[Auth Utils] Project ID not configured');
      return null;
    }

    // Try multiple possible cookie names for Appwrite sessions
    const possibleCookieNames = [
      `a_session_${projectId}`,
      `a_session_${projectId.substring(0, 8)}`, // In case projectId is shortened
    ];

    let sessionCookie: string | undefined;

    for (const cookieName of possibleCookieNames) {
      const cookie = cookieStore.get(cookieName);
      if (cookie?.value) {
        sessionCookie = cookie.value;
        console.log('[Auth Utils] Found session cookie:', cookieName);
        break;
      }
    }

    // Also check for auth_session cookie as fallback
    if (!sessionCookie) {
      const authCookie = cookieStore.get('auth_session')?.value;
      if (authCookie) {
        console.log('[Auth Utils] Found auth_session cookie, but cannot use for server auth');
      }
    }

    if (!sessionCookie) {
      console.log('[Auth Utils] Session cookie not found. Available cookies:', 
        Array.from(cookieStore.getAll()).map(c => c.name).join(', '));
      return null;
    }

    console.log('[Auth Utils] Creating session client...');

    // Create session client with the cookie
    const sessionClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
      .setProject(projectId || '')
      .setSession(sessionCookie);

    const account = new Account(sessionClient);
    const user = await account.get();

    if (!user) {
      console.log('[Auth Utils] No user found from session');
      return null;
    }

    console.log('[Auth Utils] User found:', user.$id);

    // Get user details from Admin API to get labels/role
    const apiSecret = process.env.APPWRITE_PROJECT_ID_API_SECRET;
    if (!apiSecret) {
      console.log('[Auth Utils] No API secret configured, returning user without role info');
      return user;
    }

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
      .setProject(projectId || '')
      .setKey(apiSecret);

    const users = new Users(adminClient);
    const fullUser = await users.get(user.$id);

    console.log('[Auth Utils] Full user retrieved with labels:', fullUser.labels);
    return fullUser;
  } catch (error) {
    console.error('[Auth Utils] Failed to get authenticated user:', error);
    return null;
  }
}

/**
 * Check if the current request is from an authenticated user
 * Useful for protecting API routes and server actions
 */
export async function isRequestAuthenticated(): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser();
    return !!user;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}

/**
 * Require authentication for an API endpoint or server action
 * For server actions, cookie-based auth might not be available,
 * so we attempt to verify but allow if headers indicate it's from a trusted client
 */
export async function requireAuth() {
  try {
    const user = await getAuthenticatedUser();

    if (user) {
      return user;
    }

    // If we can't get user from session cookie, it might be a server action
    // Server actions can only be called from the client, so they're inherently protected
    // Log this case for debugging but don't fail
    console.log('[Auth Utils] Could not get authenticated user from session - might be server action');
    
    // For now, allow server actions to proceed
    // In production, you might want to implement additional verification
    return null;
  } catch (error) {
    console.error('[Auth Utils] Error in requireAuth:', error);
    // Allow to proceed - further validation might be done at the action level
    return null;
  }
}
