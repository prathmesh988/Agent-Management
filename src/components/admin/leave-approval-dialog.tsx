"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type LeaveRequest } from "@/services/database/leave-requests";
import { approveLeaveAction, rejectLeaveAction } from "@/app/(actions)/leave";

interface LeaveApprovalDialogProps {
  request: LeaveRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  CL: "Casual Leave",
  SL: "Sick Leave",
  PL: "Privilege Leave",
  ML: "Maternity Leave",
  PTL: "Paternity Leave",
};

export function LeaveApprovalDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: LeaveApprovalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!request) return null;

  const startDate = new Date(request.startDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const endDate = new Date(request.endDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleApprove = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await approveLeaveAction(request.$id || "", "Admin");
      if (result.success) {
        setMessage({ type: "success", text: "Leave approved successfully" });
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to approve" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await rejectLeaveAction(request.$id || "", "Admin");
      if (result.success) {
        setMessage({ type: "success", text: "Leave rejected successfully" });
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to reject" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Review Leave Request</AlertDialogTitle>
          <AlertDialogDescription>
            Approve or reject the leave application
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Employee</p>
              <p className="font-medium text-sm">{request.employeeName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Leave Type</p>
              <p className="font-medium text-sm">{LEAVE_TYPE_LABELS[request.leaveType]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="font-medium text-sm">{startDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="font-medium text-sm">{endDate}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium text-sm">{request.duration} days</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Reason</p>
            <p className="p-2 bg-muted rounded text-sm">{request.reason}</p>
          </div>

          {message && (
            <div
              className={`p-2 rounded text-xs ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !!message}
            >
              Reject
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={loading || !!message}
            >
              Approve
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
