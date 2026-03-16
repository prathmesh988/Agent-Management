"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getEmployees } from "@/app/(actions)/employees";
import { Employee } from "@/lib/types";

interface EmployeeContextType {
  employees: Employee[];
  getEmployee: (id: string) => Employee | undefined;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  isLoading: boolean;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(
  undefined,
);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch employees from database on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { employees: fetchedEmployees } = await getEmployees(100, 0);
        setEmployees(fetchedEmployees);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const getEmployee = (id: string): Employee | undefined => {
    return employees.find((e) => e.id === id);
  };

  const updateEmployee = (updatedEmployee: Employee) => {
    // Ensure required fields have values
    const sanitized: Employee = {
      ...updatedEmployee,
      department: updatedEmployee.department || "Engineering",
      role: updatedEmployee.role || "Junior",
      status: updatedEmployee.status || "active",
    };

    setEmployees((prev) =>
      prev.map((e) => (e.id === sanitized.id ? sanitized : e)),
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        getEmployee,
        updateEmployee,
        deleteEmployee,
        isLoading,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployees() {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error("useEmployees must be used within EmployeeProvider");
  }
  return context;
}
