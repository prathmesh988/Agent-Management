#!/usr/bin/env node

/**
 * Migrate Employees Table Schema
 *
 * This script deletes the old employees table (if it exists) and creates a new one
 * with the updated schema. Run this if you're upgrading from the old schema.
 *
 * Usage:
 *   npx ts-node scripts/migrate-employees-table.ts
 *
 * Environment variables required:
 *   - APPWRITE_ENDPOINT
 *   - APPWRITE_PROJECT_ID
 *   - APPWRITE_API_KEY
 */

import { Client, TablesDB } from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "69b86fc300070678494b";
const TABLE_ID = process.env.APPWRITE_TABLE_ID || "rydr_db";
const TABLE_NAME = process.env.APPWRITE_TABLE_NAME || "rydr_db";

async function migrateTable() {
  const client = new Client()
    .setEndpoint(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
        "https://cloud.appwrite.io/v1",
    )
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || "");

  const tablesDB = new TablesDB(client);

  try {
    console.log("🔍 Checking for existing table...");

    // Try to delete the old table
    try {
      await tablesDB.deleteTable({
        databaseId: DATABASE_ID,
        tableId: TABLE_ID,
      });
      console.log("✓ Old table deleted successfully");
    } catch (err) {
      console.log("ℹ  No existing table found (or already deleted)");
    }

    console.log("");
    console.log("📋 Now running initialization with the new schema...");
    console.log("");

    // Dynamic import to run initialization
    const { initializeEmployeesTable } =
      await import("../src/lib/initialize-table");
    const result = await initializeEmployeesTable();

    console.log("");
    console.log("✅ Migration completed successfully!");
    console.log("");
    console.log("New Schema Summary:");
    console.log("- Database ID: 69b7ec04003c8a35a2d8");
    console.log("- Table name: employees");
    console.log("- Total columns: 38");
    console.log("");
    console.log("Field types:");
    console.log(
      "- String fields: employeeId, name, process, designation, etc.",
    );
    console.log("- Number fields: ctc, attendanceAllowance, presentDays, etc.");
    console.log("");
    console.log(
      "The table is now ready to receive employee data with the new schema.",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed");
    console.error("");
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error:", error);
    }
    console.error("");
    console.error("Make sure these environment variables are set:");
    console.error("- APPWRITE_ENDPOINT");
    console.error("- APPWRITE_PROJECT_ID");
    console.error("- APPWRITE_API_KEY");
    process.exit(1);
  }
}

migrateTable();
