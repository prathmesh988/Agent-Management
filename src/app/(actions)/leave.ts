"use server";

import {
  getOrCreateLeaveBalance,
  getAvailableBalance,
  updateLeaveTaken,
  getEmployeeLeaveBalances,
  getYearLeaveReport,
  type LeaveBalance,
  type LeaveType,
} from "@/services/database/leave-balance";
import {
  createLeaveRequest,
  getPendingLeaveRequests,
  getEmployeeLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getYearLeaveRequests,
  calculateLeaveDays,
  type LeaveRequest,
} from "@/services/database/leave-requests";
import { fetchAllEmployees } from "@/services/database/employees";

/**
 * Strip Appwrite metadata from LeaveRequest before returning to client.
 */
function cleanLeaveRequest(request: LeaveRequest): LeaveRequest {
  return {
    $id: request.$id,
    employeeId: request.employeeId,
    employeeName: request.employeeName,
    leaveType: request.leaveType,
    startDate: request.startDate,
    endDate: request.endDate,
    duration: request.duration,
    reason: request.reason,
    status: request.status,
    createdAt: request.createdAt,
    year: request.year,
    approvedBy: request.approvedBy,
    approvalDate: request.approvalDate,
  };
}

/**
 * Strip Appwrite metadata from LeaveBalance before returning to client.
 */
function cleanLeaveBalance(balance: LeaveBalance): LeaveBalance {
  return {
    $id: balance.$id,
    employeeId: balance.employeeId,
    year: balance.year,
    casualLeave: balance.casualLeave,
    sickLeave: balance.sickLeave,
    privilegeLeave: balance.privilegeLeave,
    maternityLeave: balance.maternityLeave,
    paternityLeave: balance.paternityLeave,
    casualLeaveTaken: balance.casualLeaveTaken,
    sickLeaveTaken: balance.sickLeaveTaken,
    privilegeLeaveTaken: balance.privilegeLeaveTaken,
    maternityLeaveTaken: balance.maternityLeaveTaken,
    paternityLeaveTaken: balance.paternityLeaveTaken,
    casualLeaveCarryForward: balance.casualLeaveCarryForward,
    privilegeLeaveCarryForward: balance.privilegeLeaveCarryForward,
    updatedAt: balance.updatedAt,
  };
}

/**
 * Apply for leave - creates a request and checks balance.
 */
export async function applyForLeaveAction(
  employeeId: string,
  employeeName: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string,
  reason: string
): Promise<{
  success: boolean;
  request?: LeaveRequest;
  error?: string;
  availableBalance?: number;
}> {
  try {
    const now = new Date();
    const year = now.getFullYear();

    // Check available balance
    const available = await getAvailableBalance(employeeId, year, leaveType);
    const duration = calculateLeaveDays(startDate, endDate);

    if (available < duration) {
      return {
        success: false,
        error: `Insufficient balance. Available: ${available} days, Requested: ${duration} days`,
        availableBalance: available,
      };
    }

    // Create request
    const request = await createLeaveRequest(
      employeeId,
      employeeName,
      leaveType,
      startDate,
      endDate,
      duration,
      reason
    );

    return { success: true, request: cleanLeaveRequest(request), availableBalance: available - duration };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error applying for leave:", error);
    return { success: false, error: msg };
  }
}

/**
 * Get pending approval requests.
 */
export async function getPendingRequestsAction(): Promise<LeaveRequest[]> {
  try {
    const requests = await getPendingLeaveRequests();
    return requests.map(cleanLeaveRequest);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return [];
  }
}

/**
 * Approve leave request and update balance.
 */
export async function approveLeaveAction(
  requestId: string,
  approverName: string
): Promise<{
  success: boolean;
  request?: LeaveRequest;
  error?: string;
}> {
  try {
    const request = await approveLeaveRequest(requestId, approverName);

    // Update balance - deduct from available
    await updateLeaveTaken(
      request.employeeId,
      request.year,
      request.leaveType,
      request.duration
    );

    return { success: true, request: cleanLeaveRequest(request) };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error approving leave:", error);
    return { success: false, error: msg };
  }
}

