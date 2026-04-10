/**
 * Service for leave requests management.
 * Each record represents one leave application from an employee.
 * Collection ID: leave_requests
 */

import { createDatabasesWithAuth, DB_CONFIG } from "./client";
import { Query } from "node-appwrite";

export const LEAVE_REQUESTS_COLLECTION_ID = "leave_requests";

export type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType = "CL" | "SL" | "PL" | "ML" | "PTL";

export interface LeaveRequest {
  $id?: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string; // ISO format
  endDate: string; // ISO format
  duration: number; // days
  reason: string;
  status: LeaveRequestStatus; // pending, approved, rejected, cancelled
  approvedBy?: string; // admin/manager name
  approvalDate?: string;
  createdAt: string;
  year: number;
}

/**
 * Ensure leave_requests collection exists.
 */
async function ensureLeaveRequestsCollectionExists(): Promise<void> {
  const databases = createDatabasesWithAuth();
  try {
    await databases.getCollection(DB_CONFIG.DATABASE_ID, LEAVE_REQUESTS_COLLECTION_ID);
    return;
  } catch (error: any) {
    if (error.code !== 404) {
      console.error("Error checking leave_requests collection:", error);
      throw error;
    }
  }

  try {
    console.log("Creating leave_requests collection...");
    await databases.createCollection(
      DB_CONFIG.DATABASE_ID,
      LEAVE_REQUESTS_COLLECTION_ID,
      "Leave Requests"
    );

    await new Promise((r) => setTimeout(r, 1000));
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // String attributes
    const stringAttrs = ["employeeId", "employeeName", "leaveType", "status", "reason", "approvedBy"];
    for (const key of stringAttrs) {
      try {
        await databases.createStringAttribute(
          DB_CONFIG.DATABASE_ID,
          LEAVE_REQUESTS_COLLECTION_ID,
          key,
          key === "reason" ? 500 : 100,
          key !== "approvedBy"
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
      }
      await delay(300);
    }

    // Integer attributes
    const intAttrs = ["duration", "year"];
    for (const key of intAttrs) {
      try {
        await databases.createIntegerAttribute(
          DB_CONFIG.DATABASE_ID,
          LEAVE_REQUESTS_COLLECTION_ID,
          key,
          true
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
      }
      await delay(300);
    }

    // DateTime attributes
    const dateAttrs = ["startDate", "endDate", "createdAt"];
    for (const key of dateAttrs) {
      try {
        await databases.createDatetimeAttribute(
          DB_CONFIG.DATABASE_ID,
          LEAVE_REQUESTS_COLLECTION_ID,
          key,
          true
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
      }
      await delay(300);
    }

    // Optional datetime
    try {
      await databases.createDatetimeAttribute(
        DB_CONFIG.DATABASE_ID,
        LEAVE_REQUESTS_COLLECTION_ID,
        "approvalDate",
        false
      );
      console.log(`  ✓ approvalDate`);
    } catch (e: any) {
      if (e.code !== 409) throw e;
    }

    // Create indexes
    await delay(5000);
    const indexes = [
      { name: "idx_employee_status", keys: ["employeeId", "status"] },
      { name: "idx_status_date", keys: ["status", "startDate"] },
      { name: "idx_year", keys: ["year"] },
    ];

    for (const idx of indexes) {
      try {
        await (databases.createIndex as any)(
          DB_CONFIG.DATABASE_ID,
          LEAVE_REQUESTS_COLLECTION_ID,
          idx.name,
          "key",
          idx.keys,
          idx.keys.map(() => "ASC")
        );
        console.log(`✓ ${idx.name} created`);
      } catch (e: any) {
        if (e.code === 409) {
          console.log(`– ${idx.name} exists`);
        } else {
          throw e;
        }
      }
      await delay(300);
    }

    console.log("✅ Leave requests collection initialized");
  } catch (error) {
    console.error("Error creating leave_requests collection:", error);
    throw error;
  }
}

/**
 * Create a new leave request.
 */
export async function createLeaveRequest(
  employeeId: string,
  employeeName: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string,
  duration: number,
  reason: string
): Promise<LeaveRequest> {
  await ensureLeaveRequestsCollectionExists();
  const databases = createDatabasesWithAuth();
  const { ID } = await import("node-appwrite");

  const now = new Date();
  const year = now.getFullYear();

  const created = await databases.createDocument({
    databaseId: DB_CONFIG.DATABASE_ID,
    collectionId: LEAVE_REQUESTS_COLLECTION_ID,
    documentId: ID.unique(),
    data: {
      employeeId,
      employeeName,
      leaveType,
      startDate,
      endDate,
      duration,
      reason,
      status: "pending",
      createdAt: now.toISOString(),
      year,
    },
  });

  return created as unknown as LeaveRequest;
}

/**
 * Get pending leave requests (for approval queue).
 */
export async function getPendingLeaveRequests(limit: number = 100): Promise<LeaveRequest[]> {
  await ensureLeaveRequestsCollectionExists();
  const databases = createDatabasesWithAuth();

  try {
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: LEAVE_REQUESTS_COLLECTION_ID,
      queries: [
        Query.equal("status", "pending"),
        Query.orderDesc("createdAt"),
        Query.limit(limit),
      ],
    });

    return result.documents as unknown as LeaveRequest[];
  } catch (error) {
    console.error("Error fetching pending leave requests:", error);
    return [];
  }
}

/**
 * Get all leave requests for an employee.
 */
export async function getEmployeeLeaveRequests(
  employeeId: string,
  limit: number = 999
): Promise<LeaveRequest[]> {
  await ensureLeaveRequestsCollectionExists();
  const databases = createDatabasesWithAuth();

  try {
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: LEAVE_REQUESTS_COLLECTION_ID,
      queries: [
        Query.equal("employeeId", employeeId),
        Query.orderDesc("startDate"),
        Query.limit(limit),
      ],
    });

    return result.documents as unknown as LeaveRequest[];
  } catch (error) {
    console.error("Error fetching employee leave requests:", error);
    return [];
  }
}

