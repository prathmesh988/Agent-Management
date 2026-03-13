'use client';

import { useState } from 'react';
import { mockEmployees } from '@/lib/data/mock-data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Eye, Mail, FileText } from 'lucide-react';
import Link from 'next/link';

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter employees
  const filteredEmployees = mockEmployees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadCertificate = (employeeId: string, employeeName: string) => {
    console.log(`Downloading certificate for ${employeeName}`);
    // TODO: Implement PDF download functionality
  };

  const handleEmailCertificate = (employeeId: string, employeeName: string, email: string) => {
    console.log(`Sending certificate to ${email}`);
    // TODO: Implement email functionality
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Employee Certificates</h1>
        <p className="mt-2 text-slate-600">
          Generate and manage certificates of employment for your employees.
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Search Employees
            </label>
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="transition-all duration-200"
            />
          </div>
        </div>
      </Card>

      {/* Certificates Table */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Certificates ({filteredEmployees.length})
            </h2>
            <div className="flex gap-2">
              <Button className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105">
                <FileText className="h-4 w-4" />
                Generate All
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="transition-colors duration-200 hover:bg-slate-50"
                >
                  <TableCell className="font-medium">{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell className="text-slate-600">{employee.email}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {employee.joinDate}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/admin/certificates/${employee.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="transition-all duration-200 hover:scale-110 hover:bg-blue-100 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDownloadCertificate(employee.id, employee.name)
                        }
                        className="transition-all duration-200 hover:scale-110 hover:bg-green-100 hover:text-green-600"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleEmailCertificate(
                            employee.id,
                            employee.name,
                            employee.email
                          )
                        }
                        className="transition-all duration-200 hover:scale-110 hover:bg-purple-100 hover:text-purple-600"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="p-6 text-center text-slate-600">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-400" />
            <p>No employees found</p>
          </div>
        )}
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border border-blue-200">
        <div className="p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Certificate Features</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Generate certificates with employee details</li>
            <li>• Download as PDF or print directly</li>
            <li>• Email certificates to employees</li>
            <li>• Track certificate generation history</li>
            <li>• Customize certificate templates</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
