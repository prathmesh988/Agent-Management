#!/usr/bin/env node

/**
 * Master Initialization Script
 *
 * Runs all collection and storage initialization in dependency order.
 * Every collection is idempotent — safe to re-run on every app start.
 *
 * Order:
 *  1. Core collections   — employees, leave, storage buckets
 *  2. Incentive          — incentives collection
 *  3. Settings           — app-level settings
 *  4. Normalized tables  — bank details, payroll records
 *  5. Audit logs         — immutable append-only audit_logs collection
 */

require('dotenv').config({ path: '.env.local' });
const { spawn } = require('child_process');

const scripts = [
  { path: 'scripts/init-collection.js',               label: 'Core collections (employees, leave, storage)' },
  { path: 'scripts/insentive-init.js',                label: 'Incentive collection'                         },
  { path: 'scripts/init-settings.js',                 label: 'Settings collection'                          },
  { path: 'scripts/create-normalized-collections.js', label: 'Normalized tables (bank details, payroll)'    },
  { path: 'scripts/init-audit-logs.js',               label: 'Audit logs collection (append-only)'          },
];

console.log('🚀 Starting comprehensive collection initialization...\n');

// ── Helpers ───────────────────────────────────────────────────────────────────

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script ${scriptPath} exited with code ${code}`));
    });

    child.on('error', reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function initializeAll() {
  const failed = [];

  for (const { path, label } of scripts) {
    console.log('\n───────────────────────────────────────────────────');
    console.log(`▶  ${label}`);
    console.log(`   ${path}`);
    console.log('───────────────────────────────────────────────────');

    try {
      await runScript(path);
    } catch (err) {
      // Non-fatal: warn and continue so one bad collection doesn't prevent others
      console.warn(`\n⚠  ${path} failed: ${err.message}`);
      console.warn('   Continuing with remaining scripts...');
      failed.push(path);
    }
  }

  if (failed.length === 0) {
    console.log('\n✅ All collections initialized successfully!');
  } else {
    console.warn(`\n⚠  Initialization completed with ${failed.length} warning(s):`);
    failed.forEach((p) => console.warn(`   – ${p}`));
    console.warn('   The app will still start. Check the warnings above.');
  }

  process.exit(0);
}

initializeAll();
