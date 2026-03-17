import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import archiver from "archiver";
import { Readable } from "stream";

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
    for (let i = 0; i < certificates.length; i += concurrencyLimit) {
      const batch = certificates.slice(i, i + concurrencyLimit);

      await Promise.all(
        batch.map(async (cert) => {
          let page = null;
          try {
            page = await browser.newPage();

            // Set viewport for consistent PDF rendering
            await page.setViewport({ width: 1200, height: 1600 });

            // Generate HTML content for the certificate
            const htmlContent = generateCertificateHTML(cert);

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

            // Add PDF to archive (convert to Buffer if needed)
            const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
            const filename = `Certificate_${cert.employeeId}_${cert.employeeName.replace(/\s+/g, "_")}.pdf`;
            archive.append(pdfBuffer, { name: filename });

            console.log(`Generated PDF for ${cert.employeeName}`);
          } catch (error) {
            console.error(`Error generating PDF for ${cert.employeeName}:`, error);
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

    // Return ZIP file as response
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Certificates_${new Date().getTime()}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
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

/**
 * Generate clean HTML for certificate rendering
 */
function generateCertificateHTML(cert: CertificateData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          background: white;
          color: #333;
        }
        .container {
          width: 8.5in;
          height: 11in;
          padding: 40px;
          background: white;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .top-graphic {
          position: absolute;
          top: 0;
          right: 0;
          width: 150px;
          height: 150px;
          opacity: 0.3;
        }
        .content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .header {
          margin-bottom: 40px;
        }
        .certificate-id {
          color: #666;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .title {
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          color: #111;
          margin: 30px 0 40px 0;
          letter-spacing: 2px;
        }
        .body {
          color: #333;
          line-height: 1.8;
          font-size: 14px;
          flex: 1;
        }
        .body p {
          margin: 15px 0;
        }
        .details-grid {
          margin: 30px 0;
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 10px 20px;
        }
        .detail-label {
          font-weight: bold;
          color: #555;
        }
        .detail-value {
          color: #333;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #999;
        }
        .signature-line {
          border-top: 1px solid #999;
          padding-top: 10px;
          margin-top: 30px;
        }
        .signer-name {
          font-weight: bold;
          margin-top: 5px;
        }
        .signer-title {
          font-size: 12px;
          color: #666;
        }
        strong {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <svg class="top-graphic" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M200 0L100 100L200 200V0Z" fill="#3B82F6"/>
          <path d="M200 0L150 50L200 100V0Z" fill="#1F2937"/>
        </svg>

        <div class="content">
          <div class="header">
            <div class="certificate-id">Certificate ID: ${escapeHtml(cert.certificateId)}</div>
          </div>

          <h2 class="title">CERTIFICATE OF EMPLOYMENT</h2>

          <div class="body">
            <p>Date: ${new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</p>

            <p>This letter certifies that <strong>${escapeHtml(cert.employeeName)}</strong> is employed by <strong>Airvincible</strong>.</p>

            <p><strong>${escapeHtml(cert.employeeName)}</strong> has been working for this organization since <strong>${escapeHtml(cert.startDate)}</strong> as a <strong>${escapeHtml(cert.jobTitle)}</strong>.</p>

            <div class="details-grid">
              <div class="detail-label">Employee Position:</div>
              <div class="detail-value">${escapeHtml(cert.jobTitle)}</div>

              <div class="detail-label">Department:</div>
              <div class="detail-value">${escapeHtml(cert.department)}</div>

              <div class="detail-label">Hiring Date:</div>
              <div class="detail-value">${escapeHtml(cert.startDate)}</div>

              <div class="detail-label">Annual Salary:</div>
              <div class="detail-value">${escapeHtml(cert.salary)}</div>
            </div>

            <p style="margin-top: 30px;">For any additional information, please contact me.</p>
          </div>

          <div class="footer">
            <div class="signature-line">
              <div class="signer-name">AUTHORIZED SIGNATORY</div>
              <div class="signer-title">HR Manager</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escape HTML special characters to prevent injection
 */
function escapeHtml(text: any): string {
  // Handle null, undefined, and non-string values
  if (text === null || text === undefined) {
    return "N/A";
  }
  
  const str = String(text);
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}
