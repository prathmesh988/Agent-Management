import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import archiver from "archiver";
import { Readable } from "stream";
import { uploadCertificateToBucket, checkIfCertificateExists, getPdfFromBucket } from "@/lib/appwrite-storage";
import { getExactCertificateHTML } from "@/lib/certificate-html-generator";

interface CertificateData {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  startDate: string;
  salary: string;
  certificateId: string;
}

/**
 * API Route: Bulk Certificate PDF Generation
 * POST /api/certificates/download-all
 * 
 * Body: { certificates: CertificateData[] }
 * Response: ZIP file containing all PDFs
 */
export async function POST(request: NextRequest) {
  try {
    const { certificates } = await request.json();

    if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
      return NextResponse.json(
        { error: "No certificates provided" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent server overload
    if (certificates.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 certificates per request" },
        { status: 400 }
      );
    }

    // Launch Puppeteer with optimized settings
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Prevent memory issues
      ],
    });

    // Create archive stream for ZIP
    const archive = archiver("zip", { zlib: { level: 9 } });

    // Convert archive to buffer
    const chunks: Uint8Array[] = [];
    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on("data", (chunk) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);
    });

    // Generate PDFs concurrently with limited concurrency (max 3)
    const concurrencyLimit = 3;
    const uploadResults: Array<{ employeeId: string; employeeName: string; generated: boolean; reused: boolean; fileId?: string; error?: string }> = [];
    
    for (let i = 0; i < certificates.length; i += concurrencyLimit) {
      const batch = certificates.slice(i, i + concurrencyLimit);

      await Promise.all(
        batch.map(async (cert) => {
          let page = null;
          try {
            // Check if PDF already exists in bucket
            const certificateExists = await checkIfCertificateExists(cert.employeeId);
            
            if (certificateExists) {
              // Reuse existing PDF from bucket
              const existingPdf = await getPdfFromBucket(cert.employeeId);
              if (existingPdf) {
                const filename = `Certificate_${cert.employeeId}_${cert.employeeName.replace(/\s+/g, "_")}.pdf`;
                archive.append(existingPdf, { name: filename });
                uploadResults.push({
                  employeeId: cert.employeeId,
                  employeeName: cert.employeeName,
                  generated: false,
                  reused: true,
                });
                console.log(`↻ Reused existing certificate for ${cert.employeeName}`);
                return;
              }
            }

            // Generate new PDF if it doesn't exist or reuse failed
            page = await browser.newPage();

            // Set viewport for consistent PDF rendering
            await page.setViewport({ width: 1200, height: 1600 });

            // Generate HTML content for the certificate
            const htmlContent = getExactCertificateHTML(cert, false);

            // Set page content
            await page.setContent(htmlContent, { waitUntil: "networkidle0" });

            // Generate PDF with specific settings
            const pdf = await page.pdf({
              format: "A4",
              margin: {
                top: "0.4in",
                right: "0.4in",
                bottom: "0.4in",
                left: "0.4in",
              },
              printBackground: true,
            });

            // Convert to Buffer
            const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
            const filename = `Certificate_${cert.employeeId}_${cert.employeeName.replace(/\s+/g, "_")}.pdf`;
            
            // Add PDF to archive
            archive.append(pdfBuffer, { name: filename });

            // Upload to Appwrite bucket (will overwrite if exists)
            try {
              const uploadResult = await uploadCertificateToBucket(
                pdfBuffer,
                cert.employeeId
              );
              uploadResults.push({
                employeeId: cert.employeeId,
                employeeName: cert.employeeName,
                generated: true,
                reused: false,
                fileId: uploadResult.fileName,
              });
              console.log(`✓ Generated and uploaded certificate for ${cert.employeeName} to bucket`);
            } catch (uploadError) {
              console.error(`✗ Failed to upload certificate for ${cert.employeeName}:`, uploadError);
              uploadResults.push({
                employeeId: cert.employeeId,
                employeeName: cert.employeeName,
                generated: true,
                reused: false,
                error: uploadError instanceof Error ? uploadError.message : "Upload failed",
              });
            }

            console.log(`Generated PDF for ${cert.employeeName}`);
          } catch (error) {
            console.error(`Error generating PDF for ${cert.employeeName}:`, error);
            uploadResults.push({
              employeeId: cert.employeeId,
              employeeName: cert.employeeName,
              generated: false,
              reused: false,
              error: "PDF generation failed",
            });
            // Continue with other certificates on error
          } finally {
            if (page) {
              await page.close();
            }
          }
        })
      );
    }

    // Close browser
    await browser.close();

    // Finalize archive
    archive.finalize();

    // Wait for archive to complete
    const zipBuffer = await archivePromise;

    // Log upload results
    const successCount = uploadResults.filter((r) => (r.generated || r.reused) && !r.error).length;
    console.log(
      `Certificate generation complete: ${successCount}/${certificates.length} processed (generated or reused)`
    );

    // Return ZIP file as response with metadata
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Certificates_${new Date().getTime()}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
        "X-Success-Count": successCount.toString(),
        "X-Total-Count": certificates.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error in bulk certificate generation:", error);
    return NextResponse.json(
      {
        error: "Failed to generate certificates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
