import { Client, Databases } from "node-appwrite";

/**
 * Initialize and export Appwrite client instance
 * Used across all database operations
 */
export const createAppwriteClient = () => {
  const client = new Client()
    .setEndpoint(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
        "https://cloud.appwrite.io/v1",
    )
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "");

  return client;
};

/**
 * Create Databases instance for database operations
 * Used only on server-side operations with API key
 */
export const createDatabasesWithAuth = () => {
  const client = new Client()
    .setEndpoint(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
        "https://cloud.appwrite.io/v1",
    )
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || "");

  return new Databases(client);
};

// Database and table constants
export const DB_CONFIG = {
  DATABASE_ID: process.env.APPWRITE_DATABASE_ID || "",
  EMPLOYEES_COLLECTION_ID: process.env.APPWRITE_COLLECTION_ID || "bob_the_builderSlink",
  EMPLOYEES_COLLECTION_NAME: process.env.APPWRITE_COLLECTION_NAME || "bob_the_builderSlink",
  INCENTIVE_COLLECTION_ID: process.env.APPWRITE_INCENTIVE_COLLECTION_ID || "incentive",
  // Certificates data comes from the same employees table
};
