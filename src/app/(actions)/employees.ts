"use server";

import {
  fetchAllEmployees as dbFetchAllEmployees,
  fetchAllEmployeesPaginated as dbFetchAllEmployeesPaginated,
  fetchEmployee as dbFetchEmployee,
  searchEmployees as dbSearchEmployees,
  updateEmployee as dbUpdateEmployee,
  EmployeeRecord,
} from "@/services/database";
import { Employee } from "@/lib/types";
import { Query } from "node-appwrite";
import { createDatabasesWithAuth, DB_CONFIG } from "@/services/database/client";
import { requireAuth } from "@/lib/auth-utils";

/**
 * Transform EmployeeRecord from database to Employee interface for UI
 */
function transformEmployeeRecord(record: EmployeeRecord): Employee {
  return {
    id: record.$id || record.employeeId || "",
    employeeId: record.employeeId || "",
    name: record.name || "",
    email: `${record.employeeId}@company.com`, // Email not in database, generate from ID
    department: record.process || "",
    sno: record.serialNo,
    designation: record.designation || "",
    dateOfJoining: record.dateOfJoining || 0,
    ctc: record.ctc,
    attendanceAllowance: record.attendanceAllowance,
    process: record.process,
    uanNumber: record.uanNumber,
    accountNumber: record.accountNumber,
    ifscCode: record.ifscCode,
    bankName: record.bankName,
    paymentMode: record.paymentMode,
    presentDays: record.presentDays,
    absentDays: record.absentDays,
    leaveDays: record.leaveDays,
    halfDays: record.halfDays,
    weekOffDays: record.weekOffDays,
    holidayDays: record.holidayDays,
    cl: record.cl,
    lc: record.lc,
    trp: record.trp,
    tra: record.tra,
    trl: record.trl,
    totalPresent: record.totalPresent,
    overtime: record.overtime,
    finalDays: record.finalDays,
    arrear: record.arrear,
    advance: record.advance,
    shiftAllowance: record.shiftAllowance,
    grossSalary: record.grossSalary,
    attendanceDeduction: record.attendanceDeduction,
    employeeContribution: record.employeeContribution,
    employeeEsic: record.employeeEsic,
    employerContribution: record.employerContribution,
    employerEsic: record.employerEsic,
    tds5perc: record.tds5perc,
    netSalary: record.netSalary,
    penalty: record.penalty,
    paidAmount: record.paidAmount,
    status: "active", // Status not in database, default to active for UI
    // Daily attendance fields (1Sun-28Sat)
    "1Sun": record["1Sun"],
    "2Mon": record["2Mon"],
    "3Tue": record["3Tue"],
    "4Wed": record["4Wed"],
    "5Thu": record["5Thu"],
    "6Fri": record["6Fri"],
    "7Sat": record["7Sat"],
    "8Sun": record["8Sun"],
    "9Mon": record["9Mon"],
    "10Tue": record["10Tue"],
    "11Wed": record["11Wed"],
    "12Thu": record["12Thu"],
    "13Fri": record["13Fri"],
    "14Sat": record["14Sat"],
    "15Sun": record["15Sun"],
    "16Mon": record["16Mon"],
    "17Tue": record["17Tue"],
    "18Wed": record["18Wed"],
    "19Thu": record["19Thu"],
    "20Fri": record["20Fri"],
    "21Sat": record["21Sat"],
    "22Sun": record["22Sun"],
    "23Mon": record["23Mon"],
    "24Tue": record["24Tue"],
    "25Wed": record["25Wed"],
    "26Thu": record["26Thu"],
    "27Fri": record["27Fri"],
    "28Sat": record["28Sat"],
    "29Sun": record["29Sun"],
    "30Mon": record["30Mon"],
    "31Tue": record["31Tue"],
  };
}

/**
 * Server action: Fetch all employees from database
 * Uses paginated fetch to get ALL employees (beyond Appwrite's 100/request limit)
 */
export async function getEmployees(): Promise<{ employees: Employee[]; total: number }> {
  try {
    const allRecords = await dbFetchAllEmployeesPaginated();
    const employees = allRecords.map(transformEmployeeRecord);
    return {
      employees,
      total: employees.length,
    };
  } catch (error) {
    console.error("Error fetching employees from database:", error);
    throw error;
  }
}

