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
import { getExactCertificateHTML } from "@/lib/pdf-generator";

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
