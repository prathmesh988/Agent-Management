'use server';

/**
 * Server action to generate certificate, upload to bucket (if needed), and return shareable URL
 */

import puppeteer from 'puppeteer';
import { uploadCertificateToBucket, checkIfCertificateExists, getCertificateDownloadUrl, getPdfFromBucket } from '@/lib/appwrite-storage';
import { getExactCertificateHTML } from '@/lib/certificate-html-generator';
import type { Certificate } from '@/lib/types';

/**
 * Get shareable URL for certificate
 * - Checks if PDF exists in bucket
 * - If not, generates and uploads it
 * - Returns the download/share URL
 */
export async function getCertificateShareUrl(certificate: Certificate): Promise<{
  success: boolean;
  shareUrl?: string;
  error?: string;
}> {
  try {
    const employeeId = certificate.employeeId || certificate.id;
    if (!employeeId) {
      return {
        success: false,
        error: 'Employee ID is required',
      };
    }

    // Check if certificate already exists in bucket
    const exists = await checkIfCertificateExists(employeeId);

    if (exists) {
      // Certificate already exists, just return the URL
      const shareUrl = getCertificateDownloadUrl(employeeId);
      console.log(`✓ Certificate for ${employeeId} already exists in bucket`);
      return {
        success: true,
        shareUrl,
      };
    }

    // Certificate doesn't exist, generate and upload it
    console.log(`📄 Generating certificate for ${employeeId}...`);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    try {
      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 1600 });

      // Generate HTML content
      const htmlContent = getExactCertificateHTML(certificate, false);

      // Set page content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '0.4in',
          right: '0.4in',
          bottom: '0.4in',
          left: '0.4in',
        },
        printBackground: true,
      });

      // Convert to Buffer
      const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);

      // Upload to bucket
      await uploadCertificateToBucket(pdfBuffer, employeeId);

      // Generate and return share URL
      const shareUrl = getCertificateDownloadUrl(employeeId);

      console.log(`✓ Certificate generated and uploaded for ${employeeId}`);

      return {
        success: true,
        shareUrl,
      };
    } finally {
      await browser.close();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('✗ Error generating certificate share URL:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