/**
 * Server action: Fetch single employee by ID
 */
export async function getEmployee(
  employeeId: string,
): Promise<Employee | null> {
  try {
    const record = await dbFetchEmployee(employeeId);
    if (!record) return null;
    return transformEmployeeRecord(record);
  } catch (error) {
    console.error("Error fetching employee from database:", error);
    throw error;
  }
}

/**
 * Server action: Search employees by name, email, or employeeId
 * Searches directly from Appwrite to handle large datasets
 */
export async function searchEmployeesAction(
  searchTerm: string,
): Promise<Employee[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      const { employees } = await getEmployees();
      return employees;
    }

    const databases = createDatabasesWithAuth();
    const term = searchTerm.trim();

    // Try search with Query.contains for partial matching on name and employeeId
    // Appwrite supports Query.contains for string attributes
    const queries = [
      Query.or([
        Query.contains("name", term),
        Query.contains("employeeId", term),
      ]),
      Query.limit(100),
    ];

    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries,
    });

    return (response.documents as EmployeeRecord[]).map(transformEmployeeRecord);
  } catch (error) {
    console.error("Error searching employees:", error);
    // Fallback: fetch all and filter client-side if Appwrite query fails
    try {
      const { employees } = await getEmployees();
      const term = searchTerm.toLowerCase();
      return employees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(term) ||
          emp.employeeId?.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term) ||
          emp.id?.toLowerCase().includes(term),
      );
    } catch (fallbackError) {
      console.error("Fallback search also failed:", fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Server action: Update an employee
 * Supports all fields in the employee schema for complete persistence
 * ⚠️ REQUIRES AUTHENTICATION - will throw error if user is not logged in
 */
export async function updateEmployeeAction(
  employeeId: string,
  updates: Partial<Employee>,
): Promise<Employee> {
  // Verify user is authenticated before allowing updates
  await requireAuth();

  try {
    // All numeric fields from database schema (double type)
    const numericFields = new Set([
      'sno', 'ctc', 'attendanceAllowance', 'dateOfJoining',
      'presentDays', 'absentDays', 'leaveDays', 'halfDays', 'weekOffDays', 'holidayDays',
      'cl', 'lc', 'trp', 'tra', 'trl', 'totalPresent', 'overtime', 'finalDays',
      'arrear', 'advance', 'shiftAllowance', 'grossSalary', 'attendanceDeduction',
      'employeeContribution', 'employeeEsic', 'employerContribution', 'employerEsic',
      'tds5perc', 'netSalary', 'penalty', 'paidAmount', 'serialNo'
    ]);

    // Convert Employee interface back to EmployeeRecord for database
    // Map ALL employee fields for complete cloud persistence with type conversion
    const dbUpdates: Record<string, any> = {
      // Basic Info
      name: updates.name,
      employeeId: updates.employeeId,
      designation: updates.designation,
      process: updates.department || updates.process, // Map department to process field
      serialNo: convertToNumber(updates.sno, 'sno'),
      
      // Salary & Allowances
      ctc: convertToNumber(updates.ctc, 'ctc'),
      attendanceAllowance: convertToNumber(updates.attendanceAllowance, 'attendanceAllowance'),
      shiftAllowance: convertToNumber(updates.shiftAllowance, 'shiftAllowance'),
      grossSalary: convertToNumber(updates.grossSalary, 'grossSalary'),
      netSalary: convertToNumber(updates.netSalary, 'netSalary'),
      
      // Bank & Payment Details
      uanNumber: updates.uanNumber,
      accountNumber: updates.accountNumber,
      ifscCode: updates.ifscCode,
      bankName: updates.bankName,
      paymentMode: updates.paymentMode,
      
      // Attendance & Leaves
      presentDays: convertToNumber(updates.presentDays, 'presentDays'),
      absentDays: convertToNumber(updates.absentDays, 'absentDays'),
      leaveDays: convertToNumber(updates.leaveDays, 'leaveDays'),
      halfDays: convertToNumber(updates.halfDays, 'halfDays'),
      weekOffDays: convertToNumber(updates.weekOffDays, 'weekOffDays'),
      holidayDays: convertToNumber(updates.holidayDays, 'holidayDays'),
      cl: convertToNumber(updates.cl, 'cl'),
      lc: convertToNumber(updates.lc, 'lc'),
      trp: convertToNumber(updates.trp, 'trp'),
      tra: convertToNumber(updates.tra, 'tra'),
      trl: convertToNumber(updates.trl, 'trl'),
      totalPresent: convertToNumber(updates.totalPresent, 'totalPresent'),
      finalDays: convertToNumber(updates.finalDays, 'finalDays'),
      
      // Deductions & Contributions
      attendanceDeduction: convertToNumber(updates.attendanceDeduction, 'attendanceDeduction'),
      employeeContribution: convertToNumber(updates.employeeContribution, 'employeeContribution'),
      employeeEsic: convertToNumber(updates.employeeEsic, 'employeeEsic'),
      employerContribution: convertToNumber(updates.employerContribution, 'employerContribution'),
      employerEsic: convertToNumber(updates.employerEsic, 'employerEsic'),
      tds5perc: convertToNumber(updates.tds5perc, 'tds5perc'),
      
      // Special Cases
      overtime: convertToNumber(updates.overtime, 'overtime'),
      arrear: convertToNumber(updates.arrear, 'arrear'),
      advance: convertToNumber(updates.advance, 'advance'),
      penalty: convertToNumber(updates.penalty, 'penalty'),
      paidAmount: convertToNumber(updates.paidAmount, 'paidAmount'),
      
      // Daily Attendance Fields (1Sun-28Sat - maps directly to database)
      "1Sun": updates['1Sun'],
      "2Mon": updates['2Mon'],
      "3Tue": updates['3Tue'],
      "4Wed": updates['4Wed'],
      "5Thu": updates['5Thu'],
      "6Fri": updates['6Fri'],
      "7Sat": updates['7Sat'],
      "8Sun": updates['8Sun'],
      "9Mon": updates['9Mon'],
      "10Tue": updates['10Tue'],
      "11Wed": updates['11Wed'],
      "12Thu": updates['12Thu'],
      "13Fri": updates['13Fri'],
      "14Sat": updates['14Sat'],
      "15Sun": updates['15Sun'],
      "16Mon": updates['16Mon'],
      "17Tue": updates['17Tue'],
      "18Wed": updates['18Wed'],
      "19Thu": updates['19Thu'],
      "20Fri": updates['20Fri'],
      "21Sat": updates['21Sat'],
      "22Sun": updates['22Sun'],
      "23Mon": updates['23Mon'],
      "24Tue": updates['24Tue'],
      "25Wed": updates['25Wed'],
      "26Thu": updates['26Thu'],
      "27Fri": updates['27Fri'],
      "28Sat": updates['28Sat'],
      "29Sun": updates['29Sun'],
      "30Mon": updates['30Mon'],
      "31Tue": updates['31Tue'],
      
      // Only include dateOfJoining if it's a valid positive number
      ...(updates.dateOfJoining && updates.dateOfJoining > 0 ? { dateOfJoining: updates.dateOfJoining } : {}),
    };

    // Filter out undefined values to avoid validation errors
    const cleanedUpdates = Object.fromEntries(
      Object.entries(dbUpdates).filter(([_, value]) => value !== undefined)
    ) as Partial<EmployeeRecord>;

    console.log("📦 Updating employee with cleaned updates:", cleanedUpdates);
    const updated = await dbUpdateEmployee(employeeId, cleanedUpdates);
    console.log("✅ Employee updated successfully:", updated);
    return transformEmployeeRecord(updated);
  } catch (error) {
    console.error("❌ Error updating employee:", error);
    throw error;
  }
}

/**
 * Helper function to safely convert values to numbers
 */
function convertToNumber(value: any, fieldName: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (isNaN(num)) {
      console.warn(`⚠️ Could not convert "${fieldName}": "${value}" to number`);
      return undefined;
    }
    return num;
  }
  
  return undefined;
}
