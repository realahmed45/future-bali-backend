// Backend Email Service - Modified for Resend API with Clean Footer
// File: routes/email.js

const express = require("express");
const { Resend } = require("resend");
const router = express.Router();

// Initialize Resend with your API key
const resend = new Resend("re_ZsYFvHRt_QrxATBMKNvcY2dwM1A4TB2eL");

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

    // Clean Email content for customer
    const customerEmailData = {
      from: "My Future Life Bali <info@futurelifebali.com>",
      to: [customerEmail],
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
            
            <!-- Main Content -->
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #374151; margin-top: 0; font-size: 24px; margin-bottom: 30px;">Your Villa Investment Contract</h2>
              
              <p style="color: #6b7280; line-height: 1.8; font-size: 16px; margin: 20px 0;">
                Hello ${customerName || "Valued Customer"},<br><br>
                Your official villa investment contract has been prepared and is attached as a PDF document.
                Please review it carefully and keep it for your records.
              </p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: left;">
                <p style="margin: 0; color: #374151; font-weight: bold;">Order ID: ${orderId}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280;">Generated: ${new Date().toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}</p>
              </div>

              <p style="color: #6b7280; line-height: 1.8; font-size: 16px;">
                If you have any questions about your contract, please don't hesitate to contact us.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #2D2D2D; padding: 40px 30px; text-align: center; color: white;">
              <!-- Logo -->
              <div style="margin-bottom: 20px;">
                <img src="https://i.ibb.co/d0xQGJqV/logo.png" alt="Future Life Bali Logo" style="height: 60px; width: auto; max-width: 200px;">
              </div>
              
              <!-- Signature in center -->
              <div style="margin-bottom: 20px;">
                <img src="https://i.ibb.co/SXyY8MQ8/signature.png" alt="Signature" style="height: 40px; width: auto; max-width: 150px;">
              </div>
              
              <!-- Company Info -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #FFD700;">Future Life (PT)</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #CCCCCC;">Welcome to My Future Life Bali Family</p>
              </div>
              
              <!-- WhatsApp Button -->
              <div style="margin-bottom: 20px;">
                <a href="https://wa.me/6287744877888" style="background-color: #25D366; color: white; padding: 12px 20px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; justify-content: center;">
                  <span style="font-size: 16px;">💬</span>
                  Connect with us
                </a>
              </div>
              
              <div style="border-top: 1px solid #444; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px; color: #CCCCCC;">Web Version</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
        },
      ],
    };

    // Email content for internal team
    const internalEmailData = {
      from: "My Future Life Bali System <info@futurelifebali.com>",
      to: ["bassam.agi@gmail.com", "Futurelifebali@gmail.com"],
      subject: `New Contract Generated - Order #${orderId} - ${customerName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contract Generated</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white;">
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #059669; margin-top: 0; font-size: 24px; margin-bottom: 30px;">New Contract Generated</h2>
              
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #374151;"><strong>Order ID:</strong> ${orderId}</p>
                <p style="margin: 0 0 10px 0; color: #374151;"><strong>Customer:</strong> ${
                  customerName || "N/A"
                }</p>
                <p style="margin: 0 0 10px 0; color: #374151;"><strong>Email:</strong> ${customerEmail}</p>
                <p style="margin: 0; color: #374151;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Contract has been sent to customer and is attached here for records.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #2D2D2D; padding: 40px 30px; text-align: center; color: white;">
              <!-- Logo -->
              <div style="margin-bottom: 20px;">
                <img src="https://i.ibb.co/d0xQGJqV/logo.png" alt="Future Life Bali Logo" style="height: 60px; width: auto; max-width: 200px;">
              </div>
              
              <!-- Signature in center -->
              <div style="margin-bottom: 20px;">
                <img src="https://i.ibb.co/SXyY8MQ8/signature.png" alt="Signature" style="height: 40px; width: auto; max-width: 150px;">
              </div>
              
              <!-- Company Info -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #FFD700;">Future Life (PT)</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #CCCCCC;">Welcome to My Future Life Bali Family</p>
              </div>
              
              <!-- WhatsApp Button -->
              <div style="margin-bottom: 20px;">
                <a href="https://wa.me/6287744877888" style="background-color: #25D366; color: white; padding: 12px 20px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; justify-content: center;">
                  <span style="font-size: 16px;">💬</span>
                  Connect with us
                </a>
              </div>
              
              <div style="border-top: 1px solid #444; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px; color: #CCCCCC;">Web Version</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
        },
      ],
    };

    console.log("[Email] Sending contract emails via Resend...");

    // Send both emails using Resend
    const results = await Promise.allSettled([
      resend.emails.send(customerEmailData),
      resend.emails.send(internalEmailData),
    ]);

    // Check results
    const customerResult = results[0];
    const internalResult = results[1];

    let successCount = 0;
    let errors = [];

    if (customerResult.status === "fulfilled") {
      successCount++;
      console.log("[Email] Customer email sent:", customerResult.value.id);
    } else {
      errors.push(`Customer email failed: ${customerResult.reason.message}`);
    }

    if (internalResult.status === "fulfilled") {
      successCount++;
      console.log("[Email] Internal email sent:", internalResult.value.id);
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

    if (error.message?.includes("API key")) {
      errorMessage = "Resend API key authentication failed.";
      statusCode = 401;
    } else if (error.message?.includes("rate limit")) {
      errorMessage =
        "Email sending rate limit exceeded. Please try again later.";
      statusCode = 429;
    } else if (error.message?.includes("Message too large")) {
      errorMessage = "PDF file is too large for email delivery.";
      statusCode = 413;
    } else if (error.message?.includes("Invalid email")) {
      errorMessage = "Invalid email address provided.";
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Test Resend email configuration
router.post("/test-resend", async (req, res) => {
  try {
    console.log("[Email] Testing Resend email configuration...");

    // Send test email
    const testEmailData = {
      from: "My Future Life Bali Test <info@futurelifebali.com>",
      to: ["bassam.agi@gmail.com"],
      subject: "Resend Email Configuration Test",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Test</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white;">
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #7c3aed; margin-top: 0; font-size: 24px; margin-bottom: 30px;">Resend Email Test Successful!</h2>
              
              <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
                This test email confirms that your Resend email configuration is working correctly.
              </p>
              
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Configuration Details:</h3>
                <ul style="color: #6b7280; line-height: 1.6;">
                  <li><strong>Email Service:</strong> Resend API</li>
                  <li><strong>From Email:</strong> info@futurelifebali.com</li>
                  <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>
              
              <p style="color: #059669; font-weight: bold; text-align: center;">
                ✅ Ready to send contract emails!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #2D2D2D; padding: 40px 30px; text-align: center; color: white;">
              <!-- Logo -->
              <div style="margin-bottom: 20px;">
                <img src="https://i.ibb.co/d0xQGJqV/logo.png" alt="Future Life Bali Logo" style="height: 60px; width: auto; max-width: 200px;">
              </div>
              
              <!-- Signature in center -->
              <div style="margin-bottom: 20px;">
                <img src="https://i.ibb.co/SXyY8MQ8/signature.png" alt="Signature" style="height: 40px; width: auto; max-width: 150px;">
              </div>
              
              <!-- Company Info -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #FFD700;">Future Life (PT)</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #CCCCCC;">Welcome to My Future Life Bali Family</p>
              </div>
              
              <!-- WhatsApp Button -->
              <div style="margin-bottom: 20px;">
                <a href="https://wa.me/6287744877888" style="background-color: #25D366; color: white; padding: 12px 20px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; justify-content: center;">
                  <span style="font-size: 16px;">💬</span>
                  Connect with us
                </a>
              </div>
              
              <div style="border-top: 1px solid #444; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px; color: #CCCCCC;">Web Version</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await resend.emails.send(testEmailData);

    console.log("[Email] Resend test email sent successfully:", result.id);

    res.status(200).json({
      success: true,
      message: "Resend email configuration is working correctly",
      messageId: result.id,
    });
  } catch (error) {
    console.error("[Email] Resend configuration test failed:", error);

    let errorMessage = "Resend email configuration failed";
    if (error.message?.includes("API key")) {
      errorMessage = "Resend API key is invalid or expired.";
    } else if (error.message?.includes("rate limit")) {
      errorMessage = "Rate limit exceeded. Please try again later.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
