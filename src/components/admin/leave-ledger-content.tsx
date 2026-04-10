'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  getEmployeeLeaveBalanceAction,
  getEmployeeLeaveHistoryAction,
} from '@/app/(actions)/leave';
import { type LeaveRequest } from '@/services/database/leave-requests';

interface Employee {
  employeeId: string;
  name: string;
}

interface EmployeeLedger {
  balance: {
    casualLeave: number;
    casualLeaveTaken: number;
    sickLeave: number;
    sickLeaveTaken: number;
    privilegeLeave: number;
    privilegeLeaveTaken: number;
    maternityLeave: number;
    maternityLeaveTaken: number;
    paternityLeave: number;
    paternityLeaveTaken: number;
  };
  history: LeaveRequest[];
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  CL: 'Casual Leave',
  SL: 'Sick Leave',
  PL: 'Privilege Leave',
  ML: 'Maternity Leave',
  PTL: 'Paternity Leave',
};

export function LeaveLedgerContent({ employees }: { employees: Employee[] }) {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeLedger, setEmployeeLedger] = useState<EmployeeLedger | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearchEmployee = async (value: string) => {
    setSelectedEmployee(value);
    
    if (!value.trim()) {
      setEmployeeLedger(null);
      return;
    }

    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const [balance, history] = await Promise.all([
        getEmployeeLeaveBalanceAction(value, year),
        getEmployeeLeaveHistoryAction(value),
      ]);
      
      if (balance && history) {
        setEmployeeLedger({
          balance: balance as any,
          history,
        });
      } else {
        setEmployeeLedger(null);
      }
    } catch (error) {
      console.error('Error loading employee ledger:', error);
      setEmployeeLedger(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Search by Employee ID..."
          className="max-w-sm"
          value={selectedEmployee}
          onChange={(e) => handleSearchEmployee(e.target.value)}
          list="employee-dropdown"
        />
        <datalist id="employee-dropdown">
          {employees.map((emp) => (
            <option key={emp.employeeId} value={emp.employeeId}>
              {emp.name}
            </option>
          ))}
        </datalist>
      </div>

      {!selectedEmployee || loading ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
          <p>Select an employee to view their detailed leave ledger.</p>
        </div>
      ) : !employeeLedger ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
          <p>No data found for selected employee.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Casual Leave</p>
              <p className="text-2xl font-bold">
                {Math.max(0, employeeLedger.balance.casualLeave - employeeLedger.balance.casualLeaveTaken)}
              </p>
              <p className="text-xs text-muted-foreground">
                {employeeLedger.balance.casualLeaveTaken} taken
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Sick Leave</p>
              <p className="text-2xl font-bold">
                {Math.max(0, employeeLedger.balance.sickLeave - employeeLedger.balance.sickLeaveTaken)}
              </p>
              <p className="text-xs text-muted-foreground">
                {employeeLedger.balance.sickLeaveTaken} taken
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Privilege Leave</p>
              <p className="text-2xl font-bold">
                {Math.max(0, employeeLedger.balance.privilegeLeave - employeeLedger.balance.privilegeLeaveTaken)}
              </p>
              <p className="text-xs text-muted-foreground">
                {employeeLedger.balance.privilegeLeaveTaken} taken
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Maternity Leave</p>
              <p className="text-2xl font-bold">
                {Math.max(0, employeeLedger.balance.maternityLeave - employeeLedger.balance.maternityLeaveTaken)}
              </p>
              <p className="text-xs text-muted-foreground">
                {employeeLedger.balance.maternityLeaveTaken} taken
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Paternity Leave</p>
              <p className="text-2xl font-bold">
                {Math.max(0, employeeLedger.balance.paternityLeave - employeeLedger.balance.paternityLeaveTaken)}
              </p>
              <p className="text-xs text-muted-foreground">
                {employeeLedger.balance.paternityLeaveTaken} taken
              </p>
            </div>
          </div>

          {employeeLedger.history.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Leave History</h3>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeLedger.history.map((request) => (
                      <TableRow key={request.$id}>
                        <TableCell>{LEAVE_TYPE_LABELS[request.leaveType]}</TableCell>
                        <TableCell>{new Date(request.startDate).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>{new Date(request.endDate).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>{request.duration}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {request.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
