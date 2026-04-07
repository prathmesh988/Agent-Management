"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Employee } from "@/lib/types";

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: Partial<Employee>) => void;
  isLoading?: boolean;
}

const departments = [
  "Engineering",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
];
const roles = ["Manager", "Senior", "Junior", "Intern", "Lead"];
const statuses = ["active", "inactive", "on-leave"];

export function EmployeeForm({
  employee,
  onSubmit,
  isLoading = false,
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: employee?.name || "",
    email: employee?.email || "",
    department: employee?.department || "",
    designation: employee?.designation || "",
    status: employee?.status || "active",
    employeeId: employee?.employeeId || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof Employee, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">
        {employee ? "Edit Employee" : "Add Employee"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Full Name
            </label>
            <Input
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Department
            </label>
            <Select
              value={formData.department || ""}
              onValueChange={(value) => handleChange("department", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <Select
              value={formData.designation || ""}
              onValueChange={(value) => handleChange("designation", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Employee ID</label>
            <Input
              value={formData.employeeId || ""}
              onChange={(e) => handleChange("employeeId", e.target.value)}
              placeholder="EMP00001"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select
              value={formData.status || "active"}
              onValueChange={(value) => handleChange("status", value as "active" | "inactive" | "on-leave")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            {isLoading
              ? "Saving..."
              : employee
                ? "Update Employee"
                : "Add Employee"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
