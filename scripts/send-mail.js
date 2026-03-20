const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

/**
 * Enhanced email sender with support for dynamic recipients and attachments
 * 
 * Usage:
 *   Direct: node send-mail.js
 *   With params: RECIPIENT_EMAIL="user@example.com" node send-mail.js
 */

async function sendEmail(options = {}) {
  // Get configuration from environment or use defaults
  const recipientEmail = options.email || process.env.RECIPIENT_EMAIL || "prathmeshgawade41@gmail.com";
  const attachmentPath = options.attachmentPath || process.env.ATTACHMENT_PATH;
  const senderEmail = process.env.GMAIL_FROM;
  const senderPassword = process.env.GMAIL_PASS;
  const recipientName = options.name || "Recipient";

  if (!senderEmail || !senderPassword) {
    console.error("✗ Error: GMAIL_FROM and GMAIL_PASS environment variables are required");
    process.exit(1);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: senderEmail,
      pass: senderPassword,
    },
  });

  // Prepare attachments
  const attachments = [];
  if (attachmentPath && fs.existsSync(attachmentPath)) {
    attachments.push({
      filename: path.basename(attachmentPath),
      path: attachmentPath,
    });
    console.log(`📎 Attachment: ${path.basename(attachmentPath)}`);
  }

  // Email options
  const mailOptions = {
    from: senderEmail,
    to: recipientEmail,
    subject: options.subject || `Certificate from Airvincible`,
    html: options.html || `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1F2937;">Certificate of Employment</h2>
            
            <p>Dear <strong>${recipientName}</strong>,</p>
            
            <p>Your employment certificate has been generated and is attached to this email.</p>
            
            <p>Please keep it safe for future reference.</p>
            
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
    text: options.text || `Dear ${recipientName},\n\nYour employment certificate has been generated and is attached.\n\nBest regards,\nHuman Resources Department`,
    attachments: attachments,
  };

  try {
    console.log(`📧 Sending email to ${recipientEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("✓ Email sent successfully!");
    console.log(`   Response: ${info.response}`);
    return { success: true, info };
  } catch (error) {
    console.error("✗ Error sending email:", error.message);
    return { success: false, error: error.message };
  }
}

// Support for CLI usage
if (require.main === module) {
  // Parse command line arguments
  const options = {
    email: process.env.RECIPIENT_EMAIL,
    attachmentPath: process.env.ATTACHMENT_PATH,
    name: process.env.RECIPIENT_NAME || "Employee",
  };

  sendEmail(options).then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { sendEmail };

