"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function HRPolicyPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">HR Policy Configuration</h1>
        <Button>Save Configuration</Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calculation Formulas</CardTitle>
            <CardDescription>Define salary calculation rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Per-day rate logic</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md border font-mono">CTC ÷ Working Days</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Half Day Deduction</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md border font-mono">(Per_day_rate ÷ 2) × HD days</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Late Coming Deduction</label>
              <div className="flex space-x-2">
                <Input type="number" placeholder="Fixed amount..." defaultValue={0} />
                <Input type="number" placeholder="% Based..." defaultValue={10} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Overtime (OT) Formula</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md border font-mono">(CTC ÷ 26 ÷ 8) × hours</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Parameters</CardTitle>
            <CardDescription>Configure PF, ESIC, and TDS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <label className="text-sm font-medium">PF Registration (%)</label>
              <div className="flex gap-4">
                 <div className="space-y-1 w-full">
                    <span className="text-xs text-muted-foreground">Employee</span>
                    <Input type="number" defaultValue={12} />
                 </div>
                 <div className="space-y-1 w-full">
                    <span className="text-xs text-muted-foreground">Employer</span>
                    <Input type="number" defaultValue={13} />
                 </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ESIC Configuration (%)</label>
              <div className="flex gap-4">
                 <div className="space-y-1 w-full">
                    <span className="text-xs text-muted-foreground">Employee</span>
                    <Input type="number" defaultValue={0.75} step={0.01} />
                 </div>
                 <div className="space-y-1 w-full">
                    <span className="text-xs text-muted-foreground">Employer</span>
                    <Input type="number" defaultValue={3.25} step={0.01} />
                 </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">TDS Configurable</label>
               <div className="h-16 flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground text-sm">
                  TDS Slab Manager Placeholder
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Salary Component Composition</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex gap-2">
                <span className="px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md border font-mono text-sm shadow-sm flex-1 text-center">Gross = CTC + Allowances - Deductions</span>
                <span className="text-xl px-2 self-center text-slate-400">→</span>
                <span className="px-3 py-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 rounded-md border font-mono text-sm shadow-sm flex-1 text-center">Net = Gross - PF - ESIC - TDS - Advance - Penalty</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
