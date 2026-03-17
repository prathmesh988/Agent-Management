"use server";

import {
  fetchAllCertificates as dbFetchAllCertificates,
  fetchCertificate as dbFetchCertificate,
  searchCertificates as dbSearchCertificates,
  fetchCertificatesByEmployee as dbFetchCertificatesByEmployee,
} from "@/services/database";
import { Certificate } from "@/lib/types";

/**
 * Normalize certificate data from database
 */
function normalizeCertificate(cert: any): Certificate {
  const employeeName = cert.employeeName || "";
  return {
    $id: cert.$id,
    id: cert.$id || cert.certificateId, // Use $id as primary id
    certificateId: cert.certificateId,
    employeeName: employeeName,
    employeeEmail: cert.employeeEmail || `${employeeName}@company.com`,
    companyName: cert.companyName,
    address: cert.address,
    phone: cert.phone,
    contactAddressLine1: cert.contactAddressLine1,
    contactAddressLine2: cert.contactAddressLine2,
    contactEmail: cert.contactEmail,
    contactPhone: cert.contactPhone,
    jobTitle: cert.jobTitle,
    department: cert.department,
    startDate: cert.startDate,
    typeOfEmployment: cert.typeOfEmployment,
    salary: cert.salary,
    workHoursPerWeek: cert.workHoursPerWeek,
    certifierName: cert.certifierName,
    certifierTitle: cert.certifierTitle,
  };
}

/**
 * Server action: Fetch all certificates from database
 * Default limit increased to 5000 to support large datasets
 */
export async function getCertificates(
  limit: number = 5000,
  offset: number = 0,
): Promise<{ certificates: Certificate[]; total: number }> {
  try {
    const { certificates, total } = await dbFetchAllCertificates(limit, offset);
    return {
      certificates: certificates.map(normalizeCertificate),
      total,
    };
  } catch (error) {
    console.error("Error fetching certificates from database:", error);
    throw error;
  }
}

/**
 * Server action: Fetch single certificate by ID
 */
export async function getCertificate(
  certificateId: string,
): Promise<Certificate | null> {
  try {
    const certificate = await dbFetchCertificate(certificateId);
    if (!certificate) return null;
    return normalizeCertificate(certificate);
  } catch (error) {
    console.error("Error fetching certificate from database:", error);
    throw error;
  }
}

/**
 * Server action: Search certificates
 */
export async function searchCertificatesAction(
  searchTerm: string,
): Promise<Certificate[]> {
  try {
    const certificates = await dbSearchCertificates(searchTerm);
    return certificates.map(normalizeCertificate);
  } catch (error) {
    console.error("Error searching certificates:", error);
    throw error;
  }
}

/**
 * Server action: Fetch certificates by employee
 */
export async function getCertificatesByEmployee(
  employeeName: string,
): Promise<Certificate[]> {
  try {
    const certificates = await dbFetchCertificatesByEmployee(employeeName);
    return certificates.map(normalizeCertificate);
  } catch (error) {
    console.error("Error fetching certificates by employee:", error);
    throw error;
  }
}
