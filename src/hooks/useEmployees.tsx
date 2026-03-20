"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { getEmployees, searchEmployeesAction } from "@/app/(actions)/employees";
import { Employee } from "@/lib/types";

interface EmployeeContextType {
  employees: Employee[];
  getEmployee: (id: string) => Employee | undefined;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  searchEmployees: (term: string) => Promise<Employee[]>;
  refreshEmployees: () => Promise<void>;
  isLoading: boolean;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(
  undefined,
);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const { employees: fetchedEmployees } = await getEmployees();
      console.log(`Fetched ${fetchedEmployees.length} employees total`);
      setEmployees(fetchedEmployees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch employees from database on mount
  useEffect(() => {
    fetchAllEmployees();
  }, [fetchAllEmployees]);

  const getEmployee = (id: string): Employee | undefined => {
    return employees.find((e) => e.id === id);
  };

  const updateEmployee = async (updatedEmployee: Employee) => {
    try {
      const { updateEmployeeAction } = await import("@/app/(actions)/employees");
      await updateEmployeeAction(updatedEmployee.id, updatedEmployee);
      
      // Update local state
      setEmployees((prev) =>
        prev.map((e) => (e.id === updatedEmployee.id ? updatedEmployee : e)),
      );
    } catch (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  /**
   * Search employees server-side from Appwrite
   * Returns matching employees directly from the database
   */
  const searchEmployees = useCallback(async (term: string): Promise<Employee[]> => {
    try {
      if (!term || term.trim().length === 0) {
        return employees;
      }
      const results = await searchEmployeesAction(term);
      return results;
    } catch (error) {
      console.error("Error searching employees:", error);
      // Fallback to local filter
      const lowerTerm = term.toLowerCase();
      return employees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(lowerTerm) ||
          emp.employeeId?.toLowerCase().includes(lowerTerm) ||
          emp.email?.toLowerCase().includes(lowerTerm) ||
          emp.id?.toLowerCase().includes(lowerTerm),
      );
    }
  }, [employees]);

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        getEmployee,
        updateEmployee,
        deleteEmployee,
        searchEmployees,
        refreshEmployees: fetchAllEmployees,
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
