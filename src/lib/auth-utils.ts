/**
 * Server-side authentication utility for API routes and server actions.
 *
 * This app stores the Appwrite session in localStorage (not httpOnly cookies)
 * and sends the userId as an `x-user-id` header on every authenticated request.
 * Server routes verify that userId via the Appwrite Admin SDK.
 */

import { cookies } from 'next/headers';
import { Client, Account, Users } from 'node-appwrite';
import type { NextRequest } from 'next/server';

let hasLoggedAuthError = false;

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');
}

/** Look up a userId via admin SDK and return the full user (with labels). */
async function lookupUser(userId: string) {
  try {
    const users = new Users(createAdminClient());
    return await users.get(userId);
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user.
 *
 * Tries in order:
 *  1. `x-user-id` request header — primary method in this app (sent by useCurrentUser / dashboard)
 *  2. Appwrite `a_session_<projectId>` cookie — fallback for direct browser navigation
 *
 * Pass `req` (NextRequest) when calling from an API route handler.
 */
export async function getAuthenticatedUser(req?: NextRequest) {
  // ── 1. x-user-id header ──────────────────────────────────────────────────
  const userId = req?.headers.get('x-user-id') ?? null;

  if (userId) {
    const user = await lookupUser(userId);
    if (user) {
      console.log('[Auth Utils] ✅ Authenticated via x-user-id:', user.email);
      return user;
    }
    // userId provided but not found — don't fall through (prevent spoofing)
    console.log('[Auth Utils] x-user-id not found in Appwrite:', userId);
    return null;
  }

  // ── 2. Appwrite session cookie ───────────────────────────────────────────
  try {
    const cookieStore = await cookies();
    const projectId   = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

    // Appwrite sets a_session_<lowercaseProjectId>
    const sessionCookie =
      cookieStore.get(`a_session_${projectId}`)?.value ??
      cookieStore.get(`a_session_${projectId.toLowerCase()}`)?.value;

    if (sessionCookie) {
      const sessionClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
        .setProject(projectId)
        .setSession(sessionCookie);

      const account    = new Account(sessionClient);
      const sessionUser = await account.get();

      if (sessionUser?.$id) {
        const fullUser = await lookupUser(sessionUser.$id);
        if (fullUser) {
          console.log('[Auth Utils] ✅ Authenticated via session cookie:', fullUser.email);
          return fullUser;
        }
      }
    }
  } catch {
    // cookies() not available or session invalid — continue
  }

  if (!hasLoggedAuthError) {
    console.log('[Auth Utils] ❌ No valid authentication found');
    hasLoggedAuthError = true;
  }
  
  return null;
}

/** Returns true if the request has a valid authenticated user. */
export async function isRequestAuthenticated(req?: NextRequest): Promise<boolean> {
  return !!(await getAuthenticatedUser(req));
}

/** Alias kept for backward compatibility. */
export async function requireAuth(req?: NextRequest) {
  return getAuthenticatedUser(req);
}
