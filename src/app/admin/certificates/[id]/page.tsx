'use client';

import CertificateOfEmployment from '@/components/certificate/certificate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, Printer, Mail, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

// Dummy employee data for certificate preview
const dummyEmployee = {
  id: 'EMP00001',
  name: 'John Michael Johnson',
  email: 'john.johnson@company.com',
  department: 'Engineering',
  role: 'Senior Software Engineer',
  joinDate: '2022-03-15',
  status: 'active' as const,
  salary: 95000,
  phone: '+1 (555) 234-5678',
};

export default function CertificateDetailPage() {
  const certificateRef = useRef<HTMLDivElement>(null);
  const employee = dummyEmployee;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download using html2pdf or similar
    console.log('Downloading PDF for:', employee.name);
  };

  const handleEmailCertificate = () => {
    // TODO: Implement email sending
    console.log('Emailing certificate to:', employee.email);
  };

  const handleShareCertificate = () => {
    // TODO: Implement sharing functionality
    console.log('Sharing certificate for:', employee.name);
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
          <p className="mt-2 text-slate-600">{employee.name}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handlePrint}
            className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Download className="h-4 w-4" />
            Download PDF
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
          date={new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          employeeName={employee.name}
          startDate={employee.joinDate}
          jobTitle={employee.role}
          departmentName={employee.department}
          typeOfEmployment={employee.status === 'active' ? 'Full-time' : 'Part-time'}
          salaryAmount={`$${employee.salary?.toLocaleString() || '0'} per annum`}
          workHoursPerWeek="40 hours"
          employeeAddressLine1={employee.phone || '123 Employee Street'}
          employeePostalCode={`Email: ${employee.email}`}
          companyName="Our Company"
          certificateId={`CERT-${employee.id}-${new Date().getFullYear()}`}
          certifierName="HR Manager"
          certifierTitle="Human Resources Manager"
          contactPhone="+1 (555) 123-4567"
          contactEmail="hr@company.com"
          contactAddressLine1="123 Company Street"
          contactAddressLine2="City, State 12345"
        />
      </div>

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
