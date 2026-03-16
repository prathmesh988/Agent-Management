import { createTablesDBWithAuth, DB_CONFIG } from "./client";
import { Query } from "node-appwrite";
import { Certificate } from "@/lib/types";

/**
 * Fetch a single certificate by ID
 */
export async function fetchCertificate(
  certificateId: string,
): Promise<Certificate | null> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.equal("certificateId", certificateId)],
    });

    if (response.rows && response.rows.length > 0) {
      return response.rows[0] as Certificate;
    }
    return null;
  } catch (error) {
    console.error("Error fetching certificate:", error);
    throw error;
  }
}

/**
 * Fetch all certificates with optional pagination and filtering
 */
export async function fetchAllCertificates(
  limit: number = 100,
  offset: number = 0,
  queries: string[] = [],
): Promise<{ certificates: Certificate[]; total: number }> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const paginatedQueries = [
      Query.limit(limit),
      Query.offset(offset),
      ...queries,
    ];
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: paginatedQueries,
    });

    return {
      certificates: response.rows as Certificate[],
      total: response.total,
    };
  } catch (error) {
    console.error("Error fetching all certificates:", error);
    throw error;
  }
}

/**
 * Search certificates by employee name or certificate ID
 */
export async function searchCertificates(
  searchTerm: string,
): Promise<Certificate[]> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [
        Query.or([
          Query.search("certificateId", searchTerm),
          Query.search("employeeName", searchTerm),
        ]),
      ],
    });

    return response.rows as Certificate[];
  } catch (error) {
    console.error("Error searching certificates:", error);
    throw error;
  }
}

/**
 * Fetch certificates by employee name
 */
export async function fetchCertificatesByEmployee(
  employeeName: string,
): Promise<Certificate[]> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.equal("employeeName", employeeName)],
    });

    return response.rows as Certificate[];
  } catch (error) {
    console.error("Error fetching certificates by employee:", error);
    throw error;
  }
}

/**
 * Get certificate count
 */
export async function getCertificateCount(): Promise<number> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.limit(1)],
    });

    return response.total;
  } catch (error) {
    console.error("Error getting certificate count:", error);
    throw error;
  }
}
