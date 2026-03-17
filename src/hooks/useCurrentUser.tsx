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
        
        // Get current user session from Appwrite Account
        const session = await account.get();
        
        if (!session || !session.$id) {
          setError('User not authenticated');
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
            setError('User not authenticated');
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
        setError(errorMsg);
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
