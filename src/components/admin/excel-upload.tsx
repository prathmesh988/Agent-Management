"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { usePagePermission } from "@/hooks/usePagePermission";

interface ExcelUploadComponentProps {
  onUpload?: (file: File) => void;
  isLoading?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDefaultMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function ExcelUploadComponent({
  onUpload,
  isLoading = false,
}: ExcelUploadComponentProps) {
  const { canWrite, loading } = usePagePermission("employees");
  const defaults = getDefaultMonthYear();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successSummary, setSuccessSummary] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(defaults.month);
  const [selectedYear, setSelectedYear] = useState<number>(defaults.year);
  const [isSingleSheet, setIsSingleSheet] = useState<boolean>(true);

  // Year range: 5 years back to 2 years ahead
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!validTypes.includes(file.type)) {
      setUploadStatus("error");
      setErrorMessage("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus("error");
      setErrorMessage("File size exceeds the 5MB limit.");
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const droppedFile = files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setUploadStatus("idle");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const selectedFile = files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setUploadStatus("idle");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadProgress(0);
    setErrorMessage("");
    setSuccessSummary("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isSingleSheet", String(isSingleSheet));
      if (isSingleSheet) {
        formData.append("month", String(selectedMonth));
        formData.append("year", String(selectedYear));
      } else {
        // For multiple sheets, still pass current month as fallback but API will detect from Excel
        formData.append("monthName", MONTHS[selectedMonth - 1]);
      }

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) { clearInterval(interval); return 90; }
          return prev + Math.random() * 30;
        });
      }, 500);

      const response = await fetch("/api/upload-employees", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      const data = await response.json();

      if (!response.ok) {
        console.error("Upload failed:", data);
        setUploadStatus("error");
        setErrorMessage(data.error || "Upload failed. Please try again.");
        setUploadProgress(0);
        return;
      }

      console.log("Upload successful:", data);
      setUploadProgress(100);
      setUploadStatus("success");

      const { summary } = data;
      if (summary) {
        setSuccessSummary(
          `${summary.inserted} inserted, ${summary.skipped} skipped` +
          (summary.attendanceUpdated != null ? `, ${summary.attendanceUpdated} attendance records updated` : "") +
          (summary.errors?.length ? `, ${summary.errors.length} errors` : "")
        );
      }

      onUpload?.(file);

      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        setUploadStatus("idle");
        setSuccessSummary("");
      }, 4000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setErrorMessage("A network error occurred. Please try again.");
      setUploadProgress(0);
    }
  };

  const canUpload = !!file && !isLoading && uploadStatus !== "success";

  return (
    <Card className="p-8 bg-background">
      {/* Sheet Type Selector */}
      <div className="mb-8 space-y-4">
        <p className="text-sm font-semibold text-foreground">
          How many months are in your sheet?
        </p>
        
        {/* Single Month Option */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="radio"
              name="sheetType"
              value="single"
              checked={isSingleSheet}
              onChange={() => setIsSingleSheet(true)}
              disabled={!canWrite || loading}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-foreground">Single Month Sheet</span>
          </label>
          
          {/* Month/Year selectors for single sheet */}
          {isSingleSheet && (
            <div className="ml-7 space-y-3">
              <p className="text-xs text-muted-foreground">
                Select the payroll month this sheet covers:
              </p>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    disabled={!canWrite || loading}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {MONTHS.map((name, i) => (
                      <option key={i + 1} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    disabled={!canWrite || loading}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/80 mt-2">
                💡 <span className="font-medium">Pro tip:</span> The system will first try to auto-detect the month from your file's sheet name (e.g., "March 2026"), then use these selections as fallback if detection fails.
              </p>
            </div>
          )}
        </div>

        {/* Multiple Months Option */}
        {/* <div className="border border-border rounded-lg p-4 bg-card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="sheetType"
              value="multiple"
              checked={!isSingleSheet}
              onChange={() => setIsSingleSheet(false)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-foreground">Multiple Months (Auto-detect from file)</span>
          </label>
          <p className="text-xs text-muted-foreground mt-2 ml-7">
            System will detect month and year from each sheet's name in your Excel file.
          </p>
        </div> */}
      </div>

      {/* Drag and Drop Area */}
      <div
        onDragEnter={canWrite && !loading ? handleDrag : undefined}
        onDragLeave={canWrite && !loading ? handleDrag : undefined}
        onDragOver={canWrite && !loading ? handleDrag : undefined}
        onDrop={canWrite && !loading ? handleDrop : undefined}
        onClick={canWrite && !loading ? () => document.getElementById("file-input")?.click() : undefined}
        className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
          !canWrite || loading
            ? "cursor-not-allowed border-slate-200 opacity-60 bg-slate-50 dark:bg-slate-900/30"
            : dragActive
            ? "border-primary bg-primary/10 shadow-lg scale-105 cursor-pointer"
            : "border-border bg-card hover:border-primary/60 hover:bg-primary/5 hover:shadow-md cursor-pointer"
        }`}
      >
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full opacity-20 blur-xl"></div>
          <Upload className="relative h-16 w-16 text-primary" />
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2">
          Drag and drop your file here
        </h3>
        <p className="text-sm text-muted-foreground mb-1">
          or click the button below to select from your computer
        </p>
        <p className="text-xs text-muted-foreground/70 mt-4">
          Supported formats: CSV, Excel (.xlsx, .xls) • Max size: 5MB
        </p>

        {/* Hidden Input */}
        <input
          type="file"
          id="file-input"
          onChange={handleChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />
      </div>

      {/* File Selection Button */}
      <div className="mt-8 flex gap-3">
        <label htmlFor="file-input" className="flex-1">
          <Button
            type="button"
            disabled={!canWrite || loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            Select File from Computer
          </Button>
        </label>
      </div>

      {/* Selected File Info */}
      {file && (
        <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">File selected</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">{file.name}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Size: {(file.size / 1024).toFixed(2)} KB &nbsp;|&nbsp;
                Month: {MONTHS[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Uploading in progress...</p>
            <p className="text-sm font-medium text-primary">{Math.round(uploadProgress)}%</p>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="bg-linear-to-r from-primary to-accent h-3 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus === "success" && (
        <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-4">
          <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Upload successful! 🎉</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              {file?.name} has been imported.
              {successSummary && <> &mdash; {successSummary}.</>}
            </p>
          </div>
        </div>
      )}

      {uploadStatus === "error" && (
        <div className="mt-8 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-4">
          <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">Upload failed</p>
            <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
              {errorMessage || "Please check file format and size. Maximum file size is 5MB."}
            </p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="mt-8">
        <Button
          onClick={handleUpload}
          disabled={!canUpload || !canWrite || loading}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading || (uploadProgress > 0 && uploadProgress < 100)
            ? "Uploading..."
            : `Upload File — ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
        </Button>
      </div>
    </Card>
  );
}
