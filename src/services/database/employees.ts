import { createTablesDBWithAuth, DB_CONFIG } from "./client";
import { Query } from "node-appwrite";
import { Employee } from "@/lib/types";

// Re-export Employee type for convenience
export type { Employee };

// Legacy interface - kept for backward compatibility
export interface EmployeeRecord {
  $id?: string;
  serialNo?: number;
  employeeId?: string;
  name?: string;
  ctc?: number;
  attendanceAllowance?: number;
  process?: string;
  designation?: string;
  dateOfJoining?: string;
  uanNumber?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  paymentMode?: string;
  // Day columns (1-27)
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
  presentDays?: number;
  absentDays?: number;
  leaveDays?: number;
  halfDays?: number;
  weekOffDays?: number;
  holidayDays?: number;
  cl?: number;
  lc?: number;
  trp?: number;
  tra?: number;
  trl?: number;
  totalPresent?: number;
  overtime?: number;
  finalDays?: number;
  arrear?: number;
  advance?: number;
  shiftAllowance?: number;
  grossSalary?: number;
  attendanceDeduction?: number;
  employeeContribution?: number;
  employeeEsic?: number;
  employerContribution?: number;
  employerEsic?: number;
  tds?: number;
  netSalary?: number;
  penalty?: number;
  paidAmount?: number;
}

/**
 * Fetch a single employee by ID
 */
export async function fetchEmployee(
  employeeId: string,
): Promise<EmployeeRecord | null> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.equal("employeeId", employeeId)],
    });

    if (response.rows && response.rows.length > 0) {
      return response.rows[0] as EmployeeRecord;
    }
    return null;
  } catch (error) {
    console.error("Error fetching employee:", error);
    throw error;
  }
}

/**
 * Fetch all employees with optional pagination and filtering
 */
export async function fetchAllEmployees(
  limit: number = 100,
  offset: number = 0,
  queries: string[] = [],
): Promise<{ employees: EmployeeRecord[]; total: number }> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const paginatedQueries = [
      Query.limit(limit),
      Query.offset(offset),
      ...queries,
    ];
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: paginatedQueries,
    });

    return {
      employees: response.rows as EmployeeRecord[],
      total: response.total,
    };
  } catch (error) {
    console.error("Error fetching all employees:", error);
    throw error;
  }
}

/**
 * Search employees by name or employeeId
 */
export async function searchEmployees(
  searchTerm: string,
): Promise<EmployeeRecord[]> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [
        Query.or([
          Query.search("name", searchTerm),
          Query.search("employeeId", searchTerm),
        ]),
      ],
    });

    return response.rows as EmployeeRecord[];
  } catch (error) {
    console.error("Error searching employees:", error);
    throw error;
  }
}

/**
 * Fetch employees by designation
 */
export async function fetchEmployeesByDesignation(
  designation: string,
): Promise<EmployeeRecord[]> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.equal("designation", designation)],
    });

    return response.rows as EmployeeRecord[];
  } catch (error) {
    console.error("Error fetching employees by designation:", error);
    throw error;
  }
}

/**
 * Fetch employees by process/department
 */
export async function fetchEmployeesByProcess(
  process: string,
): Promise<EmployeeRecord[]> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.equal("process", process)],
    });

    return response.rows as EmployeeRecord[];
  } catch (error) {
    console.error("Error fetching employees by process:", error);
    throw error;
  }
}

/**
 * Get employee count
 */
export async function getEmployeeCount(): Promise<number> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.limit(1)],
    });

    return response.total;
  } catch (error) {
    console.error("Error getting employee count:", error);
    throw error;
  }
}

/**
 * Fetch employees with salary information
 */
export async function fetchEmployeesWithSalary(): Promise<EmployeeRecord[]> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.isNotNull("netSalary")],
    });

    return response.rows as EmployeeRecord[];
  } catch (error) {
    console.error("Error fetching employees with salary:", error);
    throw error;
  }
}

/**
 * Fetch employees with detailed attendance records (day-wise)
 */
export async function fetchEmployeesWithAttendance(): Promise<
  EmployeeRecord[]
> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.isNotNull("presentDays")],
    });

    return response.rows as EmployeeRecord[];
  } catch (error) {
    console.error("Error fetching employees with attendance:", error);
    throw error;
  }
}

