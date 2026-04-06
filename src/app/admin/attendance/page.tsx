"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">Import XLSX</Button>
          <Button>Bulk Mark Attendance</Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Attendance Grid (28-day)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">Batch:</span>
              <Input type="text" placeholder="Select batch..." className="max-w-[200px]" />
            </div>
            <div className="text-sm flex gap-2 flex-wrap max-w-[50%] items-center justify-end text-slate-500">
               <span className="font-semibold text-slate-900 dark:text-slate-200">Codes:</span> 
               P (Present), WO (Week Off), CL (Casual Leave), LC (Late Coming), HD (Half Day), L (Leave), A (Absent)
            </div>
          </div>
          
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] border-r">Employee</TableHead>
                  {Array.from({ length: 14 }).map((_, i) => (
                    <TableHead key={i} className="text-center p-2 border-r min-w-[50px]">
                      Day {i + 1}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-semibold text-primary min-w-[80px]">Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium border-r">Employee {i + 1}</TableCell>
                    {Array.from({ length: 14 }).map((_, j) => (
                      <TableCell key={j} className="text-center p-0 border-r">
                        <select className="bg-transparent border-0 text-center w-full h-10 focus:ring-1 focus:ring-primary outline-none">
                          <option>P</option>
                          <option>A</option>
                          <option>WO</option>
                          <option>HD</option>
                          <option>LC</option>
                        </select>
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
                      14 / 14 P
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            * Displaying first 14 days of the 28-day grid for demo purposes.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
