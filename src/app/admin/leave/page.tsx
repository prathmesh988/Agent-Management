"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LeaveManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
        <Button>Apply Leave</Button>
      </div>

      <Tabs defaultValue="approval" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-3xl">
          <TabsTrigger value="approval">Approval Queue</TabsTrigger>
          <TabsTrigger value="ledger">Leave Ledger</TabsTrigger>
          <TabsTrigger value="policies">Leave Policies</TabsTrigger>
          <TabsTrigger value="apply">Apply Leave (Self)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="approval" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Review and approve or reject employee leave requests.</CardDescription>
            </CardHeader>
            <CardContent>
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
                    <TableRow>
                      <TableCell className="font-medium">John Doe</TableCell>
                      <TableCell>Casual Leave</TableCell>
                      <TableCell>12 Oct 2026 - 14 Oct 2026 (3 Days)</TableCell>
                      <TableCell className="text-muted-foreground">Personal Work</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">Approve</Button>
                        <Button size="sm" variant="destructive">Reject</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Sarah Smith</TableCell>
                      <TableCell>Sick Leave</TableCell>
                      <TableCell>18 Oct 2026 - 18 Oct 2026 (1 Day)</TableCell>
                      <TableCell className="text-muted-foreground">Fever</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">Approve</Button>
                        <Button size="sm" variant="destructive">Reject</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
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
                 <Input type="text" placeholder="Search employee..." className="max-w-sm" />
                 <Button variant="secondary">Search</Button>
               </div>
               <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                  <p>Select an employee to view their detailed leave ledger.</p>
               </div>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="policies" className="mt-4">
           <Card>
             <CardHeader>
               <CardTitle>Leave Policies</CardTitle>
               <CardDescription>Configure quotas and carry-forward rules.</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                  <p>Policy Configuration Form Placeholder</p>
               </div>
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
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                  <p>Leave Application Form Placeholder</p>
               </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
