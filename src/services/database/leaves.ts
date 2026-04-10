import { createDatabasesWithAuth, DB_CONFIG } from "./client";
import { Query, ID } from "node-appwrite";
import { LeaveRequest, LeaveStatus } from "@/lib/types";

/**
 * Fetch all leave requests with optional pagination
 */
export async function fetchAllLeaves(
  limit: number = 100,
  offset: number = 0,
  queries: string[] = [],
): Promise<{ leaves: LeaveRequest[]; total: number }> {
  try {
    const databases = createDatabasesWithAuth();
    const actualLimit = Math.min(limit, 100);
    const paginatedQueries = [
      Query.limit(actualLimit),
      Query.offset(offset),
      Query.orderDesc("$createdAt"),
      ...queries,
    ];

    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
      queries: paginatedQueries,
    });

    const leaves = response.documents.map((doc: any) => ({
      ...doc,
      id: doc.$id,
    })) as LeaveRequest[];

    return { leaves, total: response.total };
  } catch (error) {
    console.error("Error fetching leaves:", error);
    throw error;
  }
}

/**
 * Fetch all leaves paginated (handles >100 records)
 */
export async function fetchAllLeavesPaginated(
  queries: string[] = [],
): Promise<LeaveRequest[]> {
  try {
    const databases = createDatabasesWithAuth();
    const allLeaves: LeaveRequest[] = [];
    const pageSize = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const paginatedQueries = [
        Query.limit(pageSize),
        Query.offset(offset),
        Query.orderDesc("$createdAt"),
        ...queries,
      ];

      const response = await databases.listDocuments({
        databaseId: DB_CONFIG.DATABASE_ID,
        collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
        queries: paginatedQueries,
      });

      const mapped = response.documents.map((doc: any) => ({
        ...doc,
        id: doc.$id,
      })) as LeaveRequest[];

      allLeaves.push(...mapped);
      offset += pageSize;
      hasMore = allLeaves.length < response.total;
    }

    return allLeaves;
  } catch (error) {
    console.error("Error fetching all leaves paginated:", error);
    throw error;
  }
}

/**
 * Fetch leaves filtered by status
 */
export async function fetchLeavesByStatus(
  status: LeaveStatus,
): Promise<LeaveRequest[]> {
  try {
    const databases = createDatabasesWithAuth();
    const allLeaves: LeaveRequest[] = [];
    const pageSize = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await databases.listDocuments({
        databaseId: DB_CONFIG.DATABASE_ID,
        collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
        queries: [
          Query.equal("status", status),
          Query.orderDesc("$createdAt"),
          Query.limit(pageSize),
          Query.offset(offset),
        ],
      });

      const mapped = response.documents.map((doc: any) => ({
        ...doc,
        id: doc.$id,
      })) as LeaveRequest[];

      allLeaves.push(...mapped);
      offset += pageSize;
      hasMore = allLeaves.length < response.total;
    }

    return allLeaves;
  } catch (error) {
    console.error(`Error fetching ${status} leaves:`, error);
    throw error;
  }
}

/**
 * Fetch leaves for a specific employee
 */
export async function fetchLeavesByEmployee(
  employeeId: string,
): Promise<LeaveRequest[]> {
  try {
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
      queries: [
        Query.equal("employeeId", employeeId),
        Query.orderDesc("$createdAt"),
      ],
    });

    return response.documents.map((doc: any) => ({
      ...doc,
      id: doc.$id,
    })) as LeaveRequest[];
  } catch (error) {
    console.error("Error fetching leaves by employee:", error);
    throw error;
  }
}

/**
 * Create a new leave request
 */
export async function createLeaveRequest(
  data: Omit<LeaveRequest, "$id" | "id">,
): Promise<LeaveRequest> {
  try {
    const databases = createDatabasesWithAuth();
    const response = await databases.createDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
      documentId: ID.unique(),
      data: {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        reason: data.reason || "",
        status: data.status || "pending",
        appliedOn: data.appliedOn || new Date().toISOString(),
        reviewedBy: data.reviewedBy || "",
        reviewedOn: data.reviewedOn || "",
        remarks: data.remarks || "",
        attachmentIds: data.attachmentIds || "",
      },
    });

    return { ...response, id: response.$id } as unknown as LeaveRequest;
  } catch (error) {
    console.error("Error creating leave request:", error);
    throw error;
  }
}

/**
 * Update leave request status (approve/reject)
 */
export async function updateLeaveStatus(
  documentId: string,
  status: LeaveStatus,
  reviewedBy: string,
  remarks?: string,
): Promise<LeaveRequest> {
  try {
    const databases = createDatabasesWithAuth();
    const response = await databases.updateDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
      documentId,
      data: {
        status,
        reviewedBy,
        reviewedOn: new Date().toISOString(),
        remarks: remarks || "",
      },
    });

    return { ...response, id: response.$id } as unknown as LeaveRequest;
  } catch (error) {
    console.error("Error updating leave status:", error);
    throw error;
  }
}

/**
 * Delete a leave request
 */
export async function deleteLeaveRequest(documentId: string): Promise<void> {
  try {
    const databases = createDatabasesWithAuth();
    await databases.deleteDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
      documentId,
    });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    throw error;
  }
}

/**
 * Get leave count by status
 */
export async function getLeaveCountByStatus(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> {
  try {
    const databases = createDatabasesWithAuth();

    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      databases.listDocuments({
        databaseId: DB_CONFIG.DATABASE_ID,
        collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
        queries: [Query.equal("status", "pending"), Query.limit(1)],
      }),
      databases.listDocuments({
        databaseId: DB_CONFIG.DATABASE_ID,
        collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
        queries: [Query.equal("status", "approved"), Query.limit(1)],
      }),
      databases.listDocuments({
        databaseId: DB_CONFIG.DATABASE_ID,
        collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
        queries: [Query.equal("status", "rejected"), Query.limit(1)],
      }),
    ]);

    return {
      pending: pendingRes.total,
      approved: approvedRes.total,
      rejected: rejectedRes.total,
      total: pendingRes.total + approvedRes.total + rejectedRes.total,
    };
  } catch (error) {
    console.error("Error getting leave counts:", error);
    throw error;
  }
}

/**
 * Search leaves by employee name
 */
export async function searchLeaves(
  searchTerm: string,
): Promise<LeaveRequest[]> {
  try {
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.LEAVE_COLLECTION_ID,
      queries: [
        Query.contains("employeeName", searchTerm),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ],
    });

    return response.documents.map((doc: any) => ({
      ...doc,
      id: doc.$id,
    })) as LeaveRequest[];
  } catch (error) {
    console.error("Error searching leaves:", error);
    throw error;
  }
}
