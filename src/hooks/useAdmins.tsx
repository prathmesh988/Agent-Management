'use client';

import { useState, useEffect } from 'react';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
  labels: string[];
  permissions: ('READ' | 'WRITE' | 'UPDATE' | 'DELETE')[];
  createdAt: string;
  status: 'active' | 'inactive';
}

export function useAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch admins from API
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      setAdmins(data.users);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update admin role
  const updateAdminRole = async (userId: string, role: 'admin' | 'viewer') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/label`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to update admin role');
      }

      const data = await response.json();

      // Update local state
      setAdmins(
        admins.map((admin) =>
          admin.id === userId
            ? {
                ...admin,
                role: data.user.role,
                labels: data.user.labels,
                permissions: data.user.permissions,
              }
            : admin
        )
      );

      return data.user;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error updating admin role:', err);
      throw new Error(errorMsg);
    }
  };

  // Delete admin (optional - for future use)
  const deleteAdmin = async (userId: string) => {
    try {
      // This would require an additional API route
      // For now, just remove from local state
      setAdmins(admins.filter((admin) => admin.id !== userId));
    } catch (err) {
      console.error('Error deleting admin:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return {
    admins,
    loading,
    error,
    fetchAdmins,
    updateAdminRole,
    deleteAdmin,
  };
}
