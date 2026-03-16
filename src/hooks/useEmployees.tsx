'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Employee, generateMockEmployees } from '@/lib/data/mock-data';

interface EmployeeContextType {
  employees: Employee[];
  getEmployee: (id: string) => Employee | undefined;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  isLoading: boolean;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize employees on mount
  useEffect(() => {
    const initialEmployees = generateMockEmployees(50);
    setEmployees(initialEmployees);
    setIsLoading(false);
  }, []);

  const getEmployee = (id: string): Employee | undefined => {
    return employees.find((e) => e.id === id);
  };

  const updateEmployee = (updatedEmployee: Employee) => {
    // Ensure required fields have values
    const sanitized: Employee = {
      ...updatedEmployee,
      department: updatedEmployee.department || 'Engineering',
      role: updatedEmployee.role || 'Junior',
      status: updatedEmployee.status || 'active',
    };
    
    setEmployees((prev) =>
      prev.map((e) => (e.id === sanitized.id ? sanitized : e))
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <EmployeeContext.Provider
      value={{ employees, getEmployee, updateEmployee, deleteEmployee, isLoading }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployees() {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployees must be used within EmployeeProvider');
  }
  return context;
}
