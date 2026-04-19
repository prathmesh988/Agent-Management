import { Client, Account, ID } from 'appwrite';

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

const account = new Account(client);

// ============ AUTHENTICATION SERVICES ============

/**
 * Sign up a new user with email and password
 * 
 * Note: Appwrite only allows ONE active session per Account instance.
 * If a session already exists, we must delete it first before creating a new one.
 * The deleteSession is wrapped in try/catch because no session might exist.
 */
export const signUp = async (email: string, password: string, name: string) => {
  try {
    // Delete any existing session first (required by Appwrite - only 1 session allowed)
    try {
      await account.deleteSession('current');
    } catch (err) {
      // Session might not exist, that's fine - continue with signup
    }

    // Create new user account
    const user = await account.create(ID.unique(), email, password, name);
    
    // Automatically create authenticated session after signup
    await account.createEmailPasswordSession(email, password);

    // Set auth cookie for middleware validation
    if (typeof window !== 'undefined') {
      document.cookie = 'auth_session=true; path=/; SameSite=Lax';
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Log in user with email and password
 * 
 * Note: Appwrite only allows ONE active session per Account instance.
 * If a session already exists (from previous login, page refresh, etc),
 * we must delete it first before creating a new authenticated session.
 * The deleteSession is wrapped in try/catch because no session might exist.
 */
export const logIn = async (email: string, password: string) => {
  try {
    // Delete any existing session first (required by Appwrite - only 1 session allowed)
    try {
      await account.deleteSession('current');
    } catch (err) {
      // Session might not exist, that's fine - continue with login
    }

    // Create fresh authenticated session with new credentials
    const session = await account.createEmailPasswordSession(email, password);
    
    // Set auth cookie for middleware validation
    if (typeof window !== 'undefined') {
      document.cookie = 'auth_session=true; path=/; SameSite=Lax';
    }
    
    return session;
  } catch (error) {
    throw error;
  }
};

/**
 * Send Magic Link (Passwordless Login / Signup)
 * 
 * Note: Creates a magic URL token that Appwrite will append userId and secret to.
 * The redirectUrl must be exactly as provided when verifying the token.
 */
export const sendMagicLink = async (email: string, redirectUrl: string) => {
  try {
    // Delete any existing session before creating magic link
    try {
      await account.deleteSession('current');
    } catch (err) {
      // Session might not exist, that's fine
    }

    console.log('[sendMagicLink] Creating magic URL token for:', email, 'redirectUrl:', redirectUrl);
    const token = await account.createMagicURLToken(ID.unique(), email, redirectUrl);
    console.log('[sendMagicLink] Magic link token created successfully');
    return token;
  } catch (error) {
    console.error('[sendMagicLink] Error:', error);
    throw error;
  }
};

/**
 * Verify Magic Link
 * Stores session in localStorage for persistence across page refreshes.
 */
export const verifyMagicLink = async (userId: string, secret: string) => {
  try {
    console.log('[verifyMagicLink] Verifying magic link for userId:', userId);
    console.log('[verifyMagicLink] Secret length:', secret.length);

    // Delete any existing session first (only one session allowed in Appwrite)
    try {
      await account.deleteSession('current');
      console.log('[verifyMagicLink] Deleted existing session');
    } catch (err) {
      // Session might not exist, that's fine
      console.log('[verifyMagicLink] No existing session to delete');
    }

    // Verify the magic link token and create a new authenticated session
    console.log('[verifyMagicLink] Calling updateMagicURLSession with userId:', userId, 'secret length:', secret.length);
    const session = await account.updateMagicURLSession(userId, secret);
    
    // Wait for the session cookie to be properly persisted to disk
    console.log('[verifyMagicLink] Waiting for session to persist in cookies...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Set auth cookie for middleware validation - use more secure settings
    if (typeof window !== 'undefined') {
      // Set cookie with longer expiration (7 days)
      const date = new Date();
      date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
      document.cookie = `auth_session=true; path=/; expires=${date.toUTCString()}; SameSite=Lax`;
      console.log('[verifyMagicLink] Auth session cookie set');
      
      // Store session data in localStorage immediately for page refresh resilience
      const sessionData = {
        userId: userId,
        timestamp: Date.now(),
      };
      localStorage.setItem('user_session', JSON.stringify(sessionData));
      console.log('[verifyMagicLink] Session stored in localStorage as backup');
    }

    return session;
  } catch (error) {
    console.error('[verifyMagicLink] Error verifying magic link:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 * Falls back to localStorage if Appwrite session fails (e.g., on page refresh with magic link)
 * When using localStorage fallback, fetches full user details from server API
 */
export const getCurrentUser = async () => {
  try {
    // First check if we have a valid localStorage session (from magic link)
    if (typeof window !== 'undefined') {
      const storedSession = localStorage.getItem('user_session');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          
          // Check if session is not too old (24 hours)
          const sessionAge = Date.now() - (sessionData.timestamp || 0);
          const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
          
          if (sessionAge < MAX_SESSION_AGE) {
            console.log('[getCurrentUser] Using localStorage session, fetching full details from server');
            
            // Try to fetch full user details from server API
            try {
              const response = await fetch('/api/admin/current-user', {
                headers: {
                  'x-user-id': sessionData.userId,
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log('[getCurrentUser] Fetched full user details from server');
                // Map server API response to Appwrite User format
                return {
                  $id: data.user.id,
                  email: data.user.email,
                  name: data.user.name,
                } as any;
              }
            } catch (fetchError) {
              console.warn('[getCurrentUser] Error fetching from server:', fetchError);
            }
            
            // Fall back to localStorage data if server fetch fails
            console.log('[getCurrentUser] Using partial data from localStorage');
            return {
              $id: sessionData.userId,
              email: sessionData.email || '',
              name: sessionData.name || '',
            } as any;
          }
        } catch (parseError) {
          console.error('[getCurrentUser] Error parsing stored session:', parseError);
          localStorage.removeItem('user_session');
        }
      }
    }

    // If no valid localStorage session, try Appwrite
    console.log('[getCurrentUser] Fetching current user from Appwrite...');
    const user = await account.get();
    console.log('[getCurrentUser] User fetched successfully:', user.email);
    
    // Update localStorage with fresh user data
    if (typeof window !== 'undefined') {
      const sessionData = {
        userId: user.$id,
        email: user.email,
        name: user.name,
        timestamp: Date.now(),
      };
      localStorage.setItem('user_session', JSON.stringify(sessionData));
    }
    
    return user;
  } catch (error) {
    console.log('[getCurrentUser] Failed to get user:', error instanceof Error ? error.message : error);
    return null;
  }
};

/**
 * Log out current user - Complete session cleanup
 */
export const logOut = async () => {
  try {
    console.log('[logOut] Starting complete logout...');
    
    // 1. Delete the current session from Appwrite
    try {
      await account.deleteSession('current');
      console.log('[logOut] Appwrite session deleted');
    } catch (error: any) {
      // Session might not exist, that's fine
      console.log('[logOut] No Appwrite session to delete');
    }
    
    // 2. Clear all cookies
    if (typeof window !== 'undefined') {
      // Clear auth-related cookies
      document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      
      // Clear all cookies by setting them to expire immediately
      document.cookie.split(';').forEach((c) => {
        const cookieName = c.split('=')[0].trim();
        if (cookieName) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      console.log('[logOut] All cookies cleared');
    }
    
    // 3. Clear localStorage completely
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_session');
      localStorage.removeItem('auth_state');
      console.log('[logOut] LocalStorage cleared');
    }
    
    // 4. Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      console.log('[logOut] SessionStorage cleared');
    }
    
    console.log('[logOut] Logout complete');
  } catch (error) {
    console.error('[logOut] Logout error:', error);
    // Even if logout fails, we should still clear client-side data
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    throw error;
  }
};

/**
 * Check if user is authenticated - with fallback to localStorage
 * On page refresh, the Appwrite session cookie might not be immediately available,
 * but we can trust the localStorage session that was stored after magic link verification.
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // First check if we have a valid localStorage session (from magic link)
    if (typeof window !== 'undefined') {
      const storedSession = localStorage.getItem('user_session');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          
          // Check if session is not too old (24 hours)
          const sessionAge = Date.now() - (sessionData.timestamp || 0);
          const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
          
          if (sessionAge < MAX_SESSION_AGE) {
            console.log('[isAuthenticated] Using valid localStorage session');
            return true;
          } else {
            console.log('[isAuthenticated] Stored session is too old, clearing');
            localStorage.removeItem('user_session');
          }
        } catch (parseError) {
          console.error('[isAuthenticated] Error parsing stored session:', parseError);
          localStorage.removeItem('user_session');
        }
      }
    }

    // If no valid localStorage session, try Appwrite session
    console.log('[isAuthenticated] Checking Appwrite session...');
    const user = await account.get();
    console.log('[isAuthenticated] Session is valid for:', user.email);
    
    // If Appwrite session is valid, store it in localStorage for persistence
    if (typeof window !== 'undefined' && user.$id) {
      const sessionData = {
        userId: user.$id,
        email: user.email,
        name: user.name,
        timestamp: Date.now(),
      };
      localStorage.setItem('user_session', JSON.stringify(sessionData));
    }
    
    return !!user;
  } catch (error) {
    console.log('[isAuthenticated] No valid session found:', error instanceof Error ? error.message : error);
    return false;
  }
};

/**
 * Update user profile (Name and password-verified email)
 */
export const updateProfile = async (name: string, email: string) => {
  try {
    const updates = await Promise.all([
      account.updateName(name),
      account.updateEmail(email, 'password'), // May require password verification
    ]);
    return updates;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user's name only
 */
export const updateName = async (name: string) => {
  try {
    return await account.updateName(name);
  } catch (error) {
    throw error;
  }
};

/**
 * Update user preferences (allows storing custom key-value pairs like phone, title, etc)
 */
export const updatePreferences = async (prefs: Record<string, any>) => {
  try {
    return await account.updatePrefs(prefs);
  } catch (error) {
    throw error;
  }
};


/**
 * Change user password
 */
export const changePassword = async (newPassword: string, oldPassword: string) => {
  try {
    return await account.updatePassword(newPassword, oldPassword);
  } catch (error) {
    throw error;
  }
};

export { client, account };

