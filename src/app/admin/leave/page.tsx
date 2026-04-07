import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeaveApplicationForm } from '@/components/admin/leave-application-form';
import { LeaveStatsCards } from '@/components/admin/leave-stats-cards';
import { LeaveLedgerContent } from '@/components/admin/leave-ledger-content';
import { LeaveRequestActions } from '@/components/admin/leave-request-actions';
import {
  getPendingRequestsAction,
  getLeaveStatisticsAction,
  getAllEmployeesAction,
} from '@/app/(actions)/leave';
import { type LeaveRequest } from '@/services/database/leave-requests';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  CL: 'Casual Leave',
  SL: 'Sick Leave',
  PL: 'Privilege Leave',
  ML: 'Maternity Leave',
  PTL: 'Paternity Leave',
};

export default async function LeaveManagementPage() {
  // Fetch data on the server
  const year = new Date().getFullYear();
  const [pendingRequests, stats, employees] = await Promise.all([
    getPendingRequestsAction(),
    getLeaveStatisticsAction(year),
    getAllEmployeesAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
      </div>

      {/* Statistics Cards - Server Rendered */}
      {stats && <LeaveStatsCards stats={stats} />}

      {/* Main Tabs - Server Component with Client Children */}
      <Tabs defaultValue="approval" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="approval">Approval Queue</TabsTrigger>
          <TabsTrigger value="ledger">Leave Ledger</TabsTrigger>
          <TabsTrigger value="apply">Apply Leave</TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab - Server Rendered */}
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
                <LeaveApprovalQueueTable requests={pendingRequests} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Ledger Tab - Client Component for Search */}
        <TabsContent value="ledger" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Ledger</CardTitle>
              <CardDescription>Track the historical leaves and remaining balances for employees.</CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveLedgerContent employees={employees} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apply Leave Tab */}
        <TabsContent value="apply" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Apply for Leave</CardTitle>
              <CardDescription>Submit a new leave request to your manager.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                <p className="mb-3">Click on "Apply Leave" button at the top to submit a new request</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Server Component: Render approval queue table
 */
function LeaveApprovalQueueTable({ requests }: { requests: LeaveRequest[] }) {
  return (
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
          {requests.map((request) => (
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
                <LeaveRequestActions request={request} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
