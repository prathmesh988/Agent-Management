/**
 * Shared certificate HTML generator.
 *
 * Produces a standalone HTML document whose visual output is an
 * exact 1:1 replica of the React <CertificateOfEmployment> preview
 * component (certificate.tsx).
 *
 * It is used by:
 *  - Single-certificate download  (certificates/[id]/page.tsx)
 *  - Single-certificate download  (certificates/page.tsx → handleDownloadCertificate)
 *  - Bulk certificate API          (api/certificates/download-all)
 *
 * The HTML is fully self-contained (inline styles, embedded SVGs,
 * no external fonts or images) so the output is identical on
 * macOS, Windows and Linux.
 */

export interface CertificateData {
  certificateId?: string;
  employeeName?: string;
  employeeEmail?: string;
  jobTitle?: string;
  department?: string;
  startDate?: string;
  salary?: string;
  workHoursPerWeek?: string;
  contactAddressLine1?: string;
  contactAddressLine2?: string;
  contactPhone?: string;
  contactEmail?: string;
  certifierName?: string;
  certifierTitle?: string;
  companyName?: string;
}

/**
 * Returns a full HTML document string that mirrors the React
 * CertificateOfEmployment component pixel-for-pixel.
 *
 * @param cert  – certificate data
 * @param opts  – { autoPrint: boolean } if true, `window.print()` fires on load
 */
export function generateCertificateHTML(
  cert: CertificateData,
  opts: { autoPrint?: boolean } = {},
): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const certId      = cert.certificateId || "XXX XXX XXX";
  const name        = cert.employeeName  || "";
  const title       = cert.jobTitle      || "N/A";
  const dept        = cert.department    || "N/A";
  const start       = cert.startDate     || "N/A";
  const salary      = cert.salary        || "N/A";
  const hours       = cert.workHoursPerWeek || "40 hours";
  const signer      = cert.certifierName || "Amit Khandelwal";
  const signerTitle = cert.certifierTitle|| "Company President";
  const email       = cert.contactEmail  || "hr@airvincible.com";
  const addr2       = cert.contactAddressLine2 || "";
  const address1    = cert.contactAddressLine1 || "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Certificate of Employment – ${name}</title>
<style>
  /* Reset */
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                 "Helvetica Neue", Arial, sans-serif;
    background: #f3f4f6;          /* gray-100 */
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 16px;
  }

  /* --- Paper container --- */
  .paper {
    background: #fff;
    width: 100%;
    max-width: 800px;
    padding: 48px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1);
    position: relative;
    overflow: hidden;
  }

  /* --- Top-right corner graphic (exact SVG from preview) --- */
  .corner-graphic {
    position: absolute;
    top: 0;
    right: 0;
    pointer-events: none;
  }

  /* --- Header --- */
  .header { margin-bottom: 64px; position: relative; z-index: 1; }
  .logo-row { display: flex; align-items: center; margin-bottom: 24px; }
  .logo-box {
    width: 220px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
  }
  .logo-box svg { width: 100%; height: auto; }
  .cert-id { color: #4b5563; font-size: 14px; }

  /* --- Title --- */
  .title {
    text-align: center;
    font-size: 32px;
    font-weight: bold;
    color: #111827;
    margin-bottom: 48px;
    text-transform: uppercase;
    letter-spacing: 3px;
    font-family: Georgia, "Times New Roman", serif;
  }

  /* --- Body content --- */
  .body { color: #1f2937; line-height: 1.8; font-size: 14px; }
  .body p { margin: 12px 0; }
  .body strong { font-weight: 600; }

  .address-block { margin-bottom: 32px; }

  /* Details grid – matches preview */
  .details-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px 16px;
    margin-top: 32px;
  }
  .detail-label { font-weight: 500; color: #374151; }

  .closing { margin-top: 32px; }

  /* --- Footer (signature + contact) --- */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 80px;
  }
  .sig-section {}
  .certified-by { color: #374151; margin-bottom: 24px; }
  .sig-svg { margin-bottom: 8px; }
  .sig-border { border-top: 1px solid #d1d5db; padding-top: 8px; width: 256px; }
  .signer-name { font-size: 18px; font-weight: bold; color: #111827; text-transform: uppercase; }
  .signer-title { color: #4b5563; }

  .contact { text-align: right; color: #374151; font-size: 13px; }
  .contact p { margin: 4px 0; }
  .contact .label { font-weight: 500; }
  .contact a { color: #2563eb; text-decoration: none; }

  /* Print styles */
  @page { margin: 0; size: letter; }
  @media print {
    body { background: white; padding: 0; }
    .paper { box-shadow: none; max-width: none; width: auto; }
  }
</style>
</head>
<body>
<div class="paper">

  <!-- Corner graphic (exact SVG from certificate.tsx) -->
  <svg class="corner-graphic" width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M200 0L100 100L200 200V0Z" fill="#3B82F6" fill-opacity="0.8"/>
    <path d="M200 0L150 50L200 100V0Z" fill="#1F2937"/>
    <rect x="130" y="40" width="30" height="30" transform="rotate(45 130 40)" fill="#1F2937"/>
  </svg>

  <!-- Header -->
  <div class="header">
    <div class="logo-row">
      <div class="logo-box">
        <!-- Inline Airvincible text logo (replaces Next/Image which can't be used in raw HTML) -->
        <svg viewBox="0 0 240 40" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="30" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#1F2937">Airvincible</text>
        </svg>
      </div>
    </div>
    <p class="cert-id">Certificate ID: ${certId}</p>
  </div>

  <!-- Title -->
  <h2 class="title">Certificate of Employment</h2>

  <!-- Body -->
  <div class="body">
    <div class="address-block">
      <p>${date}</p>
      <p>${address1}</p>
      <p>Email: ${cert.employeeEmail || ""}</p>
    </div>

    <p>This letter certifies that ${name} is employed by Airvincible.</p>
    <p>${name} has been working for this organization since ${start} as a ${title}.</p>

    <div class="details-grid">
      <div class="detail-label">Employee position:</div>
      <div>${title}</div>

      <div class="detail-label">Department:</div>
      <div>${dept}</div>

      <div class="detail-label">Hiring date:</div>
      <div>${start}</div>

      <div class="detail-label">Annual salary:</div>
      <div>${salary}</div>

      <div class="detail-label">Average number of work hours:</div>
      <div>${hours}</div>
    </div>

    <p class="closing">For any additional information, please contact me.</p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <!-- Signature section -->
    <div class="sig-section">
      <p class="certified-by">Certified by:</p>
      <!-- Signature SVG (matches preview) -->
      <svg class="sig-svg" width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 50C30 20 60 55 90 35C120 15 150 45 180 25" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>
        <path d="M120 30C130 50 150 10 160 30" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <line x1="20" y1="45" x2="180" y2="45" stroke="#3B82F6" stroke-width="1" opacity="0.3"/>
      </svg>
      <div class="sig-border">
        <p class="signer-name">${signer}</p>
        <p class="signer-title">${signerTitle}</p>
      </div>
    </div>

    <!-- Contact section -->
    <div class="contact">
      <p><span class="label">Email:</span> <a href="mailto:${email}">${email}</a></p>
      ${addr2 ? `<p>${addr2}</p>` : ""}
    </div>
  </div>

</div>
${opts.autoPrint ? `<script>window.onload=function(){window.print();};</script>` : ""}
</body>
</html>`;
}
