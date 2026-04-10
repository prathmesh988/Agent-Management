/**
 * Server-side authentication utility for API routes and server actions
 * Verifies that the request is from an authenticated user
 */

import { cookies } from 'next/headers';
import { getCurrentUser } from '@/services/auth';

/**
 * Check if the current request is from an authenticated user
 * Useful for protecting API routes and server actions
 */
export async function isRequestAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('appwrite_session')?.value;

    if (!sessionCookie) {
      return false;
    }

    // Try to get current user to verify session is valid
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    const isAuth = await isRequestAuthenticated();
    if (!isAuth) return null;

    return await getCurrentUser();
  } catch (error) {
    console.error('Failed to get authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication for an API endpoint or server action
 * Throws an error if not authenticated
 */
export async function requireAuth() {
  const isAuth = await isRequestAuthenticated();

  if (!isAuth) {
    throw new Error('Unauthorized: User not authenticated');
  }

  return await getCurrentUser();
}
