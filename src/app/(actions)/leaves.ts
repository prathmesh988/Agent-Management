"use server";

import {
  fetchAllLeavesPaginated,
  fetchLeavesByStatus as dbFetchLeavesByStatus,
  createLeaveRequest as dbCreateLeaveRequest,
  updateLeaveStatus as dbUpdateLeaveStatus,
  deleteLeaveRequest as dbDeleteLeaveRequest,
  getLeaveCountByStatus as dbGetLeaveCountByStatus,
} from "@/services/database";
import { LeaveRequest, LeaveStatus, LeaveType } from "@/lib/types";

/**
 * Server action: Fetch all leave requests, optionally filtered by status
 */
export async function getLeaveRequests(
  status?: LeaveStatus,
): Promise<LeaveRequest[]> {
  try {
    if (status) {
      return await dbFetchLeavesByStatus(status);
    }
    return await fetchAllLeavesPaginated();
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    throw error;
  }
}

/**
 * Server action: Apply for leave (creates a new leave request with pending status)
 */
export async function applyLeave(data: {
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  attachmentIds?: string;
}): Promise<LeaveRequest> {
  try {
    const leaveData = {
      ...data,
      status: "pending" as LeaveStatus,
      appliedOn: new Date().toISOString(),
    };

    return await dbCreateLeaveRequest(leaveData);
  } catch (error) {
    console.error("Error applying for leave:", error);
    throw error;
  }
}

/**
 * Server action: Approve a leave request
 */
export async function approveLeave(
  leaveId: string,
  reviewerName: string,
  remarks?: string,
): Promise<LeaveRequest> {
  try {
    return await dbUpdateLeaveStatus(leaveId, "approved", reviewerName, remarks);
  } catch (error) {
    console.error("Error approving leave:", error);
    throw error;
  }
}

/**
 * Server action: Reject a leave request
 */
export async function rejectLeave(
  leaveId: string,
  reviewerName: string,
  remarks?: string,
): Promise<LeaveRequest> {
  try {
    return await dbUpdateLeaveStatus(leaveId, "rejected", reviewerName, remarks);
  } catch (error) {
    console.error("Error rejecting leave:", error);
    throw error;
  }
}

/**
 * Server action: Delete a leave request
 */
export async function removeLeave(leaveId: string): Promise<void> {
  try {
    await dbDeleteLeaveRequest(leaveId);
  } catch (error) {
    console.error("Error deleting leave:", error);
    throw error;
  }
}

/**
 * Server action: Get leave stats (counts by status)
 */
export async function getLeaveStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> {
  try {
    return await dbGetLeaveCountByStatus();
  } catch (error) {
    console.error("Error getting leave stats:", error);
    return { pending: 0, approved: 0, rejected: 0, total: 0 };
  }
}
