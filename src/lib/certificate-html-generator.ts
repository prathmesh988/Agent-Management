/**
 * Server-safe certificate HTML generation utility
 * Can be imported and used from both client and server code
 */

export interface CertificateData {
  employeeName?: string;
  certificateId?: string;
  employeeEmail?: string;
  startDate?: string;
  jobTitle?: string;
  department?: string;
  salary?: string;
  workHoursPerWeek?: string;
  contactAddressLine1?: string;
  contactAddressLine2?: string;
  certifierName?: string;
  certifierTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
}

/**
 * Escape HTML special characters for safe rendering
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Generate certificate HTML
 * Pure function that returns HTML string - works on both client and server
 */
export function getExactCertificateHTML(
  cert: CertificateData,
  isPrintMode: boolean = false
): string {
  const printScript = isPrintMode
    ? `
    <script>
      // Wait for Tailwind to process
      setTimeout(() => {
        window.print();
      }, 1000);
    </script>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate Of Employment - ${escapeHtml(cert.employeeName || "")}</title>
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

          <p>This letter certifies that ${escapeHtml(cert.employeeName || "")} is employed by Airvincible.</p>
          <p>${escapeHtml(cert.employeeName || "")} has been working for this organization since ${escapeHtml(cert.startDate || "")} as a ${escapeHtml(cert.jobTitle || "")}.</p>

          <div class="mt-8 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <div class="font-medium text-gray-700 w-48">Employee position:</div>
            <div>${escapeHtml(cert.jobTitle || "")}</div>

            <div class="font-medium text-gray-700 w-48">Department:</div>
            <div>${escapeHtml(cert.department || "")}</div>

            <div class="font-medium text-gray-700 w-48">Hiring date:</div>
            <div>${escapeHtml(cert.startDate || "")}</div>

            <div class="font-medium text-gray-700 w-48">Annual salary:</div>
            <div>${escapeHtml(cert.salary || "")}</div>

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
            
            <p class="mb-1"><span class="font-medium">Email:</span> <a href="mailto:${escapeHtml(cert.contactEmail || "hr@airvincible.com")}" class="text-blue-600 hover:underline">${escapeHtml(cert.contactEmail || "hr@airvincible.com")}</a></p>
            ${cert.contactAddressLine2 ? `<p>${escapeHtml(cert.contactAddressLine2)}</p>` : ""}
          </div>
        </div>
      </div>
      ${printScript}
    </body>
    </html>
  `;
}
