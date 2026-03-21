#!/usr/bin/env node

/**
 * Initialize Employees Collection - Standalone Script
 * This script creates the employees collection in Appwrite if it doesn't exist.
 */

require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require("node-appwrite");

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "69b7ec04003c8a35a2d8";
const COLLECTION_NAME = process.env.APPWRITE_COLLECTION_NAME || "orcus_extended1";
const COLLECTION_ID = process.env.APPWRITE_COLLECTION_ID || "orcus_extended1";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_PROJECT_ID_API_SECRET;

async function initializeCollection() {
  if (!PROJECT_ID || !API_KEY) {
    console.error("✗ Missing required environment variables:");
    console.error("  - NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    console.error("  - APPWRITE_PROJECT_ID_API_SECRET");
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const databases = new Databases(client);

  try {
    // Check if collection already exists
    try {
      await databases.getCollection(DATABASE_ID, COLLECTION_ID);
      console.log("✓ Collection already exists - no initialization needed");
      return; // Let the event loop drain naturally — process.exit() here crashes Windows libuv
    } catch (err) {
      if (err.code !== 404) {
        throw err;
      }
    }

    console.log("📋 Collection does not exist, creating now...");

    // Create the collection
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      COLLECTION_NAME
    );

    // Define columns
    const columns = [
      { key: "sno", type: "float", required: false },
      { key: "employeeId", type: "string", required: true },
      { key: "name", type: "string", required: true },
      { key: "ctc", type: "float", required: false },
      { key: "attendanceAllowance", type: "float", required: false },
      { key: "process", type: "string", required: false },
      { key: "designation", type: "string", required: false },
      { key: "dateOfJoining", type: "float", required: false },
      { key: "uanNumber", type: "string", required: false },
      { key: "accountNumber", type: "string", required: false },
      { key: "ifscCode", type: "string", required: false },
      { key: "bankName", type: "string", required: false },
      { key: "paymentMode", type: "string", required: false },
      // Day columns (28 days)
      { key: "1Sun", type: "string", required: false },
      { key: "2Mon", type: "string", required: false },
      { key: "3Tue", type: "string", required: false },
      { key: "4Wed", type: "string", required: false },
      { key: "5Thu", type: "string", required: false },
      { key: "6Fri", type: "string", required: false },
      { key: "7Sat", type: "string", required: false },
      { key: "8Sun", type: "string", required: false },
      { key: "9Mon", type: "string", required: false },
      { key: "10Tue", type: "string", required: false },
      { key: "11Wed", type: "string", required: false },
      { key: "12Thu", type: "string", required: false },
      { key: "13Fri", type: "string", required: false },
      { key: "14Sat", type: "string", required: false },
      { key: "15Sun", type: "string", required: false },
      { key: "16Mon", type: "string", required: false },
      { key: "17Tue", type: "string", required: false },
      { key: "18Wed", type: "string", required: false },
      { key: "19Thu", type: "string", required: false },
      { key: "20Fri", type: "string", required: false },
      { key: "21Sat", type: "string", required: false },
      { key: "22Sun", type: "string", required: false },
      { key: "23Mon", type: "string", required: false },
      { key: "24Tue", type: "string", required: false },
      { key: "25Wed", type: "string", required: false },
      { key: "26Thu", type: "string", required: false },
      { key: "27Fri", type: "string", required: false },
      { key: "28Sat", type: "string", required: false },
      // Attendance metrics
      { key: "presentDays", type: "float", required: false },
      { key: "absentDays", type: "float", required: false },
      { key: "leaveDays", type: "float", required: false },
      { key: "halfDays", type: "float", required: false },
      { key: "weekOffDays", type: "float", required: false },
      { key: "holidayDays", type: "float", required: false },
      // Additional fields
      { key: "cl", type: "float", required: false },
      { key: "lc", type: "float", required: false },
      { key: "trp", type: "float", required: false },
      { key: "tra", type: "float", required: false },
      { key: "trl", type: "float", required: false },
      { key: "totalPresent", type: "float", required: false },
      { key: "overtime", type: "float", required: false },
      { key: "finalDays", type: "float", required: false },
      { key: "arrear", type: "float", required: false },
      { key: "advance", type: "float", required: false },
      { key: "shiftAllowance", type: "float", required: false },
      { key: "grossSalary", type: "float", required: false },
      { key: "attendanceDeduction", type: "float", required: false },
      { key: "employeeContribution", type: "float", required: false },
      { key: "employeeEsic", type: "float", required: false },
      { key: "employerContribution", type: "float", required: false },
      { key: "employerEsic", type: "float", required: false },
      { key: "tds5perc", type: "float", required: false },
      { key: "netSalary", type: "float", required: false },
      { key: "penalty", type: "float", required: false },
      { key: "paidAmount", type: "float", required: false },
    ];

    console.log(`📝 Creating ${columns.length} attributes...`);
    let created = 0;
    let skipped = 0;

    for (const col of columns) {
      try {
        if (col.type === "string") {
          await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            col.key,
            255,
            col.required
          );
        } else if (col.type === "float") {
          await databases.createFloatAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            col.key,
            col.required
          );
        }
        created++;
      } catch (e) {
        if (e.code === 409) {
          skipped++;
        } else {
          console.error(`✗ Error creating attribute ${col.key}:`, e.message);
        }
      }
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`✓ Collection initialized with ${created} attributes`);
    // No process.exit(0) — let Node drain open handles cleanly before exiting
  } catch (error) {
    console.error("✗ Failed to initialize collection");
    console.error("");
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error:", error);
    }
    process.exit(1);
  }
}

initializeCollection();
