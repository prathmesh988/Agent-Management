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
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-600">Loading certificate...</p>
      </div>
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

      // Generate clean HTML for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificate of Employment - ${certificate.employeeName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              background: white;
              padding: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
              .certificate-container {
                box-shadow: none;
              }
            }
            .certificate-container {
              width: 100%;
              max-width: 8.5in;
              height: 11in;
              padding: 40px;
              background: white;
              margin: 0 auto;
              position: relative;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .top-graphic {
              position: absolute;
              top: 0;
              right: 0;
              width: 150px;
              height: 150px;
            }
            .header {
              margin-bottom: 50px;
              position: relative;
              z-index: 1;
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
            .body-content {
              color: #333;
              line-height: 1.8;
              font-size: 14px;
            }
            .body-content p {
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
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              padding-top: 30px;
            }
            .signature-section {
              flex: 1;
            }
            .signature-line {
              color: #999;
              font-size: 12px;
              margin-bottom: 30px;
            }
            .signer-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .signer-title {
              font-size: 12px;
              color: #666;
            }
            .contact-section {
              flex: 1;
              text-align: right;
              font-size: 12px;
              color: #666;
            }
            .contact-section p {
              margin: 8px 0;
            }
            a {
              color: #0066cc;
              text-decoration: none;
            }
            @page {
              margin: 0;
              size: letter;
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <svg class="top-graphic" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M200 0L100 100L200 200V0Z" fill="#3B82F6" fill-opacity="0.8"/>
              <path d="M200 0L150 50L200 100V0Z" fill="#1F2937"/>
              <rect x="130" y="40" width="30" height="30" transform="rotate(45 130 40)" fill="#1F2937"/>
            </svg>

            <div class="header">
              <div class="certificate-id">Certificate ID: ${certificate.certificateId || "XXXX-XXXX-XXXX"}</div>
            </div>

            <h2 class="title">CERTIFICATE OF EMPLOYMENT</h2>

            <div class="body-content">
              <p>Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              <div style="margin: 20px 0;">
                <p>${certificate.employeeName || ""}</p>
                <p>${certificate.contactAddressLine1 || ""}</p>
              </div>

              <p>This letter certifies that <strong>${certificate.employeeName}</strong> is employed by <strong>Airvincible</strong>.</p>
              <p><strong>${certificate.employeeName}</strong> has been working for this organization since <strong>${certificate.startDate}</strong> as a <strong>${certificate.jobTitle}</strong>.</p>

              <div class="details-grid">
                <div class="detail-label">Employee Position:</div>
                <div class="detail-value">${certificate.jobTitle || "N/A"}</div>

                <div class="detail-label">Department:</div>
                <div class="detail-value">${certificate.department || "N/A"}</div>

                <div class="detail-label">Hiring Date:</div>
                <div class="detail-value">${certificate.startDate || "N/A"}</div>

                <div class="detail-label">Annual Salary:</div>
                <div class="detail-value">${certificate.salary || "N/A"}</div>

                <div class="detail-label">Work Hours Per Week:</div>
                <div class="detail-value">${certificate.workHoursPerWeek || "40 hours"}</div>
              </div>

              <p style="margin-top: 30px;">For any additional information, please contact me.</p>
            </div>

            <div class="footer">
              <div class="signature-section">
                <div class="signature-line">_____________________</div>
                <div class="signer-name">${certificate.certifierName || "AUTHORIZED SIGNATORY"}</div>
                <div class="signer-title">${certificate.certifierTitle || "HR Manager"}</div>
              </div>

              <div class="contact-section">
                <p><span style="font-weight: bold;">Phone:</span> ${certificate.contactPhone || "N/A"}</p>
                <p><span style="font-weight: bold;">Email:</span> <a href="mailto:${certificate.contactEmail}">${certificate.contactEmail || "N/A"}</a></p>
                <p><span style="font-weight: bold;">Address:</span> ${certificate.contactAddressLine1 || "N/A"}</p>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              // Automatically print after page loads
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setIsDownloading(false);
    } catch (error) {
      console.error("Error opening print preview:", error);
      alert("Failed to open print preview");
      setIsDownloading(false);
    }
  };

  const handleEmailCertificate = () => {
    console.log("Emailing certificate to:", certificate.employeeEmail);
  };

  const handleShareCertificate = () => {
    console.log("Sharing certificate for:", certificate.employeeName);
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
