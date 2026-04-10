/**
 * Service for per-month payroll data.
 * Each document tracks payroll for one employee for one calendar month.
 * Collection ID: monthly_payroll
 * Schema: { employeeId, year, month, presentDays, absentDays, leaveDays, ..., status }
 */

import { createDatabasesWithAuth, DB_CONFIG } from "./client";
import { Query } from "node-appwrite";

export const MONTHLY_PAYROLL_COLLECTION_ID = "monthly_payroll2";

// Cache flag to avoid repeated collection existence checks
let collectionInitialized = false;

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
  // Skip if already initialized in this session
  if (collectionInitialized) {
    return;
  }

  const databases = createDatabasesWithAuth();
  try {
    await databases.getCollection(
      DB_CONFIG.DATABASE_ID,
      MONTHLY_PAYROLL_COLLECTION_ID
    );
    collectionInitialized = true;
    return;
  } catch (error: any) {
    if (error.code !== 404) {
      console.error("Error checking monthly payroll collection:", error);
      throw error;
    }
    // Collections are created lazily when actual operations need them
    // For payroll generation (calculate-only mode), collection isn't needed
    console.log("ℹ Lazy initialization: Payroll collection will be created on-demand if needed");
    return;
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
 * Fetch paginated payroll records for a specific month with total count.
 * THIS is the optimized method - use this instead of fetching all records.
 */
export async function getMonthPayrollPage(
  year: number,
  month: number,
  page: number = 1,
  pageSize: number = 20
): Promise<{ records: MonthlyPayrollRecord[]; total: number; pages: number }> {
  await ensureMonthlyPayrollCollectionExists();
  const databases = createDatabasesWithAuth();
  try {
    const offset = (page - 1) * pageSize;
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_PAYROLL_COLLECTION_ID,
      queries: [
        Query.equal("year", year),
        Query.equal("month", month),
        Query.limit(pageSize),
        Query.offset(offset),
      ],
    });
    
    const total = result.total;
    const pages = Math.ceil(total / pageSize);
    
    return {
      records: result.documents as unknown as MonthlyPayrollRecord[],
      total,
      pages,
    };
  } catch (error) {
    console.error("Error fetching month payroll page:", error);
    return { records: [], total: 0, pages: 0 };
  }
}

/**
 * Fetch all payroll records for a specific month (all employees).
 * WARNING: This can be slow if you have many records. Use getMonthPayrollPage() for pagination.
 */
export async function getMonthPayrollForAllEmployees(
  year: number,
  month: number,
  limit: number = 20,
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
 * Batch save multiple payroll records with rate limiting to avoid overwhelming the server.
 * Saves records in smaller batches with delays between them.
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
  const batchSize = 10; // Save 10 records at a time
  const delayMs = 500; // Wait 500ms between batches to avoid overwhelming server
  
  console.log(`💾 Batch saving ${records.length} records in groups of ${batchSize}...`);

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(records.length / batchSize);
    
    console.log(`📦 Saving batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);

    // Save batch records in parallel (but with small delays between batches)
    const batchPromises = batch.map(record =>
      (async () => {
        try {
          const result = await saveMonthlyPayroll(
            record.employeeId,
            record.year,
            record.month,
            record.payrollData
          );
          saved.push(result);
          return true;
        } catch (error) {
          console.error(
            `Error saving payroll for ${record.employeeId} ${record.year}-${record.month}:`,
            error instanceof Error ? error.message : String(error)
          );
          return false;
        }
      })()
    );

    await Promise.all(batchPromises);
    
    // Wait before next batch (except for the last batch)
    if (i + batchSize < records.length) {
      console.log(`⏳ Waiting ${delayMs}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`✅ Batch save complete: ${saved.length}/${records.length} records saved`);
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
  // Fetch records in chunks to avoid loading all at once in memory
  let allRecords: MonthlyPayrollRecord[] = [];
  let page = 1;
  let hasMore = true;
  const pageSize = 100;

  while (hasMore) {
    const { records, pages } = await getMonthPayrollPage(year, month, page, pageSize);
    allRecords = allRecords.concat(records);
    hasMore = page < pages;
    page++;
  }

  if (allRecords.length === 0) {
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
    totalEmployees: allRecords.length,
    totalGross: 0,
    totalDeductions: 0,
    totalTDS: 0,
    totalNetPaid: 0,
    averageNetSalary: 0,
    presentDaysTotal: 0,
    absentDaysTotal: 0,
  };

  allRecords.forEach((record) => {
    summary.totalGross += Number(record.grossSalary) || 0;
    summary.totalDeductions += Number(record.deductedAmount) || 0;
    summary.totalTDS += Number(record.tdsDeducted) || 0;
    summary.totalNetPaid += Number(record.netSalary) || 0;
    summary.presentDaysTotal += record.presentDays;
    summary.absentDaysTotal += record.absentDays;
  });

  summary.averageNetSalary = summary.totalNetPaid / allRecords.length;

  return summary;
}
