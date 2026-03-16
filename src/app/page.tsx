"use client";

import { useState } from "react";
import { Certificate } from "@/hooks/useCertificates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DownloadCertificateBtn } from "@/components/ui/download-certificate-btn";

const DEFAULT_CERTIFICATE: Certificate = {
  id: "CERT-2024-001",
  certificateId: "CERT-2024-001",
  employeeName: "John Doe",
  employeeEmail: "john.doe@example.com",
  phone: "(555) 123-4567",
  companyName: "Acme Corporation",
  address: "123 Business Street",
  contactAddressLine1: "123 Business Street",
  contactAddressLine2: "Suite 100, City, State 12345",
  contactEmail: "contact@acme.com",
  contactPhone: "(123) 456-7890",
  jobTitle: "Senior Software Engineer",
  department: "Engineering",
  startDate: "January 15, 2020",
  typeOfEmployment: "Full-time",
  salary: "$150,000 - $170,000 annually",
  workHoursPerWeek: "40 hours",
  certifierName: "Jane Smith",
  certifierTitle: "Human Resources Manager",
};

export default function Home() {
  const [certificate, setCertificate] =
    useState<Certificate>(DEFAULT_CERTIFICATE);
  const [editMode, setEditMode] = useState(false);

  const handleInputChange = (field: keyof Certificate, value: string) => {
    setCertificate({ ...certificate, [field]: value });
  };

  const handleReset = () => {
    setCertificate(DEFAULT_CERTIFICATE);
    setEditMode(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Employee Certificate Generator
          </h1>
          <p className="text-gray-600">
            Create and download professional employment certificates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Details</CardTitle>
                <CardDescription>
                  {editMode
                    ? "Edit certificate information"
                    : "View certificate preview"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Information */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Certificate ID
                  </label>
                  <Input
                    value={certificate.certificateId}
                    onChange={(e) =>
                      handleInputChange("certificateId", e.target.value)
                    }
                    disabled={!editMode}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Employee Name
                  </label>
                  <Input
                    value={certificate.employeeName}
                    onChange={(e) =>
                      handleInputChange("employeeName", e.target.value)
                    }
                    disabled={!editMode}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Company Name
                  </label>
                  <Input
                    value={certificate.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    disabled={!editMode}
                  />
                </div>

                {/* Employment Details */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Employment Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Job Title
                      </label>
                      <Input
                        value={certificate.jobTitle}
                        onChange={(e) =>
                          handleInputChange("jobTitle", e.target.value)
                        }
                        disabled={!editMode}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Department
                      </label>
                      <Input
                        value={certificate.department}
                        onChange={(e) =>
                          handleInputChange("department", e.target.value)
                        }
                        disabled={!editMode}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Start Date
                      </label>
                      <Input
                        value={certificate.startDate}
                        onChange={(e) =>
                          handleInputChange("startDate", e.target.value)
                        }
                        disabled={!editMode}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Type of Employment
                      </label>
                      <Input
                        value={certificate.typeOfEmployment}
                        onChange={(e) =>
                          handleInputChange("typeOfEmployment", e.target.value)
                        }
                        disabled={!editMode}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Salary
                      </label>
                      <Input
                        value={certificate.salary}
                        onChange={(e) =>
                          handleInputChange("salary", e.target.value)
                        }
                        disabled={!editMode}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Work Hours (per week)
                      </label>
                      <Input
                        value={certificate.workHoursPerWeek}
                        onChange={(e) =>
                          handleInputChange("workHoursPerWeek", e.target.value)
                        }
                        disabled={!editMode}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Contact Information
                  </h3>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Address Line 1
                    </label>
                    <Input
                      value={certificate.contactAddressLine1}
                      onChange={(e) =>
                        handleInputChange("contactAddressLine1", e.target.value)
                      }
                      disabled={!editMode}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1 mt-3">
                      Address Line 2
                    </label>
                    <Input
                      value={certificate.contactAddressLine2}
                      onChange={(e) =>
                        handleInputChange("contactAddressLine2", e.target.value)
                      }
                      disabled={!editMode}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={certificate.contactEmail}
                        onChange={(e) =>
                          handleInputChange("contactEmail", e.target.value)
                        }
                        disabled={!editMode}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Phone
                      </label>
                      <Input
                        value={certificate.contactPhone}
                        onChange={(e) =>
                          handleInputChange("contactPhone", e.target.value)
                        }
                        disabled={!editMode}
                      />
                    </div>
                  </div>
                </div>

                {/* Certifier Information */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Certifier Information
                  </h3>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Certifier Name
                    </label>
                    <Input
                      value={certificate.certifierName}
                      onChange={(e) =>
                        handleInputChange("certifierName", e.target.value)
                      }
                      disabled={!editMode}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1 mt-3">
                      Certifier Title
                    </label>
                    <Input
                      value={certificate.certifierTitle}
                      onChange={(e) =>
                        handleInputChange("certifierTitle", e.target.value)
                      }
                      disabled={!editMode}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {editMode ? (
                    <>
                      <Button
                        onClick={() => setEditMode(false)}
                        className="flex-1"
                        variant="default"
                      >
                        Save Changes
                      </Button>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <DownloadCertificateBtn
                        certificate={certificate}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => setEditMode(true)}
                        variant="outline"
                        className="flex-1"
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Certificate Preview</CardTitle>
                <CardDescription>
                  How your certificate will look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-8 shadow-sm overflow-auto max-h-96">
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-600 text-xs">Certificate ID</p>
                        <p className="font-medium">
                          {certificate.certificateId}
                        </p>
                      </div>
                      <div className="w-20 h-20 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-xs text-blue-600">Logo</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900">
                        CERTIFICATE OF EMPLOYMENT
                      </h2>
                    </div>

                    <div className="text-gray-700 space-y-2">
                      <p>
                        This letter certifies that{" "}
                        <strong>{certificate.employeeName}</strong> is employed
                        by <strong>{certificate.companyName}</strong>.
                      </p>

                      <p>
                        {certificate.employeeName} has been working for this
                        organization since{" "}
                        <strong>{certificate.startDate}</strong> as a{" "}
                        <strong>{certificate.jobTitle}</strong>.
                      </p>

                      <table className="w-full text-xs mt-4">
                        <tbody>
                          {[
                            ["Position", certificate.jobTitle],
                            ["Department", certificate.department],
                            ["Hiring Date", certificate.startDate],
                            ["Position Type", certificate.typeOfEmployment],
                            ["Salary", certificate.salary],
                            ["Hours", certificate.workHoursPerWeek],
                          ].map(([label, value], idx) => (
                            <tr key={idx} className="border-b">
                              <td className="font-semibold text-gray-700 py-2">
                                {label}:
                              </td>
                              <td className="py-2">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-4 mt-4 border-t-2 text-xs">
                      <p className="font-semibold mb-2">Certified by:</p>
                      <p className="font-bold">
                        {(certificate.certifierName || "").toUpperCase()}
                      </p>
                      <p className="text-gray-600">
                        {certificate.certifierTitle}
                      </p>
                      <p className="text-gray-600 mt-2">
                        {certificate.contactPhone}
                      </p>
                      <p className="text-gray-600">
                        {certificate.contactEmail}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
