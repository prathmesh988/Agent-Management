"use client";

import CertificateOfEmployment from "@/components/certificate/certificate";
import { EditCertificateModal } from "@/components/certificate/edit-certificate-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Download,
  Printer,
  Mail,
  Share2,
  Edit2,
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
import { Copy, Check } from "lucide-react";

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
    recipientEmail: certificate?.employeeEmail || "",
    subject: `Your Employment Certificate - ${certificate?.employeeName || ""}`,
    body: `Dear ${certificate?.employeeName || ""},\n\nPlease find your Certificate of Employment attached.\n\nBest regards,\nHuman Resources Department`,
    loading: false,
  });

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        // Fetch employee data using the ID parameter
        const employee = await getEmployee(resolvedParams.id);
        
        if (!employee) {
          setCertificate(null);
          setPageLoading(false);
          return;
        }

        // Transform employee data to certificate format
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
    return (
      <PageLoader message="Loading certificate…" className="h-96" />
    );
  }

  if (!certificate) {
    return (
      <div className="space-y-6">
        <Link href="/admin/certificates">
          <Button
            variant="outline"
            size="sm"
            className="transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Certificates
          </Button>
        </Link>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-red-600 font-medium">Certificate not found</p>
          <p className="text-slate-600 text-sm">ID: {resolvedParams.id}</p>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      if (!certificate) return;
      setIsDownloading(true);
      
      // Create a new window with print-friendly certificate
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please disable popup blocker to download certificate");
        setIsDownloading(false);
        return;
      }

      const htmlContent = getExactCertificateHTML(certificate, true);

      printWindow.document.write(htmlContent);
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

    // Open modal and check if we need to generate the URL
    setEmailDialog((prev) => ({
      ...prev,
      open: true,
      recipientEmail: certificate.employeeEmail || "",
      subject: `Your Employment Certificate - ${certificate.employeeName || ""}`,
      body: `Dear ${certificate.employeeName || ""},\n\nPlease find your Certificate of Employment attached.\n\nBest regards,\nHuman Resources Department`,
      loading: true,
    }));

    try {
      // Check if we already have a share URL, if not generate one
      let shareUrl = shareDialog.url;
      
      if (!shareUrl) {
        const result = await getCertificateShareUrl(certificate);
        if (result.success && result.shareUrl) {
          shareUrl = result.shareUrl;
        }
      }

      setEmailDialog((prev) => ({
        ...prev,
        loading: false,
        certificateUrl: shareUrl,
      }));
    } catch (error) {
      console.error("Error generating certificate URL:", error);
      setEmailDialog((prev) => ({
        ...prev,
        loading: false,
      }));
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
        alert(`Failed to generate share URL: ${result.error || 'Unknown error'}`);
        setShareDialog({ open: false, loading: false, copied: false });
      }
    } catch (error) {
      console.error('Error sharing certificate:', error);
      alert('Failed to generate share URL. Please try again.');
      setShareDialog({ open: false, loading: false, copied: false });
    }
  };

  const handleEditSave = async (updatedCertificate: Certificate) => {
    try {
      await updateCertificate(updatedCertificate);
      setCertificate(updatedCertificate);
      setIsModalOpen(false);
      alert("Certificate updated successfully!");
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
        setEmailDialog((prev) => ({
          ...prev,
          open: false,
          loading: false,
        }));
      } else {
        alert(`⚠ Failed to send email: ${result.error || "Unknown error"}`);
        setEmailDialog((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again.");
      setEmailDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/certificates">
            <Button
              variant="outline"
              size="sm"
              className="transition-all duration-200 hover:shadow-md hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Certificates
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-4">
            Certificate of Employment
          </h1>
          <p className="mt-2 text-slate-600">{certificate.employeeName}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 bg-blue-600"
          >
            <Edit2 className="h-4 w-4" />
            Edit Certificate
          </Button>
          <Button
            onClick={handlePrint}
            className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            variant="outline"
            className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </Button>
          <Button
            onClick={handleEmailCertificate}
            variant="outline"
            className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
          <Button
            onClick={handleShareCertificate}
            variant="outline"
            className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </Card>

      {/* Certificate Preview */}
      <div ref={certificateRef} className="print:bg-white">
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

      {/* Edit Modal */}
      <EditCertificateModal
        certificate={certificate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleEditSave}
      />

      {/* Share URL Dialog */}
      {shareDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShareDialog({ open: false, loading: false, copied: false })}
          />
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Share2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Share Certificate
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Copy the link below to share
                </p>
              </div>
            </div>

            {/* Body */}
            {shareDialog.loading ? (
              <div className="px-6 py-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Generating shareable link...
                  </p>
                </div>
              </div>
            ) : shareDialog.url ? (
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Share Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareDialog.url}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(shareDialog.url!);
                        setShareDialog((prev) => ({ ...prev, copied: true }));
                        setTimeout(
                          () =>
                            setShareDialog((prev) => ({
                              ...prev,
                              copied: false,
                            })),
                          2000
                        );
                      }}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      {shareDialog.copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    ℹ️ This link is publicly accessible. The certificate PDF will be automatically generated and uploaded if it doesn't already exist.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
              <Button
                variant="outline"
                onClick={() => setShareDialog({ open: false, loading: false, copied: false })}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Sender Modal */}
      {emailDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEmailDialog((prev) => ({ ...prev, open: false }))}
          />
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Send Certificate via Email
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize and send the certificate to {certificate?.employeeName}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Recipient Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailDialog.recipientEmail}
                  onChange={(e) =>
                    setEmailDialog((prev) => ({
                      ...prev,
                      recipientEmail: e.target.value,
                    }))
                  }
                  placeholder="employee@example.com"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Certificate URL */}
              {emailDialog.certificateUrl && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Certificate Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={emailDialog.certificateUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 truncate"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(emailDialog.certificateUrl!);
                        alert("Certificate URL copied to clipboard!");
                      }}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}

              {emailDialog.loading && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Generating certificate URL...
                  </p>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailDialog.subject}
                  onChange={(e) =>
                    setEmailDialog((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Body Message */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Message Body
                </label>
                <textarea
                  value={emailDialog.body}
                  onChange={(e) =>
                    setEmailDialog((prev) => ({
                      ...prev,
                      body: e.target.value,
                    }))
                  }
                  rows={6}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Info Banner */}
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  ℹ️ An email with the certificate will be sent to the recipient. If the certificate hasn't been generated yet, it will be created automatically.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
              <Button
                variant="outline"
                onClick={() => setEmailDialog((prev) => ({ ...prev, open: false }))}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={emailDialog.loading || !emailDialog.recipientEmail}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {emailDialog.loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
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
          body {
            background: white;
          }
          .print\\:bg-white {
            background: white;
          }
          header, nav, .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
