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

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [payrollData, setPayrollData] = useState<MonthlyPayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleGeneratePayroll = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await generateMonthPayrollAction(selectedYear, selectedMonth);
      if (result.errors.length > 0) {
        setMessage({
          type: 'warning',
          text: `Generated ${result.generated} payroll records with ${result.errors.length} errors`,
        });
      } else {
        setMessage({
          type: 'success',
          text: `✅ Generated payroll for ${result.generated} employees`,
        });
      }

      // Fetch the generated payroll
      const payroll = await getMonthPayrollAction(selectedYear, selectedMonth);
      setPayrollData(payroll);
      setSummary(result.summary || null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to generate payroll';
      setMessage({ type: 'error', text: `❌ ${msg}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePayroll = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await approveMonthPayrollAction(selectedYear, selectedMonth);
      if (result.errors.length > 0) {
        setMessage({
          type: 'warning',
          text: `Approved ${result.approved} with ${result.errors.length} errors`,
        });
      } else {
        setMessage({ type: 'success', text: `✅ Approved ${result.approved} payroll records` });
      }

      // Refresh payroll
      const payroll = await getMonthPayrollAction(selectedYear, selectedMonth);
      setPayrollData(payroll);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to approve payroll';
      setMessage({ type: 'error', text: `❌ ${msg}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await processMonthPayrollAction(selectedYear, selectedMonth);
      if (result.errors.length > 0) {
        setMessage({
          type: 'warning',
          text: `Processed ${result.processed} with ${result.errors.length} errors`,
        });
      } else {
        setMessage({ type: 'success', text: `✅ Processed ${result.processed} payroll records` });
      }

      // Refresh payroll
      const payroll = await getMonthPayrollAction(selectedYear, selectedMonth);
      setPayrollData(payroll);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to process payroll';
      setMessage({ type: 'error', text: `❌ ${msg}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Payroll Management</h1>
        <p className="text-muted-foreground">
          Generate, approve, and process monthly payroll for all employees
        </p>
      </div>

      {/* Month/Year Selection */}
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

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
              : message.type === 'warning'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200'
                : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-1">Total Employees</p>
            <p className="text-2xl font-bold text-foreground">{summary.totalEmployees}</p>
          </Card>
          <Card className="p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-1">Total Gross</p>
            <p className="text-2xl font-bold text-foreground">
              ₹{summary.totalGross.toLocaleString('en-IN')}
            </p>
          </Card>
          <Card className="p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-1">Total Deductions</p>
            <p className="text-2xl font-bold text-red-600">
              ₹{summary.totalDeductions.toLocaleString('en-IN')}
            </p>
          </Card>
          <Card className="p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-1">Total Net Paid</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{summary.totalNetPaid.toLocaleString('en-IN')}
            </p>
          </Card>
        </div>
      )}

      {/* Payroll Table */}
      {payrollData.length > 0 && (
        <Card className="p-6 bg-card overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Payroll Details</h2>
            <div className="flex gap-2">
              <Button
                onClick={handleApprovePayroll}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                👍 Approve
              </Button>
              <Button
                onClick={handleProcessPayroll}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                ✅ Process
              </Button>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Employee ID</th>
                <th className="text-right py-3 px-4 font-semibold">Gross</th>
                <th className="text-right py-3 px-4 font-semibold">Present</th>
                <th className="text-right py-3 px-4 font-semibold">Absent</th>
                <th className="text-right py-3 px-4 font-semibold">Deduction</th>
                <th className="text-right py-3 px-4 font-semibold">TDS</th>
                <th className="text-right py-3 px-4 font-semibold">Net</th>
                <th className="text-center py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map((record) => (
                <tr key={record.$id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 text-foreground">{record.employeeId}</td>
                  <td className="py-3 px-4 text-right text-foreground">
                    ₹{Number(record.grossSalary).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">{record.presentDays}</td>
                  <td className="py-3 px-4 text-right text-red-600">{record.absentDays}</td>
                  <td className="py-3 px-4 text-right text-red-600">
                    ₹{Number(record.deductedAmount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right text-orange-600">
                    ₹{Number(record.tdsDeducted).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    ₹{Number(record.netSalary).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        record.status === 'draft'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : record.status === 'approved'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {payrollData.length === 0 && message.type !== 'error' && (
        <Card className="p-8 bg-card text-center">
          <p className="text-muted-foreground">
            Select a month and click "Generate Payroll" to get started
          </p>
        </Card>
      )}
    </div>
  );
}
