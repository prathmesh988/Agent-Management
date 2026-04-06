/**
 * Service for per-month payroll data.
 * Each document tracks payroll for one employee for one calendar month.
 * Collection ID: monthly_payroll
 * Schema: { employeeId, year, month, presentDays, absentDays, leaveDays, ..., status }
 */

import { createDatabasesWithAuth, DB_CONFIG } from "./client";
import { Query } from "node-appwrite";

export const MONTHLY_PAYROLL_COLLECTION_ID = "monthly_payroll2";

export interface MonthlyPayrollRecord {
  $id?: string;
  employeeId: string;
  year: number;
  month: number; // 1–12

  // Attendance summary
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  totalWorkingDays: number;

  // Salary calculation (stored as strings for Appwrite)
  grossSalary: string;
  perDayRate: string;
  deductedAmount: string;
  tdsDeducted: string;
  netSalary: string;

  // Metadata
  status: "draft" | "approved" | "processed"; // draft, approved, processed
  createdAt: string;
  approvedAt?: string;
  processedAt?: string;
}

/**
 * Ensure monthly_payroll collection exists, creating it if necessary.
 */
async function ensureMonthlyPayrollCollectionExists(): Promise<void> {
  const databases = createDatabasesWithAuth();
  try {
    await databases.getCollection(
      DB_CONFIG.DATABASE_ID,
      MONTHLY_PAYROLL_COLLECTION_ID
    );
    return;
  } catch (error: any) {
    if (error.code !== 404) {
      console.error("Error checking monthly payroll collection:", error);
      throw error;
    }
    console.log("Creating monthly_payroll collection...");
  }

  try {
    await databases.createCollection(
      DB_CONFIG.DATABASE_ID,
      MONTHLY_PAYROLL_COLLECTION_ID,
      "Monthly Payroll"
    );
    console.log("✓ Collection created");

    await new Promise((r) => setTimeout(r, 1000));

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // String attributes
    const stringAttrs = ["employeeId", "status"];
    for (const key of stringAttrs) {
      try {
        await databases.createStringAttribute(
          DB_CONFIG.DATABASE_ID,
          MONTHLY_PAYROLL_COLLECTION_ID,
          key,
          50,
          true // required
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
        console.log(`  – ${key} exists`);
      }
      await delay(300);
    }

    // Integer attributes
    const intAttrs = [
      "year",
      "month",
      "presentDays",
      "absentDays",
      "leaveDays",
      "holidayDays",
      "weeklyOffDays",
      "totalWorkingDays",
    ];
    for (const key of intAttrs) {
      try {
        await databases.createIntegerAttribute(
          DB_CONFIG.DATABASE_ID,
          MONTHLY_PAYROLL_COLLECTION_ID,
          key,
          true // required
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
        console.log(`  – ${key} exists`);
      }
      await delay(300);
    }

    // String attributes for salary fields (store as strings for precision)
    const salaryStringAttrs = [
      "grossSalary",
      "perDayRate",
      "deductedAmount",
      "tdsDeducted",
      "netSalary",
    ];
    for (const key of salaryStringAttrs) {
      try {
        await databases.createStringAttribute(
          DB_CONFIG.DATABASE_ID,
          MONTHLY_PAYROLL_COLLECTION_ID,
          key,
          50,
          true // required
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
        console.log(`  – ${key} exists`);
      }
      await delay(300);
    }

    // DateTime attributes
    const dateAttrs = ["createdAt"];
    for (const key of dateAttrs) {
      try {
        await databases.createDatetimeAttribute(
          DB_CONFIG.DATABASE_ID,
          MONTHLY_PAYROLL_COLLECTION_ID,
          key,
          true // required
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
        console.log(`  – ${key} exists`);
      }
      await delay(300);
    }

    // Optional datetime attributes
    const optionalDateAttrs = ["approvedAt", "processedAt"];
    for (const key of optionalDateAttrs) {
      try {
        await databases.createDatetimeAttribute(
          DB_CONFIG.DATABASE_ID,
          MONTHLY_PAYROLL_COLLECTION_ID,
          key,
          false // not required
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
        console.log(`  – ${key} exists`);
      }
      await delay(300);
    }

    // Create composite index
    console.log("\nWaiting 5s before creating index...");
    await delay(5000);

    try {
      await (databases.createIndex as any)(
        DB_CONFIG.DATABASE_ID,
        MONTHLY_PAYROLL_COLLECTION_ID,
        "idx_employee_year_month",
        "key",
        ["employeeId", "year", "month"],
        ["ASC", "ASC", "ASC"]
      );
      console.log("✓ Index created");
    } catch (e: any) {
      if (e.code === 409) {
        console.log("– Index already exists");
      } else {
        throw e;
      }
    }

    console.log("✅ Monthly payroll collection initialized");
  } catch (error) {
    console.error("Error creating monthly payroll collection:", error);
    throw error;
  }
}

/**
 * Fetch a single month's payroll for an employee.
 */
export async function getMonthlyPayroll(
  employeeId: string,
  year: number,
  month: number
): Promise<MonthlyPayrollRecord | null> {
  await ensureMonthlyPayrollCollectionExists();
  const databases = createDatabasesWithAuth();
  try {
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_PAYROLL_COLLECTION_ID,
      queries: [
        Query.equal("employeeId", employeeId),
        Query.equal("year", year),
        Query.equal("month", month),
        Query.limit(1),
      ],
    });
    if (result.total === 0) return null;
    return result.documents[0] as unknown as MonthlyPayrollRecord;
  } catch (error) {
    console.error("Error fetching monthly payroll:", error);
    return null;
  }
}

/**
 * Save (create or update) a month's payroll for an employee.
 */
export async function saveMonthlyPayroll(
  employeeId: string,
  year: number,
  month: number,
  payrollData: Partial<MonthlyPayrollRecord>
): Promise<MonthlyPayrollRecord> {
  await ensureMonthlyPayrollCollectionExists();
  const databases = createDatabasesWithAuth();
  const { ID } = await import("node-appwrite");

  const existing = await getMonthlyPayroll(employeeId, year, month);

  const payload = {
    employeeId,
    year,
    month,
    status: payrollData.status || "draft",
    createdAt: new Date().toISOString(),
    ...payrollData,
  };

  if (existing && existing.$id) {
    const updated = await databases.updateDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_PAYROLL_COLLECTION_ID,
      documentId: existing.$id,
      data: {
        ...payload,
        createdAt: existing.createdAt, // preserve original creation time
      },
    });
    return updated as unknown as MonthlyPayrollRecord;
  } else {
    const created = await databases.createDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_PAYROLL_COLLECTION_ID,
      documentId: ID.unique(),
      data: payload,
    });
    return created as unknown as MonthlyPayrollRecord;
  }
}

