import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportPayrollToExcel, exportPayrollToCSV } from '@/lib/payroll-export';
import type { MonthlyPayrollRecord, PayrollSummary } from '@/services/database/monthly-payroll';

interface PayrollTableProps {
  payrollData: MonthlyPayrollRecord[];
  summary?: PayrollSummary | null;
  monthYear?: string;
}

export function PayrollTable({ payrollData, summary = null, monthYear = '' }: PayrollTableProps) {
  if (payrollData.length === 0) return null;

  const handleExportExcel = () => {
    exportPayrollToExcel(payrollData, summary, {
      fileName: 'Payroll',
      monthYear: monthYear || 'Report',
    });
  };

  const handleExportCSV = () => {
    exportPayrollToCSV(payrollData, monthYear || 'Report');
  };

  return (
    <Card className="p-6 bg-card overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Payroll Details</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
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
          {payrollData.map((record, index) => (
            <tr key={record.$id || `${record.employeeId}-${record.year}-${record.month}`} className="border-b border-border hover:bg-muted/50">
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
  );
}
