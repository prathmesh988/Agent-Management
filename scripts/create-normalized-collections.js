#!/usr/bin/env node
/**
 * Migration: Create normalized collections for 3NF architecture.
 * Run once: node scripts/create-normalized-collections.js
 */

require("dotenv").config({ path: ".env.local" });
const { Client, Databases } = require("node-appwrite");

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "69b7ec04003c8a35a2d8";
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_PROJECT_ID_API_SECRET;

const collectionsToCreate = [
  {
    id: process.env.APPWRITE_BANK_COLLECTION_ID || "employee_bank_details",
    name: "Employee Bank Details",
    schema: {
      "employeeId": { type: "string", size: 255, required: true },
      "accountNumber": { type: "string", size: 255, required: false },
      "ifscCode": { type: "string", size: 255, required: false },
      "bankName": { type: "string", size: 255, required: false },
      "paymentMode": { type: "string", size: 255, required: false },
    },
    indexes: [{ name: "idx_empId", type: "key", attributes: ["employeeId"] }],
  },
  {
    id: process.env.APPWRITE_PAYROLL_COLLECTION_ID || "monthly_payroll",
    name: "Monthly Payroll Records",
    schema: {
      "employeeId": { type: "string", size: 255, required: true },
      "month": { type: "integer", required: true },
      "year": { type: "integer", required: true },
      "ctc": { type: "float", required: false },
      "department": { type: "string", size: 255, required: false },
      "designation": { type: "string", size: 255, required: false },
      // Monthly allowances & deductions
      "attendanceAllowance": { type: "float", required: false },
      "overtime": { type: "float", required: false },
      "arrear": { type: "float", required: false },
      "advance": { type: "float", required: false },
      "shiftAllowance": { type: "float", required: false },
      "grossSalary": { type: "float", required: false },
      "attendanceDeduction": { type: "float", required: false },
      "employeeContribution": { type: "float", required: false },
      "employeeEsic": { type: "float", required: false },
      "employerContribution": { type: "float", required: false },
      "employerEsic": { type: "float", required: false },
      "tds5perc": { type: "float", required: false },
      "netSalary": { type: "float", required: false },
      "penalty": { type: "float", required: false },
      "paidAmount": { type: "float", required: false },
      // Attendance Stats
      "presentDays": { type: "float", required: false },
      "absentDays": { type: "float", required: false },
      "leaveDays": { type: "float", required: false },
      "halfDays": { type: "float", required: false },
      "weekOffDays": { type: "float", required: false },
      "holidayDays": { type: "float", required: false },
      "cl": { type: "float", required: false },
      "lc": { type: "float", required: false },
      "trp": { type: "float", required: false },
      "tra": { type: "float", required: false },
      "trl": { type: "float", required: false },
      "totalPresent": { type: "float", required: false },
      "finalDays": { type: "float", required: false },
    },
    indexes: [
      { name: "idx_emp_month_year", type: "key", attributes: ["employeeId", "month", "year"] }
    ],
  }
];

async function run() {
  if (!PROJECT_ID || !API_KEY) {
    console.error("✗ Missing env vars");
    process.exit(1);
  }

  const databases = new Databases(
    new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY),
  );

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const coll of collectionsToCreate) {
    console.log(`\n──────────────────────────────────────`);
    console.log(`Setting up collection: ${coll.name} (${coll.id})`);
    
    try {
      await databases.getCollection(DATABASE_ID, coll.id);
      console.log(`– Collection already exists`);
    } catch (e) {
      if (e.code === 404) {
        await databases.createCollection(DATABASE_ID, coll.id, coll.name);
        console.log(`✓ Collection created`);
      } else throw e;
    }
    
    await delay(1000);

    for (const [key, props] of Object.entries(coll.schema)) {
      try {
        if (props.type === "string") {
          await databases.createStringAttribute(DATABASE_ID, coll.id, key, props.size, props.required);
        } else if (props.type === "integer") {
          await databases.createIntegerAttribute(DATABASE_ID, coll.id, key, props.required);
        } else if (props.type === "float") {
          await databases.createFloatAttribute(DATABASE_ID, coll.id, key, props.required);
        }
        console.log(`  ✓ Attribute: ${key}`);
      } catch (e) {
        if (e.code !== 409) console.error(`  ✗ ${key}:`, e.message);
        else console.log(`  – ${key} exists`);
      }
      await delay(400);
    }
    
    console.log(`Waiting for attributes to propagate before indexes...`);
    await delay(4000);

    for (const index of coll.indexes) {
      try {
        await databases.createIndex(
            DATABASE_ID, coll.id, index.name, index.type, index.attributes
        );
        console.log(`  ✓ Index: ${index.name}`);
      } catch (e) {
        if (e.code === 409) console.log(`  – Index ${index.name} exists`);
        else console.error(`  ✗ Index error:`, e.message);
      }
    }
  }

  console.log("\n✅ Normalization Initialization Done!");
}

run();
