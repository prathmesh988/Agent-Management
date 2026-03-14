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
import { Download, FileText, Award, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

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

  const handleEditCertificate = (employeeId: string, employeeName: string) => {
    console.log(`Editing certificate for ${employeeName}`);
    // TODO: Implement edit functionality
  };

  const handleDeleteCertificate = (
    employeeId: string,
    employeeName: string,
  ) => {
    console.log(`Deleting certificate for ${employeeName}`);
    // TODO: Implement delete functionality
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
      {/* Header */}
      <div>
        <h1 className="text-4xl font-900 text-slate-950">
          Employee Certificates
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Generate and manage certificates of employment for your employees.
        </p>
      </div>

      {/* Search and Filter - Aligned */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-500 text-slate-700">Search</label>
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 transition-all duration-200"
          />
        </div>
        {searchTerm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="transition-all duration-200"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Certificates Table */}
      <Card className="border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-600 text-slate-900">
              Certificates ({filteredEmployees.length})
            </h2>
            <Button
              className="gap-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white font-500"
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
              <TableRow className="border-b border-slate-200 bg-slate-50">
                <TableHead className="w-12 py-4 px-6 text-left">
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
                  Job Title
                </TableHead>
                <TableHead className="py-4 px-6 text-left font-500 text-slate-700 text-sm">
                  Join Date
                </TableHead>
                <TableHead className="py-4 px-6 text-right font-500 text-slate-700 text-sm">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee, idx) => (
                <TableRow
                  key={employee.id}
                  className="border-b border-slate-100 transition-colors duration-200 hover:bg-slate-50"
                >
                  <TableCell className="py-4 px-6 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(employee.id)}
                      onChange={() => toggleSelection(employee.id)}
                      className="rounded border-slate-300 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="py-4 px-6 text-left">
                    <div className="flex items-center gap-3">
                      <div
                        className={`shrink-0 h-10 w-10 rounded-full ${getAvatarColor(idx)} flex items-center justify-center text-white text-sm font-700`}
                      >
                        {getInitials(employee.name)}
                      </div>
                      <div>
                        <p className="font-600 text-slate-900 text-sm leading-tight">
                          {employee.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {employee.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-left text-sm text-slate-700">
                    {employee.department}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-left text-sm text-slate-700">
                    {employee.role}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-left text-sm text-slate-600">
                    {employee.joinDate}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/certificates/${employee.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                          title="Edit Certificate"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteCertificate(employee.id, employee.name)
                        }
                        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                        title="Delete Certificate"
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

        {filteredEmployees.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-700 font-500">No employees found</p>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search filters
            </p>
          </div>
        )}
      </Card>

      {/* Features Info */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
        <div className="p-8">
          <div className="flex gap-3 mb-6">
            <Award className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
            <h3 className="font-600 text-slate-900 text-lg">
              Certificate Management
            </h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-500 text-slate-900 mb-1">
                ✓ Generate certificates
              </p>
              <p className="text-slate-600">
                with employee details for selected records
              </p>
            </div>
            <div>
              <p className="font-500 text-slate-900 mb-1">✓ Download as PDF</p>
              <p className="text-slate-600">
                Save and print certificates directly
              </p>
            </div>
            <div>
              <p className="font-500 text-slate-900 mb-1">
                ✓ Email certificates
              </p>
              <p className="text-slate-600">
                Send directly to employee mailboxes
              </p>
            </div>
            <div>
              <p className="font-500 text-slate-900 mb-1">✓ Bulk operations</p>
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
