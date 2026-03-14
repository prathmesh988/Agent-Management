"use client";

import { useState } from "react";
import { mockEmployees } from "@/lib/data/mock-data";
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
import {
  Download,
  Eye,
  Mail,
  FileText,
  MoreVertical,
  Award,
} from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

// Action dropdown component
function ActionDropdown({ employee, onDownload, onEmail }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-all duration-200 hover:text-slate-900"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10 overflow-hidden">
          <Link href={`/admin/certificates/${employee.id}`}>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors duration-200"
            >
              <Eye className="h-4 w-4 text-blue-600" />
              View Certificate
            </button>
          </Link>
          <button
            onClick={() => {
              onDownload(employee.id, employee.name);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors duration-200 border-t border-slate-200"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            Download PDF
          </button>
          <button
            onClick={() => {
              onEmail(employee.id, employee.name, employee.email);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors duration-200 border-t border-slate-200"
          >
            <Mail className="h-4 w-4 text-purple-600" />
            Send via Email
          </button>
        </div>
      )}
    </div>
  );
}

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter employees
  const filteredEmployees = mockEmployees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDownloadCertificate = (
    employeeId: string,
    employeeName: string,
  ) => {
    console.log(`Downloading certificate for ${employeeName}`);
    // TODO: Implement PDF download functionality
  };

  const handleEmailCertificate = (
    employeeId: string,
    employeeName: string,
    email: string,
  ) => {
    console.log(`Sending certificate to ${email}`);
    // TODO: Implement email functionality
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
      setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-800 text-slate-900">
          Employee Certificates
        </h1>
        <p className="mt-2 text-slate-600">
          Generate and manage certificates of employment for your employees.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 max-w-xs space-y-2">
          <label className="text-sm font-medium text-slate-700">Search</label>
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="transition-all duration-200"
          />
        </div>
        {searchTerm && (
          <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
            Clear
          </Button>
        )}
      </div>

      {/* Certificates Table */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Certificates ({filteredEmployees.length})
            </h2>
            <Button
              className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={selectedIds.size === 0}
            >
              <FileText className="h-4 w-4" />
              Generate Selected ({selectedIds.size})
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <div className="flex items-center">
                    <Checkbox
                      checked={
                        selectedIds.size === filteredEmployees.length &&
                        filteredEmployees.length > 0
                      }
                      onChange={toggleSelectAll}
                    />
                  </div>
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="transition-colors duration-200 hover:bg-slate-50"
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(employee.id)}
                      onChange={() => toggleSelection(employee.id)}
                      className="rounded border-slate-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center border border-blue-200">
                        <Award className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {employee.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {employee.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {employee.department}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {employee.role}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {employee.joinDate}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionDropdown
                      employee={employee}
                      onDownload={handleDownloadCertificate}
                      onEmail={handleEmailCertificate}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-600 font-medium">No employees found</p>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search filters
            </p>
          </div>
        )}
      </Card>

      {/* Features Info */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
        <div className="p-8">
          <div className="flex gap-3 mb-4">
            <Award className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <h3 className="font-semibold text-slate-900 text-lg">
              Certificate Management
            </h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div>
              <p className="font-medium mb-1">✓ Generate certificates</p>
              <p className="text-slate-600">
                with employee details for selected records
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">✓ Download as PDF</p>
              <p className="text-slate-600">
                Save and print certificates directly
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">✓ Email certificates</p>
              <p className="text-slate-600">
                Send directly to employee mailboxes
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">✓ Bulk operations</p>
              <p className="text-slate-600">
                Process multiple certificates at once
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
