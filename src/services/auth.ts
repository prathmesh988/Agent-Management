import { Client, Account, ID } from 'appwrite';

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

const account = new Account(client);

// ============ AUTHENTICATION SERVICES ============

/**
 * Sign up a new user with email and password
 */
export const signUp = async (email: string, password: string, name: string) => {
  try {
    // Delete any existing session first
    try {
      await account.deleteSession('current');
    } catch (err) {
      // Session might not exist, that's fine
    }

    const user = await account.create(ID.unique(), email, password, name);
    
    // Automatically create session after signup
    await account.createEmailPasswordSession(email, password);
    
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Log in user with email and password
 */
export const logIn = async (email: string, password: string) => {
  try {
    // Delete any existing session first to prevent "session is active" error
    try {
      await account.deleteSession('current');
    } catch (err) {
      // Session might not exist, that's fine
    }

    const session = await account.createEmailPasswordSession(email, password);
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
 * Update user profile
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

