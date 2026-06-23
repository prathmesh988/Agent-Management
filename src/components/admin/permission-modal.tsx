'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ALL_PERMS, APP_ROLES, PERM_LABELS, DEFAULT_ROLE_PERMS, MANAGED_PAGES,
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

const ROLE_DISPLAY: Record<AppRole, string> = {
  admin:    'Admin',
  manager:  'Manager',
  hr:       'HR',
  viewer:   'Viewer',
  new_user: 'New User',
};

// ── PermToggle ────────────────────────────────────────────────────────────────
function PermToggle({
  perm, active, disabled, locked, roleLabel, onChange,
}: {
  perm: Perm; active: boolean; disabled?: boolean; locked?: boolean;
  roleLabel?: string; onChange: (v: boolean) => void;
}) {
  const { label, icon } = PERM_LABELS[perm];
  const [pendingConfirm, setPendingConfirm] = useState(false);

  // Auto-cancel confirm step after 3s
  useEffect(() => {
    if (!pendingConfirm) return;
    const t = setTimeout(() => setPendingConfirm(false), 3000);
    return () => clearTimeout(t);
  }, [pendingConfirm]);

  if (locked) {
    return (
      <div
        title="Admin always has full access. This cannot be changed."
        className={`pm-perm-toggle pm-perm-toggle--on-${perm} pm-perm-toggle--locked`}
        role="img"
        aria-label={`${label} — locked on`}
      >
        <span className="pm-perm-icon">{icon}</span>
        <span className="pm-perm-label">{label}</span>
      </div>
    );
  }

  // Task 5: Delete ON → show inline confirm step
  if (perm === 'd' && !active && pendingConfirm) {
    return (
      <div className="pm-perm-toggle pm-perm-toggle--confirm">
        <span className="pm-perm-confirm-text">
          {icon} Lets {roleLabel ?? 'this role'} permanently remove records
        </span>
        <div className="pm-perm-confirm-actions">
          <button
            className="pm-perm-confirm-btn pm-perm-confirm-btn--ok"
            onClick={() => { setPendingConfirm(false); onChange(true); }}
          >
            Confirm ✓
          </button>
          <button
            className="pm-perm-confirm-btn pm-perm-confirm-btn--cancel"
            onClick={() => setPendingConfirm(false)}
          >
            Cancel ✕
          </button>
        </div>
      </div>
    );
  }

  const handleClick = () => {
    if (disabled) return;
    if (perm === 'd' && !active) {
      // Granting delete — require confirm
      setPendingConfirm(true);
    } else {
      onChange(!active);
    }
  };

  return (
    <button
      title={perm === 'd' && !active ? 'Grant delete — requires confirmation' : label}
      disabled={disabled}
      onClick={handleClick}
      className={`pm-perm-toggle ${active ? `pm-perm-toggle--on-${perm}` : ''} ${disabled ? 'pm-perm-toggle--disabled' : ''}`}
    >
      <span className="pm-perm-icon">{icon}</span>
      <span className="pm-perm-label">{label}</span>
    </button>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
interface PermissionModalProps {
  pageId:       string;
  pageName:     string;
  pagePath?:    string; // Task 9: used to detect sub-route inheritance
  resolvedFrom?: string; // Task 9: parent pageId when path needed fallback
  onClose:      () => void;
}

export function PermissionModal({ pageId, pageName, pagePath, resolvedFrom, onClose }: PermissionModalProps) {
  const [data,           setData]           = useState<PagePermissions | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [searchQ,        setSearchQ]        = useState('');
  const [allUsers,       setAllUsers]       = useState<any[]>([]);
  const [usersLoading,   setUsersLoading]   = useState(true);
  const [feedback,       setFeedback]       = useState('');
  const [hoveredRole,    setHoveredRole]    = useState<AppRole | null>(null);
  // Task 7: single-scroll — add-user panel open/closed
  const [addOpen,        setAddOpen]        = useState(false);
  // Task 8: Preview As
  const [previewRole,    setPreviewRole]    = useState<AppRole | null>(null);

  // ── Load current permissions ─────────────────────────────────────────────
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

  // ── Pre-load all admin users on mount ────────────────────────────────────
  useEffect(() => {
    setUsersLoading(true);
    fetch('/api/admin/users', { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => setAllUsers(json.users || []))
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, []);

  // ── Patch helper ─────────────────────────────────────────────────────────
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
      clearPagePermissionCache(pageId);
      setFeedback('✅ Saved');
      setTimeout(() => setFeedback(''), 2000);
    } catch (e: any) {
      setFeedback(`❌ ${e.message}`);
    } finally { setSaving(false); }
  };

  // ── Role perm toggle ──────────────────────────────────────────────────────
  const toggleRolePerm = (role: AppRole, perm: Perm) => {
    if (!data) return;
    const current = data.rolePerms[role] ?? [];
    const next    = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
    setData({ ...data, rolePerms: { ...data.rolePerms, [role]: next } });
    patch({ type: 'role', role, perms: next });
  };

  // ── User override perm toggle ─────────────────────────────────────────────
  const toggleUserPerm = (userId: string, perm: Perm) => {
    if (!data) return;
    const current = data.userOverrides[userId]?.perms ?? [];
    const next    = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
    const ov      = { ...data.userOverrides[userId], perms: next };
    setData({ ...data, userOverrides: { ...data.userOverrides, [userId]: ov } });
    patch({ type: 'user', userId, name: ov.name, email: ov.email, perms: next, userRole: ov.userRole });
  };

  const removeUserOverride = (userId: string) => {
    if (!data) return;
    const next = { ...data.userOverrides };
    delete next[userId];
    setData({ ...data, userOverrides: next });
    patch({ type: 'removeUser', userId });
  };

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
    if (data.userOverrides[userId]) return;
    const userRole: AppRole = (u.role as AppRole) || 'new_user';
    const override: UserOverride = { userId, name: u.name, email: u.email, perms: [], userRole };
    const next = { ...data.userOverrides, [userId]: override };
    setData({ ...data, userOverrides: next });
    patch({ type: 'user', userId, name: u.name, email: u.email, perms: [], userRole });
  };

  // ── Task 8: Preview As — compute effective perms from current (unsaved) state
  const computePreview = (role: AppRole): Record<Perm, boolean> => {
    if (role === 'admin') return { r: true, w: true, u: true, d: true };
    const rolePerms = data?.rolePerms[role] ?? DEFAULT_ROLE_PERMS[role] ?? [];
    return {
      r: rolePerms.includes('r'),
      w: rolePerms.includes('w'),
      u: rolePerms.includes('u'),
      d: rolePerms.includes('d'),
    };
  };

  // Count users whose role matches preview + have overrides
  const previewOverrideCount = previewRole
    ? Object.values(data?.userOverrides ?? {}).filter((ov) => ov.userRole === previewRole).length
    : 0;

  // ── Cascade banner role counts ────────────────────────────────────────────
  const nonAdminRoles: AppRole[] = ['manager', 'hr', 'viewer', 'new_user'];
  const roleCounts = nonAdminRoles.reduce<Record<string, number>>((acc, r) => {
    acc[r] = allUsers.filter((u) => (u.role || 'new_user') === r).length;
    return acc;
  }, {});

  // ── Override list (excluding self) ────────────────────────────────────────
  const overridesList = Object.values(data?.userOverrides ?? {}).filter(
    (ov) => ov.userId !== currentUserId
  );

  // ── Task 9: detect sub-route ──────────────────────────────────────────────
  const parentPage = resolvedFrom
    ? MANAGED_PAGES.find((p) => p.pageId === resolvedFrom)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="pm-header">
          <div className="pm-header-left">
            <span className="pm-header-icon">⚙️</span>
            <div>
              <h3 className="pm-title">Page Permissions</h3>
              <p className="pm-subtitle">{pageName}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Task 8: Preview As dropdown */}
            <div className="pm-preview-select-wrap">
              <span className="pm-preview-label">Preview as:</span>
              <select
                className="pm-preview-select"
                value={previewRole ?? ''}
                onChange={(e) => setPreviewRole((e.target.value as AppRole) || null)}
              >
                <option value="">— off</option>
                {APP_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_ICONS[r]} {ROLE_DISPLAY[r]}</option>
                ))}
              </select>
            </div>
            <button className="pm-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Task 8: Preview bar (animated in below header when a role is selected) */}
        {previewRole && (() => {
          const preview = computePreview(previewRole);
          return (
            <div className="pm-preview-bar">
              <span className="pm-preview-bar-role">
                {ROLE_ICONS[previewRole]} Viewing as {ROLE_DISPLAY[previewRole]}
              </span>
              {ALL_PERMS.map((p) => (
                <span
                  key={p}
                  className={`pm-preview-perm ${preview[p] ? 'pm-preview-perm--granted' : 'pm-preview-perm--denied'}`}
                >
                  {PERM_LABELS[p].icon} {PERM_LABELS[p].label} {preview[p] ? '✓' : '✗'}
                </span>
              ))}
              {previewOverrideCount > 0 && (
                <span className="pm-preview-override-note">
                  {previewOverrideCount} user override{previewOverrideCount > 1 ? 's' : ''} may differ
                </span>
              )}
            </div>
          );
        })()}

        {/* Task 9: Sub-route inherited-from banner */}
        {parentPage && (
          <div className="pm-subroute-banner">
            <span className="pm-subroute-banner-icon">📎</span>
            <div>
              <strong>Inherited from {parentPage.pageName}</strong>
              <br />
              Settings here control <code>{parentPage.pagePath}</code> and all child routes like{' '}
              <code>{parentPage.pagePath}/[id]</code>. Changes apply to the parent page.
            </div>
          </div>
        )}

        {/* ── Body (single scroll — Task 7) ─────────────────────────────── */}
        <div className="pm-body">
          {loading ? (
            <div className="pm-loading">Loading permissions…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* ── ROLE DEFAULTS section ──────────────────────────────── */}
              <p className="pm-section-desc">
                Role defaults apply to every user in that role. User overrides (below) always take priority.
              </p>

              {/* Cascade banner */}
              <div className="pm-cascade-banner">
                <span className="pm-cascade-banner-icon">ℹ️</span>
                <span>Editing role defaults affects <strong>all users</strong> in that role.</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                  {nonAdminRoles.map((r) => (
                    <span
                      key={r}
                      className={`pm-cascade-count${hoveredRole === r ? ' pm-cascade-count--highlighted' : ''}`}
                    >
                      {ROLE_DISPLAY[r]} → {roleCounts[r] ?? 0} {roleCounts[r] === 1 ? 'user' : 'users'}
                    </span>
                  ))}
                </span>
                <span style={{ opacity: 0.6 }}>· Overrides are unaffected.</span>
              </div>

              {/* Role rows */}
              <div className="pm-roles-list">
                {APP_ROLES.filter((r) => r !== 'new_user').map((role) => {
                  const isAdmin      = role === 'admin';
                  const isPreviewing = previewRole === role;
                  return (
                    <div
                      key={role}
                      className={[
                        'pm-role-row',
                        isAdmin      ? 'pm-role-row--admin'      : '',
                        isPreviewing ? 'pm-role-row--previewing' : '',
                      ].filter(Boolean).join(' ')}
                      onMouseEnter={() => !isAdmin && setHoveredRole(role)}
                      onMouseLeave={() => setHoveredRole(null)}
                    >
                      <div className="pm-role-info">
                        <span className="pm-role-icon" style={{ color: ROLE_COLORS[role] }}>
                          {ROLE_ICONS[role]}
                        </span>
                        <span className="pm-role-name" style={{ color: ROLE_COLORS[role] }}>
                          {ROLE_DISPLAY[role]}
                        </span>
                      </div>
                      <div className="pm-perm-group">
                        {ALL_PERMS.map((perm) => (
                          <PermToggle
                            key={perm}
                            perm={perm}
                            active={isAdmin ? true : (data?.rolePerms[role]?.includes(perm) ?? false)}
                            disabled={!isAdmin && saving}
                            locked={isAdmin}
                            roleLabel={ROLE_DISPLAY[role]}
                            onChange={() => toggleRolePerm(role, perm)}
                          />
                        ))}
                      </div>
                      {isAdmin && (
                        <span className="pm-admin-lock-badge">🔒 System — always full access</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── OVERRIDES section (Task 6 + Task 7) ───────────────── */}
              <div className="pm-section-divider">
                {overridesList.length} custom override{overridesList.length !== 1 ? 's' : ''}
              </div>

              {/* Existing overrides */}
              <div className="pm-overrides-list">
                {overridesList.length === 0 ? (
                  <div className="pm-empty">
                    <p>🔒 No custom overrides yet</p>
                    <span>Use the expander below to grant a specific user custom access</span>
                  </div>
                ) : (
                  overridesList.map((ov) => {
                    // Task 6: compute role default ghost
                    const roleDefault: Perm[] = ov.userRole
                      ? (data?.rolePerms[ov.userRole] ?? DEFAULT_ROLE_PERMS[ov.userRole] ?? [])
                      : [];
                    const roleLabel = ov.userRole ? ROLE_DISPLAY[ov.userRole] : null;

                    return (
                      <div key={ov.userId} className="pm-override-row">
                        <div className="pm-user-avatar">
                          {ov.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>

                        {/* User info + ghost */}
                        <div className="pm-user-info">
                          <p className="pm-user-name">{ov.name}</p>
                          <p className="pm-user-email">{ov.email}</p>

                          {/* Task 6: Role-default ghost line */}
                          {roleLabel && (
                            <div className="pm-override-role-ghost">
                              <span className="pm-override-role-ghost-label">
                                Role: {roleLabel} · Default:
                              </span>
                              {ALL_PERMS.map((p) => (
                                <span key={p} style={{
                                  fontSize: '0.7rem',
                                  opacity: roleDefault.includes(p) ? 1 : 0.25,
                                }}>
                                  {PERM_LABELS[p].icon}
                                </span>
                              ))}
                              {/* ↩ Reset to role */}
                              <button
                                className="pm-override-reset-btn"
                                title={`Reset to ${roleLabel} defaults`}
                                onClick={() => removeUserOverride(ov.userId)}
                              >
                                ↩ Reset to role
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Permission toggles */}
                        <div className="pm-perm-group">
                          {ALL_PERMS.map((perm) => (
                            <PermToggle
                              key={perm}
                              perm={perm}
                              active={ov.perms.includes(perm)}
                              disabled={saving}
                              roleLabel={ov.name}
                              onChange={() => toggleUserPerm(ov.userId, perm)}
                            />
                          ))}
                        </div>

                        {/* Remove override entirely */}
                        <button
                          className="pm-btn-remove"
                          title="Remove override"
                          onClick={() => removeUserOverride(ov.userId)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Task 7: + Add user override expander */}
              <button
                className="pm-add-override-expander"
                onClick={() => setAddOpen((v) => !v)}
              >
                {addOpen ? '▲ Hide user search' : '+ Add user override…'}
              </button>

              {addOpen && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Search */}
                  <div className="pm-search-wrap">
                    <span className="pm-search-icon">🔍</span>
                    <input
                      className="pm-search-input"
                      placeholder="Filter by name or email…"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                    />
                  </div>

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
                              <div className="pm-user-avatar">
                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="pm-user-info">
                                <p className="pm-user-name">{u.name}</p>
                                <p className="pm-user-email">
                                  {u.email} · <span style={{ opacity: 0.6 }}>{u.role}</span>
                                </p>
                              </div>
                              <button
                                className="pm-btn-add"
                                disabled={already}
                                onClick={() => { addUserOverride(u); setAddOpen(false); setSearchQ(''); }}
                              >
                                {already ? 'Added ✓' : '+ Add'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer feedback */}
        {feedback && (
          <div className={`pm-feedback ${feedback.startsWith('✅') ? 'pm-feedback--ok' : 'pm-feedback--err'}`}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
