import { Client, Databases, ID } from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "69b7ec04003c8a35a2d8";
const COLLECTION_NAME = process.env.APPWRITE_COLLECTION_NAME || "rydr_db";
const COLLECTION_ID = process.env.APPWRITE_COLLECTION_ID || "rydr_db";

/**
 * Initialize the employees table with all required columns
 * Run this script once to set up the database schema
 */
export async function initializeEmployeesTable() {
  const client = new Client()
    .setEndpoint(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
        "https://cloud.appwrite.io/v1",
    )
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || "");

  const databases = new Databases(client);

  try {
    // Check if table already exists
    let collectionExists = false;
    try {
      const collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
      console.log("✓ Table already exists, checking for missing attributes...");
      collectionExists = true;
    } catch (err) {
      // Table doesn't exist, create it
      console.log("Creating new table...");
    }

    // Create the collection if it doesn't exist
    let collection;
    if (!collectionExists) {
      collection = await databases.createCollection(
        DATABASE_ID,
        COLLECTION_ID,
        COLLECTION_NAME
      );
    }

    // Define columns with proper Appwrite format
    const columns: Array<{key: string, type: "string" | "double" | "integer", size?: number, required: boolean}> = [
﻿      { key: "sno", type: "double" as const, required: false },
      { key: "employeeId", type: "string" as const, required: true },
      { key: "name", type: "string" as const, required: true },
      { key: "ctc", type: "double" as const, required: false },
      { key: "attendanceAllowance", type: "double" as const, required: false },
      { key: "process", type: "string" as const, required: false },
      { key: "designation", type: "string" as const, required: false },
      { key: "dateOfJoining", type: "double" as const, required: false },
      { key: "uanNumber", type: "string" as const, required: false },
      { key: "accountNumber", type: "string" as const, required: false },
      { key: "ifscCode", type: "string" as const, required: false },
      { key: "bankName", type: "string" as const, required: false },
      { key: "paymentMode", type: "string" as const, required: false },
      { key: "1Sun", type: "string" as const, required: false },
      { key: "2Mon", type: "string" as const, required: false },
      { key: "3Tue", type: "string" as const, required: false },
      { key: "4Wed", type: "string" as const, required: false },
      { key: "5Thu", type: "string" as const, required: false },
      { key: "6Fri", type: "string" as const, required: false },
      { key: "7Sat", type: "string" as const, required: false },
      { key: "8Sun", type: "string" as const, required: false },
      { key: "9Mon", type: "string" as const, required: false },
      { key: "10Tue", type: "string" as const, required: false },
      { key: "11Wed", type: "string" as const, required: false },
      { key: "12Thu", type: "string" as const, required: false },
      { key: "13Fri", type: "string" as const, required: false },
      { key: "14Sat", type: "string" as const, required: false },
      { key: "15Sun", type: "string" as const, required: false },
      { key: "16Mon", type: "string" as const, required: false },
      { key: "17Tue", type: "string" as const, required: false },
      { key: "18Wed", type: "string" as const, required: false },
      { key: "19Thu", type: "string" as const, required: false },
      { key: "20Fri", type: "string" as const, required: false },
      { key: "21Sat", type: "string" as const, required: false },
      { key: "22Sun", type: "string" as const, required: false },
      { key: "23Mon", type: "string" as const, required: false },
      { key: "24Tue", type: "string" as const, required: false },
      { key: "25Wed", type: "string" as const, required: false },
      { key: "26Thu", type: "string" as const, required: false },
      { key: "27Fri", type: "string" as const, required: false },
      { key: "28Sat", type: "string" as const, required: false },
      { key: "presentDays", type: "double" as const, required: false },
      { key: "absentDays", type: "double" as const, required: false },
      { key: "leaveDays", type: "double" as const, required: false },
      { key: "halfDays", type: "double" as const, required: false },
      { key: "weekOffDays", type: "double" as const, required: false },
      { key: "holidayDays", type: "double" as const, required: false },
      { key: "cl", type: "double" as const, required: false },
      { key: "lc", type: "double" as const, required: false },
      { key: "trp", type: "double" as const, required: false },
      { key: "tra", type: "double" as const, required: false },
      { key: "trl", type: "double" as const, required: false },
      { key: "totalPresent", type: "double" as const, required: false },
      { key: "overtime", type: "double" as const, required: false },
      { key: "finalDays", type: "double" as const, required: false },
      { key: "arrear", type: "double" as const, required: false },
      { key: "advance", type: "double" as const, required: false },
      { key: "shiftAllowance", type: "double" as const, required: false },
      { key: "grossSalary", type: "double" as const, required: false },
      { key: "attendanceDeduction", type: "double" as const, required: false },
      { key: "employeeContribution", type: "double" as const, required: false },
      { key: "employeeEsic", type: "double" as const, required: false },
      { key: "employerContribution", type: "double" as const, required: false },
      { key: "employerEsic", type: "double" as const, required: false },
      { key: "tds5perc", type: "double" as const, required: false },
      { key: "netSalary", type: "double" as const, required: false },
      { key: "penalty", type: "double" as const, required: false },
      { key: "paidAmount", type: "double" as const, required: false },
      { key: "email",  type: "string" as const, size: 255, required: false },
      { key: "status", type: "string" as const, size: 32,  required: false },
    ];

    for (const col of columns) {
      try {
        if (col.type === "string") {
          await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, col.key, col.size || 255, col.required);
          console.log(`✓ Created attribute: ${col.key}`);
        } else if (col.type === ("integer" as any) || col.type === ("number" as any)) { // Fallback 
          await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, col.key, col.required);
          console.log(`✓ Created attribute: ${col.key}`);
        } else if (col.type === "double") {
          await databases.createFloatAttribute(DATABASE_ID, COLLECTION_ID, col.key, col.required);
          console.log(`✓ Created attribute: ${col.key}`);
        }
      } catch (e: any) {
        if (e.code === 409) { 
          console.log(`⊘ Attribute already exists: ${col.key}`);
        } else {
          console.error(`Error creating attribute ${col.key}:`, e.message);
        }
      }
      // Wait slightly between schema updates
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log("✓ Table/Attributes initialized successfully");
    return { success: true, message: "Table and attributes initialized", collection };
  } catch (error) {
    console.error("✗ Error initializing table:", error);
    throw error;
  }
}

/**
 * Check if the employees table exists
 */
export async function tableExists(): Promise<boolean> {
  const client = new Client()
    .setEndpoint(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
        "https://cloud.appwrite.io/v1",
    )
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || "");

  const databases = new Databases(client);

  try {
    await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    return true;
  } catch (error) {
    return false;
  }
}

export { DATABASE_ID, COLLECTION_ID, COLLECTION_NAME };
