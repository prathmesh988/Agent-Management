"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeaveApplicationForm } from '@/components/admin/leave-application-form';
import { LeaveApprovalDialog } from '@/components/admin/leave-approval-dialog';
import {
  getPendingRequestsAction,
  getLeaveStatisticsAction,
  getEmployeeLeaveHistoryAction,
  getEmployeeLeaveBalanceAction,
  getAllEmployeesAction,
} from '@/app/(actions)/leave';
import { type LeaveRequest } from '@/services/database/leave-requests';
import { type LeaveBalance } from '@/services/database/leave-balance';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  CL: 'Casual Leave',
  SL: 'Sick Leave',
  PL: 'Privilege Leave',
  ML: 'Maternity Leave',
  PTL: 'Paternity Leave',
};

export default function LeaveManagementPage() {
  const [applyFormOpen, setApplyFormOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [employeeLedger, setEmployeeLedger] = useState<{
    balance: LeaveBalance;
    history: LeaveRequest[];
  } | null>(null);

  const loadData = async () => {
    try {
      const year = new Date().getFullYear();
      const [pending, stats_data, emps] = await Promise.all([
        getPendingRequestsAction(),
        getLeaveStatisticsAction(year),
        getAllEmployeesAction(),
      ]);

      setPendingRequests(pending);
      setStats(stats_data);
      setEmployees(emps);
    } catch (error) {
      console.error('Error loading leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRequest = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setApprovalDialogOpen(true);
  };

  const handleSearchEmployee = async (empId: string) => {
    if (!empId) {
      setEmployeeLedger(null);
      return;
    }

    try {
      const year = new Date().getFullYear();
      const [balance, history] = await Promise.all([
        getEmployeeLeaveBalanceAction(empId, year),
        getEmployeeLeaveHistoryAction(empId),
      ]);

      if (balance) {
        setEmployeeLedger({
          balance,
          history: history.filter((h) => h.year === year),
        });
      }
    } catch (error) {
      console.error('Error loading employee ledger:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
        <Button onClick={() => setApplyFormOpen(true)}>Apply Leave</Button>
      </div>

      {/* Statistics Cards */}
      {stats && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedRequests}</div>
              <p className="text-xs text-muted-foreground">This year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</div>
              <p className="text-xs text-muted-foreground">This year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeaveTaken}</div>
              <p className="text-xs text-muted-foreground">Days this year</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="approval" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="approval">Approval Queue</TabsTrigger>
          <TabsTrigger value="ledger">Leave Ledger</TabsTrigger>
          <TabsTrigger value="apply">Apply Leave</TabsTrigger>
        </TabsList>
        
        <TabsContent value="approval" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Review and approve or reject employee leave requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <p>No pending leave requests</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates (Duration)</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((request) => (
                        <TableRow key={request.$id}>
                          <TableCell className="font-medium">{request.employeeName}</TableCell>
                          <TableCell>{LEAVE_TYPE_LABELS[request.leaveType]}</TableCell>
                          <TableCell>
                            {new Date(request.startDate).toLocaleDateString('en-IN')} -{' '}
                            {new Date(request.endDate).toLocaleDateString('en-IN')} ({request.duration}{' '}
                            Days)
                          </TableCell>
                          <TableCell className="text-muted-foreground truncate">{request.reason}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectRequest(request)}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Ledger</CardTitle>
              <CardDescription>Track the historical leaves and remaining balances for employees.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Input
                  type="text"
                  placeholder="Search by Employee ID..."
                  className="max-w-sm"
                  value={selectedEmployee}
                  onChange={(e) => {
                    setSelectedEmployee(e.target.value);
                    handleSearchEmployee(e.target.value);
                  }}
                  list="employee-dropdown"
                />
                <datalist id="employee-dropdown">
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.name}
                    </option>
                  ))}
                </datalist>
              </div>

              {!employeeLedger ? (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                  <p>Select an employee to view their detailed leave ledger.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Casual Leave</p>
                      <p className="text-2xl font-bold">
                        {Math.max(0, employeeLedger.balance.casualLeave - employeeLedger.balance.casualLeaveTaken)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employeeLedger.balance.casualLeaveTaken} taken
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Sick Leave</p>
                      <p className="text-2xl font-bold">
                        {Math.max(0, employeeLedger.balance.sickLeave - employeeLedger.balance.sickLeaveTaken)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employeeLedger.balance.sickLeaveTaken} taken
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Privilege Leave</p>
                      <p className="text-2xl font-bold">
                        {Math.max(
                          0,
                          employeeLedger.balance.privilegeLeave - employeeLedger.balance.privilegeLeaveTaken
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employeeLedger.balance.privilegeLeaveTaken} taken
                      </p>
                    </div>
                  </div>

                  {employeeLedger.history.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Leave History</h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Start Date</TableHead>
                              <TableHead>End Date</TableHead>
                              <TableHead>Days</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {employeeLedger.history.map((request) => (
                              <TableRow key={request.$id}>
                                <TableCell>{LEAVE_TYPE_LABELS[request.leaveType]}</TableCell>
                                <TableCell>{new Date(request.startDate).toLocaleDateString('en-IN')}</TableCell>
                                <TableCell>{new Date(request.endDate).toLocaleDateString('en-IN')}</TableCell>
                                <TableCell>{request.duration}</TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      request.status === 'approved'
                                        ? 'bg-green-100 text-green-800'
                                        : request.status === 'rejected'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {request.status}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apply" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Apply for Leave</CardTitle>
              <CardDescription>Submit a new leave request to your manager.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                <p className="mb-3">Click on "Apply Leave" button at the top to submit a new request</p>
                <Button onClick={() => setApplyFormOpen(true)}>Open Application Form</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <LeaveApplicationForm
        employeeId="EMP001"
        employeeName="Current Employee"
        open={applyFormOpen}
        onOpenChange={setApplyFormOpen}
        onSuccess={loadData}
      />

      <LeaveApprovalDialog
        request={selectedRequest}
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
