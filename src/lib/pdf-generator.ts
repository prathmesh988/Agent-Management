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
