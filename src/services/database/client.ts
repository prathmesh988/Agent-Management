import { Client, TablesDB } from "node-appwrite";

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
 * Create TablesDB instance for database operations
 * Used only on server-side operations with API key
 */
export const createTablesDBWithAuth = () => {
  const client = new Client()
    .setEndpoint(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
        "https://cloud.appwrite.io/v1",
    )
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || "");

  return new TablesDB(client);
};

// Database and table constants
export const DB_CONFIG = {
  DATABASE_ID: process.env.APPWRITE_DATABASE_ID || "6784f57b0000a70f1b79",
  EMPLOYEES_TABLE_ID: "emp_employees",
  EMPLOYEES_TABLE_NAME: "employees",
  // Certificates data comes from the same employees table
};
