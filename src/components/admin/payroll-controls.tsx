'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  generateMonthPayrollAction,
  getMonthPayrollAction,
  approveMonthPayrollAction,
  processMonthPayrollAction,
} from '@/app/(actions)/payroll';
import type { MonthlyPayrollRecord, PayrollSummary } from '@/services/database/monthly-payroll';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface PayrollControlsProps {
  onDataChange: (data: {
    payrollData: MonthlyPayrollRecord[];
    summary: PayrollSummary | null;
    message: { type: string; text: string };
  }) => void;
}

export function PayrollControls({ onDataChange }: PayrollControlsProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleGeneratePayroll = async () => {
    setIsLoading(true);
    try {
      const result = await generateMonthPayrollAction(selectedYear, selectedMonth);
      const payroll = await getMonthPayrollAction(selectedYear, selectedMonth);

      const message = result.errors.length > 0 ? {
        type: 'warning',
        text: `Generated ${result.generated} payroll records with ${result.errors.length} errors`,
      } : {
        type: 'success',
        text: `✅ Generated payroll for ${result.generated} employees`,
      };

      onDataChange({
        payrollData: payroll,
        summary: result.summary || null,
        message,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to generate payroll';
      onDataChange({
        payrollData: [],
        summary: null,
        message: { type: 'error', text: `❌ ${msg}` },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePayroll = async () => {
    setIsLoading(true);
    try {
      const result = await approveMonthPayrollAction(selectedYear, selectedMonth);
      const payroll = await getMonthPayrollAction(selectedYear, selectedMonth);

      const message = result.errors.length > 0 ? {
        type: 'warning',
        text: `Approved ${result.approved} with ${result.errors.length} errors`,
      } : {
        type: 'success',
        text: `✅ Approved ${result.approved} payroll records`,
      };

      onDataChange({
        payrollData: payroll,
        summary: null,
        message,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to approve payroll';
      onDataChange({
        payrollData: [],
        summary: null,
        message: { type: 'error', text: `❌ ${msg}` },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    setIsLoading(true);
    try {
      const result = await processMonthPayrollAction(selectedYear, selectedMonth);
      const payroll = await getMonthPayrollAction(selectedYear, selectedMonth);

      const message = result.errors.length > 0 ? {
        type: 'warning',
        text: `Processed ${result.processed} with ${result.errors.length} errors`,
      } : {
        type: 'success',
        text: `✅ Processed ${result.processed} payroll records`,
      };

      onDataChange({
        payrollData: payroll,
        summary: null,
        message,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to process payroll';
      onDataChange({
        payrollData: [],
        summary: null,
        message: { type: 'error', text: `❌ ${msg}` },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium text-foreground mb-2 block">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium text-foreground mb-2 block">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleGeneratePayroll}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              '📊 Generate Payroll'
            )}
          </Button>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button
          onClick={handleApprovePayroll}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          👍 Approve
        </Button>
        <Button
          onClick={handleProcessPayroll}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          ✅ Process
        </Button>
      </div>
    </div>
  );
}
