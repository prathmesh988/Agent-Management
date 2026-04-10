#!/usr/bin/env node

/**
 * Initialize Settings Collection
 * This script creates the settings collection in Appwrite if it doesn't exist.
 */

require('dotenv').config({ path: '.env.local' });
const { Client, Databases, ID } = require("node-appwrite");

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "69b7ec04003c8a35a2d8";
const COLLECTION_NAME = "settings";
const COLLECTION_ID = "settings";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
// Use fra.cloud.appwrite.io if that's what the other script uses, but let's fall back to process.env
const FINAL_ENDPOINT = ENDPOINT.includes("fra.cloud") ? ENDPOINT : "https://fra.cloud.appwrite.io/v1";

const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_PROJECT_ID_API_SECRET;

async function initializeSettingsCollection() {
  if (!PROJECT_ID || !API_KEY) {
    console.error("✗ Missing required environment variables:");
    console.error("  - NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    console.error("  - APPWRITE_PROJECT_ID_API_SECRET");
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(FINAL_ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const databases = new Databases(client);

  try {
    // Check if collection already exists
    try {
      await databases.getCollection(DATABASE_ID, COLLECTION_ID);
      console.log("✓ Settings collection already exists.");
    } catch (err) {
      if (err.code !== 404) throw err;
      
      console.log("📋 Settings collection does not exist, creating now...");
      await databases.createCollection(
        DATABASE_ID,
        COLLECTION_ID,
        COLLECTION_NAME
      );
    }

    // Define columns
    const columns = [
      { key: "companyName", type: "string", required: true },
      { key: "companyEmail", type: "string", required: true },
      { key: "supportEmail", type: "string", required: true },
    ];

    console.log(`📝 Creating ${columns.length} attributes...`);
    let created = 0;
    let skipped = 0;

    for (const col of columns) {
      try {
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          col.key,
          255,
          col.required
        );
        created++;
      } catch (e) {
        if (e.code === 409) {
          skipped++;
        } else {
          console.error(`✗ Error creating attribute ${col.key}:`, e.message);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`✓ Collection initialized with ${created} attributes created, ${skipped} skipped.`);
    
    // Create initial document if there are 0 documents
    try {
      const docs = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      if (docs.total === 0) {
        // We have to wait for attributes to be ready before creating a document 
        // Appwrite attributes take a bit of time to become active
        if (created > 0) {
            console.log("Waiting 3 seconds for attributes to be active before creating initial document...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        await databases.createDocument(
          DATABASE_ID, 
          COLLECTION_ID, 
          ID.unique(), 
          {
            companyName: "Your Company Name",
            companyEmail: "admin@company.com",
            supportEmail: "support@company.com"
          }
        );
        console.log("✓ Initial settings document created.");
      } else {
        console.log("✓ Settings document already exists.");
      }
    } catch (e) {
      console.error("✗ Error creating initial document:", e.message);
    }
    
  } catch (error) {
    console.error("✗ Failed to initialize settings collection");
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error:", error);
    }
    process.exit(1);
  }
}

initializeSettingsCollection();
