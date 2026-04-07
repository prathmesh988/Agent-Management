"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type LeaveType } from "@/services/database/leave-balance";
import { applyForLeaveAction } from "@/app/(actions)/leave";

interface LeaveApplicationFormProps {
  employeeId: string;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "CL", label: "Casual Leave" },
  { value: "SL", label: "Sick Leave" },
  { value: "PL", label: "Privilege Leave" },
  { value: "ML", label: "Maternity Leave" },
  { value: "PTL", label: "Paternity Leave" },
];

export function LeaveApplicationForm({
  employeeId,
  employeeName,
  open,
  onOpenChange,
  onSuccess,
}: LeaveApplicationFormProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>("CL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await applyForLeaveAction(
        employeeId,
        employeeName,
        leaveType,
        startDate,
        endDate,
        reason
      );

      if (result.success) {
        setMessage({ type: "success", text: "Leave application submitted successfully" });
        setStartDate("");
        setEndDate("");
        setReason("");
        setLeaveType("CL");
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to submit application" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while submitting" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Apply for Leave</AlertDialogTitle>
          <AlertDialogDescription>
            Submit a leave request for {employeeName}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Leave Type</label>
            <Select value={leaveType} onValueChange={(value) => setLeaveType(value as LeaveType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for leave..."
              required
            />
          </div>

          {message && (
            <div
              className={`p-2 rounded-md text-xs ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
