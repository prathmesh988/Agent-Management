"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ATTENDANCE } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/lib/types';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight, CheckSquare, Square, Users, Info, X } from 'lucide-react';
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
  const [branchFilter, setBranchFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<{show: boolean, msg: string}>({show: false, msg: ""});

  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [bulkCode, setBulkCode] = useState<string>("P");
  const [bulkDayStart, setBulkDayStart] = useState(1);
  const [bulkDayEnd, setBulkDayEnd] = useState(1);
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const bulkAbortRef = useRef(false);
  
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

  const showToast = useCallback((msg: string, duration = 2000) => {
    setToastMessage({show: true, msg});
    setTimeout(() => {
      setToastMessage(prev => ({ ...prev, show: false }));
    }, duration);
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

  // Derive unique branches from employee data
  const availableBranches = useMemo(() => {
    const branches = new Set<string>();
    employees.forEach((emp) => {
      const branch = emp.process || emp.department;
      if (branch && branch.trim()) branches.add(branch.trim());
    });
    return Array.from(branches).sort();
  }, [employees]);

  // Derive unique batches from employee data (future-ready)
  const availableBatches = useMemo(() => {
    const batches = new Set<string>();
    employees.forEach((emp) => {
      // Future: if employees get a "batch" field, add it here
      // e.g. if ((emp as any).batch) batches.add((emp as any).batch);
    });
    return Array.from(batches).sort();
  }, [employees]);

  const filteredEmployees = employees.filter(emp => {
    // Branch filter
    if (branchFilter !== "all") {
      const branch = (emp.process || emp.department || "").trim();
      if (branch !== branchFilter) return false;
    }

    // Batch filter (future-ready)
    if (batchFilter !== "all") {
      const batch = (((emp as unknown) as Record<string, unknown>).batch as string || "").trim();
      if (batch !== batchFilter) return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(searchLower)) ||
        (emp.process && emp.process.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Bulk mode handlers
  const toggleBulkMode = useCallback(() => {
    setBulkMode(prev => {
      if (prev) {
        // Exiting bulk mode — clear selections
        setSelectedEmployeeIds(new Set());
        setBulkProgress({ current: 0, total: 0 });
      } else {
        // Entering bulk mode — default day range to today (if in current month)
        const today = new Date();
        if (selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1) {
          setBulkDayStart(today.getDate());
          setBulkDayEnd(today.getDate());
        } else {
          setBulkDayStart(1);
          setBulkDayEnd(1);
        }
      }
      return !prev;
    });
  }, [selectedYear, selectedMonth]);

  const toggleEmployeeSelection = useCallback((employeeId: string) => {
    setSelectedEmployeeIds(prev => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  }, []);

  const allFilteredSelected = filteredEmployees.length > 0 && filteredEmployees.every(e => selectedEmployeeIds.has(e.employeeId));

  const toggleSelectAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedEmployeeIds(new Set());
    } else {
      setSelectedEmployeeIds(new Set(filteredEmployees.map(e => e.employeeId)));
    }
  }, [allFilteredSelected, filteredEmployees]);

  const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth, 0).getDate(), [selectedYear, selectedMonth]);

  const handleBulkApply = useCallback(async () => {
    if (selectedEmployeeIds.size === 0 || isBulkApplying) return;
    if (bulkDayStart > bulkDayEnd) {
      showToast("Start day must be ≤ end day", 3000);
      return;
    }

    const selectedEmps = filteredEmployees.filter(e => selectedEmployeeIds.has(e.employeeId));
    const dayCount = bulkDayEnd - bulkDayStart + 1;
    const total = selectedEmps.length * dayCount;

    setIsBulkApplying(true);
    setBulkProgress({ current: 0, total });
    bulkAbortRef.current = false;

    let completed = 0;
    let failed = 0;

    for (const emp of selectedEmps) {
      if (bulkAbortRef.current) break;

      for (let day = bulkDayStart; day <= bulkDayEnd; day++) {
        if (bulkAbortRef.current) break;

        // Build the dayKey (e.g. "3Tue")
        const date = new Date(selectedYear, selectedMonth - 1, day);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayKey = `${day}${dayNames[date.getDay()]}`;

        try {
          await saveBulkAttendanceAction(emp.employeeId, dayKey, bulkCode as string, selectedYear, selectedMonth);

          // Update local state immediately for visual feedback
          setMonthlyAttendanceData(prev => ({
            ...prev,
            [emp.employeeId]: {
              ...prev[emp.employeeId],
              [dayKey]: bulkCode as string
            }
          }));

          completed++;
        } catch {
          failed++;
        }

        setBulkProgress({ current: completed + failed, total });
      }
    }

    setIsBulkApplying(false);
    const msg = failed > 0
      ? `Done: ${completed} saved, ${failed} failed`
      : `✓ Marked ${completed} entries as ${bulkCode}`;
    showToast(msg, 3000);
  }, [selectedEmployeeIds, filteredEmployees, bulkDayStart, bulkDayEnd, bulkCode, selectedYear, selectedMonth, isBulkApplying, showToast]);

  const handleBulkCancel = useCallback(() => {
    bulkAbortRef.current = true;
  }, []);
  
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
          <Button
            variant={bulkMode ? "destructive" : "default"}
            onClick={toggleBulkMode}
            className="gap-1.5"
          >
            {bulkMode ? (
              <><X className="h-4 w-4" /> Exit Bulk Mode</>
            ) : (
              <><Users className="h-4 w-4" /> Bulk Mark Attendance</>
            )}
          </Button>
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
          <div className="flex flex-col gap-4 mb-6">
            {/* Filter Row */}
            <div className="flex flex-wrap gap-3 items-end">
              {/* Search */}
              <div className="flex-1 min-w-[180px] max-w-[280px] space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</label>
                <Input 
                  type="text" 
                  placeholder="Name or ID..." 
                  className="w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Branch Dropdown */}
              <div className="w-full sm:w-44 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch Dropdown */}
              <div className="w-full sm:w-44 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Batch</label>
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="All Batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {availableBatches.length === 0 ? (
                      <SelectItem value="_empty" disabled>No batches available</SelectItem>
                    ) : (
                      availableBatches.map((batch) => (
                        <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {(searchTerm || branchFilter !== "all" || batchFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 mt-auto"
                  onClick={() => { setSearchTerm(""); setBranchFilter("all"); setBatchFilter("all"); }}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Codes Legend */}
            <div className="text-sm flex gap-2 flex-wrap items-center text-slate-500">
               <span className="font-semibold text-slate-900 dark:text-slate-200">Codes:</span> 
               P (Present), WO (Week Off), CL (Casual Leave), LC (Late Coming), HD (Half Day), L (Leave), A (Absent)
            </div>

            {/* Bulk Mode Panel */}
            {bulkMode && (
              <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 p-4 space-y-4">
                {/* Description */}
                <div className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    <span className="font-semibold">Bulk Mode:</span> Select employees using the checkboxes, choose a day range and attendance code, then click &quot;Apply&quot; to mark attendance for all selected employees at once.
                  </p>
                </div>

                {/* Controls row */}
                <div className="flex flex-wrap gap-3 items-end">
                  {/* Select All */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-9"
                    onClick={toggleSelectAll}
                    disabled={isBulkApplying}
                  >
                    {allFilteredSelected ? (
                      <><CheckSquare className="h-4 w-4 text-blue-600" /> Deselect All</>
                    ) : (
                      <><Square className="h-4 w-4" /> Select All ({filteredEmployees.length})</>
                    )}
                  </Button>

                  {/* Day Range: From */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Day</label>
                    <Select value={String(bulkDayStart)} onValueChange={(v) => setBulkDayStart(Number(v))}>
                      <SelectTrigger className="w-24 bg-background h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                          <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Day Range: To */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To Day</label>
                    <Select value={String(bulkDayEnd)} onValueChange={(v) => setBulkDayEnd(Number(v))}>
                      <SelectTrigger className="w-24 bg-background h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d => d >= bulkDayStart).map(d => (
                          <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Attendance Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</label>
                    <Select value={bulkCode} onValueChange={setBulkCode}>
                      <SelectTrigger className="w-28 bg-background h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_CODES.filter(c => c !== '').map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Apply Button */}
                  <Button
                    size="sm"
                    className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleBulkApply}
                    disabled={selectedEmployeeIds.size === 0 || isBulkApplying}
                  >
                    {isBulkApplying ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Applying...</>
                    ) : (
                      <>Apply to {selectedEmployeeIds.size} employee{selectedEmployeeIds.size !== 1 ? 's' : ''}</>
                    )}
                  </Button>

                  {/* Cancel during apply */}
                  {isBulkApplying && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={handleBulkCancel}
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {/* Progress bar */}
                {isBulkApplying && bulkProgress.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Processing...</span>
                      <span>{bulkProgress.current} / {bulkProgress.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Selection count badge */}
                {selectedEmployeeIds.size > 0 && !isBulkApplying && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {selectedEmployeeIds.size} employee{selectedEmployeeIds.size !== 1 ? 's' : ''} selected · Days {bulkDayStart}–{bulkDayEnd} · Code: {bulkCode}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="rounded-md border overflow-x-auto max-h-[600px]">
            <Table className="min-w-[1000px] relative">
              <TableHeader className="bg-white dark:bg-slate-950 sticky top-0 z-20 shadow-sm">
                <TableRow>
                  {bulkMode && (
                    <TableHead className="w-[48px] border-r sticky left-0 bg-white dark:bg-slate-950 z-30 text-center p-1">
                      <div
                        role="checkbox"
                        aria-checked={allFilteredSelected}
                        tabIndex={0}
                        className="flex items-center justify-center cursor-pointer"
                        onClick={toggleSelectAll}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelectAll(); } }}
                      >
                        {allFilteredSelected
                          ? <CheckSquare className="h-4 w-4 text-blue-600" />
                          : <Square className="h-4 w-4 text-slate-400" />
                        }
                      </div>
                    </TableHead>
                  )}
                  <TableHead className={`w-[150px] border-r sticky ${bulkMode ? 'left-[48px]' : 'left-0'} bg-white dark:bg-slate-950 z-30`}>Employee</TableHead>
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
                    <TableCell colSpan={DAY_KEYS.length + 2 + (bulkMode ? 1 : 0)} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-lg font-medium text-slate-500">Loading employees...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={DAY_KEYS.length + 2 + (bulkMode ? 1 : 0)} className="h-24 text-center text-slate-500">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => {
                    const employeeAttendance = monthlyAttendanceData[emp.employeeId] || {};
                    const pCount = DAY_KEYS.reduce((acc, key) => acc + (employeeAttendance[key] === 'P' ? 1 : 0), 0);

                    return (
                      <TableRow key={emp.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 ${bulkMode && selectedEmployeeIds.has(emp.employeeId) ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                        {bulkMode && (
                          <TableCell className="border-r sticky left-0 bg-white dark:bg-slate-950 z-10 w-[48px] text-center p-1">
                            <div
                              role="checkbox"
                              aria-checked={selectedEmployeeIds.has(emp.employeeId)}
                              tabIndex={0}
                              className="flex items-center justify-center cursor-pointer"
                              onClick={() => toggleEmployeeSelection(emp.employeeId)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEmployeeSelection(emp.employeeId); } }}
                            >
                              {selectedEmployeeIds.has(emp.employeeId)
                                ? <CheckSquare className="h-4 w-4 text-blue-600" />
                                : <Square className="h-4 w-4 text-slate-400" />
                              }
                            </div>
                          </TableCell>
                        )}
                        <TableCell className={`font-medium border-r sticky ${bulkMode ? 'left-[48px]' : 'left-0'} bg-white dark:bg-slate-950 z-10 w-[150px] max-w-[150px] truncate`}>
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
