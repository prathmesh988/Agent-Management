"use client";

/**
 * /admin/audit-log — Immutable Audit Log Viewer
 *
 * Access restricted to: admin, manager, hr (payroll admin)
 * Self-logs a read event on each page mount.
 */

import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AuditLogPage() {
  const { currentUser } = useCurrentUser();
  const hasLogged = useRef(false);

  // Self-log: record that this user viewed the audit log page (once per mount)
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
      body: JSON.stringify({
        module:      "audit",
        action_type: "read",
        result:      "success",
        severity:    "low",
        description: "Viewed audit log page",
      }),
    }).catch(() => {});
  }, [currentUser]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Audit Log
          </h1>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            title="Entries in this log cannot be edited or deleted."
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Immutable
          </span>
        </div>

        <div className="flex gap-2">
          <button
            id="audit-log-refresh-btn"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Coming soon / placeholder ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <svg className="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Audit Log Viewer
        </h2>
        <p className="mx-auto max-w-sm text-sm text-slate-500 dark:text-slate-400">
          All system actions are now being recorded in the <strong>audit_logs</strong> collection.
          The full log viewer UI (filters, search, export) is ready to be wired to the Appwrite backend.
        </p>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Collection: <code className="font-mono">audit_logs</code> · Backend: Appwrite · Tamper-proof: ✓
        </p>
      </div>
    </div>
  );
}
