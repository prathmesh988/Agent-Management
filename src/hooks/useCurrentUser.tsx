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
        
        // Get current user session from Appwrite Account
        let session;
        try {
          session = await account.get();
        } catch (sessionError: any) {
          // Handle case where user is not authenticated
          if (sessionError?.code === 401 || sessionError?.message?.includes('missing scopes') || sessionError?.message?.includes('not authenticated')) {
            setCurrentUser(null);
            setError(null); // No error, just not authenticated
            setLoading(false);
            return;
          }
          throw sessionError;
        }
        
        if (!session || !session.$id) {
          setCurrentUser(null);
          setError(null);
          setLoading(false);
          return;
        }

        const userId = session.$id;

        // Fetch user details including labels/role from admin API
        const response = await fetch('/api/admin/current-user', {
          headers: {
            'x-user-id': userId,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setCurrentUser(null);
            setError(null);
          } else {
            throw new Error('Failed to fetch current user');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setCurrentUser(data.user);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        // Only set error if it's a real error, not just "not authenticated"
        if (!errorMsg.includes('missing scopes') && !errorMsg.includes('not authenticated')) {
          setError(errorMsg);
        }
        setCurrentUser(null);
        console.error('Error fetching current user:', err);
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
