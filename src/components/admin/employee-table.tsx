"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  onSearch?: (term: string) => Promise<Employee[]>;
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
  onSearch,
}: EmployeeTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Employee>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchResults, setSearchResults] = useState<Employee[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  // 0 = server/SSR (unknown width). Populated after mount to avoid hydration mismatch.
  const [windowWidth, setWindowWidth] = useState(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Update windowWidth safely after mount only
  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Debounced server-side search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!searchTerm.trim() || !onSearch) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await onSearch(searchTerm.trim());
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm, onSearch]);

  // Use server results when available, otherwise filter locally
  const sourceEmployees = searchResults ?? employees;

  // Filter and search
  let filtered = sourceEmployees.filter((employee) => {
    // If server search returned results, only apply department filter
    if (searchResults) {
      const matchesDept =
        departmentFilter === "all" || employee.department === departmentFilter;
      return matchesDept;
    }

    // Local filtering fallback
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      employee.name.toLowerCase().includes(term) ||
      employee.email.toLowerCase().includes(term) ||
      employee.id.toLowerCase().includes(term) ||
      (employee.employeeId?.toLowerCase().includes(term) ?? false);

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
    <Card className="flex flex-col h-full w-full overflow-hidden border-0 shadow-sm sm:border sm:shadow">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold text-slate-900">Employees</h2>
        <Link href="/admin/employees/upload">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
            + Add New Employee
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-slate-200 shrink-0 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end w-full">
          <div className="flex-1 w-full min-w-0 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Search</label>
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white transition-all duration-200 focus-visible:ring-blue-500"
            />
          </div>

          <div className="w-full sm:w-48 shrink-0 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Department
            </label>
            <Select
              value={departmentFilter}
              onValueChange={(value) => {
                setDepartmentFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-white transition-all duration-200 focus-visible:ring-blue-500">
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

          {(searchTerm || departmentFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto shrink-0 h-10 mt-1"
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

      {/* Table Area */}
      <div className="flex-1 min-h-0 relative bg-white">
        <div className="absolute inset-0 overflow-auto">
          <Table className="w-full">
            <TableHeader className="sticky top-0 bg-slate-100 z-10 shadow-sm">
              <TableRow className="border-b border-slate-200">
                <TableHead className="w-[45%] sm:w-[35%] py-3">
                <button
                  onClick={() => toggleSort("name")}
                  className="font-semibold hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                >
                  Employee
                </button>
              </TableHead>
              <TableHead className="w-[25%] sm:w-[20%] py-3">
                <button
                  onClick={() => toggleSort("department")}
                  className="font-semibold hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                >
                  Department
                </button>
              </TableHead>
              <TableHead className="w-[20%] py-3 hidden sm:table-cell">Role</TableHead>
              <TableHead className="w-[20%] py-3 hidden md:table-cell">Status</TableHead>
              <TableHead className="w-[10%] text-right py-3 pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {paginatedEmployees.map((employee, idx) => (
              <TableRow
                key={employee.id}
                onClick={() => router.push(`/admin/employees/${employee.id}`)}
                className="cursor-pointer hover:bg-slate-50 transition-colors duration-200"
              >
                <TableCell className="py-4 pl-4 min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 shrink-0 rounded-full ${getAvatarColor(idx)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}
                    >
                      {getInitials(employee.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">
                        {employee.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{employee.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium truncate max-w-[120px]">
                    {employee.department}
                  </span>
                </TableCell>
                <TableCell className="py-4 text-slate-600 truncate text-sm hidden sm:table-cell">
                  {employee.designation}
                </TableCell>
                <TableCell className="py-4 hidden md:table-cell">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap ${employee.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : employee.status === "on-leave"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                      }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${employee.status === "active"
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
                <TableCell className="py-4 text-right pr-4">
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
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 shrink-0 bg-white gap-3 sm:gap-0">
        <p className="text-xs sm:text-sm text-slate-600 shrink-0">
          Showing <span className="font-medium text-slate-900">{startIndex + 1}</span> to{" "}
          <span className="font-medium text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</span> of{" "}
          <span className="font-medium text-slate-900">{filtered.length}</span> employees
        </p>
        <div className="flex gap-1 items-center">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {(() => {
            // Mobile: simplified pagination. Use windowWidth state (safe for SSR)
            const isMobile = windowWidth > 0 && windowWidth < 640;
            
            const pages: (number | "ellipsis")[] = [];
            const maxVisiblePages = isMobile ? 3 : 5;
            
            if (totalPages <= maxVisiblePages) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (currentPage > (isMobile ? 2 : 3)) pages.push("ellipsis");
              
              const start = Math.max(2, currentPage - 1);
              const end = Math.min(totalPages - 1, currentPage + (isMobile ? 0 : 1));
              
              for (let i = start; i <= end; i++) pages.push(i);
              
              if (currentPage < totalPages - (isMobile ? 1 : 2)) pages.push("ellipsis");
              pages.push(totalPages);
            }
            
            return pages.map((page, idx) =>
              page === "ellipsis" ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="transition-all duration-200 hover:scale-105 min-w-[2rem]"
                >
                  {page}
                </Button>
              )
            );
          })()}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
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
