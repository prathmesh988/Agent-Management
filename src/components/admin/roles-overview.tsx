"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import {
  MANAGED_PAGES,
  ALL_PERMS,
  PERM_LABELS,
  DEFAULT_ROLE_PERMS,
  type AppRole,
  type Perm,
} from "@/lib/permissions";

function getUserId(): string {
  if (typeof window === "undefined") return "";
  try {
    return JSON.parse(localStorage.getItem("user_session") || "{}").userId ?? "";
  } catch {
    return "";
  }
}

function authHeaders() {
  const uid = getUserId();
  return { "Content-Type": "application/json", ...(uid ? { "x-user-id": uid } : {}) };
}

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  admin:    { icon: "👑", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  manager:  { icon: "🏢", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  hr:       { icon: "👥", color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
  mvp:      { icon: "🚀", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  viewer:   { icon: "👁️", color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  new_user: { icon: "⏳", color: "#f97316", bg: "rgba(249,115,22,0.1)" },
};

const ROLE_DISPLAY: Record<string, string> = {
  admin: "Admin", manager: "Manager", hr: "HR", mvp: "MVP",
  viewer: "Viewer", new_user: "New User",
};

interface PagePermData {
  pageId: string;
  pageName: string;
  rolePerms: Record<AppRole, string[]>;
  userOverrides: Record<string, { userId: string; name: string; email: string; perms: string[]; userRole?: string }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ── Aggregated per-user override info ─────────────────────────────────────────
interface UserOverrideInfo {
  uid: string;
  name: string;
  email: string;
  role?: string;
  pages: { pageId: string; pageName: string; perms: string[] }[];
}

// ── Check if override differs from role default ────────────────────────────────
function hasOverrideDiff(overridePerms: string[], userRole: string | undefined): boolean {
  if (!userRole) return false;
  const roleDefault: Perm[] = DEFAULT_ROLE_PERMS[userRole as AppRole] ?? [];
  const a = [...overridePerms].sort().join(",");
  const b = [...roleDefault].sort().join(",");
  return a !== b;
}

// ── Perm chip colors ──────────────────────────────────────────────────────────
const PERM_CHIP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  r: { bg: "rgba(56,189,248,0.15)",  border: "rgba(56,189,248,0.4)",  text: "#38bdf8" },
  w: { bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.4)",  text: "#34d399" },
  u: { bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.4)",  text: "#fbbf24" },
  d: { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)", text: "#f87171" },
};

// ── Small perm icon chip (read-only display) ──────────────────────────────────
function PermChip({ p, active }: { p: string; active: boolean }) {
  const { icon } = PERM_LABELS[p as keyof typeof PERM_LABELS] || { icon: p };
  const colors = PERM_CHIP_COLORS[p] ?? { bg: "rgba(129,140,248,0.15)", border: "rgba(129,140,248,0.3)", text: "#818cf8" };
  return (
    <span
      title={PERM_LABELS[p as keyof typeof PERM_LABELS]?.label ?? p}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "1.5rem",
        height: "1.5rem",
        borderRadius: "0.35rem",
        fontSize: "0.72rem",
        opacity: active ? 1 : 0.15,
        background: active ? colors.bg : "transparent",
        border: `1px solid ${active ? colors.border : "transparent"}`,
        transition: "opacity 0.15s, background 0.15s",
      }}
    >
      {icon}
    </span>
  );
}

// ── Clickable perm toggle (used in drawer) ────────────────────────────────────
function PermToggleBtn({
  p, active, disabled, onChange,
}: {
  p: string; active: boolean; disabled?: boolean; onChange: (v: boolean) => void;
}) {
  const { icon, label } = PERM_LABELS[p as keyof typeof PERM_LABELS] || { icon: p, label: p };
  const colors = PERM_CHIP_COLORS[p] ?? { bg: "rgba(129,140,248,0.15)", border: "rgba(129,140,248,0.3)", text: "#818cf8" };
  const [pendingDelete, setPendingDelete] = useState(false);

  useEffect(() => {
    if (!pendingDelete) return;
    const t = setTimeout(() => setPendingDelete(false), 3000);
    return () => clearTimeout(t);
  }, [pendingDelete]);

  if (p === "d" && !active && pendingDelete) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: "0.4rem",
        padding: "0.35rem 0.6rem", borderRadius: "0.5rem",
        border: "1.5px solid rgba(248,113,113,0.45)",
        background: "rgba(248,113,113,0.1)", fontSize: "0.68rem",
      }}>
        <span style={{ color: "#fca5a5", fontWeight: 600 }}>Grant delete?</span>
        <button
          onClick={() => { setPendingDelete(false); onChange(true); }}
          style={{ padding: "0.1rem 0.45rem", borderRadius: "0.3rem", background: "rgba(248,113,113,0.25)", border: "1px solid rgba(248,113,113,0.5)", color: "#f87171", fontWeight: 700, fontSize: "0.65rem", cursor: "pointer" }}
        >✓</button>
        <button
          onClick={() => setPendingDelete(false)}
          style={{ padding: "0.1rem 0.45rem", borderRadius: "0.3rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", fontWeight: 700, fontSize: "0.65rem", cursor: "pointer" }}
        >✕</button>
      </div>
    );
  }

  return (
    <button
      title={`${active ? "Revoke" : "Grant"} ${label}`}
      disabled={disabled}
      onClick={() => {
        if (p === "d" && !active) { setPendingDelete(true); return; }
        onChange(!active);
      }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem",
        padding: "0.4rem 0.55rem", borderRadius: "0.5rem", cursor: disabled ? "not-allowed" : "pointer",
        border: `1.5px solid ${active ? colors.border : "rgba(255,255,255,0.1)"}`,
        background: active ? colors.bg : "rgba(255,255,255,0.04)",
        color: active ? colors.text : "#64748b",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s", minWidth: "3rem",
      }}
    >
      <span style={{ fontSize: "1rem", lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
    </button>
  );
}

