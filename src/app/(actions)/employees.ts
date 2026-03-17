"use server";

import {
  fetchAllEmployees as dbFetchAllEmployees,
  fetchEmployee as dbFetchEmployee,
  searchEmployees as dbSearchEmployees,
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
    designation: record.designation || "",
    dateOfJoining: record.dateOfJoining ? parseInt((record.dateOfJoining as unknown as string).toString()) : 0,
    ctc: record.netSalary || 0,
    
  };
}

/**
 * Server action: Fetch all employees from database
 */
export async function getEmployees(
  limit: number = 100,
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
