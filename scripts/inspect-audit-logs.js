#!/usr/bin/env node
/**
 * Introspect the audit_logs collection and print every attribute
 * with its key, type, required flag, and default value.
 *
 * Run: node scripts/inspect-audit-logs.js
 */
require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT         || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY    = process.env.APPWRITE_PROJECT_ID_API_SECRET;
const DB_ID      = process.env.APPWRITE_DATABASE_ID                  || '';
const COL_ID     = process.env.APPWRITE_AUDIT_LOGS_COLLECTION_ID     || 'audit_logs';

async function run() {
  const databases = new Databases(
    new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
  );

  console.log(`\nCollection: ${COL_ID}  DB: ${DB_ID}\n`);

  const col = await databases.getCollection(DB_ID, COL_ID);
  const attrs = col.attributes || [];

  console.log('=== ATTRIBUTES ===');
  const required = [];
  for (const a of attrs) {
    const req = a.required ? '🔴 REQUIRED' : '⚪ optional';
    const def = a.default !== undefined && a.default !== null ? ` [default: ${JSON.stringify(a.default)}]` : '';
    console.log(`  ${req}  ${a.key} (${a.type})${def}`);
    if (a.required) required.push(a.key);
  }

  console.log('\n=== REQUIRED FIELDS SUMMARY ===');
  if (required.length === 0) {
    console.log('  ✅ No required fields found!');
  } else {
    required.forEach(k => console.log(`  ❌ ${k}`));
  }
  console.log('');
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
