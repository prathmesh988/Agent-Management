"use server";

/**
 * Server actions for per-month attendance CRUD.
 */

import {
  getMonthlyAttendance,
  saveMonthlyAttendance,
  monthlyRecordToCalendarKeys,
  calendarKeysToDayNumbers,
  getEmployeeYearAttendance,
  deleteMonthlyAttendance,
  getMonthAttendanceForAllEmployees,
  countAttendanceStatuses,
  batchSaveMonthlyAttendance,
} from "@/services/database/monthly-attendance";
import { getEmployee } from "./employees";

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

/**
 * Get all 12 months' attendance for an employee in a year.
 * Returns { 1: {...}, 2: {...}, ..., 12: null } if months don't exist.
 */
export async function getEmployeeYearAttendanceAction(
  employeeId: string,
  year: number
): Promise<{ success: boolean; data: Record<number, Record<string, string> | null> }> {
  try {
    const records = await getEmployeeYearAttendance(employeeId, year);
    const data: Record<number, Record<string, string> | null> = {};
    
    for (const [month, record] of Object.entries(records)) {
      data[Number(month)] = record ? monthlyRecordToCalendarKeys(record) : null;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching yearly attendance:", error);
    return { success: false, data: {} };
  }
}

/**
 * Check if employee was active (hired) during a specific month.
 * Compares dateOfJoining with month start date.
 */
export async function isEmployeeActiveInMonthAction(
  employeeId: string,
  year: number,
  month: number
): Promise<{ active: boolean; message: string; doj?: number }> {
  try {
    const employee = await getEmployee(employeeId);
    if (!employee) {
      return { active: false, message: `Employee ${employeeId} not found` };
    }

    if (!employee.dateOfJoining) {
      return { active: true, message: "No DOJ specified - assuming all time active" };
    }

    const dojDate = new Date(employee.dateOfJoining);
    const monthStart = new Date(year, month - 1, 1);

    const isActive = dojDate <= monthStart;
    return {
      active: isActive,
      doj: employee.dateOfJoining,
      message: isActive
        ? `${employee.name} was active in ${year}-${String(month).padStart(2, "0")}`
        : `${employee.name} was not hired yet (DOJ: ${new Date(employee.dateOfJoining).toLocaleDateString()})`,
    };
  } catch (error) {
    console.error("Error checking employee activity:", error);
    return { active: false, message: "Error checking employee status" };
  }
}

/**
 * Delete a month's attendance record.
 */
export async function deleteMonthlyAttendanceAction(
  employeeId: string,
  year: number,
  month: number
): Promise<{ success: boolean; message: string }> {
  try {
    const deleted = await deleteMonthlyAttendance(employeeId, year, month);
    return {
      success: deleted,
      message: deleted ? "Attendance record deleted" : "Record not found",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: msg };
  }
}

/**
 * Get attendance summary for a specific month (all employees).
 */
export async function getMonthSummaryAction(
  year: number,
  month: number
): Promise<{
  success: boolean;
  counts: Record<string, number>;
  totalEmployees: number;
}> {
  try {
    const records = await getMonthAttendanceForAllEmployees(year, month, 1000);
    const counts = countAttendanceStatuses(records);

    return {
      success: true,
      counts,
      totalEmployees: records.length,
    };
  } catch (error) {
    console.error("Error getting month summary:", error);
    return { success: false, counts: {}, totalEmployees: 0 };
  }
}

/**
 * Save a single day's attendance to monthly_attendance2 collection.
 * Used for bulk attendance grid updates to keep monthly_attendance2 in sync.
 * @param employeeId - Employee ID
 * @param dayKey - Calendar key like "3Tue" or "15Mon"
 * @param code - Attendance code like "P", "A", "L", etc.
 * @param year - Optional year (defaults to current)
 * @param month - Optional month (defaults to current)
 */
export async function saveBulkAttendanceAction(
  employeeId: string,
  dayKey: string,
  code: string,
  year?: number,
  month?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();
    const saveYear = year || now.getFullYear();
    const saveMonth = month || (now.getMonth() + 1);

    // Extract day number from dayKey (e.g., "3Tue" -> 3)
    const match = dayKey.match(/^(\d+)/);
    if (!match) {
      return { success: false, error: "Invalid day key format" };
    }

    const dayNum = parseInt(match[1], 10);

    // Build the day data object
    const dayData: Record<string, string | undefined> = {};
    for (let i = 1; i <= 31; i++) {
      if (i === dayNum) {
        dayData[`day${i}`] = code || undefined;
      }
    }

    await saveMonthlyAttendance(employeeId, saveYear, saveMonth, dayData);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error saving bulk attendance:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Fetch all employees' attendance data for a specific month from monthly_attendance2 collection.
 * Used by bulk attendance grid to display current month data.
 * @returns Map of { employeeId: { "1Sun": "P", "2Mon": "A", ... } }
 */
export async function getBulkMonthlyAttendanceAction(
  year: number,
  month: number
): Promise<{ success: boolean; data: Record<string, Record<string, string>>; error?: string }> {
  try {
    const records = await getMonthAttendanceForAllEmployees(year, month, 1000);
    const data: Record<string, Record<string, string>> = {};

    records.forEach((record) => {
      const calendarKeys = monthlyRecordToCalendarKeys(record);
      data[record.employeeId] = calendarKeys;
    });

    return { success: true, data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching bulk monthly attendance:", msg);
    return { success: false, data: {}, error: msg };
  }
}
