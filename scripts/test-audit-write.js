#!/usr/bin/env node
/**
 * Smoke-test: write one audit log entry using the same logic as audit-logger.ts
 * and confirm no required-field errors.
 *
 * Run: node scripts/test-audit-write.js
 */
require('dotenv').config({ path: '.env.local' });
const { Client, Databases, ID } = require('node-appwrite');

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT          || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY    = process.env.APPWRITE_PROJECT_ID_API_SECRET;
const DB_ID      = process.env.APPWRITE_DATABASE_ID                   || '';
const COL_ID     = process.env.APPWRITE_AUDIT_LOGS_COLLECTION_ID      || 'audit_logs';

async function run() {
  const databases = new Databases(
    new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
  );

  const description = 'Smoke test — verifying all required fields are satisfied';
  const targetValue = description.slice(0, 255); // fallback target

  const doc = {
    timestamp:            new Date().toISOString(),
    actor_id:             null,
    actor_name_snapshot:  'system-test',
    actor_employee_id:    '',
    actor_role_snapshot:  'admin',
    actor_ip:             '127.0.0.1',
    actor_user_agent:     'node-test',
    session_id:           '',
    // ── Legacy required ──
    performedBy:          'system-test',
    action:               'create',
    target:               targetValue,
    // ── Event ──
    module:               'audit',
    action_type:          'create',
    result:               'success',
    severity:             'low',
    description,
    // ── Target ──
    target_type:          '',
    target_id:            '',
    target_name_snapshot: '',
    target_employee_id:   '',
    // ── Payload ──
    field_changes:        '[]',
    metadata:             '{}',
  };

  console.log('\nWriting test audit document...');
  const result = await databases.createDocument({
    databaseId:   DB_ID,
    collectionId: COL_ID,
    documentId:   ID.unique(),
    data:         doc,
  });

  console.log('✅ SUCCESS — document created:', result.$id);
  console.log('   No required-field errors.\n');
}

run().catch(err => {
  console.error('\n❌ FAILED:', err.message);
  if (err.response) console.error('   Response:', err.response);
  process.exit(1);
});
