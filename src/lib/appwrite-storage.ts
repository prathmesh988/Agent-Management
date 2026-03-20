/**
 * Service for managing Appwrite Storage bucket operations
 */

import { Client, Storage } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const BUCKET_ID = "69b7cf9e001384db23f9";
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

function getStorageClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET!);

  return new Storage(client);
}

/**
 * Upload PDF to Appwrite bucket
 * Filename format: {employeeId}.pdf
 * 
 * Uses employeeId as file ID to ensure:
 * - Unique file per employee
 * - Easy lookup by employeeId
 * - Overwrite capability for updated certificates
 */
export async function uploadCertificateToBucket(
  pdfBuffer: Buffer,
  employeeId: string
) {
  try {
    const storage = getStorageClient();
    const fileId = employeeId; // Use employeeId as file ID for deterministic lookup
    const fileName = `${employeeId}.pdf`;

    // Create InputFile from buffer (proper way for Node.js)
    const inputFile = InputFile.fromBuffer(
      pdfBuffer,
      fileName
    );

    // Try to update existing file first (idempotent operation)
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
      console.log(`✓ Deleted old certificate for ${employeeId}`);
    } catch (deleteError) {
      // File doesn't exist yet, that's fine
    }

    // Create new file (will overwrite if old one existed)
    const file = await storage.createFile(
      BUCKET_ID,
      fileId,
      inputFile
    );

    console.log(`✓ Certificate uploaded to bucket: ${fileName}`);
    return { success: true, fileName, fileId: file.$id };
  } catch (error) {
    console.error("✗ Error uploading certificate to bucket:", error);
    throw error;
  }
}

/**
 * Check if certificates exist in bucket for selected employees
 */
export async function checkCertificatesInBucket(certificateIds: string[]) {
  try {
    const storage = getStorageClient();
    const results: Record<string, boolean> = {};

    for (const certId of certificateIds) {
      try {
        await storage.getFile(BUCKET_ID, certId);
        results[certId] = true;
      } catch (error) {
        results[certId] = false;
      }
    }

    return results;
  } catch (error) {
    console.error("✗ Error checking certificates in bucket:", error);
    return certificateIds.reduce((acc, id) => ({ ...acc, [id]: false }), {});
  }
}

/**
 * Check if certificate PDF exists in bucket for an employee
 * Uses employeeId as the lookup key
 */
export async function checkIfCertificateExists(employeeId: string): Promise<boolean> {
  try {
    const storage = getStorageClient();
    await storage.getFile(BUCKET_ID, employeeId);
    return true;
  } catch (error) {
    // File doesn't exist
    return false;
  }
}

/**
 * Get buffer of existing PDF from bucket for employee
 * Returns null if file doesn't exist
 */
export async function getPdfFromBucket(employeeId: string): Promise<Buffer | null> {
  try {
    const storage = getStorageClient();
    const file = await storage.getFileView(BUCKET_ID, employeeId);
    
    // file is a Uint8Array from Appwrite
    return Buffer.from(file);
  } catch (error) {
    console.warn(`PDF not found in bucket for employee ${employeeId}`);
    return null;
  }
}

/**
 * Get download URL for certificate in bucket
 * Uses employeeId as the file ID
 */
export function getCertificateDownloadUrl(employeeId: string): string {
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${employeeId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
}

/**
 * Get list of all certificates in bucket for an employee
 * 
 * Note: With new naming scheme (employeeId.pdf), there should be at most one per employee
 */
export async function getEmployeeCertificatesFromBucket(employeeId: string) {
  try {
    const exists = await checkIfCertificateExists(employeeId);
    if (!exists) {
      return [];
    }
    
    const storage = getStorageClient();
    const file = await storage.getFile(BUCKET_ID, employeeId);
    return [file];
  } catch (error) {
    console.error("✗ Error getting employee certificate:", error);
    return [];
  }
}

/**
 * Delete certificate from bucket using employeeId
 */
export async function deleteCertificateFromBucket(employeeId: string) {
  try {
    const storage = getStorageClient();
    await storage.deleteFile(BUCKET_ID, employeeId);
    console.log(`✓ Certificate deleted from bucket for employee: ${employeeId}`);
    return { success: true };
  } catch (error) {
    console.error("✗ Error deleting certificate:", error);
    throw error;
  }
}

export { BUCKET_ID };
