"use client";

import { Certificate } from "@/hooks/useCertificates";

export const generateCertificatePDF = async (certificate: Certificate) => {
  try {
    // Dynamically import html2pdf only on the client side
    const html2pdf = (await import("html2pdf.js")).default;

    if (!html2pdf) {
      throw new Error("html2pdf library failed to load");
    }

    // Create a temporary iframe to isolate the certificate from page styles
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error("Failed to create iframe for PDF generation");
    }

    // Write a complete HTML document with only the certificate content
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            background: white;
            padding: 0;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div style="width: 8.5in; padding: 40px; background: white; position: relative; min-height: 11in;">
          <div style="position: absolute; top: 0; right: 0; width: 200px; height: 200px;">
            <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
              <path d="M200 0L100 100L200 200V0Z" fill="#3B82F6" fill-opacity="0.8"/>
              <path d="M200 0L150 50L200 100V0Z" fill="#1F2937"/>
              <rect x="130" y="40" width="30" height="30" transform="rotate(45 130 40)" fill="#1F2937"/>
            </svg>
          </div>

          <div style="margin-bottom: 60px;">
            <p style="color: #666; margin: 0 0 4px 0; font-size: 12px;">Certificate ID: ${escapeHtml(certificate.certificateId || "")}</p>
          </div>

          <h2 style="text-align: center; font-size: 32px; font-weight: bold; color: #111; margin: 0 0 40px 0; letter-spacing: 2px;">
            CERTIFICATE OF EMPLOYMENT
          </h2>

          <div style="color: #333; line-height: 1.6; margin-bottom: 30px;">
            <p style="margin: 0 0 8px 0;">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p style="margin: 0 0 8px 0;">${escapeHtml(certificate.address || "Address not provided")}</p>
            <p style="margin: 0 0 20px 0;">${escapeHtml(certificate.contactAddressLine2 || "")}</p>

            <p style="margin: 0 0 12px 0;">
              This letter certifies that <strong>${escapeHtml(certificate.employeeName || "")}</strong> is employed by <strong>${escapeHtml(certificate.companyName || "")}</strong>.
            </p>
            <p style="margin: 0 0 20px 0;">
              ${escapeHtml(certificate.employeeName || "")} has been working for this organization since <strong>${escapeHtml(certificate.startDate || "")}</strong> as a <strong>${escapeHtml(certificate.jobTitle || "")}</strong>.
            </p>

            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="font-weight: bold; color: #555; padding: 8px 0; width: 50%;">Employee position:</td>
                <td style="padding: 8px 0;">${escapeHtml(certificate.jobTitle || "")}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="font-weight: bold; color: #555; padding: 8px 0;">Department:</td>
                <td style="padding: 8px 0;">${escapeHtml(certificate.department || "")}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="font-weight: bold; color: #555; padding: 8px 0;">Hiring date:</td>
                <td style="padding: 8px 0;">${escapeHtml(certificate.startDate || "")}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="font-weight: bold; color: #555; padding: 8px 0;">Position type:</td>
                <td style="padding: 8px 0;">${escapeHtml(certificate.typeOfEmployment || "")}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="font-weight: bold; color: #555; padding: 8px 0;">Annual salary:</td>
                <td style="padding: 8px 0;">${escapeHtml(certificate.salary || "")}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #555; padding: 8px 0;">Average number of work hours:</td>
                <td style="padding: 8px 0;">${escapeHtml(certificate.workHoursPerWeek || "")}</td>
              </tr>
            </table>

            <p style="margin: 20px 0 0 0;">
              For any additional information, please contact me.
            </p>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd;">
            <div>
              <p style="color: #555; margin: 0 0 20px 0; font-size: 14px;">Certified by:</p>
              <div style="border-top: 2px solid #333; padding-top: 8px; width: 200px;">
                <p style="font-weight: bold; font-size: 14px; color: #111; margin: 0; text-transform: uppercase;">${escapeHtml(certificate.certifierName || "")}</p>
                <p style="color: #666; font-size: 12px; margin: 4px 0 0 0;">${escapeHtml(certificate.certifierTitle || "")}</p>
              </div>
            </div>

            <div style="text-align: right; font-size: 12px; color: #555;">
              <p style="margin: 0 0 4px 0;"><strong>Phone:</strong> ${escapeHtml(certificate.contactPhone || "")}</p>
              <p style="margin: 0 0 4px 0;"><strong>Email:</strong> ${escapeHtml(certificate.contactEmail || "")}</p>
              <p style="margin: 0 0 4px 0;"><strong>Address:</strong> ${escapeHtml(certificate.contactAddressLine1 || "")}</p>
              ${certificate.contactAddressLine2 ? `<p style="margin: 0;">${escapeHtml(certificate.contactAddressLine2)}</p>` : ""}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    try {
      // Wait for iframe content to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get the body element from the iframe
      const element = iframeDoc.body;

      // PDF options with conservative settings to avoid color parsing issues
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Certificate_${(certificate.employeeName || "Unknown").replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        },
        jsPDF: { format: "letter", orientation: "portrait" as const },
      };

      // Generate and download PDF
      await html2pdf().set(opt).from(element).save();

      console.log(`PDF generated successfully for ${certificate.employeeName}`);
    } finally {
      // Clean up - remove the temporary iframe
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export const generateMultipleCertificatePDFs = async (
  certificates: Certificate[],
) => {
  try {
    for (const certificate of certificates) {
      await generateCertificatePDF(certificate);
      // Add a small delay between downloads to avoid overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error("Error generating multiple PDFs:", error);
    throw error;
  }
};

export function getExactCertificateHTML(cert: any, isPrintMode: boolean = false): string {
  const printScript = isPrintMode ? `
    <script>
      // Wait for Tailwind to process
      setTimeout(() => {
        window.print();
      }, 1000);
    </script>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate Of Employment - ${escapeHtml(cert.employeeName)}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: letter portrait; margin: 0; }
        body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          body { padding: 0 !important; margin: 0 !important; }
          .certificate-container { box-shadow: none !important; width: 100% !important; max-width: none !important; margin: 0 !important; }
        }
      </style>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              fontFamily: { serif: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'] }
            }
          }
        }
      </script>
    </head>
    <body class="bg-gray-100 flex justify-center items-center min-h-screen p-4 print:p-0 print:bg-white">
      <div class="bg-white w-full max-w-[800px] p-8 md:p-12 shadow-xl relative overflow-hidden certificate-container">
        
        <!-- Top Right Corner Graphic -->
        <div class="absolute top-0 right-0 pointer-events-none">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M200 0L100 100L200 200V0Z" fill="#3B82F6" fill-opacity="0.8"/>
            <path d="M200 0L150 50L200 100V0Z" fill="#1F2937"/>
            <rect x="130" y="40" width="30" height="30" transform="rotate(45 130 40)" fill="#1F2937"/>
          </svg>
        </div>

        <div class="mb-16">
          <div class="flex items-center mb-6">
            <div class="w-55 h-35 rounded-lg flex items-center justify-center mr-3">
              <h2 class="text-2xl font-bold tracking-tight text-blue-600">Airvincible</h2>
            </div>
          </div>
          <p class="text-gray-600">Certificate ID: ${escapeHtml(cert.certificateId || "XXXX-XXXX-XXXX")}</p>
        </div>

        <h2 class="text-3xl md:text-4xl font-serif text-center text-gray-900 mb-12 uppercase tracking-wider">
          Certificate of Employment
        </h2>

        <div class="text-gray-800 leading-relaxed space-y-6">
          <div class="mb-8">
            <p class="mb-1">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p class="mb-1">${escapeHtml(cert.contactAddressLine1 || "Company Address")}</p>
            <p>Email: ${escapeHtml(cert.employeeEmail || "email@address.com")}</p>
          </div>

          <p>This letter certifies that ${escapeHtml(cert.employeeName)} is employed by Airvincible.</p>
          <p>${escapeHtml(cert.employeeName)} has been working for this organization since ${escapeHtml(cert.startDate)} as a ${escapeHtml(cert.jobTitle)}.</p>

          <div class="mt-8 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <div class="font-medium text-gray-700 w-48">Employee position:</div>
            <div>${escapeHtml(cert.jobTitle)}</div>

            <div class="font-medium text-gray-700 w-48">Department:</div>
            <div>${escapeHtml(cert.department)}</div>

            <div class="font-medium text-gray-700 w-48">Hiring date:</div>
            <div>${escapeHtml(cert.startDate)}</div>

            <div class="font-medium text-gray-700 w-48">Annual salary:</div>
            <div>${escapeHtml(cert.salary)}</div>

            <div class="font-medium text-gray-700 w-48">Average number of work hours:</div>
            <div>${escapeHtml(cert.workHoursPerWeek || "40 hours")}</div>
          </div>

          <p class="mt-8">For any additional information, please contact me.</p>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-end mt-20">
          <div class="mb-10 md:mb-0">
            <p class="text-gray-700 mb-6">Certified by:</p>
            <div class="mb-2">
              <svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M10 50C30 20 60 55 90 35C120 15 150 45 180 25" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>
                 <path d="M120 30C130 50 150 10 160 30" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
                 <line x1="20" y1="45" x2="180" y2="45" stroke="#3B82F6" stroke-width="1" opacity="0.3" />
              </svg>
            </div>
            <div class="border-t border-gray-300 pt-2 w-64">
              <p class="text-lg font-bold text-gray-900 uppercase">${escapeHtml(cert.certifierName || "AUTHORIZED SIGNATORY")}</p>
              <p class="text-gray-600">${escapeHtml(cert.certifierTitle || "HR Manager")}</p>
            </div>
          </div>

          <div class="text-gray-700 md:text-right">
            <p class="mb-1"><span class="font-medium">Phone:</span> ${escapeHtml(cert.contactPhone || "+12 123 456 789")}</p>
            <p class="mb-1"><span class="font-medium">Email:</span> <a href="mailto:${escapeHtml(cert.contactEmail || "hr@companyname.com")}" class="text-blue-600 hover:underline">${escapeHtml(cert.contactEmail || "hr@companyname.com")}</a></p>
            <p class="mb-1"><span class="font-medium">Address:</span> ${escapeHtml(cert.contactAddressLine1 || "123 Street, Country")}</p>
            ${cert.contactAddressLine2 ? `<p>${escapeHtml(cert.contactAddressLine2)}</p>` : ""}
          </div>
        </div>
      </div>
      ${printScript}
    </body>
    </html>
  `;
}
