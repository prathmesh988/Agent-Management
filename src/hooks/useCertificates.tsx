'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Certificate {
  id: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  jobTitle: string;
  startDate: string;
  typeOfEmployment: string;
  salary: string;
  workHoursPerWeek: string;
  phone: string;
  address: string;
  companyName: string;
  certificateId: string;
  certifierName: string;
  certifierTitle: string;
  contactPhone: string;
  contactEmail: string;
  contactAddressLine1: string;
  contactAddressLine2: string;
}

interface CertificateContextType {
  certificates: Certificate[];
  getCertificate: (id: string) => Certificate | undefined;
  updateCertificate: (certificate: Certificate) => void;
  deleteCertificate: (id: string) => void;
  isLoading: boolean;
}

const CertificateContext = createContext<CertificateContextType | undefined>(undefined);

// Generate dummy certificates based on employees
const generateDummyCertificates = (): Certificate[] => {
  const certificateIds = ['CERT00001', 'CERT00002', 'CERT00003', 'CERT00004', 'CERT00005'];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  const jobTitles = ['Manager', 'Senior Developer', 'Designer', 'Analyst', 'Coordinator'];
  const names = ['John Johnson', 'Sarah Williams', 'Michael Brown', 'Emily Davis', 'David Wilson'];
  const companies = ['Tech Corp', 'Global Solutions', 'Innovate Inc', 'Digital Hub', 'Cloud Systems'];

  return certificateIds.map((id, idx) => ({
    id,
    employeeName: names[idx],
    employeeEmail: `employee${idx + 1}@company.com`,
    department: departments[idx],
    jobTitle: jobTitles[idx],
    startDate: '2022-03-15',
    typeOfEmployment: 'Full-time',
    salary: `$${75000 + idx * 10000} per annum`,
    workHoursPerWeek: '40 hours',
    phone: `+1 (555) ${200 + idx}-${1000 + idx}`,
    address: '123 Employee Street',
    companyName: companies[idx],
    certificateId: `${id}-2026`,
    certifierName: 'HR Manager',
    certifierTitle: 'Human Resources Manager',
    contactPhone: '+1 (555) 123-4567',
    contactEmail: 'hr@company.com',
    contactAddressLine1: '123 Company Street',
    contactAddressLine2: 'City, State 12345',
  }));
};

export function CertificateProvider({ children }: { children: ReactNode }) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize certificates on mount
  useEffect(() => {
    const initialCertificates = generateDummyCertificates();
    setCertificates(initialCertificates);
    setIsLoading(false);
  }, []);

  const getCertificate = (id: string): Certificate | undefined => {
    return certificates.find((c) => c.id === id);
  };

  const updateCertificate = (updatedCertificate: Certificate) => {
    setCertificates((prev) =>
      prev.map((c) => (c.id === updatedCertificate.id ? updatedCertificate : c))
    );
  };

  const deleteCertificate = (id: string) => {
    setCertificates((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <CertificateContext.Provider
      value={{ certificates, getCertificate, updateCertificate, deleteCertificate, isLoading }}
    >
      {children}
    </CertificateContext.Provider>
  );
}

export function useCertificates() {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error('useCertificates must be used within CertificateProvider');
  }
  return context;
}