/**
 * Approve a leave request.
 */
export async function approveLeaveRequest(
  requestId: string,
  approvedBy: string
): Promise<LeaveRequest> {
  await ensureLeaveRequestsCollectionExists();
  const databases = createDatabasesWithAuth();

  const updated = await databases.updateDocument({
    databaseId: DB_CONFIG.DATABASE_ID,
    collectionId: LEAVE_REQUESTS_COLLECTION_ID,
    documentId: requestId,
    data: {
      status: "approved",
      approvedBy,
      approvalDate: new Date().toISOString(),
    },
  });

  return updated as unknown as LeaveRequest;
}

/**
 * Reject a leave request.
 */
export async function rejectLeaveRequest(
  requestId: string,
  approvedBy: string
): Promise<LeaveRequest> {
  await ensureLeaveRequestsCollectionExists();
  const databases = createDatabasesWithAuth();

  const updated = await databases.updateDocument({
    databaseId: DB_CONFIG.DATABASE_ID,
    collectionId: LEAVE_REQUESTS_COLLECTION_ID,
    documentId: requestId,
    data: {
      status: "rejected",
      approvedBy,
      approvalDate: new Date().toISOString(),
    },
  });

  return updated as unknown as LeaveRequest;
}

/**
 * Get all leave requests for a specific year.
 */
export async function getYearLeaveRequests(year: number): Promise<LeaveRequest[]> {
  await ensureLeaveRequestsCollectionExists();
  const databases = createDatabasesWithAuth();

  try {
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: LEAVE_REQUESTS_COLLECTION_ID,
      queries: [
        Query.equal("year", year),
        Query.orderDesc("startDate"),
        Query.limit(999),
      ],
    });

    return result.documents as unknown as LeaveRequest[];
  } catch (error) {
    console.error("Error fetching year leave requests:", error);
    return [];
  }
}

/**
 * Calculate days between two dates (inclusive).
 */
export function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive
  return diffDays;
}
