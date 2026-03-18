"use server";

import {
  fetchAllCertificates as dbFetchAllCertificates,
  fetchCertificate as dbFetchCertificate,
  searchCertificates as dbSearchCertificates,
  fetchCertificatesByEmployee as dbFetchCertificatesByEmployee,
  updateCertificate as dbUpdateCertificate,
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

/**
 * Server action: Update a certificate
 */
export async function updateCertificateAction(
  certificateId: string,
  updates: Partial<Certificate>,
): Promise<Certificate> {
  try {
    console.log("🔵 Attempting to update certificate:", certificateId);
    console.log("📦 Received updates:", updates);
    
    // Map Certificate fields to EmployeeRecord fields with proper type conversion
    // All numeric fields from schema (double type)
    const numericFields = new Set([
      'sno', 'ctc', 'attendanceAllowance', 'dateOfJoining',
      'presentDays', 'absentDays', 'leaveDays', 'halfDays', 'weekOffDays', 'holidayDays',
      'cl', 'lc', 'trp', 'tra', 'trl', 'totalPresent', 'overtime', 'finalDays',
      'arrear', 'advance', 'shiftAllowance', 'grossSalary', 'attendanceDeduction',
      'employeeContribution', 'employeeEsic', 'employerContribution', 'employerEsic',
      'tds5perc', 'netSalary', 'penalty', 'paidAmount'
    ]);

    const dbFieldMapping: Record<string, string | null> = {
      certificateId: 'certificateId',
      jobTitle: 'designation',
      department: 'process',
      salary: 'ctc', // Convert string salary to number for ctc
      // Skip computed fields and non-database fields
      startDate: null,
      typeOfEmployment: null,
      workHoursPerWeek: null,
      certifierName: null,
      certifierTitle: null,
      employeeName: null,
      employeeEmail: null,
      companyName: null,
      address: null,
      phone: null,
      contactAddressLine1: null,
      contactAddressLine2: null,
      contactEmail: null,
      contactPhone: null,
      $id: null,
      id: null,
    };

    // Build cleanedUpdates with type conversion for numeric fields
    const cleanedUpdates: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === null) continue; // Skip undefined/null
      
      const dbField = dbFieldMapping[key];
      if (dbField) {
        // Convert to number if it's a numeric field and value is a string
        if (numericFields.has(dbField) && typeof value === 'string') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            cleanedUpdates[dbField] = numValue;
          } else {
            console.warn(`⚠️ Could not convert "${key}": "${value}" to number`);
          }
        } else if (numericFields.has(dbField) && typeof value === 'number') {
          cleanedUpdates[dbField] = value;
        } else if (!numericFields.has(dbField)) {
          cleanedUpdates[dbField] = value;
        }
      } else if (!dbFieldMapping.hasOwnProperty(key)) {
        // Include fields not in the mapping (might be database fields)
        // Apply type conversion if it's a numeric field
        if (numericFields.has(key) && typeof value === 'string') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            cleanedUpdates[key] = numValue;
          }
        } else {
          cleanedUpdates[key] = value;
        }
      }
    }

    console.log("✅ Cleaned updates to send:", cleanedUpdates);
    
    const updated = await dbUpdateCertificate(certificateId, cleanedUpdates as Partial<Certificate>);
    console.log("✅ Certificate updated successfully:", updated);
    return normalizeCertificate(updated);
  } catch (error) {
    console.error("❌ Error updating certificate:", error);
    throw error;
  }
}
