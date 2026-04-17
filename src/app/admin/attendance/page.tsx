"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ATTENDANCE } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/lib/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { saveBulkAttendanceAction, getBulkMonthlyAttendanceAction } from '@/app/(actions)/attendance';

// Types of attendance
const ATTENDANCE_CODES = ATTENDANCE.CODES;
type AttendanceCode = typeof ATTENDANCE.CODES[number];

// Helper to generate day keys for a specific month
function generateDayKeysForMonth(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const keys: string[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayName = dayNames[date.getDay()];
    keys.push(`${day}${dayName}`);
  }
  
  return keys;
}

export default function AttendancePage() {
  const { employees, updateEmployee, isLoading: employeesLoading } = useEmployees();
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<{show: boolean, msg: string}>({show: false, msg: ""});
  
  // Month/Year navigation
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  
  // Fetch monthly attendance data from monthly_attendance2 collection
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState<Record<string, Record<string, string>>>({});
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  
  // Generate day keys for selected month
  const DAY_KEYS = useMemo(() => generateDayKeysForMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  // Fetch attendance data when month/year changes
  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoadingAttendance(true);
      try {
        const result = await getBulkMonthlyAttendanceAction(selectedYear, selectedMonth);
        if (result.success) {
          setMonthlyAttendanceData(result.data);
        } else {
          setMonthlyAttendanceData({});
        }
      } catch (error) {
        console.error("Error fetching bulk attendance:", error);
        setMonthlyAttendanceData({});
      } finally {
        setIsLoadingAttendance(false);
      }
    };
    
    fetchAttendance();
  }, [selectedYear, selectedMonth]);

  const showToast = useCallback((msg: string) => {
    setToastMessage({show: true, msg});
    setTimeout(() => {
      setToastMessage(prev => ({ ...prev, show: false }));
    }, 150);
  }, []);

  const handleUpdate = useCallback(async (employee: Employee, dayKey: string, nextCode: AttendanceCode) => {
    const updatedEmp = { ...employee, [dayKey]: nextCode } as Employee;
    await updateEmployee(updatedEmp);
    
    // Also save to monthly_attendance2 collection for sync with individual attendance pages
    await saveBulkAttendanceAction(employee.employeeId, dayKey, nextCode, selectedYear, selectedMonth);
    
    // Update local state
    setMonthlyAttendanceData(prev => ({
      ...prev,
      [employee.employeeId]: {
        ...prev[employee.employeeId],
        [dayKey]: nextCode
      }
    }));
  }, [updateEmployee, selectedYear, selectedMonth]);

  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(searchLower)) ||
      (emp.process && emp.process.toLowerCase().includes(searchLower))
    );
  });
  
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };
  
  const monthYearString = new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isLoading = employeesLoading || isLoadingAttendance;

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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Attendance Grid - {monthYearString}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">{monthYearString}</span>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
            <div className="flex gap-2 items-center flex-1 min-w-[200px] max-w-[300px]">
              <span className="text-sm font-medium">Search:</span>
              <Input 
                type="text" 
                placeholder="Name or ID..." 
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm flex gap-2 flex-wrap items-center justify-end text-slate-500">
               <span className="font-semibold text-slate-900 dark:text-slate-200">Codes:</span> 
               P (Present), WO (Week Off), CL (Casual Leave), LC (Late Coming), HD (Half Day), L (Leave), A (Absent)
            </div>
          </div>
          
          <div className="rounded-md border overflow-x-auto max-h-[600px]">
            <Table className="min-w-[1000px] relative">
              <TableHeader className="bg-white dark:bg-slate-950 sticky top-0 z-20 shadow-sm">
                <TableRow>
                  <TableHead className="w-[150px] border-r sticky left-0 bg-white dark:bg-slate-950 z-30">Employee</TableHead>
                  {DAY_KEYS.map((key) => {
                    const match = key.match(/^(\d+)([A-Za-z]+)$/);
                    const num = match ? match[1] : key;
                    const day = match ? match[2] : "";
                    return (
                      <TableHead key={key} className="text-center p-1 border-r min-w-[40px] text-xs">
                        <div className="flex flex-col items-center">
                           <span>{num}</span>
                           <span className="text-[10px] text-muted-foreground">{day}</span>
                        </div>
                      </TableHead>
                    );
                  })}
                  <TableHead className="text-right font-semibold text-primary min-w-[80px] bg-white dark:bg-slate-950">Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={DAY_KEYS.length + 2} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-lg font-medium text-slate-500">Loading employees...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={DAY_KEYS.length + 2} className="h-24 text-center text-slate-500">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => {
                    const employeeAttendance = monthlyAttendanceData[emp.employeeId] || {};
                    const pCount = DAY_KEYS.reduce((acc, key) => acc + (employeeAttendance[key] === 'P' ? 1 : 0), 0);

                    return (
                      <TableRow key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <TableCell className="font-medium border-r sticky left-0 bg-white dark:bg-slate-950 z-10 w-[150px] max-w-[150px] truncate">
                          <div title={emp.name}>{emp.name}</div>
                          <div className="text-[10px] text-muted-foreground" title={emp.employeeId}>{emp.employeeId}</div>
                        </TableCell>
                        {DAY_KEYS.map((key) => (
                           <AttendanceCell 
                              key={key} 
                              employee={emp} 
                              dayKey={key} 
                              initialCode={employeeAttendance[key] || ""} 
                              onUpdate={handleUpdate}
                              showToast={showToast}
                           />
                        ))}
                        <TableCell className="text-right font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
                          {pCount} P
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ephemeral Toast */}
      {toastMessage.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white font-medium px-4 py-2 rounded-full shadow-lg text-sm z-50 pointer-events-none transition-opacity duration-150 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          {toastMessage.msg}
        </div>
      )}
    </div>
  );
}

