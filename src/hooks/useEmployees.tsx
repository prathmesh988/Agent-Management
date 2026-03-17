"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getEmployees, updateEmployeeAction } from "@/app/(actions)/employees";
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
        const { employees: fetchedEmployees } = await getEmployees();
        console.log("Fetched Employees:", fetchedEmployees);
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

  const updateEmployee = async (updatedEmployee: Employee) => {
    try {
      // Update in database via server action
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
