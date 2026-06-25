/**
 * GET /api/audit-logs
 *
 * Fetch paginated audit log entries with optional query filters.
 *
 * Query params:
 *   page       (default 1)
 *   limit      (default 30, max 100)
 *   module     filter by module
 *   severity   filter by severity
 *   action_type filter by action type
 *   actor_id   filter by actor
 *   search     free-text search on description / actor_name_snapshot
 *   from       ISO timestamp lower bound
 *   to         ISO timestamp upper bound
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';

const DB_ID     = () => process.env.APPWRITE_DATABASE_ID     || '';
const AUDIT_COL = () => process.env.APPWRITE_AUDIT_LOGS_COLLECTION_ID || 'audit_logs';

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT   || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID  || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET       || '');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page       = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
    const limit      = Math.min(100, parseInt(searchParams.get('limit') ?? '30', 10));
    const module_    = searchParams.get('module')      ?? '';
    const severity   = searchParams.get('severity')    ?? '';
    const actionType = searchParams.get('action_type') ?? '';
    const actorId    = searchParams.get('actor_id')    ?? '';
    const from       = searchParams.get('from')        ?? '';
    const to         = searchParams.get('to')          ?? '';
    const search     = searchParams.get('search')      ?? '';

    const queries: string[] = [
      Query.orderDesc('timestamp'),
      Query.limit(limit),
      Query.offset((page - 1) * limit),
    ];

    if (module_)    queries.push(Query.equal('module',      module_));
    if (severity)   queries.push(Query.equal('severity',    severity));
    if (actionType) queries.push(Query.equal('action_type', actionType));
    if (actorId)    queries.push(Query.equal('actor_id',    actorId));
    if (from)       queries.push(Query.greaterThanEqual('timestamp', from));
    if (to)         queries.push(Query.lessThanEqual('timestamp', to));
    if (search)     queries.push(Query.or([
      Query.contains('description',         search),
      Query.contains('actor_name_snapshot', search),
    ]));

    const databases = new Databases(createAdminClient());
    const result = await databases.listDocuments({
      databaseId:   DB_ID(),
      collectionId: AUDIT_COL(),
      queries,
    });

    return NextResponse.json({
      documents: result.documents,
      total:     result.total,
      page,
      limit,
      pages: Math.ceil(result.total / limit),
    });
  } catch (err) {
    console.error('[GET /api/audit-logs]', err);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
