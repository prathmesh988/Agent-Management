/**
 * POST /api/audit-logs/record
 *
 * Lightweight endpoint for client-side ("use client") components to write
 * audit log entries without leaking server credentials.
 *
 * The actor is resolved server-side from the x-user-id header.
 * The caller only needs to provide: module, action_type, result, description, metadata.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { auditLog, extractActorMeta } from '@/lib/audit-logger';
import type { AuditEntry } from '@/lib/audit-logger';

export async function POST(req: NextRequest) {
  try {
    const user  = await getAuthenticatedUser(req);
    const body  = await req.json().catch(() => ({})) as Partial<AuditEntry>;
    const meta  = extractActorMeta(req);

    await auditLog({
      ...body,
      module:              body.module      ?? 'audit',
      action_type:         body.action_type ?? 'read',
      result:              body.result      ?? 'success',
      actor_id:            user?.$id            ?? body.actor_id ?? null,
      actor_name_snapshot: user?.name           ?? body.actor_name_snapshot ?? '',
      actor_role_snapshot: (user as any)?.labels?.[0] ?? body.actor_role_snapshot ?? '',
      actor_ip:            meta.actor_ip,
      actor_user_agent:    meta.actor_user_agent,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/audit-logs/record] Error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
