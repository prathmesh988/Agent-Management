#!/usr/bin/env node
/**
 * Migration: Create the monthly_attendance collection in Appwrite.
 * Run once: node scripts/create-monthly-attendance-collection.js
 */

require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69b7ec04003c8a35a2d8';
const COLLECTION_ID = 'monthly_attendance';
const COLLECTION_NAME = 'Monthly Attendance';
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_PROJECT_ID_API_SECRET;

async function run() {
  if (!PROJECT_ID || !API_KEY) {
    console.error('✗ Missing env vars');
    process.exit(1);
  }

  const databases = new Databases(
    new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
  );

  // ── Create collection ────────────────────────────────────────────────────
  try {
    await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    console.log('– Collection already exists, adding any missing attributes...');
  } catch (e) {
    if (e.code === 404) {
      await databases.createCollection(DATABASE_ID, COLLECTION_ID, COLLECTION_NAME);
      console.log('✓ Collection created');
    } else throw e;
  }

  // ── Define attributes ─────────────────────────────────────────────────────
  const stringAttrs = ['employeeId'];
  const intAttrs = ['year', 'month'];
  const dayAttrs = Array.from({ length: 31 }, (_, i) => `day${i + 1}`);

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  for (const key of stringAttrs) {
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, key, 255, key === 'employeeId');
      console.log(`  ✓ ${key}`);
    } catch (e) { if (e.code !== 409) console.error(`  ✗ ${key}:`, e.message); else console.log(`  – ${key} exists`); }
    await delay(300);
  }

  for (const key of intAttrs) {
    try {
      await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, key, key === 'year' || key === 'month');
      console.log(`  ✓ ${key}`);
    } catch (e) { if (e.code !== 409) console.error(`  ✗ ${key}:`, e.message); else console.log(`  – ${key} exists`); }
    await delay(300);
  }

  for (const key of dayAttrs) {
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, key, 10, false);
      console.log(`  ✓ ${key}`);
    } catch (e) { if (e.code !== 409) console.error(`  ✗ ${key}:`, e.message); else console.log(`  – ${key} exists`); }
    await delay(150);
  }

  // ── Create index for fast lookups ─────────────────────────────────────────
  console.log('\nWaiting 5s for attributes to become available before creating index...');
  await delay(5000);

  try {
    await databases.createIndex(
      DATABASE_ID, COLLECTION_ID,
      'idx_employee_year_month',
      'key',
      ['employeeId', 'year', 'month'],
      ['ASC', 'ASC', 'ASC']
    );
    console.log('✓ Index created');
  } catch (e) {
    if (e.code === 409) console.log('– Index already exists');
    else console.error('✗ Index error:', e.message);
  }

  console.log('\n✅ Done!');
}

run();
