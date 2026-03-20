'use server';

/**
 * Server action to send certificates to employees via email
 */

import nodemailer from 'nodemailer';
import { getCertificateDownloadUrl, checkIfCertificateExists } from '@/lib/appwrite-storage';

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_FROM,
        pass: process.env.GMAIL_PASS,
    },
});

interface SendCertificateEmailParams {
    employeeId: string;
    employeeEmail: string;
    employeeName: string;
    certificateId: string;
}

/**
 * Send individual certificate to employee email
 */
export async function sendCertificateEmail(
    params: SendCertificateEmailParams
) {
    try {
        const { employeeEmail, employeeName, certificateId, employeeId } = params;

        // Validate email
        if (!employeeEmail || !employeeEmail.includes('@')) {
            return {
                success: false,
                error: `Invalid email for ${employeeName}: ${employeeEmail}`,
            };
        }

        // Get download URL from bucket using employeeId (not certificateId)
        const downloadUrl = getCertificateDownloadUrl(employeeId);

        // Email content
        const mailOptions = {
            from: process.env.GMAIL_FROM,
            //   to: employeeEmail,
            to: 'prathmeshgawade41@gmail.com',
            subject: `Your Employment Certificate - ${employeeName}`,
            html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1F2937;">Certificate of Employment</h2>
              
              <p>Dear <strong>${employeeName}</strong>,</p>
              
              <p>Your employment certificate has been generated and is attached to this email.</p>
              
              <p>You can also download it using the link below:</p>
              
              <p style="margin: 20px 0;">
                <a href="${downloadUrl}" 
                   style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 4px;">
                  Download Certificate
                </a>
              </p>
              
              <p>If you have any questions, please contact HR.</p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #6B7280;">
                <strong>Airvincible</strong><br>
                Human Resources Department<br>
                <em>This is an automated message, please do not reply directly.</em>
              </p>
            </div>
          </body>
        </html>
      `,
            text: `Dear ${employeeName},\n\nYour employment certificate has been generated.\n\nDownload link: ${downloadUrl}\n\nIf you have any questions, please contact HR.\n\nBest regards,\nHuman Resources Department`,
            attachmentUrl: downloadUrl, // Optional: for reference
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log(`✓ Certificate email sent to ${employeeEmail}:`, info.response);
        return {
            success: true,
            message: `Email sent to ${employeeName} (${employeeEmail})`,
            info,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('✗ Error sending certificate email:', errorMessage);
        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Send certificates to multiple employees
 */
export async function sendCertificatesToMultiple(
    certParams: SendCertificateEmailParams[]
) {
    try {
        const results = [];

        for (const params of certParams) {
            const result = await sendCertificateEmail(params);
            results.push({
                employeeName: params.employeeName,
                email: params.employeeEmail,
                ...result,
            });
        }

        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.filter((r) => !r.success).length;

        return {
            success: failureCount === 0,
            successCount,
            failureCount,
            results,
            summary: `Sent ${successCount}/${certParams.length} emails successfully`,
        } as const;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('✗ Error sending bulk emails:', errorMessage);
        return {
            success: false,
            error: errorMessage,
            successCount: 0,
            failureCount: certParams.length,
            results: [],
        } as const;
    }
}

/**
 * Server action to check which certificates exist in bucket
 * Now checks by employeeId instead of certificateId
 */
export async function checkCertificatesInBucketAction(
    employeeIds: string[]
) {
    try {
        const status: Record<string, boolean> = {};
        
        for (const employeeId of employeeIds) {
            status[employeeId] = await checkIfCertificateExists(employeeId);
        }
        
        return {
            success: true,
            status,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('✗ Error checking bucket status:', errorMessage);
        return {
            success: false,
            error: errorMessage,
            status: {},
        };
    }
}
