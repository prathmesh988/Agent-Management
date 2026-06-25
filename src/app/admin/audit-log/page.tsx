"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditDoc {
  $id: string;
  timestamp: string;
  actor_id?: string;
  actor_name_snapshot?: string;
  actor_role_snapshot?: string;
  actor_ip?: string;
  module?: string;
  action_type?: string;
  result?: string;
  severity?: string;
  description?: string;
  target_name_snapshot?: string;
  target_employee_id?: string;
  field_changes?: string;
  metadata?: string;
}

interface FetchResult {
  documents: AuditDoc[];
  total: number;
  pages: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MODULES     = ["", "auth", "employee", "payroll", "leave", "attendance", "roles", "documents", "reports", "audit"];
const SEVERITIES  = ["", "critical", "high", "medium", "low"];
const ACTION_TYPES = ["", "create", "read", "update", "delete", "export", "login", "login_failed", "password_reset"];
const RESULTS     = ["", "success", "failed"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function severityColor(s?: string) {
  switch (s) {
    case "critical": return { bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444" };
    case "high":     return { bg: "#ffedd5", text: "#c2410c", dot: "#f97316" };
    case "medium":   return { bg: "#fef9c3", text: "#92400e", dot: "#eab308" };
    case "low":      return { bg: "#dcfce7", text: "#166534", dot: "#22c55e" };
    default:         return { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" };
  }
}

function moduleColor(m?: string) {
  const map: Record<string, string> = {
    auth: "#6366f1", employee: "#0ea5e9", payroll: "#8b5cf6",
    leave: "#ec4899", attendance: "#14b8a6", roles: "#f59e0b",
    documents: "#64748b", reports: "#10b981", audit: "#f43f5e",
  };
  return map[m ?? ""] ?? "#94a3b8";
}

function actionIcon(a?: string) {
  const icons: Record<string, string> = {
    create: "＋", read: "👁", update: "✏️", delete: "🗑",
    export: "⬇", login: "🔑", login_failed: "⛔", password_reset: "🔄",
  };
  return icons[a ?? ""] ?? "•";
}

function fmtTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function parseJson(s?: string) {
  try { return s ? JSON.parse(s) : null; } catch { return null; }
}

// ── Field Changes pill ────────────────────────────────────────────────────────

function FieldChanges({ raw }: { raw?: string }) {
  const changes = parseJson(raw);
  if (!changes || !Array.isArray(changes) || changes.length === 0) return null;
  return (
    <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
      {changes.map((c: { field: string; old_value: string; new_value: string }, i: number) => (
        <span key={i} style={{
          fontSize: 11, padding: "1px 6px", borderRadius: 4,
          background: "#f8fafc", border: "1px solid #e2e8f0", color: "#334155",
          fontFamily: "monospace",
        }}>
          {c.field}: <span style={{ color: "#dc2626" }}>{c.old_value || "∅"}</span>
          {" → "}
          <span style={{ color: "#16a34a" }}>{c.new_value || "∅"}</span>
        </span>
      ))}
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function AuditRow({ doc, idx }: { doc: AuditDoc; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const sc = severityColor(doc.severity);
  const mc = moduleColor(doc.module);
  const meta = parseJson(doc.metadata);

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        style={{
          background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
        onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f8fafc")}
      >
        {/* Severity bar */}
        <td style={{ width: 4, padding: 0 }}>
          <div style={{ width: 4, height: "100%", minHeight: 48, background: sc.dot }} />
        </td>

        {/* Timestamp */}
        <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
          {fmtTime(doc.timestamp)}
        </td>

        {/* Severity */}
        <td style={{ padding: "10px 8px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: sc.bg, color: sc.text,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
            {doc.severity ?? "—"}
          </span>
        </td>

        {/* Module */}
        <td style={{ padding: "10px 8px" }}>
          <span style={{
            display: "inline-block", padding: "2px 8px", borderRadius: 4,
            fontSize: 11, fontWeight: 600, background: mc + "1a", color: mc,
            textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            {doc.module ?? "—"}
          </span>
        </td>

        {/* Action */}
        <td style={{ padding: "10px 8px", fontSize: 12, color: "#334155" }}>
          <span style={{ marginRight: 4 }}>{actionIcon(doc.action_type)}</span>
          {doc.action_type ?? "—"}
        </td>

        {/* Result */}
        <td style={{ padding: "10px 8px" }}>
          <span style={{
            padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: doc.result === "success" ? "#dcfce7" : "#fee2e2",
            color: doc.result === "success" ? "#166534" : "#b91c1c",
          }}>
            {doc.result ?? "—"}
          </span>
        </td>

        {/* Actor */}
        <td style={{ padding: "10px 8px", fontSize: 12, color: "#334155" }}>
          <div style={{ fontWeight: 500 }}>{doc.actor_name_snapshot || "system"}</div>
          {doc.actor_role_snapshot && (
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{doc.actor_role_snapshot}</div>
          )}
        </td>

        {/* Description */}
        <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569", maxWidth: 280 }}>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {doc.description || "—"}
          </div>
          <FieldChanges raw={doc.field_changes} />
        </td>

        {/* Expand chevron */}
        <td style={{ padding: "10px 8px", color: "#94a3b8", fontSize: 12 }}>
          {expanded ? "▲" : "▼"}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr style={{ background: "#f0f7ff" }}>
          <td colSpan={9} style={{ padding: "12px 24px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px 24px", fontSize: 12 }}>
              {[
                ["Actor ID",        doc.actor_id],
                ["Actor IP",        doc.actor_ip],
                ["Target",          doc.target_name_snapshot],
                ["Employee ID",     doc.target_employee_id],
                ["Timestamp (UTC)", doc.timestamp],
                ["Log ID",          doc.$id],
              ].map(([label, value]) => value ? (
                <div key={label}>
                  <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 2 }}>{label}</div>
                  <div style={{ color: "#334155", fontFamily: "monospace", wordBreak: "break-all" }}>{value}</div>
                </div>
              ) : null)}

              {meta && Object.keys(meta).length > 0 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>Metadata</div>
                  <pre style={{
                    background: "#1e293b", color: "#e2e8f0", padding: "8px 12px",
                    borderRadius: 6, fontSize: 11, overflow: "auto", margin: 0,
                  }}>
                    {JSON.stringify(meta, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function Select({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0",
          background: "#fff", color: "#334155", fontSize: 13,
          outline: "none", cursor: "pointer",
        }}
      >
        {options.map(o => (
          <option key={o} value={o}>{o === "" ? `All ${label}s` : o}</option>
        ))}
      </select>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const { currentUser } = useCurrentUser();
  const hasLogged = useRef(false);

  const [logs,    setLogs]    = useState<AuditDoc[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Filters
  const [module_,    setModule]     = useState("");
  const [severity,   setSeverity]   = useState("");
  const [actionType, setActionType] = useState("");
  const [result,     setResult]     = useState("");
  const [search,     setSearch]     = useState("");
  const [from,       setFrom]       = useState("");
  const [to,         setTo]         = useState("");

  // Self-log page view once on mount
  useEffect(() => {
    if (hasLogged.current || !currentUser) return;
    hasLogged.current = true;
    const userId = (currentUser as any)?.$id ?? (currentUser as any)?.id;
    fetch("/api/audit-logs/record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userId ? { "x-user-id": userId } : {}),
      },
      body: JSON.stringify({ module: "audit", action_type: "read", result: "success", severity: "low", description: "Viewed audit log page" }),
    }).catch(() => {});
  }, [currentUser]);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    p.set("page",  String(page));
    p.set("limit", "30");
    if (module_)    p.set("module",       module_);
    if (severity)   p.set("severity",     severity);
    if (actionType) p.set("action_type",  actionType);
    if (result)     p.set("result",       result);
    if (search)     p.set("search",       search);
    if (from)       p.set("from",         from);
    if (to)         p.set("to",           to);
    return p.toString();
  }, [page, module_, severity, actionType, result, search, from, to]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = (currentUser as any)?.$id ?? (currentUser as any)?.id;
      const res = await fetch(`/api/audit-logs?${buildQuery()}`, {
        headers: userId ? { "x-user-id": userId } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data: FetchResult = await res.json();
      setLogs(data.documents);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, currentUser]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const exportCsv = () => {
    const userId = (currentUser as any)?.$id ?? (currentUser as any)?.id;
    const p = new URLSearchParams();
    if (module_)    p.set("module",      module_);
    if (severity)   p.set("severity",    severity);
    if (actionType) p.set("action_type", actionType);
    if (from)       p.set("from",        from);
    if (to)         p.set("to",          to);
    const url = `/api/audit-logs/export?${p.toString()}`;
    const a = document.createElement("a");
    a.href = url;
    if (userId) {
      // Add header via fetch + blob for authenticated download
      fetch(url, { headers: { "x-user-id": userId } })
        .then(r => r.blob())
        .then(blob => {
          a.href = URL.createObjectURL(blob);
          a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
        });
    } else {
      a.click();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        padding: "24px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>🔍</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f8fafc" }}>Audit Log</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              Immutable activity trail · {total.toLocaleString()} total entries
            </p>
          </div>
          <span style={{
            padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: "#22c55e22", color: "#4ade80", border: "1px solid #22c55e44",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            TAMPER-PROOF
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            id="audit-log-refresh-btn"
            onClick={fetchLogs}
            disabled={loading}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #334155",
              background: "#1e293b", color: "#94a3b8", fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>⟳</span>
            Refresh
          </button>
          <button
            id="audit-log-export-btn"
            onClick={exportCsv}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "14px 32px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end",
      }}>
        {/* Search */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 220px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Search
          </label>
          <input
            id="audit-search-input"
            type="text"
            placeholder="description, actor name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0",
              fontSize: 13, color: "#334155", outline: "none",
            }}
          />
        </div>

        <Select label="Module"   value={module_}    onChange={handleFilterChange(setModule)}     options={MODULES} />
        <Select label="Severity" value={severity}   onChange={handleFilterChange(setSeverity)}   options={SEVERITIES} />
        <Select label="Action"   value={actionType} onChange={handleFilterChange(setActionType)} options={ACTION_TYPES} />
        <Select label="Result"   value={result}     onChange={handleFilterChange(setResult)}     options={RESULTS} />

        {/* Date range */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>From</label>
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#334155" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>To</label>
          <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#334155" }} />
        </div>

        {(module_ || severity || actionType || result || search || from || to) && (
          <button
            onClick={() => { setModule(""); setSeverity(""); setActionType(""); setResult(""); setSearch(""); setFrom(""); setTo(""); setPage(1); }}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid #fca5a5",
              background: "#fee2e2", color: "#b91c1c", fontSize: 13, cursor: "pointer",
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ padding: "24px 32px" }}>
        {error && (
          <div style={{ padding: 16, borderRadius: 10, background: "#fee2e2", color: "#b91c1c", marginBottom: 16, fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        {loading && logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
            <p>Loading audit entries…</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#475569" }}>No entries found</p>
            <p style={{ fontSize: 13 }}>Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div style={{
              background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              border: "1px solid #e2e8f0", overflow: "hidden",
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      {["", "Timestamp", "Severity", "Module", "Action", "Result", "Actor", "Description", ""].map((h, i) => (
                        <th key={i} style={{
                          padding: i === 0 ? 0 : "10px 12px",
                          textAlign: "left", fontSize: 11, fontWeight: 700,
                          color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em",
                          whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((doc, i) => <AuditRow key={doc.$id} doc={doc} idx={i} />)}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Pagination ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, total)} of {total.toLocaleString()} entries
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: page === 1 ? "#f8fafc" : "#fff", cursor: page === 1 ? "default" : "pointer", color: "#475569" }}
                >«</button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: page === 1 ? "#f8fafc" : "#fff", cursor: page === 1 ? "default" : "pointer", color: "#475569" }}
                >‹ Prev</button>
                {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 3, pages - 6));
                  const p = start + i;
                  if (p > pages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{
                      padding: "6px 12px", borderRadius: 6,
                      border: p === page ? "1px solid #6366f1" : "1px solid #e2e8f0",
                      background: p === page ? "#6366f1" : "#fff",
                      color: p === page ? "#fff" : "#475569",
                      fontWeight: p === page ? 700 : 400, cursor: "pointer",
                    }}>{p}</button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: page === pages ? "#f8fafc" : "#fff", cursor: page === pages ? "default" : "pointer", color: "#475569" }}
                >Next ›</button>
                <button
                  onClick={() => setPage(pages)}
                  disabled={page === pages}
                  style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: page === pages ? "#f8fafc" : "#fff", cursor: page === pages ? "default" : "pointer", color: "#475569" }}
                >»</button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
