"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { MANAGED_PAGES, ALL_PERMS, PERM_LABELS, DEFAULT_ROLE_PERMS, type AppRole, type Perm } from "@/lib/permissions";

function getUserId(): string {
  if (typeof window === "undefined") return "";
  try { return JSON.parse(localStorage.getItem("user_session") || "{}").userId ?? ""; } catch { return ""; }
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

interface PagePermData {
  pageId: string;
  pageName: string;
  rolePerms: Record<AppRole, string[]>;
  userOverrides: Record<string, { userId: string; name: string; email: string; perms: string[] }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ── Helper: check if override differs from role default ───────────────────────
function hasOverrideDiff(overridePerms: string[], userRole: string | undefined): boolean {
  if (!userRole) return false;
  const roleDefault: Perm[] = DEFAULT_ROLE_PERMS[userRole as AppRole] ?? [];
  const a = [...overridePerms].sort().join(',');
  const b = [...roleDefault].sort().join(',');
  return a !== b;
}

// ── Semantic perm colors (risk-mapped, mirrors modal CSS) ─────────────────────
const PERM_CHIP_COLORS: Record<string, { bg: string; border: string }> = {
  r: { bg: "rgba(56,189,248,0.15)",  border: "rgba(56,189,248,0.4)"  },
  w: { bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.4)"  },
  u: { bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.4)"  },
  d: { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)" },
};

// ── Helper: perm chip ─────────────────────────────────────────────────────────
function PermChip({ p, active }: { p: string; active: boolean }) {
  const { icon } = PERM_LABELS[p as keyof typeof PERM_LABELS] || { icon: p };
  const colors   = PERM_CHIP_COLORS[p] ?? { bg: "rgba(129,140,248,0.15)", border: "rgba(129,140,248,0.3)" };
  return (
    <span
      title={PERM_LABELS[p as keyof typeof PERM_LABELS]?.label ?? p}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "1.6rem",
        height: "1.6rem",
        borderRadius: "0.375rem",
        fontSize: "0.75rem",
        opacity: active ? 1 : 0.18,
        background: active ? colors.bg : "transparent",
        border: `1px solid ${active ? colors.border : "transparent"}`,
        transition: "opacity 0.15s, background 0.15s",
      }}
    >
      {icon}
    </span>
  );
}

