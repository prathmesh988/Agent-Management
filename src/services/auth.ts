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
 */
export const sendMagicLink = async (email: string, redirectUrl: string) => {
  try {
    try {
      await account.deleteSession('current');
    } catch (err) {
      // Ignore
    }
    return await account.createMagicURLToken(ID.unique(), email, redirectUrl);
  } catch (error) {
    throw error;
  }
};

/**
 * Verify Magic Link
 */
export const verifyMagicLink = async (userId: string, secret: string) => {
  try {
    try {
      await account.deleteSession('current');
    } catch (err) {
      // Ignore
    }
    const session = await account.updateMagicURLSession(userId, secret);
    
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
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    return null;
  }
};

/**
 * Log out current user
 */
export const logOut = async () => {
  try {
    await account.deleteSession('current');
    
    // Clear auth cookie
    if (typeof window !== 'undefined') {
      document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await account.get();
    return !!user;
  } catch {
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

