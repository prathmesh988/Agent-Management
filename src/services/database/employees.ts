import { createTablesDBWithAuth, DB_CONFIG } from "./client";
import { Query } from "node-appwrite";

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
  employerContribution?: number;
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
