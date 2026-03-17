import { createDatabasesWithAuth, DB_CONFIG } from "./client";
import { Query } from "node-appwrite";
import { Certificate } from "@/lib/types";

/**
 * Fetch a single certificate by ID
 */
export async function fetchCertificate(
  certificateId: string,
): Promise<Certificate | null> {
  try {
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [Query.equal("certificateId", certificateId)],
    });

    if (response.documents && response.documents.length > 0) {
      return response.documents[0] as Certificate;
    }
    return null;
  } catch (error) {
    console.error("Error fetching certificate:", error);
    throw error;
  }
}

/**
 * Fetch all certificates with optional pagination and filtering
 * Default limit is 5000 to support large bulk imports
 */
export async function fetchAllCertificates(
  limit: number = 5000,
  offset: number = 0,
  queries: string[] = [],
): Promise<{ certificates: Certificate[]; total: number }> {
  try {
    const databases = createDatabasesWithAuth();
    // Appwrite has a max limit of 100 per query, so paginate through results
    const actualLimit = Math.min(limit, 100);
    const paginatedQueries = [
      Query.limit(actualLimit),
      Query.offset(offset),
      ...queries,
    ];
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: paginatedQueries,
    });

    return {
      certificates: response.documents as Certificate[],
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [
        Query.or([
          Query.search("certificateId", searchTerm),
          Query.search("employeeName", searchTerm),
        ]),
      ],
    });

    return response.documents as Certificate[];
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [Query.equal("employeeName", employeeName)],
    });

    return response.documents as Certificate[];
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [Query.limit(1)],
    });

    return response.total;
  } catch (error) {
    console.error("Error getting certificate count:", error);
    throw error;
  }
}
