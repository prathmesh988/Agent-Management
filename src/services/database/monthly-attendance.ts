/**
 * Service for per-month attendance data.
 * Each document represents one employee's attendance for one calendar month.
 * Collection ID: monthly_attendance
 * Schema: { employeeId, year, month, day1–day31 }
 */

import { createDatabasesWithAuth, DB_CONFIG } from "./client";
import { Query } from "node-appwrite";

export const MONTHLY_ATTENDANCE_COLLECTION_ID = "monthly_attendance";

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
 * Fetch a single month's attendance for an employee.
 * Returns null if no record exists yet.
 */
export async function getMonthlyAttendance(
  employeeId: string,
  year: number,
  month: number
): Promise<MonthlyAttendanceRecord | null> {
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
