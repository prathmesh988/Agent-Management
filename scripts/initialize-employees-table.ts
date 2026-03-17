#!/usr/bin/env node

/**
 * Initialize Employees Table
 * 
 * Usage:
 *   npx ts-node scripts/initialize-employees-table.ts
 * 
 * This script creates the employees table in Appwrite if it doesn't already exist.
 * Environment variables required:
 *   - APPWRITE_ENDPOINT
 *   - APPWRITE_PROJECT_ID
 *   - APPWRITE_API_KEY
 */

import { initializeEmployeesTable, tableExists } from '../src/lib/initialize-table';

async function main() {
  console.log('🔍 Checking Appwrite connection...');

  try {
    const exists = await tableExists();
    
    if (exists) {
      console.log('✓ Table already exists, no action needed');
      process.exit(0);
    }

    console.log('📋 Table does not exist, initializing...');
    const result = await initializeEmployeesTable();
    
    console.log('✓ Table initialized successfully!');
    console.log('');
    console.log('Summary:');
    console.log('- Database ID: 69b7ec04003c8a35a2d8');
    console.log('- Table name: employees');
    console.log('- Total columns: 43');
    console.log('');
    console.log('The table is now ready to receive employee data via Excel import.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to initialize table');
    console.error('');
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error);
    }
    console.error('');
    console.error('Make sure these environment variables are set:');
    console.error('- APPWRITE_ENDPOINT');
    console.error('- APPWRITE_PROJECT_ID');
    console.error('- APPWRITE_API_KEY');
    process.exit(1);
  }
}

main();
