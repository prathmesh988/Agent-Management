/**
 * Audit Logger — core utility for writing immutable audit log entries.
 *
 * Usage (fire-and-forget pattern):
 *   auditLog({ action_type: 'update', module: 'employee', ... }); // no await
 *
 * All entries are written to the `audit_logs` Appwrite collection with
 * append-only permissions (create only — no update/delete).
 */

import { Client, Databases, ID } from 'node-appwrite';
import type { NextRequest } from 'next/server';

// ── Collection config ─────────────────────────────────────────────────────────

const DB_ID      = () => process.env.APPWRITE_DATABASE_ID || '';
const AUDIT_COL  = () => process.env.APPWRITE_AUDIT_LOGS_COLLECTION_ID || 'audit_logs';

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditModule =
  | 'payroll'
  | 'leave'
  | 'attendance'
  | 'roles'
  | 'employee'
  | 'documents'
  | 'reports'
  | 'auth'
  | 'audit';

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'login'
  | 'login_failed'
  | 'password_reset';

export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AuditResult   = 'success' | 'failed';

export interface FieldChange {
  field:     string;
  old_value: string;
  new_value: string;
}

export interface AuditEntry {
  // Actor
  actor_id?:             string | null;
  actor_name_snapshot?:  string;
  actor_role_snapshot?:  string;
  actor_ip?:             string;
  actor_user_agent?:     string;
  session_id?:           string;

  // Event
  module:       AuditModule;
  action_type:  AuditAction;
  result:       AuditResult;
  severity?:    AuditSeverity;  // auto-assigned if omitted
  description?: string;

  // Target
  target_type?:          string;
  target_id?:            string;
  target_name_snapshot?: string;
  target_employee_id?:   string;

  // Payload
  field_changes?: FieldChange[];
  metadata?:      Record<string, unknown>;
}

// ── Severity auto-assignment ───────────────────────────────────────────────────

/**
 * Auto-assign severity based on module + action combination.
 * Manual overrides are respected when provided in the entry.
 */
function assignSeverity(entry: AuditEntry): AuditSeverity {
  if (entry.severity) return entry.severity;

  const { module, action_type, result } = entry;

  // Always critical
  if (module === 'payroll')                                  return 'critical';
  if (module === 'roles'  && action_type !== 'read')         return 'critical';
  if (module === 'auth'   && action_type === 'login_failed') return 'high';
  if (module === 'audit'  && action_type === 'export')       return 'critical';

  // Employee deletions
  if (module === 'employee' && action_type === 'delete')     return 'critical';

  // Failures are always at least high
  if (result === 'failed')                                   return 'high';

  // Read ops
  if (action_type === 'read') return 'low';

  // Documents + attendance
  if (module === 'documents' || module === 'attendance')     return 'low';

  return 'medium';
}

// ── Main logger ───────────────────────────────────────────────────────────────

/**
 * Write a single audit log entry.
 * This function is intentionally fire-and-forget — never await it in hot paths.
 *
 * Failures are swallowed and logged to console only (never throw).
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    const databases = new Databases(createAdminClient());
    const severity  = assignSeverity(entry);

    // ── Build the required "target" value (legacy field — must be non-empty string) ──
    // Priority: explicit target_name_snapshot → target_id → target_employee_id → description excerpt → module
    const targetValue =
      entry.target_name_snapshot ||
      entry.target_id            ||
      entry.target_employee_id   ||
      (entry.description ? entry.description.slice(0, 255) : '') ||
      entry.module;

    const doc: Record<string, unknown> = {
      // ── datetime field — Appwrite expects ISO-8601 string for datetime type ──
      timestamp:            new Date().toISOString(),

      // ── Actor ──────────────────────────────────────────────────────────────
      actor_id:             entry.actor_id            ?? null,
      actor_name_snapshot:  entry.actor_name_snapshot ?? '',
      actor_employee_id:    entry.target_employee_id  ?? '',   // maps best available employee id
      actor_role_snapshot:  entry.actor_role_snapshot ?? '',
      actor_ip:             entry.actor_ip            ?? '',
      actor_user_agent:     entry.actor_user_agent    ?? '',
      session_id:           entry.session_id          ?? '',

      // ── Legacy required fields (pre-existing schema) ───────────────────────
      performedBy:          entry.actor_name_snapshot ?? String(entry.actor_id ?? 'system'),
      action:               entry.action_type,   // legacy alias — required
      target:               targetValue,          // legacy required — human-readable target label

      // ── Event classification ───────────────────────────────────────────────
      module:               entry.module,
      action_type:          entry.action_type,
      result:               entry.result,
      severity,
      description:          entry.description ?? '',

      // ── Target snapshot ────────────────────────────────────────────────────
      target_type:          entry.target_type          ?? '',
      target_id:            entry.target_id            ?? '',
      target_name_snapshot: entry.target_name_snapshot ?? '',
      target_employee_id:   entry.target_employee_id   ?? '',

      // ── Payload (stringified JSON) ─────────────────────────────────────────
      field_changes:        entry.field_changes
                              ? JSON.stringify(entry.field_changes)
                              : '[]',
      metadata:             entry.metadata
                              ? JSON.stringify(entry.metadata)
                              : '{}',
    };

    await databases.createDocument({
      databaseId:   DB_ID(),
      collectionId: AUDIT_COL(),
      documentId:   ID.unique(),
      data:         doc,
    });
  } catch (err) {
    // Audit log failures must never crash the application
    console.error('[AuditLog] Failed to write audit entry:', err);
  }
}

// ── Field diff helper ─────────────────────────────────────────────────────────

/**
 * Produce a list of FieldChange objects for fields that changed between
 * `before` and `after`.
 *
 * Example:
 *   const changes = diffFields(before, after, ['name', 'ctc', 'designation']);
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after:  Partial<T>,
  watchKeys: (keyof T)[],
): FieldChange[] {
  return watchKeys
    .filter(k => String(before[k] ?? '') !== String(after[k] ?? ''))
    .map(k => ({
      field:     String(k),
      old_value: String(before[k] ?? ''),
      new_value: String(after[k] ?? ''),
    }));
}

// ── Actor metadata extraction ─────────────────────────────────────────────────

/**
 * Extract IP and User-Agent from a NextRequest for API routes.
 */
export function extractActorMeta(req: NextRequest): {
  actor_ip:         string;
  actor_user_agent: string;
} {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp    = req.headers.get('x-real-ip');
  const actor_ip  = forwarded?.split(',')[0]?.trim() ?? realIp ?? 'unknown';
  const actor_user_agent = req.headers.get('user-agent') ?? '';
  return { actor_ip, actor_user_agent };
}
