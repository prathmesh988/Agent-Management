'use client';

import { DashboardStatsCards } from '@/components/admin/dashboard-cards';
import { Card } from '@/components/ui/card';
import { mockEmployees, mockAdmins } from '@/lib/data/mock-data';
import { Users, UserCheck, Shield, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function DashboardPage() {
  const totalEmployees = mockEmployees.length;
  const activeEmployees = mockEmployees.filter((e) => e.status === 'active').length;
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
      title: 'Total Employees',
      value: totalEmployees,
      icon: <Users className="h-6 w-6 text-white" />,
      trend: '+12% from last month',
      color: 'bg-blue-500',
    },
    {
      title: 'Active Employees',
      value: activeEmployees,
      icon: <UserCheck className="h-6 w-6 text-white" />,
      trend: `${((activeEmployees / totalEmployees) * 100).toFixed(0)}% active`,
      color: 'bg-green-500',
    },
    {
      title: 'Admin Users',
      value: totalAdmins,
      icon: <Shield className="h-6 w-6 text-white" />,
      trend: 'Fully configured',
      color: 'bg-purple-500',
    },
    {
      title: 'New This Month',
      value: newEmployeesThisMonth,
      icon: <TrendingUp className="h-6 w-6 text-white" />,
      trend: 'Recent hires',
      color: 'bg-orange-500',
    },
  ];

  const recentEmployees = mockEmployees.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Welcome back! Here's what's happening with your employees.
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStatsCards stats={stats} />

      {/* Recent Activity */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Employees</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {employee.joinDate}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : employee.status === 'on-leave'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
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
