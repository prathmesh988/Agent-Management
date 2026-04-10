/**
 * Service for employee leave balance tracking.
 * Each record tracks annual leave entitlements and usage for an employee in a given year.
 * Collection ID: leave_balance
 */

import { createDatabasesWithAuth, DB_CONFIG } from "./client";
import { Query } from "node-appwrite";

export const LEAVE_BALANCE_COLLECTION_ID = "leave_balance";

export interface LeaveBalance {
  $id?: string;
  employeeId: string;
  year: number;

  // Leave entitlements (annual allocation)
  casualLeave: number; // CL - casual leave
  sickLeave: number; // SL - sick leave
  privilegeLeave: number; // PL - privilege/personal leave
  maternityLeave: number; // ML - maternity leave
  paternityLeave: number; // PTL - paternity leave

  // Leave usage (consumed)
  casualLeaveTaken: number;
  sickLeaveTaken: number;
  privilegeLeaveTaken: number;
  maternityLeaveTaken: number;
  paternityLeaveTaken: number;

  // Carry-forward from previous year
  casualLeaveCarryForward: number;
  privilegeLeaveCarryForward: number;

  updatedAt: string;
}

export type LeaveType = "CL" | "SL" | "PL" | "ML" | "PTL";

const LEAVE_TYPE_FIELDS: Record<LeaveType, { balance: keyof LeaveBalance; taken: keyof LeaveBalance }> = {
  CL: { balance: "casualLeave", taken: "casualLeaveTaken" },
  SL: { balance: "sickLeave", taken: "sickLeaveTaken" },
  PL: { balance: "privilegeLeave", taken: "privilegeLeaveTaken" },
  ML: { balance: "maternityLeave", taken: "maternityLeaveTaken" },
  PTL: { balance: "paternityLeave", taken: "paternityLeaveTaken" },
};

/**
 * Ensure leave_balance collection exists.
 */
async function ensureLeaveBalanceCollectionExists(): Promise<void> {
  const databases = createDatabasesWithAuth();
  try {
    await databases.getCollection(DB_CONFIG.DATABASE_ID, LEAVE_BALANCE_COLLECTION_ID);
    return;
  } catch (error: any) {
    if (error.code !== 404) {
      console.error("Error checking leave_balance collection:", error);
      throw error;
    }
  }

  try {
    console.log("Creating leave_balance collection...");
    await databases.createCollection(
      DB_CONFIG.DATABASE_ID,
      LEAVE_BALANCE_COLLECTION_ID,
      "Leave Balance"
    );

    await new Promise((r) => setTimeout(r, 1000));
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // String attributes
    const stringAttrs = ["employeeId"];
    for (const key of stringAttrs) {
      try {
        await databases.createStringAttribute(
          DB_CONFIG.DATABASE_ID,
          LEAVE_BALANCE_COLLECTION_ID,
          key,
          50,
          true
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
      }
      await delay(300);
    }

    // Integer attributes
    const intAttrs = [
      "year",
      "casualLeave",
      "sickLeave",
      "privilegeLeave",
      "maternityLeave",
      "paternityLeave",
      "casualLeaveTaken",
      "sickLeaveTaken",
      "privilegeLeaveTaken",
      "maternityLeaveTaken",
      "paternityLeaveTaken",
      "casualLeaveCarryForward",
      "privilegeLeaveCarryForward",
    ];
    for (const key of intAttrs) {
      try {
        await databases.createIntegerAttribute(
          DB_CONFIG.DATABASE_ID,
          LEAVE_BALANCE_COLLECTION_ID,
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
    try {
      await databases.createDatetimeAttribute(
        DB_CONFIG.DATABASE_ID,
        LEAVE_BALANCE_COLLECTION_ID,
        "updatedAt",
        true
      );
      console.log(`  ✓ updatedAt`);
    } catch (e: any) {
      if (e.code !== 409) throw e;
    }

    // Create index
    await delay(5000);
    try {
      await (databases.createIndex as any)(
        DB_CONFIG.DATABASE_ID,
        LEAVE_BALANCE_COLLECTION_ID,
        "idx_employee_year",
        "key",
        ["employeeId", "year"],
        ["ASC", "ASC"]
      );
      console.log("✓ Index created");
    } catch (e: any) {
      if (e.code === 409) {
        console.log("– Index already exists");
      } else {
        throw e;
      }
    }

    console.log("✅ Leave balance collection initialized");
  } catch (error) {
    console.error("Error creating leave_balance collection:", error);
    throw error;
  }
}

/**
 * Get or create leave balance for an employee in a given year.
 */
export async function getOrCreateLeaveBalance(
  employeeId: string,
  year: number,
  defaultCL: number = 12,
  defaultSL: number = 10,
  defaultPL: number = 15
): Promise<LeaveBalance> {
  await ensureLeaveBalanceCollectionExists();
  const databases = createDatabasesWithAuth();

  try {
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: LEAVE_BALANCE_COLLECTION_ID,
      queries: [
        Query.equal("employeeId", employeeId),
        Query.equal("year", year),
      ],
    });

    if (result.total > 0) {
      return result.documents[0] as unknown as LeaveBalance;
    }

    // Create new balance
    const { ID } = await import("node-appwrite");
    const created = await databases.createDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: LEAVE_BALANCE_COLLECTION_ID,
      documentId: ID.unique(),
      data: {
        employeeId,
        year,
        casualLeave: defaultCL,
        sickLeave: defaultSL,
        privilegeLeave: defaultPL,
        maternityLeave: 180,
        paternityLeave: 5,
        casualLeaveTaken: 0,
        sickLeaveTaken: 0,
        privilegeLeaveTaken: 0,
        maternityLeaveTaken: 0,
        paternityLeaveTaken: 0,
        casualLeaveCarryForward: 0,
        privilegeLeaveCarryForward: 0,
        updatedAt: new Date().toISOString(),
      },
    });

    return created as unknown as LeaveBalance;
  } catch (error) {
    console.error("Error getting/creating leave balance:", error);
    throw error;
  }
}

