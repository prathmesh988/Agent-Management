'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Perm, ALL_PERMS } from '@/lib/permissions';

interface PermissionSet {
  canRead:   boolean;
  canWrite:  boolean;
  canUpdate: boolean;
  canDelete: boolean;
  loading:   boolean;
  role:      string;
}

function getUserId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const s = localStorage.getItem('user_session');
    return s ? JSON.parse(s).userId ?? '' : '';
  } catch { return ''; }
}

const cache = new Map<string, PermissionSet>();

/**
 * Hook that fetches all 4 permission bits for a given page at once.
 * Results are cached in memory for the session — no repeated API calls.
 */
export function usePagePermission(pageId: string): PermissionSet {
  const [perms, setPerms] = useState<PermissionSet>({
    canRead: true, canWrite: false, canUpdate: false, canDelete: false,
    loading: true, role: 'viewer',
  });

  const fetch4 = useCallback(async () => {
    const cached = cache.get(pageId);
    if (cached) { setPerms(cached); return; }

    const userId = getUserId();
    const headers: Record<string, string> = userId ? { 'x-user-id': userId } : {};

    try {
      const res = await fetch(`/api/permissions/check?pageId=${pageId}&perm=all`, { headers });
      const data = await res.json();
      
      const result: PermissionSet = {
        canRead:   data.canRead ?? data.allowed ?? false,
        canWrite:  data.canWrite ?? false,
        canUpdate: data.canUpdate ?? false,
        canDelete: data.canDelete ?? false,
        loading:   false,
        role:      data.role ?? 'viewer',
      };

      cache.set(pageId, result);
      setPerms(result);
    } catch {
      const result: PermissionSet = {
        canRead: false, canWrite: false, canUpdate: false, canDelete: false,
        loading: false, role: 'viewer',
      };
      cache.set(pageId, result);
      setPerms(result);
    }
  }, [pageId]);

  useEffect(() => {
    fetch4();
  }, [fetch4]);

  return perms;
}

/** Clear the in-memory cache for a specific page (call after saving permission changes). */
export function clearPagePermissionCache(pageId: string) {
  cache.delete(pageId);
}

/** Clear the ENTIRE in-memory cache (use sparingly). */
export function clearPermissionCache() {
  cache.clear();
}
