"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PayrollProcessingPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Payroll Processing</h1>
        <div className="flex gap-2">
           <Button variant="outline">Bank Export (NEFT/RTGS)</Button>
           <Button variant="default" className="bg-primary">Run Automated Payroll</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         <Card className="lg:col-span-2">
            <CardHeader>
               <CardTitle>Recent Payroll Runs</CardTitle>
               <CardDescription>View status of automated and manual payroll runs.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Processed Employees</TableHead>
                        <TableHead>Total Gross</TableHead>
                        <TableHead>Total Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">October 2026</TableCell>
                        <TableCell>145</TableCell>
                        <TableCell>₹ 8,450,000</TableCell>
                        <TableCell>₹ 7,820,000</TableCell>
                        <TableCell>
                           <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">Completed</span>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button size="sm" variant="ghost">View Details</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle>Manual Adjustments</CardTitle>
               <CardDescription>Arrears, advances, and penalties.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-muted-foreground text-sm">
                  Adjustment Entry Form
               </div>
            </CardContent>
         </Card>

         <Card className="lg:col-span-3">
            <CardHeader>
               <CardTitle>Payslips & Reports Generator</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex gap-4">
                  <Card className="flex-1 bg-slate-50 dark:bg-slate-900">
                     <CardContent className="pt-6 text-center space-y-4">
                        <div className="font-semibold text-lg">Generate Payslips</div>
                        <p className="text-sm text-muted-foreground">Batch export payslips as PDF for all employees.</p>
                        <Button variant="outline" className="w-full">Generate PDFs</Button>
                     </CardContent>
                  </Card>
                  <Card className="flex-1 bg-slate-50 dark:bg-slate-900">
                     <CardContent className="pt-6 text-center space-y-4">
                        <div className="font-semibold text-lg">PF/ESIC/TDS Reports</div>
                        <p className="text-sm text-muted-foreground">Download compliance reports for auditory filing.</p>
                        <Button variant="outline" className="w-full">Download Reports</Button>
                     </CardContent>
                  </Card>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
