/**
 * Database Service Module
 * Central export point for all database operations
 *
 * Usage:
 * ```
 * import { fetchAllEmployees, fetchCertificate } from '@/services/database';
 *
 * const employees = await fetchAllEmployees();
 * const cert = await fetchCertificate('cert-123');
 * ```
 */

// Client exports
export {
  createAppwriteClient,
  createDatabasesWithAuth,
  DB_CONFIG,
} from "./client";

// Employee exports
export {
  fetchEmployee,
  fetchAllEmployees,
  fetchAllEmployeesPaginated,
  searchEmployees,
  fetchEmployeesByDesignation,
  fetchEmployeesByProcess,
  getEmployeeCount,
  fetchEmployeesWithSalary,
  updateEmployee,
  type EmployeeRecord,
} from "./employees";
export type { Employee } from "@/lib/types";

// Certificate exports
export {
  fetchCertificate,
  fetchAllCertificates,
  searchCertificates,
  fetchCertificatesByEmployee,
  getCertificateCount,
  updateCertificate,
} from "./certificates";

// Leave exports
export {
  fetchAllLeaves,
  fetchAllLeavesPaginated,
  fetchLeavesByStatus,
  fetchLeavesByEmployee,
  createLeaveRequest,
  updateLeaveStatus,
  deleteLeaveRequest,
  getLeaveCountByStatus,
  searchLeaves,
} from "./leaves";
