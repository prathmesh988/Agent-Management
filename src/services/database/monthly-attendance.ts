/**
 * Service for per-month attendance data.
 * Each document represents one employee's attendance for one calendar month.
 * Collection ID: monthly_attendance
 * Schema: { employeeId, year, month, day1–day31 }
 */

import { createDatabasesWithAuth, DB_CONFIG } from "./client";
import { Query } from "node-appwrite";

export const MONTHLY_ATTENDANCE_COLLECTION_ID = "monthly_attendance2";

export interface MonthlyAttendanceRecord {
  $id?: string;
  employeeId: string;
  year: number;
  month: number; // 1–12
  day1?: string;
  day2?: string;
  day3?: string;
  day4?: string;
  day5?: string;
  day6?: string;
  day7?: string;
  day8?: string;
  day9?: string;
  day10?: string;
  day11?: string;
  day12?: string;
  day13?: string;
  day14?: string;
  day15?: string;
  day16?: string;
  day17?: string;
  day18?: string;
  day19?: string;
  day20?: string;
  day21?: string;
  day22?: string;
  day23?: string;
  day24?: string;
  day25?: string;
  day26?: string;
  day27?: string;
  day28?: string;
  day29?: string;
  day30?: string;
  day31?: string;
}

/**
 * Ensure monthly_attendance collection exists, creating it if necessary.
 */
async function ensureMonthlyAttendanceCollectionExists(): Promise<void> {
  const databases = createDatabasesWithAuth();
  try {
    // Try to get the collection
    await databases.getCollection(
      DB_CONFIG.DATABASE_ID,
      MONTHLY_ATTENDANCE_COLLECTION_ID
    );
    // Collection exists, we're done
    return;
  } catch (error: any) {
    if (error.code !== 404) {
      // Some other error occurred
      console.error('Error checking monthly attendance collection:', error);
      throw error;
    }
    // Collection doesn't exist, create it
    console.log('Creating monthly_attendance2 collection...');
  }

  try {
    // Create the collection
    await databases.createCollection(
      DB_CONFIG.DATABASE_ID,
      MONTHLY_ATTENDANCE_COLLECTION_ID,
      'Monthly Attendance'
    );
    console.log('✓ Collection created');

    // Small delay before adding attributes
    await new Promise(r => setTimeout(r, 1000));

    // Create attributes: employeeId, year, month
    const stringAttrs = ['employeeId'];
    const intAttrs = ['year', 'month'];
    const dayAttrs = Array.from({ length: 31 }, (_, i) => `day${i + 1}`);

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // Create string attributes
    for (const key of stringAttrs) {
      try {
        await databases.createStringAttribute(
          DB_CONFIG.DATABASE_ID,
          MONTHLY_ATTENDANCE_COLLECTION_ID,
          key,
          255,
          key === 'employeeId' // employeeId is required
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e; // Ignore "already exists" errors
        console.log(`  – ${key} exists`);
      }
      await delay(300);
    }

    // Create integer attributes
    for (const key of intAttrs) {
      try {
        await databases.createIntegerAttribute(
          DB_CONFIG.DATABASE_ID,
          MONTHLY_ATTENDANCE_COLLECTION_ID,
          key,
          key === 'year' || key === 'month' // year and month are required
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
        console.log(`  – ${key} exists`);
      }
      await delay(300);
    }

    // Create day attributes
    for (const key of dayAttrs) {
      try {
        await databases.createStringAttribute(
          DB_CONFIG.DATABASE_ID,
          MONTHLY_ATTENDANCE_COLLECTION_ID,
          key,
          10,
          false // day columns are optional
        );
        console.log(`  ✓ ${key}`);
      } catch (e: any) {
        if (e.code !== 409) throw e;
        console.log(`  – ${key} exists`);
      }
      await delay(150);
    }

    // Create composite index for fast lookups
    console.log('\nWaiting 5s before creating index...');
    await delay(5000);

    try {
      await (databases.createIndex as any)(
        DB_CONFIG.DATABASE_ID,
        MONTHLY_ATTENDANCE_COLLECTION_ID,
        'idx_employee_year_month',
        'key',
        ['employeeId', 'year', 'month'],
        ['ASC', 'ASC', 'ASC']
      );
      console.log('✓ Index created');
    } catch (e: any) {
      if (e.code === 409) {
        console.log('– Index already exists');
      } else {
        throw e;
      }
    }

    console.log('✅ Monthly attendance collection initialized');
  } catch (error) {
    console.error('Error creating monthly attendance collection:', error);
    throw error;
  }
}

/**
 * Fetch a single month's attendance for an employee.
 * Returns null if no record exists yet.
 */
export async function getMonthlyAttendance(
  employeeId: string,
  year: number,
  month: number
): Promise<MonthlyAttendanceRecord | null> {
  await ensureMonthlyAttendanceCollectionExists();
  const databases = createDatabasesWithAuth();
  try {
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_ATTENDANCE_COLLECTION_ID,
      queries: [
        Query.equal("employeeId", employeeId),
        Query.equal("year", year),
        Query.equal("month", month),
        Query.limit(1),
      ],
    });
    if (result.total === 0) return null;
    return result.documents[0] as unknown as MonthlyAttendanceRecord;
  } catch (error) {
    console.error("Error fetching monthly attendance:", error);
    return null;
  }
}

/**
 * Save (create or update) a month's attendance for an employee.
 */
