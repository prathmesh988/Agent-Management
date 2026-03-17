"use client";

import { Employee } from "@/lib/types";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  Calendar,
  AlertCircle,
  Target,
  Clock,
  Activity,
} from "lucide-react";

interface AttendanceAnalyticsProps {
  employee: Employee;
}

function calculateAttendancePercentage(presentDays: number, totalDays: number): number {
  if (totalDays === 0) return 0;
  return Math.round((presentDays / totalDays) * 100);
}

function calculateDaysWorked(
  presentDays: number,
  halfDays: number
): number {
  return presentDays + Math.floor(halfDays / 2);
}

function getPercentageColor(percentage: number): string {
  if (percentage >= 90) return "text-emerald-600";
  if (percentage >= 75) return "text-amber-600";
  return "text-red-600";
}

function getPercentageBgColor(percentage: number): string {
  if (percentage >= 90) return "bg-emerald-50 border-emerald-100";
  if (percentage >= 75) return "bg-amber-50 border-amber-100";
  return "bg-red-50 border-red-100";
}

function getDaysFromJoining(dateOfJoining?: number): number {
  if (!dateOfJoining) return 0;
  const joiningDate = new Date(dateOfJoining);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - joiningDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatDateRange(dateOfJoining?: number): string {
  if (!dateOfJoining) return "N/A";
  const joiningDate = new Date(dateOfJoining);
  const today = new Date();
  return `${joiningDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function AttendanceAnalytics({ employee }: AttendanceAnalyticsProps) {
  const presentDays = employee.presentDays || 0;
  const absentDays = employee.absentDays || 0;
  const leaveDays = employee.leaveDays || 0;
  const halfDays = employee.halfDays || 0;
  const weekOffDays = employee.weekOffDays || 0;
  const holidayDays = employee.holidayDays || 0;
  const totalPresent = employee.totalPresent || 0;
  const overtime = employee.overtime || 0;

  const totalDays = presentDays + absentDays + leaveDays + halfDays + weekOffDays + holidayDays;
  const workingDays = totalDays - weekOffDays - holidayDays;

  const attendancePercentage = calculateAttendancePercentage(presentDays, workingDays);
  const daysWorked = calculateDaysWorked(presentDays, halfDays);
  const daysFromJoining = getDaysFromJoining(employee.dateOfJoining);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Percentage */}
        <Card className={`p-6 border rounded-lg shadow-sm ${getPercentageBgColor(attendancePercentage)}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                Attendance %
              </p>
              <p className={`text-4xl font-bold ${getPercentageColor(attendancePercentage)}`}>
                {attendancePercentage}%
              </p>
            </div>
            <TrendingUp className={`h-8 w-8 ${getPercentageColor(attendancePercentage)}`} />
          </div>
          <p className="text-xs text-slate-600">
            Based on {workingDays} working days
          </p>
        </Card>

        {/* Days Worked */}
        <Card className="p-6 border border-blue-100 rounded-lg shadow-sm bg-blue-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                Days Worked
              </p>
              <p className="text-4xl font-bold text-blue-600">{daysWorked}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-xs text-slate-600">
            {presentDays} full + {halfDays} half days
          </p>
        </Card>

        {/* Total Tenure */}
        <Card className="p-6 border border-purple-100 rounded-lg shadow-sm bg-purple-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                Tenure
              </p>
              <p className="text-4xl font-bold text-purple-600">{daysFromJoining}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-xs text-slate-600">Days since joining</p>
        </Card>

        {/* Overtime Hours */}
        <Card className="p-6 border border-indigo-100 rounded-lg shadow-sm bg-indigo-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                Overtime
              </p>
              <p className="text-4xl font-bold text-indigo-600">{overtime}</p>
            </div>
            <Clock className="h-8 w-8 text-indigo-600" />
          </div>
          <p className="text-xs text-slate-600">Hours worked extra</p>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card className="p-6 border border-slate-100 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Detailed Breakdown</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance Distribution */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
              Attendance Distribution
            </h4>

            <div className="space-y-3">
              {/* Present */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    Present Days
                  </span>
                  <span className="font-semibold text-slate-900">{presentDays}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${totalDays > 0 ? (presentDays / totalDays) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Absent */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    Absent Days
                  </span>
                  <span className="font-semibold text-slate-900">{absentDays}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${totalDays > 0 ? (absentDays / totalDays) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Leave */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                    Leave Days
                  </span>
                  <span className="font-semibold text-slate-900">{leaveDays}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${totalDays > 0 ? (leaveDays / totalDays) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Half Days */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    Half Days
                  </span>
                  <span className="font-semibold text-slate-900">{halfDays}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${totalDays > 0 ? (halfDays / totalDays) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Other Metrics */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
              Other Metrics
            </h4>

            <div className="space-y-3">
              {/* Week Offs */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Week Off Days</span>
                  <span className="text-2xl font-bold text-slate-900">{weekOffDays}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Scheduled rest days</p>
              </div>

              {/* Holidays */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Holiday Days</span>
                  <span className="text-2xl font-bold text-slate-900">{holidayDays}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Total holidays</p>
              </div>

              {/* Total Present */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Present</span>
                  <span className="text-2xl font-bold text-emerald-600">{totalPresent}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Combined metric</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tenure Info */}
      <Card className="p-6 border border-slate-100 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Employment Timeline</h3>
            <p className="text-sm text-slate-600">{formatDateRange(employee.dateOfJoining)}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-slate-900">{daysFromJoining}</p>
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mt-1">
              Days Employed
            </p>
          </div>
        </div>

        {/* Expected tenure progress */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">
            One Year Progress
          </p>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${Math.min((daysFromJoining / 365) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {Math.round((daysFromJoining / 365) * 100)}% toward one year
          </p>
        </div>
      </Card>

      {/* Attendance Status Alert */}
      {attendancePercentage < 75 && (
        <Card className="p-4 border border-amber-100 rounded-lg shadow-sm bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900">Attendance Alert</h4>
              <p className="text-sm text-amber-800 mt-1">
                Attendance is below 75%. Current: {attendancePercentage}%. Monitor and take necessary action.
              </p>
            </div>
          </div>
        </Card>
      )}

      {attendancePercentage >= 90 && (
        <Card className="p-4 border border-emerald-100 rounded-lg shadow-sm bg-emerald-50">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-900">Excellent Attendance</h4>
              <p className="text-sm text-emerald-800 mt-1">
                Outstanding attendance record! Keep maintaining this excellent track record.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
