"use server";

/**
 * Server actions for per-month attendance CRUD.
 */

import {
  getMonthlyAttendance,
  saveMonthlyAttendance,
  monthlyRecordToCalendarKeys,
  calendarKeysToDayNumbers,
} from "@/services/database/monthly-attendance";

/**
 * Fetch attendance data for a specific employee + year + month.
 * Returns a map of { "1Sun": "P", "3Tue": "A", ... } or {} if no data yet.
 */
export async function getMonthlyAttendanceAction(
  employeeId: string,
  year: number,
  month: number
): Promise<{ success: boolean; data: Record<string, string>; error?: string }> {
  try {
    const record = await getMonthlyAttendance(employeeId, year, month);
    const data = monthlyRecordToCalendarKeys(record);
    return { success: true, data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching monthly attendance:", msg);
    return { success: false, data: {}, error: msg };
  }
}

/**
 * Save attendance edits for a specific employee + year + month.
 * @param updates  Map of { "3Tue": "A", "4Wed": "P", ... }
 */
export async function saveMonthlyAttendanceAction(
  employeeId: string,
  year: number,
  month: number,
  updates: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const dayData = calendarKeysToDayNumbers(updates);
    await saveMonthlyAttendance(employeeId, year, month, dayData);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error saving monthly attendance:", msg);
    return { success: false, error: msg };
  }
}
