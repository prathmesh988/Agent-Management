#!/usr/bin/env node
/**
 * Migration: Add day 29/30/31 attributes to existing Appwrite employees collection.
 * Run once: node scripts/add-days-29-31.js
 */

require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69b7ec04003c8a35a2d8';
const COLLECTION_ID = process.env.APPWRITE_COLLECTION_ID || 'orcus_extended1';
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_PROJECT_ID_API_SECRET;

const NEW_ATTRIBUTES = ['29Sun', '30Mon', '31Tue'];

async function migrate() {
  if (!PROJECT_ID || !API_KEY) {
    console.error('✗ Missing env vars: NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_PROJECT_ID_API_SECRET');
    process.exit(1);
  }

  const databases = new Databases(
    new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
  );

  console.log(`📋 Adding attributes to collection "${COLLECTION_ID}"...`);

  for (const key of NEW_ATTRIBUTES) {
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, key, 10, false);
      console.log(`  ✓ Created attribute: ${key}`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`  – Already exists: ${key}`);
      } else {
        console.error(`  ✗ Failed to create ${key}:`, e.message);
      }
    }
    // Brief pause between requests
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('✅ Migration complete.');
}

migrate();
