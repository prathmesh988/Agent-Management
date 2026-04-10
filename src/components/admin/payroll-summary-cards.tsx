import { Card } from '@/components/ui/card';
import type { PayrollSummary } from '@/services/database/monthly-payroll';

export function PayrollSummaryCards({ summary }: { summary: PayrollSummary }) {
  return (
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
  );
}
