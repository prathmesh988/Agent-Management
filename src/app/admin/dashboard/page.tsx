"use client";

import { DashboardStatsCards } from "@/components/admin/dashboard-cards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEmployees } from "@/hooks/useEmployees";
import { mockAdmins } from "@/lib/data/mock-data";
import { Users, UserCheck, Shield, TrendingUp, ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function DashboardPage() {
  const { employees, isLoading } = useEmployees();

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const totalAdmins = mockAdmins.length;
  const totalSalary = employees.reduce(
    (sum, e) => sum + (e.grossSalary || 0),
    0,
  );
  const totalAttendance = employees.reduce(
    (sum, e) => sum + (e.presentDays || 0),
    0,
  );

  const newEmployeesThisMonth = employees.filter((e) => {
    const joinDate = new Date(e.dateOfJoining || 0);
    const now = new Date();
    return (
      joinDate.getMonth() === now.getMonth() &&
      joinDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: <Users className="h-6 w-6 text-white" />,
      trend: `${newEmployeesThisMonth} new this month`,
      color: "bg-blue-500",
      bgGradient: "from-blue-50 to-blue-100/50",
    },
    {
      title: "Active Employees",
      value: activeEmployees,
      icon: <UserCheck className="h-6 w-6 text-white" />,
      trend: `${totalEmployees > 0 ? ((activeEmployees / totalEmployees) * 100).toFixed(0) : 0}% active`,
      color: "bg-emerald-500",
      bgGradient: "from-emerald-50 to-emerald-100/50",
    },
    {
      title: "Admin Users",
      value: totalAdmins,
      icon: <Shield className="h-6 w-6 text-white" />,
      trend: "Fully configured",
      color: "bg-purple-500",
      bgGradient: "from-purple-50 to-purple-100/50",
    },
    {
      title: "Total Attendance",
      value: totalAttendance,
      icon: <TrendingUp className="h-6 w-6 text-white" />,
      trend: `Avg: ${totalEmployees > 0 ? (totalAttendance / totalEmployees).toFixed(1) : 0} days`,
      color: "bg-amber-500",
      bgGradient: "from-amber-50 to-amber-100/50",
    },
  ];

  const recentEmployees = employees.slice(0, 5);

  // Generate avatar with initials
  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

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

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <DashboardStatsCards stats={stats} />

      {/* Salary Overview */}
      <Card className="p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Salary Overview
        </h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-600">Total Monthly Salary</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              ₹{totalSalary.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">
              Average Salary per Employee
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              ₹
              {totalEmployees > 0
                ? (totalSalary / totalEmployees).toFixed(0)
                : 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Employees on Payroll</p>
            <p className="mt-2 text-2xl font-bold text-purple-600">
              {totalEmployees}
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Employees
          </h2>
          <Link href="/admin/employees">
            <Button variant="ghost" size="sm" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <p className="text-slate-600">Loading employees...</p>
          </div>
        ) : recentEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600">No employees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEmployees.map((employee, idx) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full ${getAvatarColor(idx)} flex items-center justify-center text-white text-xs font-600`}
                        >
                          {getInitials(employee.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {employee.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {employee.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {employee.department || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {employee.designation || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {employee.dateOfJoining || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-900">
                      ₹
                      {employee.grossSalary
                        ? (employee.grossSalary / 1000).toFixed(1)
                        : 0}
                      K
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {employee.presentDays || 0} days
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                          employee.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : employee.status === "on-leave"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            employee.status === "active"
                              ? "bg-emerald-600"
                              : employee.status === "on-leave"
                                ? "bg-amber-600"
                                : "bg-rose-600"
                          }`}
                        />
                        {employee.status
                          ? employee.status.charAt(0).toUpperCase() +
                            employee.status.slice(1)
                          : "N/A"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
