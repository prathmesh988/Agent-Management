"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportsAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <Button>Custom Report Builder</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-slate-500">Total Headcount</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold">145</div>
               <p className="text-xs text-muted-foreground mt-1">+2 from last month</p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-slate-500">Avg. Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold">96.4%</div>
               <p className="text-xs text-emerald-500 mt-1">Healthy</p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-slate-500">Payroll Cost (YTD)</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold">₹ 84.5M</div>
               <p className="text-xs text-muted-foreground mt-1">Trending to budget</p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-slate-500">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold">12</div>
               <p className="text-xs text-amber-500 mt-1">Requires immediate action</p>
            </CardContent>
         </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card>
            <CardHeader>
               <CardTitle>Attendance Analytics</CardTitle>
               <CardDescription>Monthly trends over the year.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-md border flex items-center justify-center">
                  Chart Placeholder (Recharts)
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle>Payroll Summary</CardTitle>
               <CardDescription>Cost distribution by department.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-md border flex items-center justify-center">
                  Pie Chart Placeholder
               </div>
            </CardContent>
         </Card>

         <Card className="md:col-span-2">
            <CardHeader>
               <CardTitle>PF/ESIC Reports</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="h-48 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground">
                  Compliance Reports Data Table Placeholder
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
