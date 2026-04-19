'use client';

import { useState, useEffect } from 'react';
import { AdminUser } from '@/lib/types';
import { account } from '@/lib/appwrite-client';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First check if we have a valid localStorage session
        let userId: string | null = null;
        
        if (typeof window !== 'undefined') {
          const storedSession = localStorage.getItem('user_session');
          if (storedSession) {
            try {
              const sessionData = JSON.parse(storedSession);
              const sessionAge = Date.now() - (sessionData.timestamp || 0);
              const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
              
              if (sessionAge < MAX_SESSION_AGE && sessionData.userId) {
                userId = sessionData.userId;
              } else {
                localStorage.removeItem('user_session');
              }
            } catch (e) {
              localStorage.removeItem('user_session');
            }
          }
        }
        
        // If no valid localStorage session, try Appwrite Account
        if (!userId) {
          try {
            const session = await account.get();
            if (session && session.$id) {
              userId = session.$id;
            }
          } catch (sessionError: any) {
            // Handle case where user is not authenticated
            if (sessionError?.code === 401 || sessionError?.message?.includes('missing scopes') || sessionError?.message?.includes('not authenticated')) {
              setCurrentUser(null);
              setError(null); // No error, just not authenticated
              setLoading(false);
              return;
            }
            // For any other error, log but continue
            console.log('[useCurrentUser] Session check failed:', sessionError?.message);
          }
        }
        
        // If we don't have a userId by now, user is not authenticated
        if (!userId) {
          setCurrentUser(null);
          setError(null);
          setLoading(false);
          return;
        }

        // Fetch user details including labels/role from admin API
        try {
          const response = await fetch('/api/admin/current-user', {
            headers: {
              'x-user-id': userId,
            },
          });

          if (!response.ok) {
            if (response.status === 401 || response.status === 404) {
              console.log('[useCurrentUser] User not found or unauthorized');
              setCurrentUser(null);
              // Clear invalid session
              if (typeof window !== 'undefined') {
                localStorage.removeItem('user_session');
              }
            } else {
              console.error('[useCurrentUser] API error:', response.status, response.statusText);
              setError(`Failed to fetch user (${response.status})`);
            }
            setLoading(false);
            return;
          }

          const data = await response.json();
          console.log('[useCurrentUser] Fetched user:', data.user.email, 'Role:', data.user.role, 'Labels:', data.user.labels);
          setCurrentUser(data.user);
          setError(null);
        } catch (fetchError) {
          console.error('[useCurrentUser] Network error:', fetchError);
          setError(fetchError instanceof Error ? fetchError.message : 'Network error');
          setCurrentUser(null);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useCurrentUser] Error fetching current user:', err);
        setError(errorMsg);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return {
    currentUser,
    loading,
    error,
  };
}