function AttendanceCell({ 
  employee, 
  dayKey, 
  initialCode, 
  onUpdate,
  showToast
}: { 
  employee: Employee, 
  dayKey: string, 
  initialCode: string, 
  onUpdate: (emp: Employee, dayKey: string, nextCode: AttendanceCode) => Promise<void>,
  showToast: (msg: string) => void
}) {
  // Parse and normalize the code from database
  const parseCode = (val: string | undefined): AttendanceCode => {
    if (!val) return '';
    
    // If it's already a valid attendance code, return it
    if (ATTENDANCE_CODES.includes(val as AttendanceCode)) {
      return val as AttendanceCode;
    }
    
    // Map alternate formats
    if (val === "H" || val === "0.5") return "HD";
    if (val === "LWP") return "L";
    
    return '';
  };

  const normalizedCode = parseCode(initialCode);
  const [code, setCode] = useState<AttendanceCode>(normalizedCode);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state when initialCode changes
  useEffect(() => {
    const validCode = parseCode(initialCode);
    setCode(validCode);
  }, [initialCode, employee.name]);

  const handleClick = async () => {
    if (isUpdating) return;
    
    const currentIndex = ATTENDANCE_CODES.indexOf(code);
    const nextIndex = (currentIndex + 1) % ATTENDANCE_CODES.length;
    const nextCode = ATTENDANCE_CODES[nextIndex];
    
    // immediate visual update
    setCode(nextCode);
    setIsUpdating(true);
    
    try {
      await onUpdate(employee, dayKey, nextCode);
      showToast("Saved!");
    } catch {
      // revert on fail
      setCode(code);
    } finally {
      setIsUpdating(false);
    }
  };

  let bgColor = "";
  let textColor = "";

  if (code === "P") { bgColor = "bg-emerald-100 dark:bg-emerald-900/30"; textColor = "text-emerald-700 dark:text-emerald-400"; }
  else if (code === "A") { bgColor = "bg-rose-100 dark:bg-rose-900/30"; textColor = "text-rose-700 dark:text-rose-400"; }
  else if (code === "WO") { bgColor = "bg-slate-100 dark:bg-slate-800"; textColor = "text-slate-600 dark:text-slate-400"; }
  else if (code === "HD" || code === "LC") { bgColor = "bg-amber-100 dark:bg-amber-900/30"; textColor = "text-amber-700 dark:text-amber-400"; }
  else if (code === "CL" || code === "L") { bgColor = "bg-blue-100 dark:bg-blue-900/30"; textColor = "text-blue-700 dark:text-blue-400"; }

  return (
    <TableCell 
      className={`text-center p-0 border-r cursor-pointer select-none transition-colors ${bgColor} ${isUpdating ? 'opacity-70' : ''}`}
      onClick={handleClick}
    >
      <div className={`flex items-center justify-center h-10 w-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 font-medium text-xs ${textColor}`}>
        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : (code || "-")}
      </div>
    </TableCell>
  );
}