// ── Roles Matrix Tab ──────────────────────────────────────────────────────────
export function RolesOverview({ users }: { users: User[] }) {
  const [pagePerms, setPagePerms] = useState<PagePermData[]>([]);
  const [loading,   setLoading]   = useState(true);

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

  // ── Role Summary section (who is in each role) ────────────────────────────
  const roleGroups: Record<string, User[]> = {};
  for (const u of users) {
    const r = u.role || "new_user";
    roleGroups[r] = roleGroups[r] || [];
    roleGroups[r].push(u);
  }

  return (
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
                  <span style={{ marginLeft: "auto", fontSize: "0.7rem", fontWeight: 700, color: cfg.color,
                    background: `${cfg.color}20`, borderRadius: "1rem", padding: "0.1rem 0.5rem" }}>
                    {roleUsers.length}
                  </span>
                </div>
                {roleUsers.length === 0 ? (
                  <p style={{ fontSize: "0.72rem", color: "#64748b", fontStyle: "italic" }}>No users assigned</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {roleUsers.map((u) => (
                      <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ width: "1.4rem", height: "1.4rem", borderRadius: "50%", background: cfg.color,
                          color: "#fff", fontSize: "0.6rem", fontWeight: 700, display: "inline-flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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

      {/* ── Page permissions matrix ──────────────────────────────────────── */}
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
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem",
                              fontSize: "0.7rem", fontWeight: 700, color: "#818cf8",
                              background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)",
                              borderRadius: "1rem", padding: "0.1rem 0.6rem" }}>
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

      {/* ── User-specific overrides list ─────────────────────────────────── */}
      <div>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
              User-Specific Page Overrides
            </h3>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              These users have custom permissions on specific pages — overriding their default role access.
            </p>
          </div>
          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.5rem", padding: "0.375rem 0.75rem" }}>
            {ALL_PERMS.map((p) => {
              const lbl = PERM_LABELS[p as keyof typeof PERM_LABELS];
              return (
                <span key={p} title={lbl?.label ?? p} style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.67rem", color: "#94a3b8" }}>
                  <span style={{ fontSize: "0.75rem" }}>{lbl?.icon}</span>
                  <span>{lbl?.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {loading ? (
          <Card style={{ padding: "2rem", textAlign: "center" }}>
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Loading overrides…</p>
          </Card>
        ) : (() => {
          // Collect all overrides across pages keyed by userId
          const byUser: Record<string, { name: string; email: string; role?: string; pages: { pageName: string; perms: string[]; pageId: string }[] }> = {};
          for (const pd of pagePerms) {
            for (const [uid, ov] of Object.entries(pd.userOverrides ?? {})) {
              if (!byUser[uid]) byUser[uid] = { name: ov.name, email: ov.email, role: (ov as any).userRole, pages: [] };
              byUser[uid].pages.push({ pageName: pd.pageName, perms: ov.perms, pageId: pd.pageId });
            }
          }
          const entries = Object.entries(byUser);

          if (entries.length === 0) {
            return (
              <Card style={{ padding: "2.5rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔓</div>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.375rem" }}>No custom overrides yet</p>
                <p style={{ color: "#94a3b8", fontSize: "0.775rem", maxWidth: "26rem", margin: "0 auto 1.25rem" }}>
                  User-specific overrides let you grant or restrict individual users beyond their role's default access — useful for exceptions like a Viewer who needs write access on one page.
                </p>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: "0.375rem",
                  background: "rgba(129,140,248,0.07)", border: "1px solid rgba(129,140,248,0.18)",
                  borderRadius: "0.625rem", padding: "0.75rem 1.25rem", textAlign: "left" }}>
                  <p style={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 700, marginBottom: "0.125rem" }}>HOW TO ADD AN OVERRIDE</p>
                  <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>1. Click the <span style={{ background: "rgba(255,255,255,0.08)", borderRadius: "0.25rem", padding: "0.05rem 0.35rem", fontFamily: "monospace" }}>⚙️</span> gear icon next to any page in the sidebar</p>
                  <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>2. Switch to the <strong style={{ color: "#c4b5fd" }}>Users</strong> tab</p>
                  <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>3. Search for a user and click <strong style={{ color: "#c4b5fd" }}>+ Add</strong>, then toggle their permissions</p>
                </div>
              </Card>
            );
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {entries.map(([uid, info]) => (
                <Card key={uid} style={{ padding: "1.125rem", border: "1px solid rgba(255,255,255,0.07)" }}>

                  {/* User header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                    <span style={{
                      width: "2.25rem", height: "2.25rem", borderRadius: "50%",
                      background: "linear-gradient(135deg,#818cf8,#6366f1)", color: "#fff",
                      fontSize: "0.875rem", fontWeight: 700, display: "inline-flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 0 0 3px rgba(129,140,248,0.2)",
                    }}>
                      {info.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.9rem" }}>{info.name}</p>
                      <p style={{ color: "#64748b", fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{info.email}</p>
                    </div>
                    {/* Pages count badge */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                      fontSize: "0.7rem", fontWeight: 700, color: "#818cf8",
                      background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)",
                      borderRadius: "1rem", padding: "0.2rem 0.65rem", flexShrink: 0,
                    }}>
                      📄 {info.pages.length} {info.pages.length === 1 ? "page" : "pages"}
                    </span>
                  </div>

                  {/* Per-page permission rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {info.pages.map((pg) => {
                      const activePerms = ALL_PERMS.filter((p) => pg.perms.includes(p));
                      const hasDiff     = hasOverrideDiff(pg.perms, info.role);
                      return (
                        <div key={pg.pageName} style={{
                          display: "flex", alignItems: "center", gap: "0.75rem",
                          background: "rgba(255,255,255,0.03)",
                          border: hasDiff
                            ? "1px solid rgba(129,140,248,0.2)"
                            : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
                        }}>
                          {/* Page name + ★ Override badge */}
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: "7rem", flexShrink: 0 }}>
                            <span style={{ fontSize: "0.775rem", color: "#cbd5e1", fontWeight: 600 }}>
                              {pg.pageName}
                            </span>
                            {hasDiff && (
                              <span
                                title={`Custom access — differs from ${info.role ? info.role.replace("_", " ") : "role"} default`}
                                style={{
                                  fontSize: "0.62rem", fontWeight: 700, color: "#818cf8",
                                  background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.28)",
                                  borderRadius: "0.35rem", padding: "0.05rem 0.35rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                ★ Override
                              </span>
                            )}
                          </div>

                          <span style={{ width: "1px", height: "1rem", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

                          {/* Labeled permission pills */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", flex: 1 }}>
                            {ALL_PERMS.map((p) => {
                              const lbl    = PERM_LABELS[p as keyof typeof PERM_LABELS];
                              const active = pg.perms.includes(p);
                              return (
                                <span key={p} title={active ? `${lbl?.label} — granted` : `${lbl?.label} — not granted`} style={{
                                  display: "inline-flex", alignItems: "center", gap: "0.25rem",
                                  fontSize: "0.68rem", fontWeight: 600,
                                  borderRadius: "0.375rem", padding: "0.15rem 0.5rem",
                                  border: active ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.06)",
                                  background: active ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                                  color: active ? "#86efac" : "#64748b",
                                  transition: "all 0.15s",
                                }}>
                                  <span style={{ fontSize: "0.75rem", opacity: active ? 1 : 0.35 }}>{lbl?.icon}</span>
                                  <span style={{ opacity: active ? 1 : 0.4 }}>{lbl?.label}</span>
                                </span>
                              );
                            })}
                          </div>

                          {/* Active count summary */}
                          {activePerms.length > 0 ? (
                            <span style={{
                              fontSize: "0.67rem", color: "#22c55e", fontWeight: 700,
                              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                              borderRadius: "1rem", padding: "0.1rem 0.5rem", flexShrink: 0,
                            }}>
                              {activePerms.length}/{ALL_PERMS.length}
                            </span>
                          ) : (
                            <span style={{
                              fontSize: "0.67rem", color: "#ef4444", fontWeight: 700,
                              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                              borderRadius: "1rem", padding: "0.1rem 0.5rem", flexShrink: 0,
                            }}>
                              No access
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
