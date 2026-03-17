"use server";

import {
  fetchAllEmployees as dbFetchAllEmployees,
  fetchEmployee as dbFetchEmployee,
  searchEmployees as dbSearchEmployees,
  updateEmployee as dbUpdateEmployee,
  EmployeeRecord,
} from "@/services/database";
import { Employee } from "@/lib/types";

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
    tds5perc: record.tds,
    netSalary: record.netSalary,
    penalty: record.penalty,
    paidAmount: record.paidAmount,
    status: "active",
  };
}

/**
 * Server action: Fetch all employees from database
 * Default limit increased to 5000 to support large datasets
 */
export async function getEmployees(
  limit: number = 5000,
  offset: number = 0,
): Promise<{ employees: Employee[]; total: number }> {
  try {
    const { employees, total } = await dbFetchAllEmployees(limit, offset);
    return {
      employees: employees.map(transformEmployeeRecord),
      total,
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
 * Server action: Search employees
 */
export async function searchEmployeesAction(
  searchTerm: string,
): Promise<Employee[]> {
  try {
    const records = await dbSearchEmployees(searchTerm);
    return records.map(transformEmployeeRecord);
  } catch (error) {
    console.error("Error searching employees:", error);
    throw error;
  }
}

/**
 * Server action: Update an employee
 * Supports all fields in the employee schema for complete persistence
 */
export async function updateEmployeeAction(
  employeeId: string,
  updates: Partial<Employee>,
): Promise<Employee> {
  try {
    // All numeric fields from database schema (double type)
    const numericFields = new Set([
      'sno', 'ctc', 'attendanceAllowance', 'dateOfJoining',
      'presentDays', 'absentDays', 'leaveDays', 'halfDays', 'weekOffDays', 'holidayDays',
      'cl', 'lc', 'trp', 'tra', 'trl', 'totalPresent', 'overtime', 'finalDays',
      'arrear', 'advance', 'shiftAllowance', 'grossSalary', 'attendanceDeduction',
      'employeeContribution', 'employeeEsic', 'employerContribution', 'employerEsic',
      'tds', 'netSalary', 'penalty', 'paidAmount', 'serialNo'
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
      tds: convertToNumber(updates.tds5perc, 'tds'),
      
      // Special Cases
      overtime: convertToNumber(updates.overtime, 'overtime'),
      arrear: convertToNumber(updates.arrear, 'arrear'),
      advance: convertToNumber(updates.advance, 'advance'),
      penalty: convertToNumber(updates.penalty, 'penalty'),
      paidAmount: convertToNumber(updates.paidAmount, 'paidAmount'),
      
      // Only include dateOfJoining if it's a valid positive number
      ...(updates.dateOfJoining && updates.dateOfJoining > 0 ? { dateOfJoining: updates.dateOfJoining } : {}),
    };

    // Filter out undefined values to avoid validation errors
    const cleanedUpdates = Object.fromEntries(
      Object.entries(dbUpdates).filter(([_, value]) => value !== undefined)
    ) as Partial<EmployeeRecord>;

    const updated = await dbUpdateEmployee(employeeId, cleanedUpdates);
    return transformEmployeeRecord(updated);
  } catch (error) {
    console.error("Error updating employee:", error);
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
