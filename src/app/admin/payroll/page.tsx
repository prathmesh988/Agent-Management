'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { PayrollControls } from '@/components/admin/payroll-controls';
import { PayrollSummaryCards } from '@/components/admin/payroll-summary-cards';
import { PayrollTable } from '@/components/admin/payroll-table';
import type { MonthlyPayrollRecord, PayrollSummary } from '@/services/database/monthly-payroll';

export default function PayrollPage() {
  const [payrollData, setPayrollData] = useState<MonthlyPayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleDataChange = (data: {
    payrollData: MonthlyPayrollRecord[];
    summary: PayrollSummary | null;
    message: { type: string; text: string };
  }) => {
    setPayrollData(data.payrollData);
    setSummary(data.summary);
    setMessage(data.message);
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

      {/* Controls */}
      <PayrollControls onDataChange={handleDataChange} />

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
      {summary && <PayrollSummaryCards summary={summary} />}

      {/* Payroll Table */}
      {payrollData.length > 0 && <PayrollTable payrollData={payrollData} />}

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
