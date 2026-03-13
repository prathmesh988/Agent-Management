'use client';

import { Employee } from '@/lib/data/mock-data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EmployeeProfileProps {
  employee: Employee;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EmployeeProfile({
  employee,
  onEdit,
  onDelete,
}: EmployeeProfileProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/employees">
          <Button variant="outline" size="sm" className="transition-all duration-200 hover:shadow-md hover:scale-105">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button onClick={onEdit} variant="outline" className="transition-all duration-200 hover:shadow-md hover:scale-105">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            className="text-red-600 hover:text-red-700 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="p-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{employee.name}</h1>
            <p className="mt-2 text-slate-600">{employee.role}</p>

            <div className="mt-8 space-y-6">
              <div>
                <p className="text-sm font-medium text-slate-600">Employee ID</p>
                <p className="mt-1 text-lg text-slate-900">{employee.id}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600">Email</p>
                <p className="mt-1 text-lg text-slate-900">{employee.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600">Phone</p>
                <p className="mt-1 text-lg text-slate-900">{employee.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-600">Department</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {employee.department}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600">Status</p>
              <div className="mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    employee.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : employee.status === 'on-leave'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600">Join Date</p>
              <p className="mt-1 text-lg text-slate-900">{employee.joinDate}</p>
            </div>

            {employee.salary && (
              <div>
                <p className="text-sm font-medium text-slate-600">Salary</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  ${employee.salary.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
