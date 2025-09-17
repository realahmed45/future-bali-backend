// Backend Email Service - Complete File
// File: routes/email.js

const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

// Email configuration options
const createEmailTransporter = () => {
  // OPTION 1: Gmail (Easiest setup)
  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "youremail@gmail.com",
      pass: process.env.EMAIL_APP_PASSWORD || "your-16-char-app-password",
    },
  });
};

// Send contract PDF email
router.post("/send-contract", async (req, res) => {
  try {
    const { orderId, pdfBase64, customerEmail, customerName } = req.body;

    console.log("[Email] Processing contract email request");
    console.log("[Email] Order ID:", orderId);
    console.log("[Email] Customer Email:", customerEmail);

    // Validation
    if (!pdfBase64 || !customerEmail || !orderId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: pdfBase64, customerEmail, or orderId",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Convert base64 to buffer
    let pdfBuffer;
    try {
      const base64Data = pdfBase64.includes(",")
        ? pdfBase64.split(",")[1]
        : pdfBase64;
      pdfBuffer = Buffer.from(base64Data, "base64");
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid PDF base64 data",
      });
    }

    // Check PDF size
    const pdfSizeMB = pdfBuffer.length / (1024 * 1024);
    console.log(`[Email] PDF size: ${pdfSizeMB.toFixed(2)} MB`);

    if (pdfSizeMB > 20) {
      return res.status(400).json({
        success: false,
        message: `PDF too large (${pdfSizeMB.toFixed(
          2
        )}MB). Maximum size is 20MB.`,
      });
    }

    // Create email transporter
    const transporter = createEmailTransporter();

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("[Email] Transporter verified successfully");
    } catch (verifyError) {
      console.error("[Email] Transporter verification failed:", verifyError);
      return res.status(500).json({
        success: false,
        message: "Email service configuration error",
      });
    }

    // Generate filename
    const currentDate = new Date().toISOString().split("T")[0];
    const sanitizedCustomerName = (customerName || "Customer").replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    const filename = `Villa_Investment_Contract_${sanitizedCustomerName}_${orderId}_${currentDate}.pdf`;

    // Email content
    const mailOptions = {
      from: {
        name: "My Future Life Bali",
        address: process.env.EMAIL_USER || "youremail@gmail.com",
      },
      to: customerEmail,
      subject: `Your Villa Investment Contract - Order #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contract Ready</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold;">Contract Ready!</h1>
              <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Your Bali Villa Investment Agreement</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #374151; margin-top: 0; font-size: 24px;">Hello ${
                customerName || "Valued Customer"
              },</h2>
              
              <p style="color: #6b7280; line-height: 1.8; font-size: 16px; margin: 20px 0;">
                Congratulations on your investment in your future Bali villa! Your official contract has been prepared and is attached to this email as a PDF document.
              </p>
              
              <!-- Contract Details Box -->
              <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border-left: 5px solid #7c3aed; margin: 30px 0;">
                <h3 style="color: #7c3aed; margin-top: 0; font-size: 18px; font-weight: bold;">📋 Contract Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order ID:</td>
                    <td style="padding: 8px 0; color: #374151;">${orderId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Document:</td>
                    <td style="padding: 8px 0; color: #374151;">Villa Investment Contract (PDF)</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Generated:</td>
                    <td style="padding: 8px 0; color: #374151;">${new Date().toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">File Size:</td>
                    <td style="padding: 8px 0; color: #374151;">${pdfSizeMB.toFixed(
                      2
                    )} MB</td>
                  </tr>
                </table>
              </div>

              <!-- Important Notice -->
              <div style="background: #dbeafe; padding: 25px; border-radius: 12px; margin: 30px 0;">
                <h3 style="color: #1d4ed8; margin-top: 0; font-size: 18px; font-weight: bold;">📎 Important Instructions:</h3>
                <ul style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Please review the attached contract carefully and thoroughly</li>
                  <li>Save this document in a secure location for your records</li>
                  <li>If you have any questions, contact us immediately</li>
                  <li>The contract contains all terms, conditions, and your investment details</li>
                </ul>
              </div>

              <!-- Contact Information -->
              <div style="text-align: center; margin: 40px 0;">
                <div style="background: #7c3aed; color: white; padding: 20px; border-radius: 25px; display: inline-block;">
                  <h3 style="margin: 0 0 10px 0; font-size: 18px;">Questions? Contact Us:</h3>
                  <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">📞 WhatsApp: +62 818-1818-5522</p>
                  <p style="margin: 5px 0; font-size: 16px;">📧 Email: info@myfuturelifebali.com</p>
                </div>
              </div>

              <p style="color: #6b7280; line-height: 1.8; font-size: 16px;">
                Thank you for choosing My Future Life Bali for your villa investment. We look forward to helping you build your dream future in paradise.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0; line-height: 1.6;">
                This email was sent from My Future Life Bali<br>
                Your trusted partner for Bali villa investments<br>
                <strong>Please keep this contract for your records</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    console.log("[Email] Sending contract email...");

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("[Email] Contract sent successfully!");
    console.log("[Email] Message ID:", info.messageId);
    console.log("[Email] Recipient:", customerEmail);
    console.log("[Email] File size:", `${pdfSizeMB.toFixed(2)} MB`);

    res.status(200).json({
      success: true,
      message: "Contract PDF sent successfully",
      data: {
        messageId: info.messageId,
        recipient: customerEmail,
        filename: filename,
        fileSize: `${pdfSizeMB.toFixed(2)} MB`,
        orderId: orderId,
      },
    });
  } catch (error) {
    console.error("[Email] Error sending contract:", error);

    // Determine error type and provide appropriate response
    let errorMessage = "Failed to send contract email";
    let statusCode = 500;

    if (error.code === "EAUTH") {
      errorMessage =
        "Email authentication failed. Please check email credentials.";
      statusCode = 401;
    } else if (error.code === "ECONNECTION") {
      errorMessage =
        "Could not connect to email server. Please try again later.";
      statusCode = 503;
    } else if (error.message.includes("Invalid login")) {
      errorMessage = "Email login credentials are invalid.";
      statusCode = 401;
    } else if (error.message.includes("Message too large")) {
      errorMessage = "PDF file is too large for email delivery.";
      statusCode = 413;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Test email configuration
router.post("/test-email", async (req, res) => {
  try {
    console.log("[Email] Testing email configuration...");

    const transporter = createEmailTransporter();

    // Verify transporter
    await transporter.verify();

    console.log("[Email] Configuration test passed");

    res.status(200).json({
      success: true,
      message: "Email configuration is working correctly",
    });
  } catch (error) {
    console.error("[Email] Configuration test failed:", error);

    let errorMessage = "Email configuration failed";
    if (error.code === "EAUTH") {
      errorMessage =
        "Email authentication failed. Check your email credentials.";
    } else if (error.code === "ECONNECTION") {
      errorMessage =
        "Cannot connect to email server. Check your internet connection.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Send test email
router.post("/test-send", async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: "Test email address is required",
      });
    }

    console.log("[Email] Sending test email to:", testEmail);

    const transporter = createEmailTransporter();

    const mailOptions = {
      from: {
        name: "My Future Life Bali - Test",
        address: process.env.EMAIL_USER || "youremail@gmail.com",
      },
      to: testEmail,
      subject: "Email Service Test - My Future Life Bali",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">Email Service Test</h2>
          <p>This is a test email from My Future Life Bali email service.</p>
          <p>If you received this email, the email configuration is working correctly!</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Test sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("[Email] Test email sent successfully:", info.messageId);

    res.status(200).json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
      recipient: testEmail,
    });
  } catch (error) {
    console.error("[Email] Test email failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message,
    });
  }
});

module.exports = router;
