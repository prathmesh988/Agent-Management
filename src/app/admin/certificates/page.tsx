"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEmployees } from "@/hooks/useEmployees";
import { Employee } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Trash2, ChevronLeft, ChevronRight, Mail, Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 10;
import { sendCertificatesToMultiple, checkCertificatesInBucketAction } from "@/app/(actions)/send-certificate";

// Helper function to get initials
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Helper function to get avatar color
function getAvatarColor(index: number) {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  return colors[index % colors.length];
}

export default function CertificatesPage() {
  const router = useRouter();
  const { employees, updateEmployee, deleteEmployee, searchEmployees, isLoading } =
    useEmployees();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [isLoadingPdfs, setIsLoadingPdfs] = useState(true);
  const [certificatesInBucket, setCertificatesInBucket] = useState<Record<string, boolean>>({});

  // Fetch certificate status from bucket when page loads or employees change
  useEffect(() => {
    const fetchCertificateStatus = async () => {
      setIsLoadingPdfs(true);
      
      if (employees.length === 0) {
        console.log("No employees yet, skipping certificate check");
        setIsLoadingPdfs(false);
        return;
      }

      try {
        // Get employeeIds of all available employees
        const employeeIds = employees
          .map((emp) => emp.employeeId)
          .filter((id) => id != null);

        console.log("Fetching certificate status for employeeIds:", employeeIds);

        if (employeeIds.length === 0) {
          console.log("No employeeIds found");
          setIsLoadingPdfs(false);
          return;
        }

        // Check which certificates exist in bucket
        const result = await checkCertificatesInBucketAction(employeeIds);
        console.log("Certificate check result:", result);
        
        if (result.success && result.status) {
          setCertificatesInBucket(result.status);
          console.log("✓ Loaded certificate status from bucket:", result.status);
        } else {
          console.warn("Certificate check failed or returned empty status");
        }
      } catch (error) {
        console.error("✗ Error fetching certificate status:", error);
      } finally {
        setIsLoadingPdfs(false);
      }
    };

    fetchCertificateStatus();
  }, [employees]);
  const [searchResults, setSearchResults] = useState<Employee[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced server-side search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!searchTerm.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchEmployees(searchTerm.trim());
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm, searchEmployees]);

  // Use server results when available, otherwise show all employees
  const filteredEmployees = searchResults ?? employees;

  // Paginate
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const generateCertificateHTML = (certData: any) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: white; }
        .container { width: 8.5in; height: 11in; padding: 40px; background: white; position: relative; }
        .title { text-align: center; font-size: 32px; font-weight: bold; margin: 30px 0 40px 0; }
        .body { color: #333; line-height: 1.8; font-size: 14px; }
        .body p { margin: 15px 0; }
        .grid { margin: 30px 0; display: grid; grid-template-columns: 200px 1fr; gap: 10px 20px; }
        .label { font-weight: bold; }
        .footer { margin-top: 60px; padding-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 class="title">CERTIFICATE OF EMPLOYMENT</h2>
        <div class="body">
          <p>Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          <p>This letter certifies that <strong>${certData.employeeName}</strong> is employed by <strong>Airvincible</strong>.</p>
          <p><strong>${certData.employeeName}</strong> has been working since <strong>${certData.startDate}</strong> as <strong>${certData.jobTitle}</strong>.</p>
          <div class="grid">
            <div class="label">Position:</div>
            <div>${certData.jobTitle}</div>
            <div class="label">Department:</div>
            <div>${certData.department}</div>
            <div class="label">Salary:</div>
            <div>${certData.salary}</div>
          </div>
          <p style="margin-top: 30px;">For information, please contact HR.</p>
        </div>
        <div class="footer">
          <div style="border-top: 1px solid #999; padding-top: 10px;">
            <div style="font-weight: bold;">AUTHORIZED SIGNATORY</div>
            <div style="font-size: 12px; color: #666;">HR Manager</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const handleDownloadCertificate = (
    employeeId: string,
    name: string,
  ) => {
    try {
      const emp = employees.find((e) => e.id === employeeId);
      if (!emp) {
        alert("Employee not found");
        return;
      }

      setIsGenerating(true);
      const certData = {
        id: emp.id,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        jobTitle: emp.designation,
        department: emp.department,
        startDate: emp.dateOfJoining,
        salary: `₹${emp.ctc}`,
        certificateId: `CERT-${emp.employeeId}`,
      };

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please disable popup blocker to download certificate");
        setIsGenerating(false);
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificate - ${certData.employeeName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              background: white;
              color: #333;
            }
            .container {
              width: 8.5in;
              height: 11in;
              padding: 40px;
              background: white;
              position: relative;
              display: flex;
              flex-direction: column;
            }
            .top-graphic {
              position: absolute;
              top: 0;
              right: 0;
              width: 150px;
              height: 150px;
              opacity: 0.3;
            }
            .content {
              position: relative;
              z-index: 1;
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .header {
              margin-bottom: 40px;
            }
            .certificate-id {
              color: #666;
              font-size: 12px;
              margin-bottom: 10px;
            }
            .title {
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              color: #111;
              margin: 30px 0 40px 0;
              letter-spacing: 2px;
            }
            .body {
              color: #333;
              line-height: 1.8;
              font-size: 14px;
              flex: 1;
            }
            .body p {
              margin: 15px 0;
            }
            .details-grid {
              margin: 30px 0;
              display: grid;
              grid-template-columns: 200px 1fr;
              gap: 10px 20px;
            }
            .detail-label {
              font-weight: bold;
              color: #555;
            }
            .detail-value {
              color: #333;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #999;
            }
            .signature-line {
              border-top: 1px solid #999;
              padding-top: 10px;
              margin-top: 30px;
            }
            .signer-name {
              font-weight: bold;
              margin-top: 5px;
            }
            .signer-title {
              font-size: 12px;
              color: #666;
            }
            strong {
              font-weight: bold;
            }
            @page { margin: 0; size: letter; }
            @media print { body { padding: 0; } .container { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="container">
            <svg class="top-graphic" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M200 0L100 100L200 200V0Z" fill="#3B82F6"/>
              <path d="M200 0L150 50L200 100V0Z" fill="#1F2937"/>
            </svg>

            <div class="content">
              <div class="header">
                <div class="certificate-id">Certificate ID: ${certData.certificateId}</div>
              </div>

              <h2 class="title">CERTIFICATE OF EMPLOYMENT</h2>

              <div class="body">
                <p>Date: ${new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>

                <p>This letter certifies that <strong>${certData.employeeName}</strong> is employed by <strong>Airvincible</strong>.</p>

                <p><strong>${certData.employeeName}</strong> has been working for this organization since <strong>${certData.startDate}</strong> as a <strong>${certData.jobTitle}</strong>.</p>

                <div class="details-grid">
                  <div class="detail-label">Employee Position:</div>
                  <div class="detail-value">${certData.jobTitle}</div>

                  <div class="detail-label">Department:</div>
                  <div class="detail-value">${certData.department}</div>

                  <div class="detail-label">Hiring Date:</div>
                  <div class="detail-value">${certData.startDate}</div>

                  <div class="detail-label">Annual Salary:</div>
                  <div class="detail-value">${certData.salary}</div>
                </div>

                <p style="margin-top: 30px;">For any additional information, please contact me.</p>
              </div>

              <div class="footer">
                <div class="signature-line">
                  <div class="signer-name">AUTHORIZED SIGNATORY</div>
                  <div class="signer-title">HR Manager</div>
                </div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      console.log(`Opened print preview for ${name}`);
      setIsGenerating(false);
    } catch (error) {
      console.error("Error opening print preview:", error);
      alert("Failed to open print preview");
      setIsGenerating(false);
    }
  };

  const handleGenerateSelected = async () => {
    try {
      if (selectedIds.size === 0) {
        alert("Please select at least one employee");
        return;
      }

      const selectedEmps = employees.filter(
        (e) => e.id && selectedIds.has(e.id),
      );

      setIsGenerating(true);

      // Prepare certificate data for API
      const certificatesData = selectedEmps.map((emp) => ({
        id: emp.id,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        jobTitle: emp.designation,
        department: emp.department,
        startDate: emp.dateOfJoining,
        salary: `₹${emp.ctc}`,
        certificateId: `CERT-${emp.employeeId}`,
      }));

      console.log(
        `Sending ${certificatesData.length} certificates to API for generation`,
      );

      // Call API to generate ZIP with PDFs
      const response = await fetch("/api/certificates/download-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ certificates: certificatesData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `API error: ${response.statusText}`,
        );
      }

      // Get ZIP blob and trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Certificates_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // After successful generation, check which certificates are in bucket
      // Use employeeId as the lookup key (new naming: {employeeId}.pdf)
      const employeeIds = certificatesData.map((c) => c.employeeId);
      const bucketCheckResult = await checkCertificatesInBucketAction(employeeIds);
      if (bucketCheckResult.success && bucketCheckResult.status) {
        setCertificatesInBucket((prev) => ({ ...prev, ...bucketCheckResult.status }));
      }

      console.log(`Successfully downloaded ZIP with ${selectedEmps.length} certificates`);
    } catch (error) {
      console.error("Error generating certificates:", error);
      alert(
        `Failed to generate certificates: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToMail = async () => {
    try {
      if (selectedIds.size === 0) {
        alert("Please select at least one employee");
        return;
      }

      const selectedEmps = employees.filter(
        (e) => e.id && selectedIds.has(e.id),
      );

      // Check if all selected employees have certificates in bucket
      // Now using employeeId directly (new naming: {employeeId}.pdf)
      const employeeIds = selectedEmps.map((e) => e.employeeId);
      const missingCerts = employeeIds.filter((id) => !certificatesInBucket[id]);

      if (missingCerts.length > 0) {
        alert(
          `Certificates not found in bucket for some employees. Please generate them first.`
        );
        return;
      }

      // Validate emails
      const invalidEmails = selectedEmps.filter(
        (e) => !e.email || !e.email.includes("@")
      );
      if (invalidEmails.length > 0) {
        alert(
          `Invalid email addresses for: ${invalidEmails.map((e) => e.name).join(", ")}`
        );
        return;
      }

      setIsSendingEmails(true);

      // Prepare email data
      const emailParams = selectedEmps.map((emp) => ({
        employeeId: emp.employeeId,
        employeeEmail: emp.email!,
        employeeName: emp.name!,
        certificateId: `CERT-${emp.employeeId}`, // Kept for compatibility but download uses employeeId
      }));

      // Call server action to send emails
      const result = await sendCertificatesToMultiple(emailParams);

      if (result.success) {
        alert(
          `✓ Emails sent successfully!\n${result.summary || "All emails sent."}`
        );
      } else if (result.results && Array.isArray(result.results)) {
        const failedEmails = result.results
          .filter((r) => !r.success)
          .map((r) => r.email)
          .join(", ");
        alert(
          `⚠ Some emails failed to send: ${failedEmails}\n\nSuccessful: ${result.successCount || 0}/${emailParams.length}`
        );
      } else {
        alert(`⚠ Failed to send emails: ${result.error || "Unknown error"}`);
      }

      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error sending emails:", error);
      alert(
        `Failed to send emails: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSendingEmails(false);
    }
  };

  const areAllSelectedInBucket = () => {
    if (selectedIds.size === 0) return false;
    
    const selectedEmps = employees.filter((e) => e.id && selectedIds.has(e.id));
    
    // Debug logging
    console.log("Selected employees:", selectedEmps.map(e => ({ name: e.name, employeeId: e.employeeId })));
    console.log("Certificate bucket status:", certificatesInBucket);
    console.log("Checking each:", selectedEmps.map(e => ({
      name: e.name,
      employeeId: e.employeeId,
      inBucket: certificatesInBucket[e.employeeId!]
    })));
    
    // Now using employeeId directly (new naming: {employeeId}.pdf)
    const allInBucket = selectedEmps.every((e) => e.employeeId && certificatesInBucket[e.employeeId]);
    console.log("All selected in bucket?", allInBucket);
    
    return allInBucket;
  };

  const handleDeleteEmployee = (employeeId: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteEmployee(employeeId);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmployees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(
          filteredEmployees
            .map((e) => e.id)
            .filter((id): id is string => id !== undefined),
        ),
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden gap-4 pb-4">
      {/* Search and Filter - Aligned */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Search</label>
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-72 bg-white transition-all duration-200 focus-visible:ring-blue-500"
          />
        </div>
        {searchTerm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="transition-all duration-200 h-10 shrink-0"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Certificates Table Card */}
      <Card className="flex flex-col flex-1 min-h-0 border-0 shadow-sm sm:border sm:shadow">
        <div className="p-4 sm:p-6 border-b border-slate-200 shrink-0 bg-slate-50/50">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <h2 className="text-lg font-600 text-slate-900">
                Generate Certificates ({filteredEmployees.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateSelected}
                  className="w-full sm:w-auto gap-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white font-500"
                  disabled={selectedIds.size === 0 || isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {isGenerating
                    ? "Generating..."
                    : `Generate Selected (${selectedIds.size})`}
                </Button>
                <Button
                  onClick={handleSendToMail}
                  className="gap-2 transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 text-white font-500"
                  disabled={
                    !areAllSelectedInBucket() ||
                    selectedIds.size === 0 ||
                    isSendingEmails ||
                    isLoadingPdfs
                  }
                  title={
                    isLoadingPdfs
                      ? "Loading certificate status..."
                      : areAllSelectedInBucket()
                        ? "Send certificates to selected employees"
                        : "Generate certificates first before sending"
                  }
                >
                  {isSendingEmails ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {isSendingEmails
                    ? "Sending..."
                    : `Send to Mail (${selectedIds.size})`}
                </Button>
              </div>
            </div>
            
            {/* Loading PDF status indicator */}
            {isLoadingPdfs && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                <span>Checking certificate storage...</span>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center flex-1">
            <p className="text-slate-600">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 flex-1 flex flex-col items-center justify-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-700 font-500">No employees found</p>
            <p className="text-sm text-slate-500 mt-1">
              {searchTerm
                ? "Try a different search term"
                : "Add employees to generate certificates"}
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 relative bg-white">
            <div className="absolute inset-0 overflow-auto">
              <Table className="w-full relative">
                <TableHeader className="sticky top-0 bg-slate-100 z-10 shadow-sm">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="w-12 py-3 px-4 sm:px-6 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === filteredEmployees.length &&
                        filteredEmployees.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="py-4 px-6 text-left font-500 text-slate-700 text-sm">
                    Employee
                  </TableHead>
                  <TableHead className="py-4 px-6 text-left font-500 text-slate-700 text-sm">
                    Department
                  </TableHead>
                  <TableHead className="py-4 px-6 text-left font-500 text-slate-700 text-sm">
                    Designation
                  </TableHead>
                  <TableHead className="py-4 px-6 text-left font-500 text-slate-700 text-sm">
                    Join Date
                  </TableHead>
                  <TableHead className="py-4 px-6 text-left font-500 text-slate-700 text-sm">
                    Salary
                  </TableHead>
                    <TableHead className="py-3 px-4 sm:px-6 text-right font-semibold text-slate-700 text-xs tracking-wider uppercase">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {paginatedEmployees.map((emp, idx) => (
                    <TableRow
                      key={emp.id}
                      onClick={() => router.push(`/admin/certificates/${emp.id}`)}
                      className="transition-colors duration-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <TableCell className="py-4 px-4 sm:px-6 text-left w-12 shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(emp.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelection(emp.id);
                        }}
                        className="rounded border-slate-300 cursor-pointer"
                      />
                    </TableCell>
                      <TableCell className="py-4 px-4 sm:px-6 text-left min-w-0">
                        <div className="flex items-center gap-3">
                          <div
                            className={`shrink-0 h-10 w-10 rounded-full ${getAvatarColor(idx)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}
                          >
                            {getInitials(emp.name || "")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm leading-tight truncate">
                              {emp.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {emp.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 sm:px-6 text-left text-sm text-slate-700">
                      {emp.department || "N/A"}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-left text-sm text-slate-700">
                      {emp.designation || "N/A"}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-left text-sm text-slate-600">
                      {emp.dateOfJoining || "N/A"}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-left text-sm text-slate-600">
                      ₹
                      {emp.ctc
                        ? (emp.ctc / 1000).toFixed(1)
                        : 0}
                      K
                    </TableCell>
                      <TableCell className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            emp.id &&
                            emp.name &&
                            handleDownloadCertificate(emp.id, emp.name)
                          }
                          disabled={isGenerating || !emp.id}
                          className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors duration-200"
                          title="Download Certificate PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            emp.id &&
                            emp.name &&
                            handleDeleteEmployee(emp.id, emp.name)
                          }
                          className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                          title="Remove Employee"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        {/* Pagination Footer - Added inside Card, below table */}
        {(filteredEmployees.length > 0 && !isLoading) && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 shrink-0 bg-white gap-3 sm:gap-0 mt-auto">
            <p className="text-xs sm:text-sm text-slate-600 shrink-0">
              Showing <span className="font-medium text-slate-900">{startIndex + 1}</span> to{" "}
              <span className="font-medium text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, filteredEmployees.length)}</span> of{" "}
              <span className="font-medium text-slate-900">{filteredEmployees.length}</span> employees
            </p>
            <div className="flex gap-1 items-center">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {(() => {
                // Mobile: extremely simplified pagination to avoid squishing
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                
                const pages: (number | "ellipsis")[] = [];
                const maxVisiblePages = isMobile ? 3 : 5;
                
                if (totalPages <= maxVisiblePages) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > (isMobile ? 2 : 3)) pages.push("ellipsis");
                  
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + (isMobile ? 0 : 1));
                  
                  for (let i = start; i <= end; i++) pages.push(i);
                  
                  if (currentPage < totalPages - (isMobile ? 1 : 2)) pages.push("ellipsis");
                  pages.push(totalPages);
                }
                
                return pages.map((page, idx) =>
                  page === "ellipsis" ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="transition-all duration-200 hover:scale-105 min-w-[2rem]"
                    >
                      {page}
                    </Button>
                  )
                );
              })()}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
