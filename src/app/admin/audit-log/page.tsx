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

const MODULES      = ["", "auth", "employee", "payroll", "leave", "attendance", "roles", "documents", "reports", "audit"];
const SEVERITIES   = ["", "critical", "high", "medium", "low"];
const ACTION_TYPES = ["", "create", "read", "update", "delete", "export", "login", "login_failed", "password_reset"];
const RESULTS      = ["", "success", "failed"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function severityClasses(s?: string) {
  switch (s) {
    case "critical": return { badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", dot: "bg-red-500", bar: "bg-red-500" };
    case "high":     return { badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400", dot: "bg-orange-500", bar: "bg-orange-500" };
    case "medium":   return { badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400", dot: "bg-yellow-500", bar: "bg-yellow-500" };
    case "low":      return { badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", dot: "bg-green-500", bar: "bg-green-500" };
    default:         return { badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400", bar: "bg-slate-400" };
  }
}

function moduleClasses(m?: string) {
  const map: Record<string, string> = {
    auth:       "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
    employee:   "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
    payroll:    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
    leave:      "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400",
    attendance: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400",
    roles:      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    documents:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    reports:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    audit:      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
  };
  return map[m ?? ""] ?? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
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
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function parseJson(s?: string) {
  try { return s ? JSON.parse(s) : null; } catch { return null; }
}

// ── Field Changes ─────────────────────────────────────────────────────────────

function FieldChanges({ raw }: { raw?: string }) {
  const changes = parseJson(raw);
  if (!changes || !Array.isArray(changes) || changes.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {changes.map((c: { field: string; old_value: string; new_value: string }, i: number) => (
        <span key={i} className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {c.field}:{" "}
          <span className="text-red-500 dark:text-red-400">{c.old_value || "∅"}</span>
          {" → "}
          <span className="text-green-600 dark:text-green-400">{c.new_value || "∅"}</span>
        </span>
      ))}
    </div>
  );
}

// ── Table Row ─────────────────────────────────────────────────────────────────

function AuditRow({ doc, idx }: { doc: AuditDoc; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const sc  = severityClasses(doc.severity);
  const mc  = moduleClasses(doc.module);
  const meta = parseJson(doc.metadata);

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        className={`cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-slate-800/60 ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/60"}`}
      >
        {/* Severity left bar */}
        <td className="p-0 w-1">
          <div className={`w-1 min-h-[48px] h-full ${sc.bar}`} />
        </td>

        {/* Timestamp */}
        <td className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {fmtTime(doc.timestamp)}
        </td>

        {/* Severity */}
        <td className="px-2 py-2.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${sc.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {doc.severity ?? "—"}
          </span>
        </td>

        {/* Module */}
        <td className="px-2 py-2.5">
          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${mc}`}>
            {doc.module ?? "—"}
          </span>
        </td>

        {/* Action */}
        <td className="px-2 py-2.5 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
          <span className="mr-1">{actionIcon(doc.action_type)}</span>
          {doc.action_type ?? "—"}
        </td>

        {/* Result */}
        <td className="px-2 py-2.5">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            doc.result === "success"
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
          }`}>
            {doc.result ?? "—"}
          </span>
        </td>

        {/* Actor */}
        <td className="px-2 py-2.5 text-xs">
          <div className="font-medium text-slate-800 dark:text-slate-200">{doc.actor_name_snapshot || "system"}</div>
          {doc.actor_role_snapshot && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500">{doc.actor_role_snapshot}</div>
          )}
        </td>

        {/* Description */}
        <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
          <div className="truncate">{doc.description || "—"}</div>
          <FieldChanges raw={doc.field_changes} />
        </td>

        {/* Expand */}
        <td className="px-2 py-2.5 text-[11px] text-slate-400 dark:text-slate-500">
          {expanded ? "▲" : "▼"}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr className="bg-blue-50/50 dark:bg-slate-800/40 border-b border-blue-100 dark:border-slate-700">
          <td colSpan={9} className="px-6 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-xs">
              {([
                ["Actor ID",        doc.actor_id],
                ["Actor IP",        doc.actor_ip],
                ["Target",          doc.target_name_snapshot],
                ["Employee ID",     doc.target_employee_id],
                ["Timestamp (UTC)", doc.timestamp],
                ["Log ID",          doc.$id],
              ] as [string, string | undefined][]).map(([label, value]) =>
                value ? (
                  <div key={label}>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">{label}</div>
                    <div className="font-mono text-slate-700 dark:text-slate-300 break-all">{value}</div>
                  </div>
                ) : null
              )}

              {meta && Object.keys(meta).length > 0 && (
                <div className="col-span-full">
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Metadata</div>
                  <pre className="bg-slate-900 dark:bg-slate-950 text-emerald-400 dark:text-emerald-300 p-3 rounded-lg text-[11px] overflow-auto">
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

// ── Select filter ─────────────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
      >
        {options.map(o => (
          <option key={o} value={o}>{o === "" ? `All ${label}s` : o}</option>
        ))}
      </select>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const { currentUser } = useCurrentUser();
  const hasLogged = useRef(false);

  const [logs,    setLogs]    = useState<AuditDoc[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [module_,    setModule]     = useState("");
  const [severity,   setSeverity]   = useState("");
  const [actionType, setActionType] = useState("");
  const [result,     setResult]     = useState("");
  const [search,     setSearch]     = useState("");
  const [from,       setFrom]       = useState("");
  const [to,         setTo]         = useState("");

  // Self-log page view
  useEffect(() => {
    if (hasLogged.current || !currentUser) return;
    hasLogged.current = true;
    const userId = (currentUser as any)?.$id ?? (currentUser as any)?.id;
    fetch("/api/audit-logs/record", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(userId ? { "x-user-id": userId } : {}) },
      body: JSON.stringify({ module: "audit", action_type: "read", result: "success", severity: "low", description: "Viewed audit log page" }),
    }).catch(() => {});
  }, [currentUser]);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", "30");
    if (module_)    p.set("module",      module_);
    if (severity)   p.set("severity",    severity);
    if (actionType) p.set("action_type", actionType);
    if (result)     p.set("result",      result);
    if (search)     p.set("search",      search);
    if (from)       p.set("from",        from);
    if (to)         p.set("to",          to);
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

  const setFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const hasFilters = !!(module_ || severity || actionType || result || search || from || to);

  const exportCsv = () => {
    const userId = (currentUser as any)?.$id;
    const p = new URLSearchParams();
    if (module_)    p.set("module",      module_);
    if (severity)   p.set("severity",    severity);
    if (actionType) p.set("action_type", actionType);
    if (from)       p.set("from",        from);
    if (to)         p.set("to",          to);
    const url = `/api/audit-logs/export?${p.toString()}`;
    fetch(url, { headers: userId ? { "x-user-id": userId } : {} })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl shadow-lg">
            🔍
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Audit Log</h1>
            <p className="text-xs text-slate-400">
              Immutable activity trail · {total.toLocaleString()} total entries
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            TAMPER-PROOF
          </span>
        </div>

        <div className="flex gap-2">
          <button
            id="audit-log-refresh-btn"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm disabled:opacity-50"
          >
            <span className={loading ? "animate-spin inline-block" : ""}>⟳</span>
            Refresh
          </button>
          <button
            id="audit-log-export-btn"
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow transition-all"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Search</label>
          <input
            id="audit-search-input"
            type="text"
            placeholder="description, actor name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        <FilterSelect label="Module"   value={module_}    onChange={setFilter(setModule)}     options={MODULES} />
        <FilterSelect label="Severity" value={severity}   onChange={setFilter(setSeverity)}   options={SEVERITIES} />
        <FilterSelect label="Action"   value={actionType} onChange={setFilter(setActionType)} options={ACTION_TYPES} />
        <FilterSelect label="Result"   value={result}     onChange={setFilter(setResult)}     options={RESULTS} />

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">From</label>
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">To</label>
          <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {hasFilters && (
          <button
            onClick={() => { setModule(""); setSeverity(""); setActionType(""); setResult(""); setSearch(""); setFrom(""); setTo(""); setPage(1); }}
            className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto px-6 py-4">

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            ⚠ {error}
          </div>
        )}

        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
            <span className="text-4xl mb-3 animate-spin">⟳</span>
            <p className="text-sm">Loading audit entries…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
            <span className="text-5xl mb-4">📋</span>
            <p className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-1">No entries found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b-2 border-slate-200 dark:border-slate-700">
                      <th className="w-1 p-0" />
                      {["Timestamp", "Severity", "Module", "Action", "Result", "Actor", "Description", ""].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {logs.map((doc, i) => <AuditRow key={doc.$id} doc={doc} idx={i} />)}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, total)} of{" "}
                <strong className="text-slate-700 dark:text-slate-200">{total.toLocaleString()}</strong> entries
              </span>

              <div className="flex gap-1">
                {[
                  { label: "«", p: 1,         disabled: page === 1 },
                  { label: "‹", p: page - 1,  disabled: page === 1 },
                ].map(({ label, p, disabled }) => (
                  <button key={label} onClick={() => setPage(p)} disabled={disabled}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-default transition-colors">
                    {label}
                  </button>
                ))}

                {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 3, pages - 6));
                  const p = start + i;
                  if (p > pages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        p === page
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}>
                      {p}
                    </button>
                  );
                })}

                {[
                  { label: "›", p: page + 1, disabled: page === pages },
                  { label: "»", p: pages,    disabled: page === pages },
                ].map(({ label, p, disabled }) => (
                  <button key={label} onClick={() => setPage(p)} disabled={disabled}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-default transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
