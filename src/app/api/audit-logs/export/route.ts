/**
 * GET /api/audit-logs/export
 *
 * Export all audit log entries (matching optional filters) as a CSV download.
 * Also self-logs the export as a critical audit event.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';
import { auditLog, extractActorMeta } from '@/lib/audit-logger';
import { getAuthenticatedUser } from '@/lib/auth-utils';

const DB_ID     = () => process.env.APPWRITE_DATABASE_ID            || '';
const AUDIT_COL = () => process.env.APPWRITE_AUDIT_LOGS_COLLECTION_ID || 'audit_logs';

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT   || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID  || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET       || '');
}

const CSV_HEADERS = [
  'timestamp', 'actor_id', 'actor_name_snapshot', 'actor_role_snapshot',
  'actor_ip', 'module', 'action_type', 'result', 'severity',
  'description', 'target_id', 'target_name_snapshot', 'target_employee_id',
  'field_changes', 'metadata',
];

function escapeCsv(val: unknown): string {
  const str = val == null ? '' : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const module_    = searchParams.get('module')      ?? '';
    const severity   = searchParams.get('severity')    ?? '';
    const actionType = searchParams.get('action_type') ?? '';
    const from       = searchParams.get('from')        ?? '';
    const to         = searchParams.get('to')          ?? '';

    const databases = new Databases(createAdminClient());

    const queries: string[] = [Query.orderDesc('timestamp'), Query.limit(100)];
    if (module_)    queries.push(Query.equal('module',      module_));
    if (severity)   queries.push(Query.equal('severity',    severity));
    if (actionType) queries.push(Query.equal('action_type', actionType));
    if (from)       queries.push(Query.greaterThanEqual('timestamp', from));
    if (to)         queries.push(Query.lessThanEqual('timestamp', to));

    // Paginate through all results
    const allDocs: Record<string, unknown>[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await databases.listDocuments({
        databaseId:   DB_ID(),
        collectionId: AUDIT_COL(),
        queries: [...queries, Query.offset(offset)],
      });
      allDocs.push(...(result.documents as Record<string, unknown>[]));
      offset += result.documents.length;
      hasMore = result.documents.length === 100;
    }

    // Build CSV
    const rows = [
      CSV_HEADERS.join(','),
      ...allDocs.map(doc =>
        CSV_HEADERS.map(h => escapeCsv(doc[h])).join(',')
      ),
    ];
    const csv = rows.join('\n');

    // Self-log the export
    const user = await getAuthenticatedUser(req);
    const meta = extractActorMeta(req);
    auditLog({
      actor_id:            user?.$id,
      actor_name_snapshot: user?.name,
      actor_role_snapshot: (user as any)?.labels?.[0],
      actor_ip:            meta.actor_ip,
      actor_user_agent:    meta.actor_user_agent,
      module:              'audit',
      action_type:         'export',
      severity:            'critical',
      result:              'success',
      description:         `Audit log exported — ${allDocs.length} entries`,
      metadata:            { row_count: allDocs.length },
    });

    const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/audit-logs/export]', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