// ── Page badge chip (in table row) ────────────────────────────────────────────
function PageBadge({ name, hasDiff }: { name: string; hasDiff: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.25rem",
      fontSize: "0.67rem", fontWeight: 600,
      borderRadius: "0.35rem", padding: "0.15rem 0.45rem",
      background: hasDiff ? "rgba(129,140,248,0.1)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${hasDiff ? "rgba(129,140,248,0.28)" : "rgba(255,255,255,0.08)"}`,
      color: hasDiff ? "#a5b4fc" : "#94a3b8",
      whiteSpace: "nowrap",
    }}>
      {hasDiff && <span style={{ fontSize: "0.55rem" }}>★</span>}
      {name}
    </span>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? { icon: "?", color: "#64748b", bg: "rgba(100,116,139,0.1)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      fontSize: "0.68rem", fontWeight: 700,
      borderRadius: "0.4rem", padding: "0.18rem 0.55rem",
      background: cfg.bg, border: `1px solid ${cfg.color}30`,
      color: cfg.color, whiteSpace: "nowrap",
    }}>
      <span>{cfg.icon}</span>
      <span>{ROLE_DISPLAY[role] ?? role}</span>
    </span>
  );
}

// ── Quick-Edit Drawer ─────────────────────────────────────────────────────────
interface DrawerProps {
  user: UserOverrideInfo;
  onClose: () => void;
  onPermChange: (pageId: string, perm: string, value: boolean) => void;
  onRemoveOverride: (pageId: string) => void;
  saving: boolean;
}

