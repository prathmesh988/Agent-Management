'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ALL_PERMS, APP_ROLES, PERM_LABELS,
  type Perm, type AppRole, type PagePermissions, type UserOverride,
} from '@/lib/permissions';
import { clearPagePermissionCache } from '@/hooks/usePagePermission';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserId(): string {
  if (typeof window === 'undefined') return '';
  try { return JSON.parse(localStorage.getItem('user_session') || '{}').userId ?? ''; } catch { return ''; }
}

function authHeaders(extra: Record<string, string> = {}) {
  const uid = getUserId();
  return { 'Content-Type': 'application/json', ...(uid ? { 'x-user-id': uid } : {}), ...extra };
}

const ROLE_COLORS: Record<AppRole, string> = {
  admin:    '#f59e0b',
  manager:  '#8b5cf6',
  hr:       '#06b6d4',
  viewer:   '#64748b',
  new_user: '#ef4444',
};

const ROLE_ICONS: Record<AppRole, string> = {
  admin:    '👑',
  manager:  '🏢',
  hr:       '👥',
  viewer:   '👁',
  new_user: '⏳',
};

// ── PermToggle ────────────────────────────────────────────────────────────────
function PermToggle({
  perm, active, disabled, onChange,
}: { perm: Perm; active: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  const { label, icon } = PERM_LABELS[perm];
  return (
    <button
      title={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!active)}
      className={`pm-perm-toggle ${active ? 'pm-perm-toggle--on' : ''} ${disabled ? 'pm-perm-toggle--disabled' : ''}`}
    >
      <span className="pm-perm-icon">{icon}</span>
      <span className="pm-perm-label">{label}</span>
    </button>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
interface PermissionModalProps {
  pageId:   string;
  pageName: string;
  onClose:  () => void;
}

export function PermissionModal({ pageId, pageName, onClose }: PermissionModalProps) {
  const [tab,         setTab]         = useState<'roles' | 'users'>('users');
  const [data,        setData]        = useState<PagePermissions | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [searchQ,     setSearchQ]     = useState('');
  const [allUsers,    setAllUsers]    = useState<any[]>([]);
  const [usersLoading,setUsersLoading]= useState(true);
  const [feedback,    setFeedback]    = useState('');

  // ── Load current permissions ────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/permissions/${pageId}`, { headers: authHeaders() });
      const json = await res.json();
      setData(json);
    } catch { setFeedback('Failed to load permissions'); }
    finally { setLoading(false); }
  }, [pageId]);

  useEffect(() => { load(); }, [load]);

  // ── Pre-load all admin users on mount ───────────────────────────────────────
  useEffect(() => {
    setUsersLoading(true);
    fetch('/api/admin/users', { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => setAllUsers(json.users || []))
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, []);

  // ── Patch helper ────────────────────────────────────────────────────────────
  const patch = async (body: object) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/permissions/${pageId}`, {
        method:  'PATCH',
        headers: authHeaders(),
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData((prev) => prev ? { ...prev, ...json } : null);
      clearPagePermissionCache(pageId); // Only clear this specific page's cache
      setFeedback('✅ Saved');
      setTimeout(() => setFeedback(''), 2000);
    } catch (e: any) {
      setFeedback(`❌ ${e.message}`);
    } finally { setSaving(false); }
  };

  // ── Role perm toggle ────────────────────────────────────────────────────────
  const toggleRolePerm = (role: AppRole, perm: Perm) => {
    if (!data) return;
    const current = data.rolePerms[role] ?? [];
    const next    = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
    setData({ ...data, rolePerms: { ...data.rolePerms, [role]: next } });
    patch({ type: 'role', role, perms: next });
  };

  // ── User override perm toggle ───────────────────────────────────────────────
  const toggleUserPerm = (userId: string, perm: Perm) => {
    if (!data) return;
    const current = data.userOverrides[userId]?.perms ?? [];
    const next    = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
    const ov      = { ...data.userOverrides[userId], perms: next };
    setData({ ...data, userOverrides: { ...data.userOverrides, [userId]: ov } });
    patch({ type: 'user', userId, name: ov.name, email: ov.email, perms: next });
  };

  const removeUserOverride = (userId: string) => {
    if (!data) return;
    const next = { ...data.userOverrides };
    delete next[userId];
    setData({ ...data, userOverrides: next });
    patch({ type: 'removeUser', userId });
  };

  const handleSearchInput = (q: string) => setSearchQ(q);

  const currentUserId = getUserId();

  // Client-side filter of pre-loaded users
  const filteredUsers = allUsers
    .filter((u) => {
      const uid = u.id || u.$id;
      return uid !== currentUserId;
    })
    .filter((u) => {
      if (!searchQ.trim()) return true;
      return (
        u.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQ.toLowerCase())
      );
    });

  const addUserOverride = (u: any) => {
    if (!data) return;
    const userId = u.id || u.$id;
    if (data.userOverrides[userId]) return; // already added
    const override: UserOverride = { userId, name: u.name, email: u.email, perms: [] };
    const next = { ...data.userOverrides, [userId]: override };
    setData({ ...data, userOverrides: next });
    patch({ type: 'user', userId, name: u.name, email: u.email, perms: [] });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="pm-header">
          <div className="pm-header-left">
            <span className="pm-header-icon">⚙️</span>
            <div>
              <h3 className="pm-title">Page Permissions</h3>
              <p className="pm-subtitle">{pageName}</p>
            </div>
          </div>
          <button className="pm-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="pm-tabs">
           <button className={`pm-tab ${tab === 'users' ? 'pm-tab--active' : ''}`} onClick={() => setTab('users')}>
            👤 Users
          </button>
          <button className={`pm-tab ${tab === 'roles' ? 'pm-tab--active' : ''}`} onClick={() => setTab('roles')}>
            🎭 Roles
          </button>
        </div>

        {/* Body */}
        <div className="pm-body">
          {loading ? (
            <div className="pm-loading">Loading permissions…</div>
          ) : tab === 'roles' ? (
            /* ── Roles tab ── */
            <div className="pm-roles-list">
              <p className="pm-section-desc">
                Set default permissions per role. User overrides (Users tab) always take priority.
              </p>
              {APP_ROLES.filter((r) => r !== 'new_user').map((role) => (
                <div key={role} className="pm-role-row">
                  <div className="pm-role-info">
                    <span className="pm-role-icon" style={{ color: ROLE_COLORS[role] }}>
                      {ROLE_ICONS[role]}
                    </span>
                    <span className="pm-role-name" style={{ color: ROLE_COLORS[role] }}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  </div>
                  <div className="pm-perm-group">
                    {ALL_PERMS.map((perm) => (
                      <PermToggle
                        key={perm}
                        perm={perm}
                        active={(data?.rolePerms[role]?.includes(perm) ?? false)}
                        disabled={saving}
                        onChange={() => toggleRolePerm(role, perm)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Users tab ── */
            <div className="pm-users-section">
              <p className="pm-section-desc">
                Grant specific users custom access to this page — overrides their role defaults.
              </p>

              {/* Search / filter */}
              <div className="pm-search-wrap">
                <span className="pm-search-icon">🔍</span>
                <input
                  className="pm-search-input"
                  placeholder="Filter by name or email…"
                  value={searchQ}
                  onChange={(e) => handleSearchInput(e.target.value)}
                />
              </div>

              {/* Pre-loaded user list (client-side filtered) */}
              {usersLoading ? (
                <p className="pm-loading">Loading users…</p>
              ) : (
                <div className="pm-search-results">
                  {filteredUsers.length === 0 ? (
                    <p className="pm-loading">No users found</p>
                  ) : (
                    filteredUsers.map((u) => {
                      const uid     = u.id || u.$id;
                      const already = !!data?.userOverrides[uid];
                      return (
                        <div key={uid} className="pm-search-result-row">
                          <div className="pm-user-avatar">{u.name?.charAt(0)?.toUpperCase() || '?'}</div>
                          <div className="pm-user-info">
                            <p className="pm-user-name">{u.name}</p>
                            <p className="pm-user-email">{u.email} · <span style={{ opacity: 0.6 }}>{u.role}</span></p>
                          </div>
                          <button
                            className="pm-btn-add"
                            disabled={already}
                            onClick={() => addUserOverride(u)}
                          >
                            {already ? 'Added ✓' : '+ Add'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Divider if overrides exist */}
              {(() => {
                const overridesList = Object.values(data?.userOverrides ?? {}).filter((ov) => ov.userId !== currentUserId);
                return (
                  <>
                    {overridesList.length > 0 && (
                      <div className="pm-overrides-header"><span>Custom access assigned</span></div>
                    )}

                    {/* Current overrides */}
                    <div className="pm-overrides-list">
                      {overridesList.length === 0 ? (
                        <div className="pm-empty">
                          <p>🔒 No custom overrides yet</p>
                          <span>Click + Add on a user above to grant custom permissions</span>
                        </div>
                      ) : (
                        overridesList.map((ov) => (
                          <div key={ov.userId} className="pm-override-row">
                            <div className="pm-user-avatar">{ov.name?.charAt(0)?.toUpperCase() || '?'}</div>
                            <div className="pm-user-info">
                              <p className="pm-user-name">{ov.name}</p>
                              <p className="pm-user-email">{ov.email}</p>
                            </div>
                            <div className="pm-perm-group">
                              {ALL_PERMS.map((perm) => (
                                <PermToggle
                                  key={perm}
                                  perm={perm}
                                  active={ov.perms.includes(perm)}
                                  disabled={saving}
                                  onChange={() => toggleUserPerm(ov.userId, perm)}
                                />
                              ))}
                            </div>
                            <button
                              className="pm-btn-remove"
                              title="Remove override"
                              onClick={() => removeUserOverride(ov.userId)}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer feedback */}
        {feedback && <div className={`pm-feedback ${feedback.startsWith('✅') ? 'pm-feedback--ok' : 'pm-feedback--err'}`}>{feedback}</div>}
      </div>
    </div>
  );
}