/**
 * Fetch all payroll records for a specific month (all employees).
 */
export async function getMonthPayrollForAllEmployees(
  year: number,
  month: number,
  limit: number = 500,
  offset: number = 0
): Promise<MonthlyPayrollRecord[]> {
  await ensureMonthlyPayrollCollectionExists();
  const databases = createDatabasesWithAuth();
  try {
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_PAYROLL_COLLECTION_ID,
      queries: [
        Query.equal("year", year),
        Query.equal("month", month),
        Query.limit(limit),
        Query.offset(offset),
      ],
    });
    return result.documents as unknown as MonthlyPayrollRecord[];
  } catch (error) {
    console.error("Error fetching month payroll:", error);
    return [];
  }
}

/**
 * Update payroll status (draft -> approved -> processed).
 */
export async function updatePayrollStatus(
  employeeId: string,
  year: number,
  month: number,
  status: "draft" | "approved" | "processed"
): Promise<MonthlyPayrollRecord | null> {
  const existing = await getMonthlyPayroll(employeeId, year, month);
  if (!existing) return null;

  const databases = createDatabasesWithAuth();
  const updateData: any = { status };

  if (status === "approved") {
    updateData.approvedAt = new Date().toISOString();
  } else if (status === "processed") {
    updateData.processedAt = new Date().toISOString();
  }

  const updated = await databases.updateDocument({
    databaseId: DB_CONFIG.DATABASE_ID,
    collectionId: MONTHLY_PAYROLL_COLLECTION_ID,
    documentId: existing.$id!,
    data: updateData,
  });

  return updated as unknown as MonthlyPayrollRecord;
}

/**
 * Batch save multiple payroll records.
 */
export async function batchSaveMonthlyPayroll(
  records: Array<{
    employeeId: string;
    year: number;
    month: number;
    payrollData: Partial<MonthlyPayrollRecord>;
  }>
): Promise<MonthlyPayrollRecord[]> {
  const saved: MonthlyPayrollRecord[] = [];

  for (const record of records) {
    try {
      const result = await saveMonthlyPayroll(
        record.employeeId,
        record.year,
        record.month,
        record.payrollData
      );
      saved.push(result);
    } catch (error) {
      console.error(
        `Error saving payroll for ${record.employeeId} ${record.year}-${record.month}:`,
        error
      );
    }
  }

  return saved;
}

/**
 * Delete a payroll record.
 */
export async function deleteMonthlyPayroll(
  employeeId: string,
  year: number,
  month: number
): Promise<boolean> {
  await ensureMonthlyPayrollCollectionExists();
  const databases = createDatabasesWithAuth();
  try {
    const existing = await getMonthlyPayroll(employeeId, year, month);
    if (!existing || !existing.$id) return false;

    await databases.deleteDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_PAYROLL_COLLECTION_ID,
      documentId: existing.$id,
    });
    return true;
  } catch (error) {
    console.error("Error deleting monthly payroll:", error);
    return false;
  }
}

/**
 * Get payroll summary for a month (aggregated stats).
 */
export interface PayrollSummary {
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalTDS: number;
  totalNetPaid: number;
  averageNetSalary: number;
  presentDaysTotal: number;
  absentDaysTotal: number;
}

export async function getPayrollSummary(
  year: number,
  month: number
): Promise<PayrollSummary> {
  const records = await getMonthPayrollForAllEmployees(year, month, 999);

  if (records.length === 0) {
    return {
      totalEmployees: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalTDS: 0,
      totalNetPaid: 0,
      averageNetSalary: 0,
      presentDaysTotal: 0,
      absentDaysTotal: 0,
    };
  }

  const summary: PayrollSummary = {
    totalEmployees: records.length,
    totalGross: 0,
    totalDeductions: 0,
    totalTDS: 0,
    totalNetPaid: 0,
    averageNetSalary: 0,
    presentDaysTotal: 0,
    absentDaysTotal: 0,
  };

  records.forEach((record) => {
    summary.totalGross += Number(record.grossSalary) || 0;
    summary.totalDeductions += Number(record.deductedAmount) || 0;
    summary.totalTDS += Number(record.tdsDeducted) || 0;
    summary.totalNetPaid += Number(record.netSalary) || 0;
    summary.presentDaysTotal += record.presentDays;
    summary.absentDaysTotal += record.absentDays;
  });

  summary.averageNetSalary = summary.totalNetPaid / records.length;

  return summary;
}
