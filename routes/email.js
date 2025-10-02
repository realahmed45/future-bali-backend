// Backend Email Service - Optimized with Better Image Display + Daily CSV Automation
// File: routes/email.js

const express = require("express");
const { Resend } = require("resend");
const cron = require("node-cron");
const router = express.Router();
const Order = require("../models/Order");

// Initialize Resend with updated API key
const resend = new Resend("re_7tfNGeRF_NruHVonWoav1rmjEgLgPgtw8");

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
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; }
              .content { padding: 20px !important; }
              .logo-img { height: 50px !important; }
              .signature-img { height: 35px !important; }
            }
            
            /* Ensure images display properly */
            img {
              border: 0;
              display: block;
              outline: none;
              text-decoration: none;
              height: auto;
              width: auto;
              font-size: 13px;
            }
            
            /* Fix for Gmail and other clients */
            u + .body .container { width: 600px !important; }
            .ExternalClass { width: 100%; }
            .ExternalClass, 
            .ExternalClass p, 
            .ExternalClass span, 
            .ExternalClass font, 
            .ExternalClass td, 
            .ExternalClass div { line-height: 100%; }
          </style>
        </head>
        <body class="body" style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background: white;">
            
            <!-- Main Content -->
            <div class="content" style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #374151; margin-top: 0; font-size: 24px; margin-bottom: 30px; font-weight: bold;">Your Villa Investment Contract</h2>
              
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
  <div style="margin-bottom: 25px;">
    <!--[if mso]>
    <img src="https://i.ibb.co/d0xQGJqV/logo.png" alt="Future Life Bali Logo" width="280" height="auto" style="width: 280px; height: auto; display: block; margin: 0 auto;">
    <![endif]-->
    <!--[if !mso]><!-->
    <img src="https://i.ibb.co/d0xQGJqV/logo.png" alt="Future Life Bali Logo" style="width: 280px; max-width: 100%; height: auto; display: block; margin: 0 auto;">
    <!--<![endif]-->
  </div>
  
  <!-- Signature -->
  <div style="margin-bottom: 25px;">
    <!--[if mso]>
    <img src="https://i.ibb.co/SXyY8MQ8/signature.png" alt="Director Signature" width="200" height="auto" style="width: 200px; height: auto; display: block; margin: 0 auto;">
    <![endif]-->
    <!--[if !mso]><!-->
    <img src="https://i.ibb.co/SXyY8MQ8/signature.png" alt="Director Signature" style="width: 200px; max-width: 100%; height: auto; display: block; margin: 0 auto;">
    <!--<![endif]-->
  </div>
  
  <!-- Company Info -->
  <div style="margin-bottom: 25px;">
    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #FFD700; line-height: 1.2;">Future Life (PT)</p>
    <p style="margin: 8px 0 0 0; font-size: 14px; color: #CCCCCC; line-height: 1.4;">Welcome to My Future Life Bali Family</p>
  </div>
  
  <!-- WhatsApp Button -->
  <div style="margin-bottom: 25px;">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://wa.me/6287744877888" style="height:44px;v-text-anchor:middle;width:180px;" arcsize="57%" stroke="f" fillcolor="#25D366">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">💬 Connect with us</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="https://wa.me/6287744877888" style="background-color: #25D366; color: white !important; padding: 12px 20px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px; line-height: 1.2;">
      <span style="font-size: 16px;">💬</span> Connect with us
    </a>
    <!--<![endif]-->
  </div>
  
  <div style="border-top: 1px solid #444; padding-top: 20px; margin-top: 20px;">
    <p style="margin: 0; font-size: 12px; color: #999999;">Web Version</p>
  </div>
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
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; }
              .content { padding: 20px !important; }
              .logo-img { height: 50px !important; }
              .signature-img { height: 35px !important; }
            }
            
            img {
              border: 0;
              display: block;
              outline: none;
              text-decoration: none;
              height: auto;
              width: auto;
              font-size: 13px;
            }
            
            u + .body .container { width: 600px !important; }
            .ExternalClass { width: 100%; }
            .ExternalClass, 
            .ExternalClass p, 
            .ExternalClass span, 
            .ExternalClass font, 
            .ExternalClass td, 
            .ExternalClass div { line-height: 100%; }
          </style>
        </head>
        <body class="body" style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background: white;">
            
            <!-- Main Content -->
            <div class="content" style="padding: 40px 30px;">
              <h2 style="color: #059669; margin-top: 0; font-size: 24px; margin-bottom: 30px; font-weight: bold;">New Contract Generated</h2>
              
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
  <div style="margin-bottom: 25px;">
    <!--[if mso]>
    <img src="https://i.ibb.co/d0xQGJqV/logo.png" alt="Future Life Bali Logo" width="280" height="auto" style="width: 280px; height: auto; display: block; margin: 0 auto;">
    <![endif]-->
    <!--[if !mso]><!-->
    <img src="https://i.ibb.co/d0xQGJqV/logo.png" alt="Future Life Bali Logo" style="width: 280px; max-width: 100%; height: auto; display: block; margin: 0 auto;">
    <!--<![endif]-->
  </div>
  
  <!-- Signature -->
  <div style="margin-bottom: 25px;">
    <!--[if mso]>
    <img src="https://i.ibb.co/SXyY8MQ8/signature.png" alt="Director Signature" width="200" height="auto" style="width: 200px; height: auto; display: block; margin: 0 auto;">
    <![endif]-->
    <!--[if !mso]><!-->
    <img src="https://i.ibb.co/SXyY8MQ8/signature.png" alt="Director Signature" style="width: 200px; max-width: 100%; height: auto; display: block; margin: 0 auto;">
    <!--<![endif]-->
  </div>
  
  <!-- Company Info -->
  <div style="margin-bottom: 25px;">
    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #FFD700; line-height: 1.2;">Future Life (PT)</p>
    <p style="margin: 8px 0 0 0; font-size: 14px; color: #CCCCCC; line-height: 1.4;">Welcome to My Future Life Bali Family</p>
  </div>
  
  <!-- WhatsApp Button -->
  <div style="margin-bottom: 25px;">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://wa.me/6287744877888" style="height:44px;v-text-anchor:middle;width:180px;" arcsize="57%" stroke="f" fillcolor="#25D366">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">💬 Connect with us</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="https://wa.me/6287744877888" style="background-color: #25D366; color: white !important; padding: 12px 20px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px; line-height: 1.2;">
      <span style="font-size: 16px;">💬</span> Connect with us
    </a>
    <!--<![endif]-->
  </div>
  
  <div style="border-top: 1px solid #444; padding-top: 20px; margin-top: 20px;">
    <p style="margin: 0; font-size: 12px; color: #999999;">Web Version</p>
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

