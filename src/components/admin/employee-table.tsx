"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Employee } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";

interface EmployeeTableProps {
  employees: Employee[];
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
}

const ITEMS_PER_PAGE = 10;

// Dropdown menu component
function ActionDropdown({ employee, onView, onEdit, onDelete }: any) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-all duration-200 hover:text-slate-900"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10 overflow-hidden">
          <Link href={`/admin/employees/${employee.id}`}>
            <button
              onClick={() => {
                onView?.(employee);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors duration-200"
            >
              <Eye className="h-4 w-4 text-blue-600" />
              View Details
            </button>
          </Link>
          <button
            onClick={() => {
              onEdit?.(employee);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors duration-200 border-t border-slate-200"
          >
            <Edit2 className="h-4 w-4 text-amber-600" />
            Edit
          </button>
          <button
            onClick={() => {
              onDelete?.(employee);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-red-50 flex items-center gap-2 transition-colors duration-200 border-t border-slate-200"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(index: number) {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  return colors[index % colors.length];
}

export function EmployeeTable({
  employees,
  onView,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Employee>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter and search
  let filtered = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      departmentFilter === "all" || employee.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  // Sort
  filtered.sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filtered.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean)),
  ) as string[];

  const toggleSort = (field: keyof Employee) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <Card>
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Employees</h2>
        <Link href="/admin/employees/upload">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            + Add New Employee
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="p-6 space-y-4 border-b border-slate-200">
        <div className="grid gap-4 md:grid-cols-3 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Search</label>
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Department
            </label>
            <Select
              value={departmentFilter}
              onValueChange={(value) => {
                setDepartmentFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            {(searchTerm || departmentFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setDepartmentFilter("all");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => toggleSort("name")}
                  className="font-semibold hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                >
                  Employee
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("department")}
                  className="font-semibold hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                >
                  Department
                </button>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.map((employee, idx) => (
              <TableRow
                key={employee.id}
                onClick={() => router.push(`/admin/employees/${employee.id}`)}
                className="cursor-pointer hover:bg-slate-50 transition-colors duration-200"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full ${getAvatarColor(idx)} flex items-center justify-center text-white text-xs font-700`}
                    >
                      {getInitials(employee.name)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {employee.name}
                      </p>
                      <p className="text-xs text-slate-500">{employee.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell className="text-slate-600">
                  {employee.designation}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                      employee.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : employee.status === "on-leave"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        employee.status === "active"
                          ? "bg-emerald-600"
                          : employee.status === "on-leave"
                            ? "bg-amber-600"
                            : "bg-rose-600"
                      }`}
                    />
                    {(employee.status || "").charAt(0).toUpperCase() +
                      (employee.status || "").slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ActionDropdown
                    employee={employee}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-6 border-t border-slate-200">
        <p className="text-sm text-slate-600">
          Showing {startIndex + 1} to{" "}
          {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of{" "}
          {filtered.length} employees
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(i + 1)}
              className="transition-all duration-200 hover:scale-105"
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
