'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Models } from 'appwrite';
import {
  getCurrentUser,
  logIn,
  logOut,
  signUp,
  isAuthenticated as checkIsAuthenticated,
  updateName,
  updatePreferences,
  sendMagicLink as authSendMagicLink,
  verifyMagicLink as authVerifyMagicLink,
} from '@/services/auth';

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updateUserPreferences: (prefs: Record<string, any>) => Promise<void>;
  sendMagicLink: (email: string, redirectUrl: string) => Promise<void>;
  verifyMagicLink: (userId: string, secret: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await checkIsAuthenticated();
        if (authenticated) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await logIn(email, password);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      await signUp(email, password, name);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await logOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileName = async (name: string) => {
    try {
      setIsLoading(true);
      await updateName(name);
      // Fetch updated user to reflect changes in context
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPreferences = async (prefs: Record<string, any>) => {
    try {
      setIsLoading(true);
      await updatePreferences(prefs);
      // Fetch updated user to reflect changes in context
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMagicLink = async (email: string, redirectUrl: string) => {
    try {
      setIsLoading(true);
      await authSendMagicLink(email, redirectUrl);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMagicLink = async (userId: string, secret: string) => {
    try {
      setIsLoading(true);
      await authVerifyMagicLink(userId, secret);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateProfileName,
    updateUserPreferences,
    sendMagicLink,
    verifyMagicLink,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
