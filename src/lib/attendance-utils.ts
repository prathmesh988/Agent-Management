/**
 * Attendance management utilities
 * Provides type-safe helpers for working with employee attendance records
 */

import { AttendanceStatus, AttendanceRecord } from "./types";

// Day key patterns used in the system
export const DAY_KEYS = {
  "1": "1Sun",
  "2": "2Mon",
  "3": "3Tue",
  "4": "4Wed",
  "5": "5Thu",
  "6": "6Fri",
  "7": "7Sat",
  "8": "8Sun",
  "9": "9Mon",
  "10": "10Tue",
  "11": "11Wed",
  "12": "12Thu",
  "13": "13Fri",
  "14": "14Sat",
  "15": "15Sun",
  "16": "16Mon",
  "17": "17Tue",
  "18": "18Wed",
  "19": "19Thu",
  "20": "20Fri",
  "21": "21Sat",
  "22": "22Sun",
  "23": "23Mon",
  "24": "24Tue",
  "25": "25Wed",
  "26": "26Thu",
  "27": "27Fri",
  "28": "28Sat",
  "29": "29Sun",
  "30": "30Mon",
  "31": "31Tue",
} as const;

export type DayKeyType = typeof DAY_KEYS[keyof typeof DAY_KEYS];

/**
 * Convert legacy individual day properties to attendance record
 * @param employee - Employee object with legacy day keys
 * @returns AttendanceRecord with all day entries
 */
export function legacyToAttendanceRecord(employee: Record<string, any>): AttendanceRecord {
  const attendance: AttendanceRecord = {};

  Object.entries(DAY_KEYS).forEach(([_, dayKey]) => {
    if (dayKey in employee) {
      attendance[dayKey] = employee[dayKey];
    }
  });

  return attendance;
}

/**
 * Get attendance status color for UI display
 * @param status - Attendance status
 * @returns CSS class string for styling
 */
export function getAttendanceColorClass(status?: AttendanceStatus): string {
  switch (status) {
    case "P": // Present
      return "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300";
    case "A": // Absent
      return "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300";
    case "HD": // Half day
      return "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300";
    case "WO": // Week off
      return "bg-slate-100 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300";
    case "L": // Leave
      return "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300";
    case "CL": // Casual Leave
      return "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300";
    case "LC": // Late Coming
      return "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300";
    default:
      return "bg-gray-100 dark:bg-gray-950/50 text-gray-700 dark:text-gray-300";
  }
}

/**
 * Get display label for attendance status
 * @param status - Attendance status
 * @returns Human-readable label
 */
export function getAttendanceLabel(status?: AttendanceStatus): string {
  switch (status) {
    case "P":
      return "Present";
    case "A":
      return "Absent";
    case "HD":
      return "Half Day";
    case "WO":
      return "Week Off";
    case "L":
      return "Leave";
    case "CL":
      return "Casual Leave";
    case "LC":
      return "Late Coming";
    default:
      return "Not Marked";
  }
}

/**
 * Get all day keys for a given month
 * @param month - Month number (1-12)
 * @param year - Year (for determining days in month)
 * @returns Array of valid day keys for the month
 */
export function getDayKeysForMonth(month: number, year: number): DayKeyType[] {
  const lastDay = new Date(year, month, 0).getDate();
  const keys: DayKeyType[] = [];

  for (let day = 1; day <= lastDay; day++) {
    const dayStr = day.toString() as keyof typeof DAY_KEYS;
    keys.push(DAY_KEYS[dayStr]);
  }

  return keys;
}
