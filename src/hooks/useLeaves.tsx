"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import {
  getLeaveRequests,
  applyLeave as applyLeaveAction,
  approveLeave as approveLeaveAction,
  rejectLeave as rejectLeaveAction,
  removeLeave as removeLeaveAction,
  getLeaveStats,
} from "@/app/(actions)/leaves";
import { LeaveRequest, LeaveStatus, LeaveType } from "@/lib/types";

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface LeaveContextType {
  leaves: LeaveRequest[];
  pendingLeaves: LeaveRequest[];
  approvedLeaves: LeaveRequest[];
  rejectedLeaves: LeaveRequest[];
  stats: LeaveStats;
  isLoading: boolean;
  applyLeave: (data: {
    employeeId: string;
    employeeName: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
  }) => Promise<void>;
  approveLeave: (leaveId: string, reviewerName: string, remarks?: string) => Promise<void>;
  rejectLeave: (leaveId: string, reviewerName: string, remarks?: string) => Promise<void>;
  deleteLeave: (leaveId: string) => Promise<void>;
  refreshLeaves: () => Promise<void>;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export function LeaveProvider({ children }: { children: ReactNode }) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allLeaves, leaveStats] = await Promise.all([
        getLeaveRequests(),
        getLeaveStats(),
      ]);
      setLeaves(allLeaves);
      setStats(leaveStats);
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const pendingLeaves = leaves.filter((l) => l.status === "pending");
  const approvedLeaves = leaves.filter((l) => l.status === "approved");
  const rejectedLeaves = leaves.filter((l) => l.status === "rejected");

  const applyLeave = async (data: {
    employeeId: string;
    employeeName: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
  }) => {
    const newLeave = await applyLeaveAction(data);
    setLeaves((prev) => [newLeave, ...prev]);
    setStats((prev) => ({
      ...prev,
      pending: prev.pending + 1,
      total: prev.total + 1,
    }));
  };

  const handleApprove = async (
    leaveId: string,
    reviewerName: string,
    remarks?: string,
  ) => {
    const updated = await approveLeaveAction(leaveId, reviewerName, remarks);
    setLeaves((prev) =>
      prev.map((l) => (l.$id === leaveId || l.id === leaveId ? updated : l)),
    );
    setStats((prev) => ({
      ...prev,
      pending: Math.max(0, prev.pending - 1),
      approved: prev.approved + 1,
    }));
  };

  const handleReject = async (
    leaveId: string,
    reviewerName: string,
    remarks?: string,
  ) => {
    const updated = await rejectLeaveAction(leaveId, reviewerName, remarks);
    setLeaves((prev) =>
      prev.map((l) => (l.$id === leaveId || l.id === leaveId ? updated : l)),
    );
    setStats((prev) => ({
      ...prev,
      pending: Math.max(0, prev.pending - 1),
      rejected: prev.rejected + 1,
    }));
  };

  const handleDelete = async (leaveId: string) => {
    await removeLeaveAction(leaveId);
    const deleted = leaves.find((l) => l.$id === leaveId || l.id === leaveId);
    setLeaves((prev) =>
      prev.filter((l) => l.$id !== leaveId && l.id !== leaveId),
    );
    if (deleted) {
      setStats((prev) => ({
        ...prev,
        [deleted.status]: Math.max(0, (prev[deleted.status as keyof LeaveStats] as number) - 1),
        total: Math.max(0, prev.total - 1),
      }));
    }
  };

  return (
    <LeaveContext.Provider
      value={{
        leaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        stats,
        isLoading,
        applyLeave,
        approveLeave: handleApprove,
        rejectLeave: handleReject,
        deleteLeave: handleDelete,
        refreshLeaves: fetchAll,
      }}
    >
      {children}
    </LeaveContext.Provider>
  );
}

export function useLeaves() {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error("useLeaves must be used within LeaveProvider");
  }
  return context;
}
