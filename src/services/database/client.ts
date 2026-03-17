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
  DATABASE_ID: process.env.APPWRITE_DATABASE_ID || "69b7ec04003c8a35a2d8",
  EMPLOYEES_COLLECTION_ID: "rydr_db",
  EMPLOYEES_COLLECTION_NAME: "rydr_db",
  // Certificates data comes from the same employees table
};
