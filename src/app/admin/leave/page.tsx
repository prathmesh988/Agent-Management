"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {LeaveRequestActions} from "@/components/admin/leave-request-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/ui/page-loader";
import {
  getLeaveRequests,
  applyLeave,
  approveLeave,
  rejectLeave,
  removeLeave,
  getLeaveStats,
} from "@/app/(actions)/leaves";
import { useEmployees } from "@/hooks/useEmployees";
import { LeaveRequest, LeaveStatus, LeaveType } from "@/lib/types";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Send,
  FileText,
  Users,
  AlertCircle,
  Trash2,
  Paperclip,
  Download,
  Upload,
  File,
} from "lucide-react";

// ─── Leave Type Labels ──────────────────────────────────────────────
const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  earned: "Earned Leave",
  unpaid: "Unpaid Leave",
  other: "Other",
};

const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  casual: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  sick: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  earned: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  unpaid: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  other: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    icon: <XCircle className="h-3 w-3" />,
  },
};

// ─── Helper ─────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function calculateDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

// ═════════════════════════════════════════════════════════════════════
// Apply Leave Modal
// ═════════════════════════════════════════════════════════════════════
function ApplyLeaveModal({
  open,
  onClose,
  onSubmit,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employeeId: string;
    employeeName: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
    attachmentIds?: string;
  }) => Promise<void>;
  employees: { id: string; name: string; employeeId: string }[];
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  const totalDays = startDate && endDate ? calculateDays(startDate, endDate) : 0;

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const reset = () => {
    setEmployeeId("");
    setEmployeeName("");
    setLeaveType("casual");
    setStartDate("");
    setEndDate("");
    setReason("");
    setSearchTerm("");
    setAttachedFiles([]);
    setUploadProgress("");
  };

  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles: File[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`"${file.name}" is not a supported file type. Allowed: PDF, Images, Word, Excel.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" exceeds the 30 MB limit.`);
        continue;
      }
      newFiles.push(file);
    }
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") return "📄";
    if (type.startsWith("image/")) return "🖼️";
    if (type.includes("word")) return "📝";
    if (type.includes("excel") || type.includes("spreadsheet")) return "📊";
    return "📎";
  };

  const handleSubmit = async () => {
    if (!employeeId || !startDate || !endDate || totalDays < 1) return;
    setIsSubmitting(true);
    try {
      let attachmentIds = "";

      // Upload files first if any
      if (attachedFiles.length > 0) {
        setUploadProgress(`Uploading ${attachedFiles.length} file(s)...`);
        const formData = new FormData();
        attachedFiles.forEach((file) => formData.append("files", file));

        const uploadRes = await fetch("/api/leave/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "File upload failed");
        }

        const uploadData = await uploadRes.json();
        attachmentIds = uploadData.files
          .map((f: { fileId: string; fileName: string }) => `${f.fileId}:${f.fileName}`)
          .join(",");
        setUploadProgress("");
      }

      await onSubmit({
        employeeId,
        employeeName,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason: reason || undefined,
        attachmentIds: attachmentIds || undefined,
      });
      reset();
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to submit leave request");
      setUploadProgress("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Apply for Leave
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit a new leave request
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Employee Search & Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Employee <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Search employee by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            {searchTerm && (
              <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                {filteredEmployees.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-slate-500">
                    No employees found
                  </p>
                ) : (
                  filteredEmployees.slice(0, 8).map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        setEmployeeId(emp.id);
                        setEmployeeName(emp.name);
                        setSearchTerm("");
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-between items-center ${
                        employeeId === emp.id
                          ? "bg-blue-50 dark:bg-blue-950/30"
                          : ""
                      }`}
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {emp.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {emp.employeeId}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
            {employeeName && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {employeeName}
                </span>
                <button
                  onClick={() => {
                    setEmployeeId("");
                    setEmployeeName("");
                  }}
                  className="ml-auto p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                >
                  <X className="h-3 w-3 text-blue-500" />
                </button>
              </div>
            )}
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="earned">Earned Leave</SelectItem>
                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Duration Badge */}
          {totalDays > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <CalendarDays className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {totalDays} {totalDays === 1 ? "day" : "days"}
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for leave..."
              rows={3}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Attachments
              <span className="text-xs font-normal text-slate-400 ml-1">(Optional — PDF, Images, Word, Excel up to 30 MB)</span>
            </label>

            {/* Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileSelect(e.dataTransfer.files);
              }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = ALLOWED_TYPES.join(",");
                input.onchange = (e) => {
                  handleFileSelect((e.target as HTMLInputElement).files);
                };
                input.click();
              }}
            >
              <Upload className={`h-6 w-6 mx-auto mb-2 ${isDragOver ? "text-blue-500" : "text-slate-400"}`} />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-blue-600 dark:text-blue-400">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, Images, Word, Excel
              </p>
            </div>

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 group"
                  >
                    <span className="text-base flex-shrink-0">{getFileIcon(file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {uploadProgress}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!employeeId || !startDate || !endDate || totalDays < 1 || isSubmitting}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Remarks Modal (for approve/reject)
// ═════════════════════════════════════════════════════════════════════
function RemarksModal({
  open,
  onClose,
  onConfirm,
  action,
  leaveName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => Promise<void>;
  action: "approve" | "reject";
  leaveName: string;
}) {
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(remarks);
      setRemarks("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const isApprove = action === "approve";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className={`flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700 ${
          isApprove
            ? "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30"
            : "bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30"
        }`}>
          <div className={`p-2 rounded-lg ${isApprove ? "bg-emerald-500" : "bg-rose-500"}`}>
            {isApprove ? (
              <CheckCircle2 className="h-4 w-4 text-white" />
            ) : (
              <XCircle className="h-4 w-4 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {isApprove ? "Approve" : "Reject"} Leave
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {leaveName}
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={isApprove ? "Any notes for the employee..." : "Reason for rejection..."}
              rows={3}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`gap-2 ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-rose-600 hover:bg-rose-700 text-white"
            }`}
          >
            {isApprove ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {isSubmitting
              ? "Processing..."
              : isApprove
                ? "Approve"
                : "Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Leave Table Component
// ═════════════════════════════════════════════════════════════════════
function LeaveTable({
  leaves,
  showActions,
  onApprove,
  onReject,
  onDelete,
  emptyMessage,
}: {
  leaves: LeaveRequest[];
  showActions?: boolean;
  onApprove?: (leave: LeaveRequest) => void;
  onReject?: (leave: LeaveRequest) => void;
  onDelete?: (leave: LeaveRequest) => void;
  emptyMessage: string;
}) {
  if (leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
          <FileText className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-base font-medium text-slate-600 dark:text-slate-400">
          {emptyMessage}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
          Leave requests will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            {!showActions && <TableHead>Reviewed By</TableHead>}
            {!showActions && <TableHead>Remarks</TableHead>}
            <TableHead>Applied On</TableHead>
            <TableHead>Attachments</TableHead>
            {(showActions || onDelete) && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => {
            const id = leave.$id || leave.id || "";
            return (
              <TableRow key={id} className="group">
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {leave.employeeName}
                    </p>
                    <p className="text-xs text-slate-500">{leave.employeeId}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      LEAVE_TYPE_COLORS[leave.leaveType] || LEAVE_TYPE_COLORS.other
                    }`}
                  >
                    {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {leave.totalDays} {leave.totalDays === 1 ? "day" : "days"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {leave.reason || "—"}
                  </p>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      STATUS_CONFIG[leave.status]?.color || ""
                    }`}
                  >
                    {STATUS_CONFIG[leave.status]?.icon}
                    {STATUS_CONFIG[leave.status]?.label || leave.status}
                  </span>
                </TableCell>
                {!showActions && (
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {leave.reviewedBy || "—"}
                  </TableCell>
                )}
                {!showActions && (
                  <TableCell className="max-w-[150px]">
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {leave.remarks || "—"}
                    </p>
                  </TableCell>
                )}
                <TableCell className="text-sm text-slate-500">
                  {formatDate(leave.appliedOn || "")}
                </TableCell>
                <TableCell>
                  {leave.attachmentIds ? (
                    <div className="flex flex-wrap gap-1">
                      {leave.attachmentIds.split(",").map((entry, idx) => {
                        const [fileId, ...nameParts] = entry.trim().split(":");
                        const fileName = nameParts.join(":") || `File ${idx + 1}`;
                        return (
                          <a
                            key={fileId}
                            href={`/api/leave/upload?fileId=${fileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            title={fileName}
                          >
                            <Paperclip className="h-3 w-3" />
                            <span className="max-w-[80px] truncate">{fileName}</span>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </TableCell>
                {(showActions || onDelete) && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {showActions && onApprove && (
                        <Button
                          size="sm"
                          onClick={() => onApprove(leave)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      )}
                      {showActions && onReject && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onReject(leave)}
                          className="gap-1.5 h-8 text-xs"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(leave)}
                          className="gap-1.5 h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Main Page Component
// ═════════════════════════════════════════════════════════════════════
export default function LeaveManagementPage() {
  const { employees } = useEmployees();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [remarksModal, setRemarksModal] = useState<{
    open: boolean;
    action: "approve" | "reject";
    leave: LeaveRequest | null;
  }>({ open: false, action: "approve", leave: null });

  const fetchLeaves = useCallback(async () => {
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
    fetchLeaves();
  }, [fetchLeaves]);

  const pendingLeaves = leaves.filter((l) => l.status === "pending");
  const approvedLeaves = leaves.filter((l) => l.status === "approved");
  const rejectedLeaves = leaves.filter((l) => l.status === "rejected");

  const handleApplyLeave = async (data: {
    employeeId: string;
    employeeName: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
    attachmentIds?: string;
  }) => {
    await applyLeave(data);
    await fetchLeaves();
  };

  const handleApproveClick = (leave: LeaveRequest) => {
    setRemarksModal({ open: true, action: "approve", leave });
  };

  const handleRejectClick = (leave: LeaveRequest) => {
    setRemarksModal({ open: true, action: "reject", leave });
  };

  const handleConfirmAction = async (remarks: string) => {
    const { action, leave } = remarksModal;
    if (!leave) return;
    const leaveId = leave.$id || leave.id || "";
    if (action === "approve") {
      await approveLeave(leaveId, "Admin", remarks);
    } else {
      await rejectLeave(leaveId, "Admin", remarks);
    }
    await fetchLeaves();
  };

  const handleDelete = async (leave: LeaveRequest) => {
    const leaveId = leave.$id || leave.id || "";
    if (confirm("Are you sure you want to delete this leave request?")) {
      await removeLeave(leaveId);
      await fetchLeaves();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Leave Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and track employee leave requests
          </p>
        </div>
        <Button
          onClick={() => setShowApplyModal(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Apply Leave
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Requests
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-200 dark:border-amber-800/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {stats.pending}
                </p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200 dark:border-emerald-800/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Approved
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.approved}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-rose-200 dark:border-rose-800/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Rejected
                </p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {stats.rejected}
                </p>
              </div>
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      {isLoading ? (
        <PageLoader message="Loading leave requests…" />
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-3.5 w-3.5" />
              Pending
              {stats.pending > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500 text-white min-w-[18px] text-center">
                  {stats.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved
              {stats.approved > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-white min-w-[18px] text-center">
                  {stats.approved}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-3.5 w-3.5" />
              Rejected
              {stats.rejected > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500 text-white min-w-[18px] text-center">
                  {stats.rejected}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>
                  Review and approve or reject employee leave requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaveTable
                  leaves={pendingLeaves}
                  showActions
                  onApprove={handleApproveClick}
                  onReject={handleRejectClick}
                  onDelete={handleDelete}
                  emptyMessage="No pending leave requests"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Approved Leaves
                </CardTitle>
                <CardDescription>
                  All approved leave requests with reviewer information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaveTable
                  leaves={approvedLeaves}
                  onDelete={handleDelete}
                  emptyMessage="No approved leave requests"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-rose-500" />
                  Rejected Leaves
                </CardTitle>
                <CardDescription>
                  Rejected leave requests with rejection details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaveTable
                  leaves={rejectedLeaves}
                  onDelete={handleDelete}
                  emptyMessage="No rejected leave requests"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSubmit={handleApplyLeave}
        employees={employees.map((e) => ({
          id: e.id,
          name: e.name,
          employeeId: e.employeeId,
        }))}
      />

      {/* Remarks Modal */}
      <RemarksModal
        open={remarksModal.open}
        onClose={() =>
          setRemarksModal({ open: false, action: "approve", leave: null })
        }
        onConfirm={handleConfirmAction}
        action={remarksModal.action}
        leaveName={remarksModal.leave?.employeeName || ""}
      />
    </div>
  );
}
