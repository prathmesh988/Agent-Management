#!/usr/bin/env node
/**
 * Initialize the audit_logs collection in Appwrite.
 *
 * Collection ID: process.env.APPWRITE_AUDIT_LOGS_COLLECTION_ID || 'audit_logs'
 *
 * Permissions: append-only (create only — no update or delete for any role).
 * This is enforced at the Appwrite collection level so that even admins cannot
 * tamper with historical records.
 *
 * Run standalone: node scripts/init-audit-logs.js
 * Or via:         npm run init-db
 */

require('dotenv').config({ path: '.env.local' });
const { Client, Databases, Permission, Role } = require('node-appwrite');

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT  || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY    = process.env.APPWRITE_PROJECT_ID_API_SECRET;
const DB_ID      = process.env.APPWRITE_DATABASE_ID            || '69b7ec04003c8a35a2d8';
const COL_ID     = process.env.APPWRITE_AUDIT_LOGS_COLLECTION_ID || 'audit_logs';
const COL_NAME   = 'Audit Logs';

// ── Schema ────────────────────────────────────────────────────────────────────
// All attributes are strings (some store stringified JSON).
// "size" is used for string fields; 65535 = text/blob tier.

const ATTRIBUTES = [
  // Timestamp (ISO-8601 UTC string)
  { key: 'timestamp',            type: 'string',  size: 64,    required: false },

  // Actor snapshot
  { key: 'actor_id',             type: 'string',  size: 255,   required: false },
  { key: 'actor_name_snapshot',  type: 'string',  size: 255,   required: false },
  { key: 'actor_email_snapshot', type: 'string',  size: 255,   required: false },
  { key: 'actor_employee_id',    type: 'string',  size: 64,    required: false },
  { key: 'actor_role_snapshot',  type: 'string',  size: 64,    required: false },
  { key: 'actor_ip',             type: 'string',  size: 64,    required: false },
  { key: 'actor_user_agent',     type: 'string',  size: 512,   required: false },
  { key: 'session_id',           type: 'string',  size: 255,   required: false },

  // Event classification
  { key: 'module',               type: 'string',  size: 64,    required: false },
  // 'action' is the existing required field name in the Appwrite collection
  { key: 'action',               type: 'string',  size: 64,    required: false },
  // 'action_type' kept as forward-compat alias (new schema)
  { key: 'action_type',          type: 'string',  size: 64,    required: false },
  { key: 'result',               type: 'string',  size: 32,    required: false },
  { key: 'severity',             type: 'string',  size: 32,    required: false },
  { key: 'description',          type: 'string',  size: 1024,  required: false },

  // Target record snapshot
  { key: 'target_type',          type: 'string',  size: 64,    required: false },
  { key: 'target_id',            type: 'string',  size: 255,   required: false },
  { key: 'target_name_snapshot', type: 'string',  size: 255,   required: false },
  { key: 'target_employee_id',   type: 'string',  size: 64,    required: false },

  // Payload (stringified JSON)
  { key: 'field_changes',        type: 'string',  size: 65535, required: false },
  { key: 'metadata',             type: 'string',  size: 65535, required: false },
];

// ── Indexes ───────────────────────────────────────────────────────────────────
const INDEXES = [
  { key: 'idx_timestamp',   type: 'key', attributes: ['timestamp'],   orders: ['DESC'] },
  { key: 'idx_actor_id',    type: 'key', attributes: ['actor_id'] },
  { key: 'idx_module',      type: 'key', attributes: ['module'] },
  { key: 'idx_severity',    type: 'key', attributes: ['severity'] },
  { key: 'idx_action_type', type: 'key', attributes: ['action_type'] },
  { key: 'idx_session_id',  type: 'key', attributes: ['session_id'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  if (!PROJECT_ID || !API_KEY) {
    console.error('✗ Missing env vars: NEXT_PUBLIC_APPWRITE_PROJECT_ID or APPWRITE_PROJECT_ID_API_SECRET');
    process.exit(1);
  }

  const databases = new Databases(
    new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY),
  );

  console.log(`\nSetting up collection: ${COL_NAME} (${COL_ID})`);

  // ── 1. Create collection (append-only: create permission only) ──────────────
  try {
    await databases.getCollection(DB_ID, COL_ID);
    console.log('  – Collection already exists, skipping creation');
  } catch (e) {
    if (e.code === 404) {
      await databases.createCollection(
        DB_ID,
        COL_ID,
        COL_NAME,
        // Append-only: any authenticated user can create, nobody can update/delete
        [Permission.create(Role.any())],
      );
      console.log('  ✓ Collection created (append-only permissions)');
    } else {
      throw e;
    }
  }

  await delay(1000);

  // ── 2. Attributes ──────────────────────────────────────────────────────────
  console.log('\n  Creating attributes...');
  for (const attr of ATTRIBUTES) {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(DB_ID, COL_ID, attr.key, attr.size, attr.required);
        console.log(`  ✓ Attribute: ${attr.key}`);
      }
    } catch (e) {
      if (e.code === 409) {
        console.log(`  – ${attr.key} already exists`);
      } else {
        console.error(`  ✗ ${attr.key}:`, e.message);
      }
    }
    await delay(350);
  }

  // ── 3. Wait for Appwrite to propagate schema before creating indexes ─────────
  console.log('\n  Waiting for attributes to propagate before creating indexes...');
  await delay(5000);

  // ── 4. Indexes ──────────────────────────────────────────────────────────────
  console.log('  Creating indexes...');
  for (const idx of INDEXES) {
    try {
      await databases.createIndex(
        DB_ID,
        COL_ID,
        idx.key,
        idx.type,
        idx.attributes,
        idx.orders,
      );
      console.log(`  ✓ Index: ${idx.key}`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`  – Index ${idx.key} already exists`);
      } else {
        console.error(`  ✗ Index error (${idx.key}):`, e.message);
      }
    }
    await delay(400);
  }

  console.log('\n✅ audit_logs collection initialized successfully!');
}

run().catch((err) => {
  console.error('✗ Fatal error:', err.message);
  process.exit(1);
});