export async function saveMonthlyAttendance(
  employeeId: string,
  year: number,
  month: number,
  dayData: Partial<MonthlyAttendanceRecord>
): Promise<MonthlyAttendanceRecord> {
  await ensureMonthlyAttendanceCollectionExists();
  const databases = createDatabasesWithAuth();
  const { ID } = await import("node-appwrite");

  // Check if a record already exists
  const existing = await getMonthlyAttendance(employeeId, year, month);

  const payload = {
    employeeId,
    year,
    month,
    ...dayData,
  };

  if (existing && existing.$id) {
    // Update existing document
    const updated = await databases.updateDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_ATTENDANCE_COLLECTION_ID,
      documentId: existing.$id,
      data: payload,
    });
    return updated as unknown as MonthlyAttendanceRecord;
  } else {
    // Create new document
    const created = await databases.createDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_ATTENDANCE_COLLECTION_ID,
      documentId: ID.unique(),
      data: payload,
    });
    return created as unknown as MonthlyAttendanceRecord;
  }
}

/**
 * Convert MonthlyAttendanceRecord day values to the key format used by the calendar.
 * The calendar uses keys like "1Sun", "2Mon", etc. (positional, cycling Sun→Sat).
 * We store as day1, day2, ... day31 in the monthly_attendance collection.
 */
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function monthlyRecordToCalendarKeys(
  record: MonthlyAttendanceRecord | null
): Record<string, string> {
  if (!record) return {};
  const result: Record<string, string> = {};
  for (let i = 1; i <= 31; i++) {
    const val = (record as any)[`day${i}`];
    if (val) {
      const dayName = DAY_NAMES[(i - 1) % 7];
      result[`${i}${dayName}`] = val;
    }
  }
  return result;
}

/**
 * Convert calendar key updates (e.g. { "3Tue": "A", "4Wed": "P" }) to day-number keys.
 * Used before saving to the monthly_attendance collection.
 */
export function calendarKeysToDayNumbers(
  updates: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(updates)) {
    // Keys look like "1Sun", "12Thu", "31Tue"
    const match = key.match(/^(\d+)[A-Za-z]+$/);
    if (match) {
      result[`day${match[1]}`] = value;
    }
  }
  return result;
}

/**
 * Fetch all 12 months' attendance for an employee in a given year.
 * Returns object mapping month number (1-12) to MonthlyAttendanceRecord or null.
 */
export async function getEmployeeYearAttendance(
  employeeId: string,
  year: number
): Promise<Record<number, MonthlyAttendanceRecord | null>> {
  await ensureMonthlyAttendanceCollectionExists();
  const databases = createDatabasesWithAuth();
  try {
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_ATTENDANCE_COLLECTION_ID,
      queries: [
        Query.equal("employeeId", employeeId),
        Query.equal("year", year),
        Query.limit(12),
      ],
    });

    const records: Record<number, MonthlyAttendanceRecord | null> = {};

    // Initialize all months as null
    for (let m = 1; m <= 12; m++) {
      records[m] = null;
    }

    // Fill in found records
    result.documents.forEach((doc) => {
      const record = doc as unknown as MonthlyAttendanceRecord;
      records[record.month] = record;
    });

    return records;
  } catch (error) {
    console.error("Error fetching yearly attendance:", error);
    return {};
  }
}

/**
 * Batch save multiple months at once (e.g., when uploading CSV for entire month).
 */
export async function batchSaveMonthlyAttendance(
  records: Array<{
    employeeId: string;
    year: number;
    month: number;
    dayData: Partial<MonthlyAttendanceRecord>;
  }>
): Promise<MonthlyAttendanceRecord[]> {
  const saved: MonthlyAttendanceRecord[] = [];

  for (const record of records) {
    try {
      const result = await saveMonthlyAttendance(
        record.employeeId,
        record.year,
        record.month,
        record.dayData
      );
      saved.push(result);
    } catch (error) {
      console.error(
        `Error saving attendance for employee ${record.employeeId} ${record.year}-${record.month}:`,
        error
      );
    }
  }

  return saved;
}

/**
 * Delete a month's attendance record.
 */
export async function deleteMonthlyAttendance(
  employeeId: string,
  year: number,
  month: number
): Promise<boolean> {
  await ensureMonthlyAttendanceCollectionExists();
  const databases = createDatabasesWithAuth();
  try {
    const existing = await getMonthlyAttendance(employeeId, year, month);
    if (!existing || !existing.$id) return false;

    await databases.deleteDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_ATTENDANCE_COLLECTION_ID,
      documentId: existing.$id,
    });
    return true;
  } catch (error) {
    console.error("Error deleting monthly attendance:", error);
    return false;
  }
}

/**
 * Get all attendance records for a specific month across all employees.
 * Useful for bulk exports or department-wide analytics.
 */
export async function getMonthAttendanceForAllEmployees(
  year: number,
  month: number,
  limit: number = 100,
  offset: number = 0
): Promise<MonthlyAttendanceRecord[]> {
  await ensureMonthlyAttendanceCollectionExists();
  const databases = createDatabasesWithAuth();
  try {
    const result = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: MONTHLY_ATTENDANCE_COLLECTION_ID,
      queries: [
        Query.equal("year", year),
        Query.equal("month", month),
        Query.limit(limit),
        Query.offset(offset),
      ],
    });
    return result.documents as unknown as MonthlyAttendanceRecord[];
  } catch (error) {
    console.error("Error fetching month attendance:", error);
    return [];
  }
}

/**
 * Count attendance breakdown for a month (aggregate).
 * Returns { P: 5, A: 2, L: 1, ... } for use in reporting.
 */
export function countAttendanceStatuses(
  records: MonthlyAttendanceRecord[]
): Record<string, number> {
  const counts: Record<string, number> = {
    P: 0,
    A: 0,
    L: 0,
    H: 0,
    WO: 0,
    HO: 0,
    "-": 0,
  };

  records.forEach((record) => {
    for (let i = 1; i <= 31; i++) {
      const val = (record as any)[`day${i}`];
      if (val && val in counts) {
        counts[val]++;
      }
    }
  });

  return counts;
}