function QuickEditDrawer({ user, onClose, onPermChange, onRemoveOverride, saving }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const cfg = ROLE_CONFIG[user.role ?? "new_user"] ?? ROLE_CONFIG.new_user;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
          zIndex: 150,
          animation: "roDrawerFadeIn 0.18s ease",
        }}
      />
      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(440px, 95vw)",
          background: "#1a1d2e",
          borderLeft: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
          zIndex: 151,
          display: "flex", flexDirection: "column",
          animation: "roDrawerSlideIn 0.22s cubic-bezier(.4,0,.2,1)",
          overflowY: "auto",
        }}
      >
        {/* Drawer header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: "0.875rem",
          background: "rgba(255,255,255,0.02)",
          flexShrink: 0,
        }}>
          {/* Avatar */}
          <span style={{
            width: "2.75rem", height: "2.75rem", borderRadius: "50%",
            background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color}66)`,
            color: "#fff", fontSize: "1rem", fontWeight: 700,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: `0 0 0 3px ${cfg.color}22`,
          }}>
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.9rem", marginBottom: "0.2rem" }}>
              {user.name}
            </p>
            <p style={{ color: "#64748b", fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </p>
            <div style={{ marginTop: "0.35rem" }}>
              <RoleBadge role={user.role ?? "new_user"} />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none", color: "#64748b",
              cursor: "pointer", width: "2rem", height: "2rem", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", transition: "all 0.15s", flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; }}
          >
            ✕
          </button>
        </div>

        {/* Drawer sub-header info */}
        <div style={{
          padding: "0.75rem 1.5rem",
          background: "rgba(129,140,248,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
        }}>
          <p style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.5 }}>
            <span style={{ color: "#818cf8", fontWeight: 700 }}>✏️ Quick-edit permissions</span> — changes save instantly per page.
            Overrides take priority over the user's role defaults.
          </p>
        </div>

        {/* Per-page permission blocks */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {user.pages.map((pg) => {
            const hasDiff = hasOverrideDiff(pg.perms, user.role);
            const roleDefault: string[] = DEFAULT_ROLE_PERMS[user.role as AppRole] ?? [];
            return (
              <div key={pg.pageId} style={{
                borderRadius: "0.75rem",
                border: hasDiff ? "1px solid rgba(129,140,248,0.22)" : "1px solid rgba(255,255,255,0.07)",
                background: hasDiff ? "rgba(129,140,248,0.04)" : "rgba(255,255,255,0.02)",
                overflow: "hidden",
              }}>
                {/* Page row header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.625rem 0.875rem",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.02)",
                }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#cbd5e1", flex: 1 }}>
                    {pg.pageName}
                  </span>
                  {hasDiff && (
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 700, color: "#818cf8",
                      background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.28)",
                      borderRadius: "0.3rem", padding: "0.05rem 0.35rem",
                    }}>
                      ★ Override
                    </span>
                  )}
                  <button
                    title="Remove override for this page"
                    onClick={() => onRemoveOverride(pg.pageId)}
                    disabled={saving}
                    style={{
                      background: "transparent", border: "none", color: "#475569",
                      cursor: saving ? "not-allowed" : "pointer",
                      fontSize: "0.75rem", borderRadius: "0.35rem",
                      padding: "0.15rem 0.35rem", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* Permission toggles */}
                <div style={{ padding: "0.75rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {ALL_PERMS.map((p) => (
                      <PermToggleBtn
                        key={p}
                        p={p}
                        active={pg.perms.includes(p)}
                        disabled={saving}
                        onChange={(v) => onPermChange(pg.pageId, p, v)}
                      />
                    ))}
                  </div>

                  {/* Role-default ghost */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "0.62rem", color: "#475569", whiteSpace: "nowrap" }}>
                      {ROLE_DISPLAY[user.role ?? "new_user"] ?? user.role} default:
                    </span>
                    {ALL_PERMS.map((p) => (
                      <span key={p} style={{ fontSize: "0.75rem", opacity: roleDefault.includes(p) ? 0.85 : 0.2 }}>
                        {PERM_LABELS[p as keyof typeof PERM_LABELS]?.icon}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {user.pages.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#475569" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔓</p>
              <p style={{ fontSize: "0.8rem" }}>No page overrides for this user</p>
            </div>
          )}
        </div>

        {/* Drawer footer */}
        <div style={{
          padding: "0.875rem 1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.01)",
          flexShrink: 0,
        }}>
          <p style={{ fontSize: "0.68rem", color: "#475569", textAlign: "center" }}>
            Press <kbd style={{ background: "rgba(255,255,255,0.07)", borderRadius: "0.25rem", padding: "0.05rem 0.35rem", fontFamily: "monospace", fontSize: "0.65rem" }}>Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </>
  );
}

// ── Roles Matrix Tab ──────────────────────────────────────────────────────────
export function RolesOverview({ users }: { users: User[] }) {
  const [pagePerms, setPagePerms] = useState<PagePermData[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [drawerUid, setDrawerUid] = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(
      MANAGED_PAGES.map((p) =>
        fetch(`/api/permissions/${p.pageId}`, { headers: authHeaders() })
          .then((r) => r.json())
          .catch(() => null)
      )
    );
    setPagePerms(results.filter(Boolean));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Role Summary section ─────────────────────────────────────────────────────
  const roleGroups: Record<string, User[]> = {};
  for (const u of users) {
    const r = u.role || "new_user";
    roleGroups[r] = roleGroups[r] || [];
    roleGroups[r].push(u);
  }

  // ── Build per-user override map ──────────────────────────────────────────────
  const byUser: Record<string, UserOverrideInfo> = {};
  for (const pd of pagePerms) {
    for (const [uid, ov] of Object.entries(pd.userOverrides ?? {})) {
      if (!byUser[uid]) {
        byUser[uid] = {
          uid,
          name: ov.name,
          email: ov.email,
          role: (ov as any).userRole,
          pages: [],
        };
      }
      byUser[uid].pages.push({ pageId: pd.pageId, pageName: pd.pageName, perms: ov.perms });
    }
  }

  // Filter entries by search
  const allEntries = Object.values(byUser);
  const filtered = allEntries.filter((info) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      info.name?.toLowerCase().includes(q) ||
      info.email?.toLowerCase().includes(q) ||
      info.role?.toLowerCase().includes(q) ||
      info.pages.some((p) => p.pageName.toLowerCase().includes(q))
    );
  });

  const drawerUser = drawerUid ? byUser[drawerUid] ?? null : null;

  // ── Patch a single page's user override ──────────────────────────────────────
  const patchUserPerm = async (pageId: string, userId: string, newPerms: string[]) => {
    setSaving(true);
    const pd = pagePerms.find((p) => p.pageId === pageId);
    const ov = pd?.userOverrides[userId];
    if (!pd || !ov) { setSaving(false); return; }
    try {
      await fetch(`/api/permissions/${pageId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ type: "user", userId, name: ov.name, email: ov.email, perms: newPerms, userRole: (ov as any).userRole }),
      });
      // Update local state
      setPagePerms((prev) =>
        prev.map((p) =>
          p.pageId !== pageId ? p : {
            ...p,
            userOverrides: {
              ...p.userOverrides,
              [userId]: { ...p.userOverrides[userId], perms: newPerms },
            },
          }
        )
      );
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handlePermChange = (pageId: string, perm: string, value: boolean) => {
    if (!drawerUid) return;
    const pd = pagePerms.find((p) => p.pageId === pageId);
    const current = pd?.userOverrides[drawerUid]?.perms ?? [];
    const next = value ? [...current, perm] : current.filter((p) => p !== perm);
    patchUserPerm(pageId, drawerUid, next);
  };

  const handleRemoveOverride = async (pageId: string) => {
    if (!drawerUid) return;
    setSaving(true);
    try {
      await fetch(`/api/permissions/${pageId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ type: "removeUser", userId: drawerUid }),
      });
      setPagePerms((prev) =>
        prev.map((p) => {
          if (p.pageId !== pageId) return p;
          const next = { ...p.userOverrides };
          delete next[drawerUid];
          return { ...p, userOverrides: next };
        })
      );
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <>
      {/* ── Keyframes injected once ───────────────────────────────────────── */}
      <style>{`
        @keyframes roDrawerFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes roDrawerSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .ro-table-row { cursor: pointer; transition: background 0.15s; }
        .ro-table-row:hover { background: rgba(129,140,248,0.07) !important; }
        .ro-search:focus { outline: none; border-color: rgba(129,140,248,0.45) !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Who is in each role ─────────────────────────────────────────── */}
        <div>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            Users by Role
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "0.75rem" }}>
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
              const roleUsers = roleGroups[role] || [];
              return (
                <Card key={role} style={{ padding: "1rem", background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                    <span style={{ fontSize: "1.1rem" }}>{cfg.icon}</span>
                    <span style={{ fontWeight: 700, color: cfg.color, fontSize: "0.875rem", textTransform: "capitalize" }}>
                      {role.replace("_", " ")}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: "0.7rem", fontWeight: 700, color: cfg.color, background: `${cfg.color}20`, borderRadius: "1rem", padding: "0.1rem 0.5rem" }}>
                      {roleUsers.length}
                    </span>
                  </div>
                  {roleUsers.length === 0 ? (
                    <p style={{ fontSize: "0.72rem", color: "#64748b", fontStyle: "italic" }}>No users assigned</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {roleUsers.map((u) => (
                        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{
                            width: "1.4rem", height: "1.4rem", borderRadius: "50%", background: cfg.color,
                            color: "#fff", fontSize: "0.6rem", fontWeight: 700, display: "inline-flex",
                            alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            {u.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "0.775rem", fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</p>
                            <p style={{ fontSize: "0.65rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── Page × Role Permissions Matrix ─────────────────────────────── */}
        <div>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            Page × Role Permissions Matrix
          </h3>
          {loading ? (
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Loading permissions…</p>
          ) : (
            <Card style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      <th style={{ padding: "0.625rem 1rem", textAlign: "left", color: "#64748b", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        Page
                      </th>
                      {["admin","manager","hr","mvp","viewer"].map((role) => (
                        <th key={role} style={{ padding: "0.625rem 0.75rem", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem" }}>
                            <span>{ROLE_CONFIG[role]?.icon}</span>
                            <span style={{ color: ROLE_CONFIG[role]?.color, fontWeight: 700, fontSize: "0.7rem", textTransform: "capitalize" }}>
                              {role}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th style={{ padding: "0.625rem 0.75rem", textAlign: "center", color: "#64748b", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        Overrides
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MANAGED_PAGES.map((page) => {
                      const pd = pagePerms.find((p) => p.pageId === page.pageId);
                      const rp = pd?.rolePerms ?? DEFAULT_ROLE_PERMS;
                      const ov = pd?.userOverrides ?? {};
                      const overrideCount = Object.keys(ov).length;
                      return (
                        <tr key={page.pageId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "0.625rem 1rem", color: "#e2e8f0", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {page.pageName}
                          </td>
                          {["admin","manager","hr","mvp","viewer"].map((role) => (
                            <td key={role} style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "0.2rem", justifyContent: "center" }}>
                                {ALL_PERMS.map((p) => (
                                  <PermChip
                                    key={p}
                                    p={p}
                                    active={role === "admin" || ((rp as any)[role] ?? []).includes(p)}
                                  />
                                ))}
                              </div>
                            </td>
                          ))}
                          <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                            {overrideCount > 0 ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", fontWeight: 700, color: "#818cf8", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)", borderRadius: "1rem", padding: "0.1rem 0.6rem" }}>
                                👤 {overrideCount}
                              </span>
                            ) : (
                              <span style={{ color: "#334155", fontSize: "0.75rem" }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* ── User-Specific Page Overrides ─────────────────────────────────── */}
        <div>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
                User-Specific Page Overrides
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Users with custom permissions overriding their role defaults. Click any row to quick-edit.
              </p>
            </div>

            {/* Search */}
            {allEntries.length > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,255,255,0.08)",
                borderRadius: "0.6rem", padding: "0.45rem 0.875rem",
                transition: "border-color 0.15s",
              }}>
                <span style={{ fontSize: "0.8rem", color: "#475569" }}>🔍</span>
                <input
                  className="ro-search"
                  placeholder="Search users, roles, pages…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    background: "transparent", border: "none",
                    color: "#f1f5f9", fontSize: "0.8rem",
                    width: "180px", outline: "none",
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.75rem", padding: "0.1rem" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <Card style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Loading overrides…</p>
            </Card>
          ) : allEntries.length === 0 ? (
            /* Empty state */
            <Card style={{ padding: "2.5rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔓</div>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.375rem" }}>No custom overrides yet</p>
              <p style={{ color: "#64748b", fontSize: "0.775rem", maxWidth: "26rem", margin: "0 auto 1.25rem" }}>
                User-specific overrides let you grant or restrict individual users beyond their role's default access.
              </p>
              <div style={{
                display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: "0.375rem",
                background: "rgba(129,140,248,0.07)", border: "1px solid rgba(129,140,248,0.18)",
                borderRadius: "0.625rem", padding: "0.75rem 1.25rem", textAlign: "left",
              }}>
                <p style={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 700, marginBottom: "0.125rem" }}>HOW TO ADD AN OVERRIDE</p>
                <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>1. Click the <span style={{ background: "rgba(255,255,255,0.08)", borderRadius: "0.25rem", padding: "0.05rem 0.35rem", fontFamily: "monospace" }}>⚙️</span> gear icon next to any page in the sidebar</p>
                <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>2. Switch to the <strong style={{ color: "#c4b5fd" }}>Users</strong> tab</p>
                <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>3. Search for a user, click <strong style={{ color: "#c4b5fd" }}>+ Add</strong>, then toggle their permissions</p>
              </div>
            </Card>
          ) : (
            /* ── Compact Datatable ── */
            <Card style={{ overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 1fr 120px",
                padding: "0.5rem 1rem",
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                {["User", "Role", "Overridden Pages", "Access"].map((col) => (
                  <span key={col} style={{ fontSize: "0.67rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {col}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#475569", fontSize: "0.8rem" }}>
                  No results for "{search}"
                </div>
              ) : (
                filtered.map((info, idx) => {
                  const isSelected = drawerUid === info.uid;
                  const totalPermsGranted = info.pages.reduce((acc, pg) => acc + pg.perms.length, 0);
                  const totalPossible = info.pages.length * ALL_PERMS.length;
                  const hasDiffCount = info.pages.filter((pg) => hasOverrideDiff(pg.perms, info.role)).length;

                  return (
                    <div
                      key={info.uid}
                      className="ro-table-row"
                      onClick={() => setDrawerUid(isSelected ? null : info.uid)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 110px 1fr 120px",
                        padding: "0.625rem 1rem",
                        borderBottom: idx < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        alignItems: "center", gap: "0.5rem",
                        background: isSelected ? "rgba(129,140,248,0.09)" : "transparent",
                        borderLeft: isSelected ? "2px solid #818cf8" : "2px solid transparent",
                        transition: "all 0.15s",
                      }}
                    >
                      {/* User column */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
                        <span style={{
                          width: "1.8rem", height: "1.8rem", borderRadius: "50%", flexShrink: 0,
                          background: `linear-gradient(135deg,${ROLE_CONFIG[info.role ?? "new_user"]?.color ?? "#818cf8"}99,${ROLE_CONFIG[info.role ?? "new_user"]?.color ?? "#818cf8"}44)`,
                          color: "#fff", fontSize: "0.65rem", fontWeight: 700,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {info.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {info.name}
                          </p>
                          <p style={{ fontSize: "0.65rem", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {info.email}
                          </p>
                        </div>
                      </div>

                      {/* Role column */}
                      <div>
                        <RoleBadge role={info.role ?? "new_user"} />
                      </div>

                      {/* Pages column – compact badge chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", alignItems: "center" }}>
                        {info.pages.map((pg) => (
                          <PageBadge
                            key={pg.pageId}
                            name={pg.pageName}
                            hasDiff={hasOverrideDiff(pg.perms, info.role)}
                          />
                        ))}
                      </div>

                      {/* Access summary column */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {/* Mini perm icon strip */}
                        <div style={{ display: "flex", gap: "0.15rem" }}>
                          {ALL_PERMS.map((p) => {
                            const grantedOnAny = info.pages.some((pg) => pg.perms.includes(p));
                            return (
                              <span key={p} style={{ fontSize: "0.7rem", opacity: grantedOnAny ? 1 : 0.18 }}>
                                {PERM_LABELS[p as keyof typeof PERM_LABELS]?.icon}
                              </span>
                            );
                          })}
                        </div>
                        {hasDiffCount > 0 && (
                          <span style={{
                            fontSize: "0.6rem", fontWeight: 700, color: "#818cf8",
                            background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)",
                            borderRadius: "0.3rem", padding: "0.08rem 0.35rem", whiteSpace: "nowrap",
                          }}>
                            Custom ({hasDiffCount}/{info.pages.length})
                          </span>
                        )}
                        {/* Chevron */}
                        <span style={{
                          marginLeft: "auto", color: "#475569", fontSize: "0.75rem",
                          transform: isSelected ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}>
                          ▸
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Table footer count */}
              <div style={{
                padding: "0.5rem 1rem",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(255,255,255,0.01)",
              }}>
                <span style={{ fontSize: "0.67rem", color: "#475569" }}>
                  {filtered.length} of {allEntries.length} user{allEntries.length !== 1 ? "s" : ""} with overrides
                </span>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{ fontSize: "0.67rem", color: "#818cf8", background: "transparent", border: "none", cursor: "pointer", marginLeft: "auto" }}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Quick-Edit Drawer ─────────────────────────────────────────────── */}
      {drawerUser && (
        <QuickEditDrawer
          user={drawerUser}
          onClose={() => setDrawerUid(null)}
          onPermChange={handlePermChange}
          onRemoveOverride={handleRemoveOverride}
          saving={saving}
        />
      )}
    </>
  );
}
