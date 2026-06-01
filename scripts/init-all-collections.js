#!/usr/bin/env node

/**
 * Master Initialization Script
 * This script runs all collection and storage initialization in proper order.
 * It ensures that all collections (employees, leave, incentives, settings, etc.) 
 * are auto-created on app startup.
 */

require('dotenv').config({ path: '.env.local' });
const { spawn } = require('child_process');

const scripts = [
  'scripts/init-collection.js',          // Core collections: employees, leave, storage
  'scripts/insentive-init.js',           // Incentive collection
  'scripts/init-settings.js',            // Settings collection
  'scripts/create-normalized-collections.js', // Bank details, payroll
];

console.log('🚀 Starting comprehensive collection initialization...\n');

async function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const script = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    script.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
      }
    });

    script.on('error', (error) => {
      reject(error);
    });
  });
}

async function initializeAll() {
  try {
    for (const script of scripts) {
      console.log(`\n───────────────────────────────────────`);
      console.log(`Running: ${script}`);
      console.log(`───────────────────────────────────────`);
      await runScript(script);
    }

    console.log('\n✅ All collections initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

initializeAll();
