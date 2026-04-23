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

    // Fire 4 check calls in parallel
    const [r, w, u, d] = await Promise.all(
      ALL_PERMS.map((p: Perm) =>
        fetch(`/api/permissions/check?pageId=${pageId}&perm=${p}`, { headers })
          .then((res) => res.json())
          .catch(() => ({ allowed: false, role: 'viewer' }))
      )
    );

    const result: PermissionSet = {
      canRead:   r.allowed,
      canWrite:  w.allowed,
      canUpdate: u.allowed,
      canDelete: d.allowed,
      loading:   false,
      role:      r.role ?? 'viewer',
    };

    cache.set(pageId, result);
    setPerms(result);
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
