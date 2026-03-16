"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/lib/types";
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
import { X } from "lucide-react";

interface EditEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
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
const statuses: ("active" | "inactive" | "on-leave")[] = [
  "active",
  "inactive",
  "on-leave",
];

export function EditEmployeeModal({
  employee,
  isOpen,
  onClose,
  onSave,
}: EditEmployeeModalProps) {
  const [formData, setFormData] = useState<Employee>(
    employee || {
      id: "",
      name: "",
      email: "",
      designation: "",
      department: "",
      status: "active",
      dateOfJoining: "",
    },
  );

  // Autofill form when employee changes
  useEffect(() => {
    if (employee) {
      setFormData(employee);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.department ||
      !formData.role ||
      !formData.status ||
      !formData.joinDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Edit Employee</h2>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@company.com"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Department
              </label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  handleSelectChange("department", value)
                }
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

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
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

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  handleSelectChange(
                    "status",
                    value as "active" | "inactive" | "on-leave",
                  )
                }
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

            {/* Join Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Join Date
              </label>
              <Input
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone
              </label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                placeholder="+1234567890"
              />
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Salary
              </label>
              <Input
                type="number"
                name="salary"
                value={formData.salary || ""}
                onChange={handleChange}
                placeholder="50000"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
