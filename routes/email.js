// Backend Email Service - Modified for Titan Email
// File: routes/email.js

const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: "relay-hosting.secureserver.net", // Alternative GoDaddy SMTP
    port: 25, // Try port 25
    secure: false,
    auth: {
      user: "info@futurelifebali.com",
      pass: "PASSnew123#",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};
// Send contract PDF email to multiple recipients
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
      console.log("[Email] Titan transporter verified successfully");
    } catch (verifyError) {
      console.error(
        "[Email] Titan transporter verification failed:",
        verifyError
      );
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

    // Define all recipients
    const recipients = [
      customerEmail, // Customer's email
      "bassam.agi@gmail.com", // Admin 1
      "Futurelifebali@gmail.com", // Admin 2
    ];

    console.log("[Email] Sending to recipients:", recipients);

    // Email content for customer
    const customerMailOptions = {
      from: {
        name: "My Future Life Bali",
        address: "info@futurelifebali.com",
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
                  <p style="margin: 5px 0; font-size: 16px;">📧 Email: info@futurelifebali.com</p>
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

    // Email content for internal team
    const internalMailOptions = {
      from: {
        name: "My Future Life Bali - System",
        address: "info@futurelifebali.com",
      },
      to: ["bassam.agi@gmail.com", "Futurelifebali@gmail.com"],
      subject: `New Contract Generated - Order #${orderId} - ${customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">New Contract Generated</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Customer:</strong> ${customerName || "N/A"}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p>Contract has been sent to customer and is attached here for records.</p>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    console.log("[Email] Sending contract emails...");

    // Send both emails
    const results = await Promise.allSettled([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(internalMailOptions),
    ]);

    // Check results
    const customerResult = results[0];
    const internalResult = results[1];

    let successCount = 0;
    let errors = [];

    if (customerResult.status === "fulfilled") {
      successCount++;
      console.log(
        "[Email] Customer email sent:",
        customerResult.value.messageId
      );
    } else {
      errors.push(`Customer email failed: ${customerResult.reason.message}`);
    }

    if (internalResult.status === "fulfilled") {
      successCount++;
      console.log(
        "[Email] Internal email sent:",
        internalResult.value.messageId
      );
    } else {
      errors.push(`Internal email failed: ${internalResult.reason.message}`);
    }

    // Prepare response
    const response = {
      success: successCount > 0,
      message: `${successCount} out of 2 emails sent successfully`,
      data: {
        customerSent: customerResult.status === "fulfilled",
        internalSent: internalResult.status === "fulfilled",
        recipients: recipients,
        filename: filename,
        fileSize: `${pdfSizeMB.toFixed(2)} MB`,
        orderId: orderId,
      },
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    console.log(`[Email] Results: ${successCount} emails sent successfully`);
    if (errors.length > 0) {
      console.error("[Email] Errors:", errors);
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("[Email] Error sending contract:", error);

    // Determine error type and provide appropriate response
    let errorMessage = "Failed to send contract email";
    let statusCode = 500;

    if (error.code === "EAUTH") {
      errorMessage =
        "Email authentication failed. Please check Titan email credentials.";
      statusCode = 401;
    } else if (error.code === "ECONNECTION") {
      errorMessage =
        "Could not connect to Titan email server. Please try again later.";
      statusCode = 503;
    } else if (error.message.includes("Invalid login")) {
      errorMessage = "Titan email login credentials are invalid.";
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

// Test Titan email configuration
router.post("/test-titan", async (req, res) => {
  try {
    console.log("[Email] Testing Titan email configuration...");

    const transporter = createEmailTransporter();

    // Verify transporter
    await transporter.verify();

    // Send test email
    const testMail = {
      from: {
        name: "My Future Life Bali - Test",
        address: "info@futurelifebali.com",
      },
      to: "bassam.agi@gmail.com", // Send test to your admin email
      subject: "Titan Email Configuration Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">Titan Email Test Successful!</h2>
          <p>This test email confirms that your Titan email configuration is working correctly.</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Configuration Details:</h3>
            <ul>
              <li><strong>SMTP Server:</strong> smtp.titan.email</li>
              <li><strong>Port:</strong> 587 (TLS)</li>
              <li><strong>From Email:</strong> info@futurelifebali.com</li>
              <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          <p style="color: #059669; font-weight: bold;">✅ Ready to send contract emails!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(testMail);

    console.log("[Email] Titan test email sent successfully:", info.messageId);

    res.status(200).json({
      success: true,
      message: "Titan email configuration is working correctly",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("[Email] Titan configuration test failed:", error);

    let errorMessage = "Titan email configuration failed";
    if (error.code === "EAUTH") {
      errorMessage =
        "Titan email authentication failed. Check your email credentials.";
    } else if (error.code === "ECONNECTION") {
      errorMessage =
        "Cannot connect to Titan email server. Check your internet connection.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
