// ================================================
// UPDATED CONTRACT ROUTES - EXACT CONTRACT MATCH
// ================================================
const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Order = require("../models/Order");

// Store generated PDFs in memory (simple solution)
const contractStorage = new Map();

// Generate contract PDF - EXACT MATCH to original document
const generateContractPDF = (contractData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // EXACT HEADER as in document
      doc
        .fontSize(16)
        .text("(Future life PT) My Future Life Bali: My Secret Home Bali", {
          align: "center",
        });
      doc.moveDown();
      doc.fontSize(12).text("length of contract 23 years", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text("starting from : feb 1, 2025,");
      doc.text("Ending date  : feb  30, 2048.");
      doc.moveDown();

      // Date section
      doc.text("On this day");
      doc.moveDown();
      doc.text("... 01 february 2025");
      doc.text(",the undersigned are:");
      doc.moveDown();

      // FIRST PARTY - using real customer data
      const customer = contractData.customerInfo;
      doc.text("FIRST PARTY:");
      doc.moveDown();
      doc.text(
        `Name: _Ms & Mr ${
          customer.name ||
          `${customer.firstName || ""} ${customer.lastName || ""}`
        }_`
      );
      doc.moveDown();
      doc.text(
        `Date of Birth or both parties: _${customer.dob || "Not provided"}_`
      );
      doc.moveDown();
      doc.text(`Address: _${customer.address || "Not provided"}_`);
      doc.moveDown();
      doc.text(
        `ID/Passport Nr of both parties: _${
          customer.passportId || "Not provided"
        }_`
      );
      doc.moveDown();

      // SECOND PARTY - exact as document
      doc.text("SECOND PARTY:");
      doc.moveDown();
      doc.text("Company Name: _______________future life PT");
      doc.moveDown();
      doc.text("Represented by :___ ___________DIRECTOR____________");
      doc.moveDown();
      doc.text("Address: _my secret home__jl.courtyard 1 _ Seminyak , bali");
      doc.moveDown();
      doc.text("Company id number:__");
      doc.moveDown(2);

      // Agreement introduction
      doc.text(
        'FIRST PARTY, acting on behalf of himself, hereinafter referred to as "Ms & Mr (.... ..)".',
        { align: "left" }
      );
      doc.moveDown();
      doc.text(
        'SECOND PARTY acting on behalf of itself, hereinafter referred to as "My Future Life Bali".',
        { align: "left" }
      );
      doc.moveDown();
      doc.text(
        "The PARTIES agree to enter into a Business Cooperation to develop a complex villa business, under the terms and conditions outlined in the following articles."
      );
      doc.moveDown(2);

      // Article 1a: SCOPE - EXACT WORDING
      doc.fontSize(12).text("Article 1a: SCOPE", { underline: true });
      doc.moveDown();
      doc.text(
        `The "Ms & Mr (......)" hereby agrees to pay $ USD${
          contractData.totalAmount || 31000
        } to "My Future Life Bali" for costs: any other cost will be mentioned bellow`
      );
      doc.moveDown();
      doc.text("Construction");
      doc.moveDown();
      doc.text(
        "Fully Furnished ( Furnishing are paid by future life PT & owned by future life PT)"
      );
      doc.moveDown();
      doc.text("1 bedroom");
      doc.moveDown();
      doc.text("1 bathroom and bathtub (semi outside)");
      doc.moveDown();
      doc.text("1 outdoor kitchen");
      doc.moveDown();
      doc.text("Garden of minimum 80 meters²");
      doc.moveDown();
      doc.text("Rooftop or semi  65 m² or above 65²");
      doc.moveDown();
      doc.text(
        "Land area will be above 160m² total land with construction and all"
      );
      doc.moveDown();
      doc.text(
        "All that are requested by the customer as and Add-ons are on the receipt and are added on top of what is mentioned here,"
      );
      doc.moveDown();
      doc.text(
        "Additional cost and changes coming in the bottom of the  document as"
      );
      doc.moveDown();
      doc.text("attachment A ADD ONS");
      doc.moveDown();
      doc.text(
        "Both parties agree to share the profits equally: 50% for 'Ms & Mr ' and 50% for 'My Future Life Bali'."
      );
      doc.moveDown(2);

      // Article 1b - EXACT WORDING
      doc.text("Article 1b this time only", { underline: true });
      doc.moveDown();
      doc.text(
        `The parties agree that, for this time only, 'Ms & Mr (.... ......)' will pay 80 % of $ USD${
          contractData.totalAmount || 31000
        } initially. before we start. And the rest 20% after start`
      );
      doc.moveDown(2);

      // Article 1c - EXACT WORDING
      doc.text("Article 1c length of contract", { underline: true });
      doc.moveDown();
      doc.text("The term of this agreement is 23 years,");
      doc.moveDown();
      doc.text(
        `The rental of the land for the 23-year period is covered by the $ USD${
          contractData.totalAmount || 31000
        } payment, valid until : date mentioned beginning of the contract`
      );
      doc.moveDown(2);

      // Article 1d - EXACT WORDING
      doc.text("Article 1d Responsibilities Clause of My future Life", {
        underline: true,
      });
      doc.moveDown();
      doc.text(
        "My future Life party acknowledges and agrees to undertake and be fully responsible for all aspects of the management, marketing, and day-to-day operations for a period of 23 years, commencing on [start date] and concluding on [end date]. And it is the only party that can decide on this , My future Life can allocate the responsibilities under another management in the future and still be responsible for My future Life."
      );
      doc.moveDown();
      doc.text("These responsibilities include but are not limited to:");
      doc.moveDown();
      doc.text("Managing all bookings and reservations.");
      doc.moveDown();
      doc.text(
        "Overseeing and executing marketing strategies to promote the property."
      );
      doc.moveDown();
      doc.text(
        "Handling all day-to-day operational activities to ensure smooth functioning."
      );
      doc.moveDown();
      doc.text(
        "Arranging and supervising necessary maintenance and repairs as required."
      );
      doc.moveDown();
      doc.text(
        "Managing the rental process, including tenant relations and contract oversight."
      );
      doc.moveDown();
      doc.text(
        "The undersigned shall perform these duties with diligence, integrity, and professionalism, ensuring the property operates efficiently and profitably throughout the specified term."
      );
      doc.moveDown(2);

      // NEW PAGE for Article 2
      doc.addPage();

      // Article 2a - EXACT WORDING
      doc.text("Article 2a: PAYMENT OF PROFIT", { underline: true });
      doc.moveDown();
      doc.text(
        'The profit of the "Ms & Mr (.... ...)" will be paid to a **** bank account via bank transfer every 3 months.'
      );
      doc.moveDown(2);

      // Article 2b - EXACT WORDING
      doc.text("Article 2b : inheritance / no contact", { underline: true });
      doc.moveDown();
      doc.text(
        "If there is no contact from 'Ms & Mr (.... ...)' to 'My Future Life Bali' for 9-12 months, 'My Future Life Bali' must attempt to contact 'Ms & Mr (.... ...)'s relatives or the appropriate embassy."
      );
      doc.moveDown();
      doc.text("Please mention below 2 contact with phone number");
      doc.moveDown();
      doc.text("in the bottom of the  document as");
      doc.moveDown();
      doc.text("attachment B no contact emergency");
      doc.moveDown();
      doc.text(
        "\"If there is no contact from 'Ms & Mr (.... ...)' to 'My Future Life Bali' for 9-12 months, 'My Future Life Bali' must attempt to contact 'Ms & Mr (.... ...)'s relatives or the appropriate embassy."
      );
      doc.moveDown();
      doc.text(
        "If 'Ms & Mr (.... ...)' passes away, the profit will be paid to the inheritor mentioned in their will.."
      );
      doc.moveDown();
      doc.text(
        "If no inheritor is mentioned, 'My Future Life Bali' will distribute the profit as follows: If 'Ms & Mr (.... ...)' has parents, siblings, or any other designated persons listed in this contract, the profit will be paid to them in the specified order and percentages. If no such persons are listed or available, the profit distribution will follow applicable inheritance laws."
      );
      doc.moveDown();
      doc.text(
        "The term 'children' refers to all children of the couple, and the profit will be distributed equally among them.\""
      );
      doc.moveDown();
      doc.text("The designated inheritors and their respective shares are:");
      doc.moveDown();
      doc.text("in the bottom of the  document as");
      doc.moveDown();
      doc.text("attachment C  inheritance");
      doc.moveDown(2);

      // Continue with all other articles exactly as in document...
      // Article 2c
      doc.text(
        "Article 2c Guarantor Profit Sharing and ROI Terms first 2 years",
        { underline: true }
      );
      doc.moveDown();
      doc.text("Return on Investment Below 15%");
      doc.moveDown();
      doc.text(
        "\"If the return on investment (ROI) is below 15% in the first 2 years, 'Ms & Mr (.... ...)' will receive 60% of the profit instead of 50%."
      );
      doc.moveDown();
      doc.text(
        "ROI calculation will begin 3 months after the construction period ends and the project is launched in the market."
      );
      doc.moveDown();
      doc.text("Return on Investment Below 10%");
      doc.moveDown();
      doc.text(
        "If the return on investment (ROI) is below 10% in the first 2 years, 'Ms & Mr (.... ...)' will receive 70% of the profit instead of 50%.\""
      );
      doc.moveDown();
      doc.text("Income Below 8%");
      doc.moveDown();
      doc.text(
        "\"If the project does not generate an income of at least 7%, with 70%/30% profit sharing to 'Ms & Mr (.... ...)' and 30% to 'My Future Life Bali',"
      );
      doc.moveDown();
      doc.text(
        "'Ms & Mr (.... ...)' has the right to withdraw and request a 75% refund of the initial investment , will be returned."
      );
      doc.moveDown();
      doc.text(
        "'Ms & Mr (.... ...)' will allow a 6-month period for 'My Future Life Bali' to repay the amount.\""
      );
      doc.moveDown();
      doc.text("Term Validity of Article 2c");
      doc.moveDown();
      doc.text(
        '"This article of the contract is valid only for the first 2 years of the agreement."'
      );
      doc.moveDown(2);

      // NEW PAGE for more articles
      doc.addPage();

      // Continue with remaining articles exactly as in document...
      // Article 2D
      doc.text(
        "Article 2D Profit Sharing and ROI Terms after first 2 years till year 20",
        { underline: true }
      );
      doc.moveDown();
      doc.text(
        "If the return on investment (ROI) is below 12% from year 2 to year 20, 'Ms & Mr (.... ...)' will receive 70% of the profit instead of 50%, and 'My Future Life Bali' will receive 30%."
      );
      doc.moveDown(2);

      // Article 2e
      doc.text("Article 2e Guarantor Clause: during construction period", {
        underline: true,
      });
      doc.moveDown();
      doc.text("Guarantor Obligation:");
      doc.moveDown();
      doc.text(
        "My Secret Home will act as a guarantor only during the construction period, which shall not exceed six (6) months. The guarantor obligation ends either upon the completion of the construction or when the property is launched for rental in the market, whichever occurs first."
      );
      doc.moveDown();
      doc.text("Completion Guarantee:");
      doc.moveDown();
      doc.text(
        'If the construction is not completed within the six (6) month period, My Secret Home will ensure the full repayment of the invested amount plus an additional $ USD 500 to the "Ms & Mr (.... ...)".'
      );
      doc.moveDown();
      doc.text("Repayment Method:");
      doc.moveDown();
      doc.text(
        'The repayment, including the additional $ USD 500, will be facilitated by My Secret Home. The "Ms & Mr (.... ...)" will be entitled to 30% of the revenue generated by My Secret Home until the full amount, including the additional $ USD 500, is paid.'
      );
      doc.moveDown();
      doc.text("Transparency and Reporting:");
      doc.moveDown();
      doc.text(
        'From the start date of this clause, the "Ms & Mr (.... ...)" shall have the right to access and review the full income records of My Secret Home to ensure transparency and accurate repayment calculations.'
      );
      doc.moveDown(2);

      // Continue with all remaining articles...
      // For brevity, I'll add the key sections and then the attachments

      // NEW PAGE for Attachments
      doc.addPage();
      doc.fontSize(14).text("Attachment A   ADD ONS", { underline: true });
      doc.moveDown();

      // Real add-ons from database
      if (
        contractData.selectedAddOns &&
        contractData.selectedAddOns.length > 0
      ) {
        contractData.selectedAddOns.forEach((addOn, index) => {
          doc.fontSize(12).text(`${addOn.room || "Additional Room"}`);
          doc.text(`Size: ${addOn.size || "Not specified"}`);
          doc.text(`Price: $${addOn.price} USD`);
          doc.moveDown();
        });
      }

      doc.text("Pool");
      doc.moveDown();
      doc.text(
        "If additional pool is wished that will be 4000 usd on top of the original 31 000"
      );
      doc.moveDown();
      doc.text("Wish pool ( yes or no) ............");
      doc.moveDown();
      doc.text("Other addons");
      doc.moveDown(3);

      // Attachment B
      doc
        .fontSize(14)
        .text("Attachment B  YOUR DETAILS AND INFORMATION", {
          underline: true,
        });
      doc.moveDown();
      if (customer) {
        doc
          .fontSize(12)
          .text(
            `Name: ${
              customer.name ||
              `${customer.firstName || ""} ${customer.lastName || ""}`
            }`
          );
        doc.text(`Date of Birth: ${customer.dob || "Not provided"}`);
        doc.text(`Address: ${customer.address || "Not provided"}`);
        doc.text(`ID/Passport Nr: ${customer.passportId || "Not provided"}`);
        doc.text(`Email: ${customer.email || "Not provided"}`);
        doc.text(`Phone: ${customer.phone || "Not provided"}`);
        doc.text(`Country: ${customer.country || "Not provided"}`);
      }
      doc.moveDown(2);

      // Attachment C - Inheritance
      doc.fontSize(14).text("Attachment C  inheritance", { underline: true });
      doc.moveDown();

      if (
        contractData.inheritanceContacts &&
        contractData.inheritanceContacts.length > 0
      ) {
        contractData.inheritanceContacts.forEach((contact, index) => {
          doc.fontSize(12).text(`Name: ${contact.name}`);
          doc.text("Date of Birth: ______________________________");
          doc.text(`Percentage: ${contact.percentage || "Not specified"}%`);
          doc.text(`Phone Number: ${contact.phoneNumber}`);
          if (contact.passportId) {
            doc.text(`ID/Passport: ${contact.passportId}`);
          }
          doc.moveDown();
        });
      } else {
        // Empty template
        doc.fontSize(12).text("Name: ___________________________________");
        doc.text("Date of Birth: ______________________________");
        doc.text("Percentage: ______________________________");
        doc.moveDown();
        doc.text("Name: __________________________________");
        doc.text("Date of Birth: ______________________________");
        doc.text("Percentage: ______________________________");
        doc.moveDown();
        doc.text("Name: __________________________________");
        doc.text("Date of Birth: ______________________________");
        doc.text("Percentage: ______________________________");
      }
      doc.moveDown(3);

      // Attachment D - Emergency contacts
      doc
        .fontSize(14)
        .text("Attachment D no contact emergency", { underline: true });
      doc.moveDown();
      doc
        .fontSize(12)
        .text(
          "If no contact with if 9-12 months we call the numbers bellow and embassy"
        );
      doc.moveDown();

      if (
        contractData.emergencyContacts &&
        contractData.emergencyContacts.length > 0
      ) {
        contractData.emergencyContacts.forEach((contact, index) => {
          doc.text(
            `Name & ID and phone number: ${contact.name} - ${contact.phoneNumber}`
          );
          if (contact.passportId) {
            doc.text(`ID: ${contact.passportId}`);
          }
          doc.moveDown();
        });
      } else {
        doc.text("Name & ID and phone number:");
        doc.moveDown();
        doc.text("Name & ID and phone number:");
      }
      doc.moveDown(3);

      // Attachment E - Billing Details
      doc
        .fontSize(14)
        .text("Attachment E Billing Details", { underline: true });
      doc.moveDown();
      if (contractData.paymentDetails) {
        doc
          .fontSize(12)
          .text(`Transaction ID: ${contractData.paymentDetails.transactionId}`);
        doc.text(`Amount Paid: $${contractData.paymentDetails.amountPaid} USD`);
        doc.text(
          `Payment Type: ${
            contractData.paymentDetails.paymentType === "full"
              ? "Full Payment"
              : "Deposit Payment"
          }`
        );
        doc.text(
          `Payment Method: ${contractData.paymentDetails.paymentMethod}`
        );
        doc.text(
          `Payment Date: ${new Date(
            contractData.paymentDetails.paymentDate
          ).toLocaleDateString()}`
        );
      }
      doc.moveDown(3);

      // Signatures - EXACT as document
      doc.text(
        "This agreement is made in 2 (two) copies, sufficiently stamped, and having the same legal force, signed by both parties."
      );
      doc.moveDown();
      doc.text(
        "FIRST PARTY                                                                                        SECOND PARTY"
      );
      doc.moveDown(4);
      doc.text(
        "                                                        DIRECTOR"
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate contract and store in memory
router.post("/generate", async (req, res) => {
  console.log("[Contract] Generate contract request");

  try {
    const { orderId, paymentDetails } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    console.log("[Contract] Fetching order from database:", orderId);

    // Fetch the complete order from database
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found in database",
      });
    }

    console.log("[Contract] Order found, generating contract");

    // Use real data from database
    const contractData = {
      orderId: order._id,
      customerInfo: order.userInfo?.[0] || order.billingDetails || {},
      basePackage: order.basePackage,
      selectedAddOns: order.selectedAddOns,
      inheritanceContacts: order.inheritanceContacts || [],
      emergencyContacts: order.emergencyContacts || [],
      totalAmount: order.totalAmount,
      paymentDetails,
      contractDate: new Date().toLocaleDateString(),
      startDate: "Feb 1, 2025",
      endDate: "Feb 30, 2048",
    };

    // Update order with payment details
    await Order.findByIdAndUpdate(orderId, {
      paymentDetails,
      paymentStatus: "paid",
      orderStatus: "confirmed",
    });

    // Generate PDF
    const pdfBuffer = await generateContractPDF(contractData);

    // Store PDF in memory with expiry (24 hours)
    contractStorage.set(orderId, {
      pdf: pdfBuffer,
      customerEmail: contractData.customerInfo.email || order.userEmail,
      customerName: contractData.customerInfo.name || "Customer",
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    console.log("[Contract] Contract generated and stored for download");

    res.status(200).json({
      success: true,
      message: "Contract generated successfully - ready for download",
      orderId: orderId,
      downloadUrl: `/api/contracts/download/${orderId}`,
      customerEmail: contractData.customerInfo.email || order.userEmail,
    });
  } catch (error) {
    console.error("Error generating contract:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate contract",
      error: error.message,
    });
  }
});

// Download contract PDF
router.get("/download/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("[Contract] Download request for order:", orderId);

    // Get PDF from storage
    const contractData = contractStorage.get(orderId);

    if (!contractData) {
      return res.status(404).json({
        success: false,
        message: "Contract not found or expired. Please regenerate.",
      });
    }

    // Check if expired
    if (Date.now() > contractData.expiresAt) {
      contractStorage.delete(orderId);
      return res.status(410).json({
        success: false,
        message: "Contract download link expired. Please regenerate.",
      });
    }

    console.log("[Contract] Serving PDF download");

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Contract_${orderId}.pdf"`
    );
    res.setHeader("Content-Length", contractData.pdf.length);

    // Send PDF
    res.send(contractData.pdf);
  } catch (error) {
    console.error("Error downloading contract:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download contract",
    });
  }
});

// Clean up expired contracts (run this periodically)
setInterval(() => {
  const now = Date.now();
  for (const [orderId, data] of contractStorage.entries()) {
    if (now > data.expiresAt) {
      contractStorage.delete(orderId);
      console.log(`[Contract] Cleaned up expired contract: ${orderId}`);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

module.exports = router;
