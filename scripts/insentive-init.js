require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require("node-appwrite");

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "69b7ec04003c8a35a2d8";
const COLLECTION_NAME = "Incentive & Bonuses";
const COLLECTION_ID = "incentive";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_PROJECT_ID_API_SECRET;

async function initInsentiveCollection() {
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
    try {
      await databases.getCollection(DATABASE_ID, COLLECTION_ID);
      console.log(`✓ Collection '${COLLECTION_NAME}' already exists`);
    } catch (err) {
      if (err.code === 404) {
        console.log(`📋 Collection '${COLLECTION_NAME}' does not exist, creating now...`);
        await databases.createCollection(
          DATABASE_ID,
          COLLECTION_ID,
          COLLECTION_NAME
        );
      } else {
        throw err;
      }
    }

    const fields = [
      { key: "employeeId", type: "string", required: true },
      { key: "month", type: "string", required: true },
      { key: "incentiveAmount", type: "number", required: false },
      { key: "performanceBonus", type: "number", required: false },
      { key: "referralBonus", type: "number", required: false },
      { key: "festivalBonus", type: "number", required: false },
      { key: "retentionBonus", type: "number", required: false },
      { key: "totalIncentive", type: "number", required: false },
    ];

    console.log(`📝 Creating ${fields.length} attributes...`);
    let created = 0;
    let skipped = 0;

    for (const field of fields) {
      try {
        if (field.type === "string") {
          await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            field.key,
            255,
            field.required
          );
        } else if (field.type === "number") {
          await databases.createFloatAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            field.key,
            field.required
          );
        }
        created++;
      } catch (e) {
        if (e.code === 409) {
          skipped++;
        } else {
          console.error(`✗ Error creating attribute ${field.key}:`, e.message);
        }
      }
      // Small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`✓ Collection initialized with ${created} attributes, skipped ${skipped} existing attributes`);
  } catch (error) {
    console.error("✗ Failed to initialize collection");
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error:", error);
    }
    process.exit(1);
  }
}

initInsentiveCollection();