// DAILY CSV EMAIL AUTOMATION SECTION

// Function to generate CSV data
const generateCSVData = async () => {
  try {
    console.log("[Daily CSV] Generating CSV data...");

    // Fetch orders (same logic as dashboard route)
    const orders = await Order.find({}).lean();
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Complete headers matching dashboard
    const headers = [
      "Order ID",
      "Date Created",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Customer Address",
      "Customer Country",
      "Customer DOB",
      "Customer Passport",
      "Package Title",
      "Package Price",
      "Add-ons Details",
      "Add-ons Total",
      "Total Amount",
      "Payment Status",
      "Order Status",
      "Deposit Amount (90%)",
      "Remaining Amount (10%)",
      "Payment Deadline",
      "Inheritance Contacts",
      "Emergency Contacts",
      "Billing Name",
      "Billing Email",
      "Billing Phone",
      "Billing Country",
      "Billing Address",
    ];

    const csvRows = [
      headers.join(","),
      ...orders.map((order) => {
        // Primary customer info
        const primaryUser = order.userInfo?.[0] || {};
        const customerName = primaryUser.name || "N/A";
        const customerEmail = primaryUser.email || order.userEmail || "N/A";
        const customerPhone = primaryUser.phone || order.userPhone || "N/A";
        const customerAddress = primaryUser.address || "N/A";
        const customerCountry = primaryUser.country || "N/A";
        const customerDOB = primaryUser.dob || "N/A";
        const customerPassport = primaryUser.passportId || "N/A";

        // Package info
        const packageTitle = order.basePackage?.title || "N/A";
        const packagePrice = order.basePackage?.price || 0;

        // Add-ons info
        const addOnsDetails =
          order.selectedAddOns
            ?.map(
              (addon) =>
                `${addon.room}${addon.size ? ` (${addon.size})` : ""}: $${
                  addon.price
                }`
            )
            .join(" | ") || "None";
        const addOnsTotal =
          order.selectedAddOns?.reduce(
            (sum, addon) => sum + (addon.price || 0),
            0
          ) || 0;

        // Financial calculations
        const totalAmount = order.totalAmount || 0;
        const depositAmount = Math.round(totalAmount * 0.9);
        const remainingAmount = totalAmount - depositAmount;

        // Dates
        const dateCreated = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString()
          : "";
        const paymentDeadline = order.createdAt
          ? new Date(
              new Date(order.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000
            ).toLocaleDateString()
          : "";

        // Inheritance contacts
        const inheritanceContacts =
          order.inheritanceContacts
            ?.map(
              (contact) =>
                `${contact.name} (${contact.phoneNumber})${
                  contact.percentage ? ` - ${contact.percentage}%` : ""
                }`
            )
            .join(" | ") || "None";

        // Emergency contacts
        const emergencyContacts =
          order.emergencyContacts
            ?.map((contact) => `${contact.name} (${contact.phoneNumber})`)
            .join(" | ") || "None";

        // Billing info
        const billingName = order.billingDetails
          ? `${order.billingDetails.firstName || ""} ${
              order.billingDetails.lastName || ""
            }`.trim()
          : "N/A";
        const billingEmail = order.billingDetails?.email || "N/A";
        const billingPhone = order.billingDetails?.phone || "N/A";
        const billingCountry = order.billingDetails?.country || "N/A";
        const billingAddress = order.billingDetails?.address || "N/A";

        return [
          `"${order._id}"`,
          `"${dateCreated}"`,
          `"${customerName}"`,
          `"${customerEmail}"`,
          `"${customerPhone}"`,
          `"${customerAddress}"`,
          `"${customerCountry}"`,
          `"${customerDOB}"`,
          `"${customerPassport}"`,
          `"${packageTitle}"`,
          packagePrice,
          `"${addOnsDetails}"`,
          addOnsTotal,
          totalAmount,
          `"${order.paymentStatus || "pending"}"`,
          `"${order.orderStatus || "pending"}"`,
          depositAmount,
          remainingAmount,
          `"${paymentDeadline}"`,
          `"${inheritanceContacts}"`,
          `"${emergencyContacts}"`,
          `"${billingName}"`,
          `"${billingEmail}"`,
          `"${billingPhone}"`,
          `"${billingCountry}"`,
          `"${billingAddress}"`,
        ].join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");

    console.log(`[Daily CSV] Generated CSV with ${orders.length} orders`);
    return {
      csvContent,
      ordersCount: orders.length,
      totalRevenue: orders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      ),
    };
  } catch (error) {
    console.error("[Daily CSV] Error generating CSV:", error);
    throw error;
  }
};

// Function to send daily CSV email
const sendDailyCSV = async () => {
  try {
    console.log("[Daily CSV] Starting daily CSV email generation...");

    // Generate CSV data
    const { csvContent, ordersCount, totalRevenue } = await generateCSVData();

    // Create filename with today's date
    const today = new Date();
    const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `Villa_Orders_Daily_Report_${dateString}.csv`;

    // Convert CSV to buffer
    const csvBuffer = Buffer.from(csvContent, "utf8");

    // Prepare email
    const emailData = {
      from: "My Future Life Bali System <info@futurelifebali.com>",
      to: ["futurelifebali@gmail.com", "bassam.agi@gmail.com"],
      subject: `Daily Orders Report - ${today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Orders Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #7c3aed; }
            .stat-number { font-size: 32px; font-weight: bold; color: #7c3aed; margin-bottom: 8px; }
            .stat-label { color: #6b7280; font-size: 14px; }
            .footer { background: #2D2D2D; padding: 20px; text-align: center; color: white; }
            @media only screen and (max-width: 600px) {
              .stats-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Daily Orders Report</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${today.toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}</p>
            </div>

            <!-- Main Content -->
            <div class="content">
              <p style="color: #374151; line-height: 1.6; margin-bottom: 30px;">
                Here's your daily orders summary. The complete CSV report is attached for detailed analysis.
              </p>

              <!-- Statistics -->
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${ordersCount}</div>
                  <div class="stat-label">Total Orders</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">$${totalRevenue.toLocaleString()}</div>
                  <div class="stat-label">Total Revenue</div>
                </div>
              </div>
              <!-- Report Info -->
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
                <h3 style="margin-top: 0; color: #92400e;">Report Details</h3>
                <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                  <li>Complete customer information</li>
                  <li>Package and add-ons details</li>
                  <li>Payment status and amounts</li>
                  <li>Contact information</li>
                  <li>Generated: ${today.toLocaleString()}</li>
                </ul>
              </div>

              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
                This report is automatically generated daily at 1:00 PM
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0; font-size: 14px;">
                Future Life (PT) - Automated Daily Report System
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: filename,
          content: csvBuffer,
          type: "text/csv",
        },
      ],
    };

    // Send email
    const result = await resend.emails.send(emailData);

    console.log("[Daily CSV] Email sent successfully:", result.id);
    console.log(
      `[Daily CSV] Report sent with ${ordersCount} orders, $${totalRevenue} total revenue`
    );

    return {
      success: true,
      messageId: result.id,
      ordersCount,
      totalRevenue,
      filename,
    };
  } catch (error) {
    console.error("[Daily CSV] Error sending daily report:", error);
    throw error;
  }
};

// Schedule daily CSV email at 1:00 PM (13:00) every day
// Cron format: second minute hour day month dayOfWeek
const scheduleDaily = () => {
  console.log("[Daily CSV] Scheduling daily CSV email for 1:00 PM...");

  // Schedule for 1:00 PM every day (0 0 13 * * *)
  cron.schedule(
    "0 0 13 * * *",
    async () => {
      console.log("[Daily CSV] Executing daily CSV email task...");
      try {
        await sendDailyCSV();
      } catch (error) {
        console.error("[Daily CSV] Daily task failed:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Jakarta", // Bali timezone
    }
  );

  console.log("[Daily CSV] Daily email scheduled for 1:00 PM Bali time");
};

// Manual trigger endpoint (for testing)
router.post("/send-daily-csv", async (req, res) => {
  try {
    console.log("[Daily CSV] Manual trigger requested...");

    const result = await sendDailyCSV();

    res.status(200).json({
      success: true,
      message: "Daily CSV report sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("[Daily CSV] Manual trigger failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send daily report",
      error: error.message,
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
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; }
              .content { padding: 20px !important; }
              .logo-img { height: 50px !important; }
              .signature-img { height: 35px !important; }
            }
            
            img {
              border: 0;
              display: block;
              outline: none;
              text-decoration: none;
              height: auto;
              width: auto;
              font-size: 13px;
            }
            
            u + .body .container { width: 600px !important; }
            .ExternalClass { width: 100%; }
            .ExternalClass, 
            .ExternalClass p, 
            .ExternalClass span, 
            .ExternalClass font, 
            .ExternalClass td, 
            .ExternalClass div { line-height: 100%; }
          </style>
        </head>
        <body class="body" style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background: white;">
            
            <!-- Main Content -->
            <div class="content" style="padding: 40px 30px;">
              <h2 style="color: #7c3aed; margin-top: 0; font-size: 24px; margin-bottom: 30px; font-weight: bold;">Resend Email Test Successful!</h2>
              
              <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
                This test email confirms that your Resend email configuration is working correctly.
              </p>
              
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151; font-weight: bold;">Configuration Details:</h3>
                <ul style="color: #6b7280; line-height: 1.6; padding-left: 20px;">
                  <li style="margin-bottom: 8px;"><strong>Email Service:</strong> Resend API</li>
                  <li style="margin-bottom: 8px;"><strong>From Email:</strong> info@futurelifebali.com</li>
                  <li style="margin-bottom: 8px;"><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>
              
              <p style="color: #059669; font-weight: bold; text-align: center; font-size: 18px;">
                ✅ Ready to send contract emails!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #2D2D2D; padding: 40px 30px; text-align: center; color: white;">
              <!-- Logo with fallback -->
              <div style="margin-bottom: 25px;">
                <!--[if mso]>
                <img class="logo-img" src="https://i.ibb.co/d0xQGJqV/logo.png" alt="Future Life Bali Logo" width="200" height="60" style="width: 200px; height: 60px; display: block; margin: 0 auto;">
                <![endif]-->
                <!--[if !mso]><!-->
                <img class="logo-img" src="https://i.ibb.co/d0xQGJqV/logo.png" alt="Future Life Bali Logo" style="height: 60px; width: auto; max-width: 200px; display: block; margin: 0 auto; object-fit: contain;">
                <!--<![endif]-->
              </div>
              
              <!-- Signature with fallback -->
              <div style="margin-bottom: 25px;">
                <!--[if mso]>
                <img class="signature-img" src="https://i.ibb.co/SXyY8MQ8/signature.png" alt="Director Signature" width="150" height="40" style="width: 150px; height: 40px; display: block; margin: 0 auto;">
                <![endif]-->
                <!--[if !mso]><!-->
                <img class="signature-img" src="https://i.ibb.co/SXyY8MQ8/signature.png" alt="Director Signature" style="height: 40px; width: auto; max-width: 150px; display: block; margin: 0 auto; object-fit: contain;">
                <!--<![endif]-->
              </div>
              
              <!-- Company Info -->
              <div style="margin-bottom: 25px;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #FFD700; line-height: 1.2;">Future Life (PT)</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #CCCCCC; line-height: 1.4;">Welcome to My Future Life Bali Family</p>
              </div>
              
              <!-- WhatsApp Button -->
              <div style="margin-bottom: 25px;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://wa.me/6287744877888" style="height:44px;v-text-anchor:middle;width:180px;" arcsize="57%" stroke="f" fillcolor="#25D366">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">💬 Connect with us</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="https://wa.me/6287744877888" style="background-color: #25D366; color: white !important; padding: 12px 20px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px; line-height: 1.2;">
                  <span style="font-size: 16px;">💬</span> Connect with us
                </a>
                <!--<![endif]-->
              </div>
              
              <div style="border-top: 1px solid #444; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #999999;">Web Version</p>
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

// Initialize the scheduling when the server starts
scheduleDaily();

module.exports = router;