/**
 * Reject leave request.
 */
export async function rejectLeaveAction(
  requestId: string,
  approverName: string
): Promise<{
  success: boolean;
  request?: LeaveRequest;
  error?: string;
}> {
  try {
    const request = await rejectLeaveRequest(requestId, approverName);
    return { success: true, request: cleanLeaveRequest(request) };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error rejecting leave:", error);
    return { success: false, error: msg };
  }
}

/**
 * Get employee's leave balance.
 */
export async function getEmployeeLeaveBalanceAction(
  employeeId: string,
  year: number
): Promise<LeaveBalance | null> {
  try {
    const balance = await getEmployeeLeaveBalances(employeeId, year);
    return balance ? cleanLeaveBalance(balance) : null;
  } catch (error) {
    console.error("Error fetching leave balance:", error);
    return null;
  }
}

/**
 * Get employee's leave requests.
 */
export async function getEmployeeLeaveHistoryAction(
  employeeId: string
): Promise<LeaveRequest[]> {
  try {
    const requests = await getEmployeeLeaveRequests(employeeId);
    return requests.map(cleanLeaveRequest);
  } catch (error) {
    console.error("Error fetching leave history:", error);
    return [];
  }
}

/**
 * Get leave ledger for all employees in a year.
 */
export async function getLeaveReportAction(year: number): Promise<
  Array<{
    employeeId: string;
    employeeName: string;
    balance: LeaveBalance;
    requests: LeaveRequest[];
  }>
> {
  try {
    const result = await fetchAllEmployees();
    const employees = result.employees || [];

    const ledger = [];

    for (const emp of employees) {
      if (!emp.employeeId) continue;

      const balance = await getEmployeeLeaveBalances(emp.employeeId, year);
      const requests = await getEmployeeLeaveRequests(emp.employeeId);

      ledger.push({
        employeeId: emp.employeeId,
        employeeName: emp.name || "",
        balance: cleanLeaveBalance(balance),
        requests: requests
          .filter((r) => r.year === year)
          .map(cleanLeaveRequest),
      });
    }

    return ledger;
  } catch (error) {
    console.error("Error fetching leave report:", error);
    return [];
  }
}

/**
 * Get all employees for leave management.
 */
export async function getAllEmployeesAction(): Promise<
  Array<{ employeeId: string; name: string }>
> {
  try {
    const result = await fetchAllEmployees();
    return (result.employees || []).map((emp) => ({
      employeeId: emp.employeeId || "",
      name: emp.name || "",
    }));
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
}

/**
 * Get leave statistics.
 */
export async function getLeaveStatisticsAction(year: number): Promise<{
  totalEmployees: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalLeaveTaken: number;
}> {
  try {
    // Get all leave requests for the year (single query)
    let requests: LeaveRequest[] = [];
    try {
      requests = await getYearLeaveRequests(year);
    } catch (error) {
      console.error("Error fetching year leave requests:", error);
      // Fallback to empty list
      requests = [];
    }

    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;

    // Calculate total leave taken from requests instead of iterating employees
    let totalTaken = 0;
    const requestsByEmployee = new Map<string, LeaveRequest[]>();
    
    for (const req of requests) {
      if (req.status === "approved") {
        if (!requestsByEmployee.has(req.employeeId)) {
          requestsByEmployee.set(req.employeeId, []);
        }
        requestsByEmployee.get(req.employeeId)!.push(req);
      }
    }

    for (const reqs of requestsByEmployee.values()) {
      for (const req of reqs) {
        totalTaken += req.duration;
      }
    }

    return {
      totalEmployees: requestsByEmployee.size,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      totalLeaveTaken: totalTaken,
    };
  } catch (error) {
    console.error("Error fetching leave statistics:", error);
    return {
      totalEmployees: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalLeaveTaken: 0,
    };
  }
}
