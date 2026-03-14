"use client";

import { DashboardStatsCards } from "@/components/admin/dashboard-cards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockEmployees, mockAdmins } from "@/lib/data/mock-data";
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
  const totalEmployees = mockEmployees.length;
  const activeEmployees = mockEmployees.filter(
    (e) => e.status === "active",
  ).length;
  const totalAdmins = mockAdmins.length;
  const newEmployeesThisMonth = mockEmployees.filter((e) => {
    const joinDate = new Date(e.joinDate);
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
      trend: "+12% from last month",
      color: "bg-blue-500",
      bgGradient: "from-blue-50 to-blue-100/50",
    },
    {
      title: "Active Employees",
      value: activeEmployees,
      icon: <UserCheck className="h-6 w-6 text-white" />,
      trend: `${((activeEmployees / totalEmployees) * 100).toFixed(0)}% active`,
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
      title: "New This Month",
      value: newEmployeesThisMonth,
      icon: <TrendingUp className="h-6 w-6 text-white" />,
      trend: "Recent hires",
      color: "bg-amber-500",
      bgGradient: "from-amber-50 to-amber-100/50",
    },
  ];

  const recentEmployees = mockEmployees.slice(0, 5);

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
      {/* Header */}
      <div>
        <h1 className="text-4xl font-800 text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Welcome back! Here's what's happening with your employees.
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStatsCards stats={stats} />

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

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Join Date</TableHead>
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
                        <p className="text-xs text-slate-500">{employee.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {employee.joinDate}
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
                      {employee.status.charAt(0).toUpperCase() +
                        employee.status.slice(1)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