/**
 * Get available balance for a specific leave type.
 */
export async function getAvailableBalance(
  employeeId: string,
  year: number,
  leaveType: LeaveType
): Promise<number> {
  const balance = await getOrCreateLeaveBalance(employeeId, year);
  const fields = LEAVE_TYPE_FIELDS[leaveType];

  const total = (balance[fields.balance] as number) || 0;
  const taken = (balance[fields.taken] as number) || 0;

  return Math.max(0, total - taken);
}

/**
 * Update leave taken count.
 */
export async function updateLeaveTaken(
  employeeId: string,
  year: number,
  leaveType: LeaveType,
  daysToAdd: number
): Promise<LeaveBalance> {
  await ensureLeaveBalanceCollectionExists();
  const databases = createDatabasesWithAuth();
  const balance = await getOrCreateLeaveBalance(employeeId, year);

  if (!balance.$id) throw new Error("Invalid leave balance record");

  const fields = LEAVE_TYPE_FIELDS[leaveType];
  const currentTaken = (balance[fields.taken] as number) || 0;

  const updateData = {
    [fields.taken]: currentTaken + daysToAdd,
    updatedAt: new Date().toISOString(),
  };

  const updated = await databases.updateDocument({
    databaseId: DB_CONFIG.DATABASE_ID,
    collectionId: LEAVE_BALANCE_COLLECTION_ID,
    documentId: balance.$id,
    data: updateData,
  });

  return updated as unknown as LeaveBalance;
}

/**
 * Get employee leave balances.
 */
export async function getEmployeeLeaveBalances(
  employeeId: string,
  year: number
): Promise<LeaveBalance> {
  return getOrCreateLeaveBalance(employeeId, year);
}

/**
 * Get leave summary for all employees in a year.
 */
export async function getYearLeaveReport(year: number): Promise<LeaveBalance[]> {
  await ensureLeaveBalanceCollectionExists();
  const databases = createDatabasesWithAuth();

  try {
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: LEAVE_BALANCE_COLLECTION_ID,
      queries: [
        Query.equal("year", year),
        Query.limit(999),
      ],
    });

    return result.documents as unknown as LeaveBalance[];
  } catch (error) {
    console.error("Error fetching year leave report:", error);
    return [];
  }
}
