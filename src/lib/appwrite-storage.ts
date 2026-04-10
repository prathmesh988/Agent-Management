/**
 * Service for managing Appwrite Storage bucket operations
 */

import { Client, Storage } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const BUCKET_ID = "69b7cf9e001384db23f9";
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

// Lazy singleton — created once per server process, not per request
let _storageClient: Storage | null = null;

function getStorageClient(): Storage {
  if (!_storageClient) {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET!);
    _storageClient = new Storage(client);
  }
  return _storageClient;
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
 * Check if certificates exist in bucket for selected employees.
 * Uses a SINGLE listFiles() API call instead of N getFile() calls.
 * Appwrite's listFiles returns up to 5000 files — sufficient for typical usage.
 */
export async function checkCertificatesInBucket(certificateIds: string[]) {
  return checkAllCertificatesInBucket(certificateIds);
}

/**
 * Bulk-check certificate existence in ONE API call.
 * Lists all files in the bucket, then does a local O(n) set lookup.
 * Replaces the old sequential loop that made one HTTP request per employee.
 */
export async function checkAllCertificatesInBucket(
  employeeIds: string[]
): Promise<Record<string, boolean>> {
  try {
    const storage = getStorageClient();
    const { Query } = await import("node-appwrite");

    // Fetch up to 5000 files in one request — covers all realistic employee counts
    const response = await storage.listFiles(BUCKET_ID, [
      Query.limit(5000),
    ]);

    // Build a set of file IDs that exist for O(1) lookup
    const existingFileIds = new Set(response.files.map((f) => f.$id));

    // Map each employeeId to whether their certificate file exists
    return Object.fromEntries(
      employeeIds.map((id) => [id, existingFileIds.has(id)])
    );
  } catch (error) {
    console.error("✗ Error bulk-checking certificates in bucket:", error);
    // Graceful degradation: assume none exist rather than crashing
    return Object.fromEntries(employeeIds.map((id) => [id, false]));
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

/**
 * ============================================================================
 * Leave Document Storage Functions
 * ============================================================================
 * Naming scheme: leave_{leaveId}.{extension} or leave_{leaveId}_{index}.{extension}
 * Used for storing employee leave evidence (PDFs, images, documents)
 */

/**
 * Get download URL for a leave document in bucket
 * Uses the file ID from the leave upload system
 */
export function getLeaveDocumentDownloadUrl(fileId: string): string {
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
}

/**
 * Check if leave documents exist for a specific leave request
 * Returns boolean indicating if any documents are found
 */
export async function checkIfLeaveDocumentsExist(leaveId: string): Promise<boolean> {
  try {
    const storage = getStorageClient();
    const { Query } = await import("node-appwrite");

    // Query for files matching the pattern: leave_{leaveId}*
    const response = await storage.listFiles(BUCKET_ID, [
      Query.startsWith("$id", `leave_${leaveId}`),
    ]);

    return response.files.length > 0;
  } catch (error) {
    console.warn(`No documents found in bucket for leave ${leaveId}`);
    return false;
  }
}

/**
 * Get all documents for a specific leave request
 * Returns array of file objects
 */
export async function getLeaveDocumentsFromBucket(leaveId: string) {
  try {
    const storage = getStorageClient();
    const { Query } = await import("node-appwrite");

    const response = await storage.listFiles(BUCKET_ID, [
      Query.startsWith("$id", `leave_${leaveId}`),
      Query.limit(100), // Max 100 files per leave request
    ]);

    return response.files;
  } catch (error) {
    console.error(`✗ Error getting leave documents for ${leaveId}:`, error);
    return [];
  }
}

/**
 * Delete a specific leave document from bucket
 */
export async function deleteLeaveDocumentFromBucket(fileId: string) {
  try {
    const storage = getStorageClient();
    await storage.deleteFile(BUCKET_ID, fileId);
    console.log(`✓ Leave document deleted from bucket: ${fileId}`);
    return { success: true };
  } catch (error) {
    console.error(`✗ Error deleting leave document ${fileId}:`, error);
    throw error;
  }
}

/**
 * Delete all documents for a specific leave request
 * Useful when a leave request is deleted
 */
export async function deleteAllLeaveDocuments(leaveId: string) {
  try {
    const documents = await getLeaveDocumentsFromBucket(leaveId);
    const storage = getStorageClient();

    for (const doc of documents) {
      await storage.deleteFile(BUCKET_ID, doc.$id);
    }

    console.log(`✓ Deleted ${documents.length} documents for leave ${leaveId}`);
    return { success: true, deletedCount: documents.length };
  } catch (error) {
    console.error(`✗ Error deleting leave documents for ${leaveId}:`, error);
    throw error;
  }
}
