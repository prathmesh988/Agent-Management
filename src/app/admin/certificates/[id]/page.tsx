"use client";

import CertificateOfEmployment from "@/components/certificate/certificate";
import { EditCertificateModal } from "@/components/certificate/edit-certificate-modal";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Printer,
  Mail,
  Share2,
  Edit2,
  Copy,
  Check,
  FileText,
  User,
  Building2,
  Loader2,
} from "lucide-react";
import { Certificate } from "@/lib/types";
import { getEmployee } from "@/app/(actions)/employees";
import { useCertificates } from "@/hooks/useCertificates";
import Link from "next/link";
import { useRef, useState, useEffect, use } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import { getExactCertificateHTML } from "@/lib/certificate-html-generator";
import { getCertificateShareUrl } from "@/app/(actions)/share-certificate";
import { sendCertificateEmail } from "@/app/(actions)/send-certificate";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CertificateDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { updateCertificate } = useCertificates();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareDialog, setShareDialog] = useState<{
    open: boolean;
    url?: string;
    loading: boolean;
    copied: boolean;
  }>({ open: false, loading: false, copied: false });
  const [emailDialog, setEmailDialog] = useState<{
    open: boolean;
    recipientEmail: string;
    subject: string;
    body: string;
    loading: boolean;
    certificateUrl?: string;
  }>({
    open: false,
    recipientEmail: "",
    subject: "",
    body: "",
    loading: false,
  });

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        const employee = await getEmployee(resolvedParams.id);

        if (!employee) {
          setCertificate(null);
          setPageLoading(false);
          return;
        }

        const dateOfJoining = employee.dateOfJoining
          ? new Date(employee.dateOfJoining).toLocaleDateString()
          : "";

        const certData: Certificate = {
          id: employee.id,
          employeeId: employee.employeeId,
          employeeName: employee.name,
          employeeEmail: employee.email,
          jobTitle: employee.designation,
          department: employee.department,
          startDate: dateOfJoining,
          salary: employee.ctc?.toString(),
          companyName: "Company Name",
          address: "Company Address",
        };

        setCertificate(certData);
        setEmailDialog((prev) => ({
          ...prev,
          recipientEmail: certData.employeeEmail || "",
          subject: `Your Employment Certificate - ${certData.employeeName || ""}`,
          body: `Dear ${certData.employeeName || ""},\n\nPlease find your Certificate of Employment attached.\n\nBest regards,\nHuman Resources Department`,
        }));
      } catch (error) {
        console.error("Error loading certificate:", error);
        setCertificate(null);
      } finally {
        setPageLoading(false);
      }
    };

    loadCertificate();
  }, [resolvedParams.id]);

  if (pageLoading) {
    return <PageLoader message="Loading certificate…" className="h-96" />;
  }

  if (!certificate) {
    return (
      <div className="space-y-6">
        <Link href="/admin/certificates">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Certificates
          </Button>
        </Link>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-foreground font-semibold text-lg">Certificate not found</p>
          <p className="text-muted-foreground text-sm">ID: {resolvedParams.id}</p>
        </div>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    try {
      if (!certificate) return;
      setIsDownloading(true);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please disable popup blocker to download certificate");
        setIsDownloading(false);
        return;
      }
      printWindow.document.write(getExactCertificateHTML(certificate, true));
      printWindow.document.close();
      setIsDownloading(false);
    } catch (error) {
      console.error("Error opening print preview:", error);
      alert("Failed to open print preview");
      setIsDownloading(false);
    }
  };

  const handleEmailCertificate = async () => {
    if (!certificate) return;
    setEmailDialog((prev) => ({ ...prev, open: true, loading: true }));
    try {
      let shareUrl = shareDialog.url;
      if (!shareUrl) {
        const result = await getCertificateShareUrl(certificate);
        if (result.success && result.shareUrl) shareUrl = result.shareUrl;
      }
      setEmailDialog((prev) => ({ ...prev, loading: false, certificateUrl: shareUrl }));
    } catch {
      setEmailDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleShareCertificate = async () => {
    if (!certificate) return;
    setShareDialog({ open: true, loading: true, copied: false });
    try {
      const result = await getCertificateShareUrl(certificate);
      if (result.success && result.shareUrl) {
        setShareDialog({ open: true, url: result.shareUrl, loading: false, copied: false });
      } else {
        alert(`Failed to generate share URL: ${result.error || "Unknown error"}`);
        setShareDialog({ open: false, loading: false, copied: false });
      }
    } catch {
      alert("Failed to generate share URL. Please try again.");
      setShareDialog({ open: false, loading: false, copied: false });
    }
  };

  const handleEditSave = async (updatedCertificate: Certificate) => {
    try {
      await updateCertificate(updatedCertificate);
      setCertificate(updatedCertificate);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving certificate:", error);
      alert("Failed to update certificate. Please try again.");
    }
  };

  const handleSendEmail = async () => {
    if (!certificate || !emailDialog.recipientEmail) {
      alert("Please enter a recipient email address");
      return;
    }
    if (!certificate.employeeId) {
      alert("Employee ID is missing");
      return;
    }
    setEmailDialog((prev) => ({ ...prev, loading: true }));
    try {
      const result = await sendCertificateEmail({
        employeeId: certificate.employeeId,
        senderEmail: emailDialog.recipientEmail,
        employeeName: certificate.employeeName || "",
        certificateId: certificate.certificateId || `CERT-${certificate.employeeId}`,
      });
      if (result.success) {
        alert(`✓ Email sent successfully to ${emailDialog.recipientEmail}`);
        setEmailDialog((prev) => ({ ...prev, open: false, loading: false }));
      } else {
        alert(`⚠ Failed to send email: ${result.error || "Unknown error"}`);
        setEmailDialog((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      alert("Failed to send email. Please try again.");
      setEmailDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const initials = (certificate.employeeName || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Back Navigation ── */}
      <Link href="/admin/certificates">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Certificates
        </Button>
      </Link>

      {/* ── Hero Header ── */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
        {/* gradient band */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

        <div className="relative px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent rounded-full border-2 border-card flex items-center justify-center">
              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Certificate of Employment
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
              {certificate.employeeName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {certificate.jobTitle && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {certificate.jobTitle}
                </span>
              )}
              {certificate.department && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {certificate.department}
                </span>
              )}
              {certificate.employeeId && (
                <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                  {certificate.employeeId}
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* ── Action Panel ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Actions
        </p>
        <div className="flex flex-wrap gap-3">
          {/* Primary */}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Edit2 className="h-4 w-4" />
            Edit Certificate
          </Button>

          {/* Secondary group */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="gap-2 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              variant="outline"
              className="gap-2 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isDownloading ? "Opening..." : "Download PDF"}
            </Button>
            <Button
              onClick={handleEmailCertificate}
              variant="outline"
              className="gap-2 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
            <Button
              onClick={handleShareCertificate}
              variant="outline"
              className="gap-2 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
            >
              <Share2 className="h-4 w-4" />
              Share Link
            </Button>
          </div>
        </div>
      </div>

      {/* ── Certificate Preview ── */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/40 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Preview</span>
          <span className="ml-auto text-xs text-muted-foreground">Scroll to view full document</span>
        </div>
        <div ref={certificateRef} className="print:bg-white bg-background p-4 sm:p-8">
          <CertificateOfEmployment
            date={new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            employeeName={certificate.employeeName || ""}
            startDate={certificate.startDate || ""}
            jobTitle={certificate.jobTitle || ""}
            departmentName={certificate.department || ""}
            typeOfEmployment={certificate.typeOfEmployment || ""}
            salaryAmount={certificate.salary || ""}
            workHoursPerWeek={certificate.workHoursPerWeek || ""}
            employeeAddressLine1={certificate.phone || certificate.address || ""}
            employeePostalCode={`Email: ${certificate.employeeEmail || ""}`}
            companyName={certificate.companyName}
            certificateId={certificate.certificateId}
            certifierName={certificate.certifierName}
            certifierTitle={certificate.certifierTitle}
            contactPhone={certificate.contactPhone}
            contactEmail={certificate.contactEmail}
            contactAddressLine1={certificate.contactAddressLine1}
            contactAddressLine2={certificate.contactAddressLine2}
          />
        </div>
      </div>

      {/* ── Edit Modal ── */}
      <EditCertificateModal
        certificate={certificate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleEditSave}
      />

      {/* ── Share Dialog ── */}
      {shareDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShareDialog({ open: false, loading: false, copied: false })}
          />
          <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Share Certificate</h2>
                <p className="text-xs text-muted-foreground">Copy the link below to share</p>
              </div>
              <button
                onClick={() => setShareDialog({ open: false, loading: false, copied: false })}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {shareDialog.loading ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Generating shareable link…</p>
                </div>
              ) : shareDialog.url ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Share Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={shareDialog.url}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground font-mono truncate focus:outline-none"
                      />
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(shareDialog.url!);
                          setShareDialog((p) => ({ ...p, copied: true }));
                          setTimeout(() => setShareDialog((p) => ({ ...p, copied: false })), 2000);
                        }}
                        size="sm"
                        variant={shareDialog.copied ? "default" : "outline"}
                        className="gap-2 shrink-0 transition-all duration-200"
                      >
                        {shareDialog.copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                    ℹ️ This link is publicly accessible. The certificate PDF will be automatically generated and uploaded if it doesn't already exist.
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-border bg-muted/30">
              <Button variant="outline" onClick={() => setShareDialog({ open: false, loading: false, copied: false })}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Dialog ── */}
      {emailDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEmailDialog((p) => ({ ...p, open: false }))}
          />
          <div className="relative z-10 w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Send Certificate via Email</h2>
                <p className="text-xs text-muted-foreground">
                  Sending to {certificate?.employeeName}
                </p>
              </div>
              <button
                onClick={() => setEmailDialog((p) => ({ ...p, open: false }))}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Recipient */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailDialog.recipientEmail}
                  onChange={(e) => setEmailDialog((p) => ({ ...p, recipientEmail: e.target.value }))}
                  placeholder="employee@example.com"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Certificate URL */}
              {emailDialog.certificateUrl && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Certificate Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={emailDialog.certificateUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground font-mono truncate focus:outline-none"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(emailDialog.certificateUrl!);
                        alert("Certificate URL copied to clipboard!");
                      }}
                      size="sm"
                      variant="outline"
                      className="gap-2 shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}

              {/* Generating URL spinner */}
              {emailDialog.loading && !emailDialog.certificateUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  <p className="text-xs text-muted-foreground">Generating certificate URL…</p>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailDialog.subject}
                  onChange={(e) => setEmailDialog((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Message Body
                </label>
                <textarea
                  value={emailDialog.body}
                  onChange={(e) => setEmailDialog((p) => ({ ...p, body: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Info */}
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/15 text-xs text-muted-foreground">
                ℹ️ An email with the certificate will be sent to the recipient. If the certificate hasn't been generated yet, it will be created automatically.
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
              <Button variant="outline" onClick={() => setEmailDialog((p) => ({ ...p, open: false }))}>
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={emailDialog.loading || !emailDialog.recipientEmail}
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all duration-200"
              >
                {emailDialog.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:bg-white { background: white; }
          header, nav, .no-print { display: none; }
        }
      `}</style>
    </div>
  );
}
