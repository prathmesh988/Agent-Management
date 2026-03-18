import { createDatabasesWithAuth, DB_CONFIG } from "./client";
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
  dateOfJoining?: number;
  uanNumber?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  paymentMode?: string;
  // Daily attendance fields (matching database schema: 1Sun-28Sat)
  "1Sun"?: string;
  "2Mon"?: string;
  "3Tue"?: string;
  "4Wed"?: string;
  "5Thu"?: string;
  "6Fri"?: string;
  "7Sat"?: string;
  "8Sun"?: string;
  "9Mon"?: string;
  "10Tue"?: string;
  "11Wed"?: string;
  "12Thu"?: string;
  "13Fri"?: string;
  "14Sat"?: string;
  "15Sun"?: string;
  "16Mon"?: string;
  "17Tue"?: string;
  "18Wed"?: string;
  "19Thu"?: string;
  "20Fri"?: string;
  "21Sat"?: string;
  "22Sun"?: string;
  "23Mon"?: string;
  "24Tue"?: string;
  "25Wed"?: string;
  "26Thu"?: string;
  "27Fri"?: string;
  "28Sat"?: string;
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
  tds5perc?: number;
  netSalary?: number;
  penalty?: number;
  paidAmount?: number;
}

/**
 * Fetch a single employee by ID (document ID or employeeId field)
 * Tries document ID first, then falls back to searching by employeeId field
 */
export async function fetchEmployee(
  documentId: string,
): Promise<EmployeeRecord | null> {
  try {
    const databases = createDatabasesWithAuth();
    console.log("🔍 Attempting to fetch employee with ID:", documentId);
    console.log("📦 Database ID:", DB_CONFIG.DATABASE_ID);
    console.log("📦 Collection ID:", DB_CONFIG.EMPLOYEES_COLLECTION_ID);
    
    // First, try to fetch by document ID
    try {
      const response = await databases.getDocument({
        databaseId: DB_CONFIG.DATABASE_ID,
        collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
        documentId: documentId,
      });
      console.log("✅ Successfully fetched employee by document ID:", response);
      return response as EmployeeRecord;
    } catch (docError) {
      console.log("⚠️ Document ID fetch failed, trying employeeId field search...");
    }

    // Fall back to searching by employeeId field
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [Query.equal("employeeId", documentId)],
    });

    if (response.documents && response.documents.length > 0) {
      console.log("✅ Successfully found employee by employeeId field:", response.documents[0]);
      return response.documents[0] as EmployeeRecord;
    }

    console.log("❌ Employee not found by document ID or employeeId:", documentId);
    return null;
  } catch (error) {
    console.error("❌ Error fetching employee:", error);
    return null;
  }
}

/**
 * Fetch all employees with optional pagination and filtering
 * Default limit is 5000 to support large bulk imports
 * Note: Appwrite Query.limit() has a max of 100 per request, so pagination is needed for >100
 */
export async function fetchAllEmployees(
  limit: number = 5000,
  offset: number = 0,
  queries: string[] = [],
): Promise<{ employees: EmployeeRecord[]; total: number }> {
  try {
    const databases = createDatabasesWithAuth();
    // Appwrite has a max limit of 100 per query, so paginate through results
    const actualLimit = Math.min(limit, 100);
    const paginatedQueries = [
      Query.limit(actualLimit),
      Query.offset(offset),
      ...queries,
    ];
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: paginatedQueries,
    });

    return {
      employees: response.documents as EmployeeRecord[],
      total: response.total,
    };
  } catch (error) {
    console.error("Error fetching all employees:", error);
    throw error;
  }
}

/**
 * Fetch ALL employees across multiple pages (handles >100 records)
 * Automatically paginates through all results
 */
export async function fetchAllEmployeesPaginated(
  queries: string[] = [],
): Promise<EmployeeRecord[]> {
  try {
    const databases = createDatabasesWithAuth();
    const allEmployees: EmployeeRecord[] = [];
    const pageSize = 100; // Appwrite max limit per request
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const paginatedQueries = [
        Query.limit(pageSize),
        Query.offset(offset),
        ...queries,
      ];

      const response = await databases.listDocuments({
        databaseId: DB_CONFIG.DATABASE_ID,
        collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
        queries: paginatedQueries,
      });

      allEmployees.push(...(response.documents as EmployeeRecord[]));
      offset += pageSize;

      // Check if there are more records to fetch
      hasMore = allEmployees.length < response.total;
    }

    return allEmployees;
  } catch (error) {
    console.error("Error fetching all employees paginated:", error);
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [
        Query.or([
          Query.search("name", searchTerm),
          Query.search("employeeId", searchTerm),
        ]),
      ],
    });

    return response.documents as EmployeeRecord[];
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [Query.equal("designation", designation)],
    });

    return response.documents as EmployeeRecord[];
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [Query.equal("process", process)],
    });

    return response.documents as EmployeeRecord[];
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [Query.isNotNull("netSalary")],
    });

    return response.documents as EmployeeRecord[];
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [Query.isNotNull("presentDays")],
    });

    return response.documents as EmployeeRecord[];
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [Query.isNotNull("employeeContribution")],
    });

    return response.documents as EmployeeRecord[];
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [
        Query.isNotNull("grossSalary"),
        Query.isNotNull("employeeContribution"),
      ],
    });

    return response.documents as EmployeeRecord[];
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
 * Update an employee record in the database
 */
export async function updateEmployee(
  documentId: string,
  updates: Partial<EmployeeRecord>,
): Promise<EmployeeRecord> {
  try {
    const databases = createDatabasesWithAuth();
    
    // Filter out undefined and read-only fields
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates)
        .filter(([key, value]) => {
          if (value === undefined) return false;
          if (key === '$id') return false;
          return true;
        })
    );
    
    const response = await databases.updateDocument({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      documentId: documentId,
      data: cleanedUpdates,
    });

    console.log("Successfully updated employee:", response);
    return response as EmployeeRecord;
  } catch (error) {
    console.error("Error updating employee:", error);
    throw error;
  }
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
    tds5perc?: number;
    attendance?: number;
    penalty?: number;
  };
} {
  const gross = employee.grossSalary || 0;
  const employeePF = employee.employeeContribution || 0;
  const employeeESIC = employee.employeeEsic || 0;
  const employerPF = employee.employerContribution || 0;
  const employerESIC = employee.employerEsic || 0;
  const tds5perc = employee.tds5perc || 0;
  const attendanceDeduction = employee.attendanceDeduction || 0;
  const penalty = employee.penalty || 0;

  const totalDeductions =
    employeePF + employeeESIC + tds5perc + attendanceDeduction + penalty;
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
      tds5perc: tds5perc || undefined,
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
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments({
      databaseId: DB_CONFIG.DATABASE_ID,
      collectionId: DB_CONFIG.EMPLOYEES_COLLECTION_ID,
      queries: [Query.isNotNull("presentDays")],
    });

    const employees = response.documents as EmployeeRecord[];
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