/**
 * Fetch employees with detailed salary deductions (PF, ESIC, TDS)
 */
export async function fetchEmployeesWithDeductions(): Promise<
  EmployeeRecord[]
> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.isNotNull("employeeContribution")],
    });

    return response.rows as EmployeeRecord[];
  } catch (error) {
    console.error("Error fetching employees with deductions:", error);
    throw error;
  }
}

/**
 * Fetch employees with complete salary and contribution details
 */
export async function fetchEmployeesWithCompleteDetails(): Promise<
  EmployeeRecord[]
> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [
        Query.isNotNull("grossSalary"),
        Query.isNotNull("employeeContribution"),
      ],
    });

    return response.rows as EmployeeRecord[];
  } catch (error) {
    console.error("Error fetching employees with complete details:", error);
    throw error;
  }
}

/**
 * Calculate attendance summary from day-wise data for an employee
 */
export function calculateAttendanceSummary(employee: EmployeeRecord): {
  totalDaysWorked: number;
  attendancePercentage: number;
} {
  const days = Array.from({ length: 27 }, (_, i) => {
    const key = `day${i + 1}` as keyof EmployeeRecord;
    return employee[key];
  }).filter((day) => day !== undefined && day !== null && day !== "");

  const totalDaysWorked = days.length;
  const presentDays = employee.presentDays || 0;
  const totalWorkingDays = presentDays + (employee.absentDays || 0);
  const attendancePercentage =
    totalWorkingDays > 0
      ? Math.round((presentDays / totalWorkingDays) * 100)
      : 0;

  return {
    totalDaysWorked,
    attendancePercentage,
  };
}

/**
 * Calculate salary breakdown with all deductions
 */
export function calculateSalaryBreakdown(employee: EmployeeRecord): {
  gross: number;
  totalDeductions: number;
  net: number;
  breakdownDetails: {
    employeePF?: number;
    employeeESIC?: number;
    employerPF?: number;
    employerESIC?: number;
    tds?: number;
    attendance?: number;
    penalty?: number;
  };
} {
  const gross = employee.grossSalary || 0;
  const employeePF = employee.employeeContribution || 0;
  const employeeESIC = employee.employeeEsic || 0;
  const employerPF = employee.employerContribution || 0;
  const employerESIC = employee.employerEsic || 0;
  const tds = employee.tds || 0;
  const attendanceDeduction = employee.attendanceDeduction || 0;
  const penalty = employee.penalty || 0;

  const totalDeductions =
    employeePF + employeeESIC + tds + attendanceDeduction + penalty;
  const net = employee.netSalary || gross - totalDeductions;

  return {
    gross,
    totalDeductions,
    net,
    breakdownDetails: {
      employeePF: employeePF || undefined,
      employeeESIC: employeeESIC || undefined,
      employerPF: employerPF || undefined,
      employerESIC: employerESIC || undefined,
      tds: tds || undefined,
      attendance: attendanceDeduction || undefined,
      penalty: penalty || undefined,
    },
  };
}

/**
 * Get employees with attendance below threshold
 */
export async function fetchEmployeesByAttendanceThreshold(
  threshold: number,
): Promise<EmployeeRecord[]> {
  try {
    const tablesDB = createTablesDBWithAuth();
    const response = await tablesDB.listRows({
      databaseId: DB_CONFIG.DATABASE_ID,
      tableId: DB_CONFIG.EMPLOYEES_TABLE_ID,
      queries: [Query.isNotNull("presentDays")],
    });

    const employees = response.rows as EmployeeRecord[];
    return employees.filter((emp) => {
      const summary = calculateAttendanceSummary(emp);
      return summary.attendancePercentage < threshold;
    });
  } catch (error) {
    console.error("Error fetching employees by attendance threshold:", error);
    throw error;
  }
}

/**
 * Fetch employee day-wise attendance record
 */
export function getEmployeeDayWiseAttendance(employee: EmployeeRecord): {
  day: number;
  status: string | null;
}[] {
  const dayWiseAttendance = [];

  for (let i = 1; i <= 27; i++) {
    const key = `day${i}` as keyof EmployeeRecord;
    const status = employee[key];

    dayWiseAttendance.push({
      day: i,
      status: (status as string) || null,
    });
  }

  return dayWiseAttendance;
}
