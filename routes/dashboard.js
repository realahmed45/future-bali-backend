// routes/dashboard.js - COMPLETE VERSION WITH ALL ORDER DETAILS
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Complete CSV with all order details
router.get("/excel-csv", async (req, res) => {
  try {
    console.log("[Dashboard] Fetching complete order data for Excel...");

    const orders = await Order.find({}).lean();
    console.log(`[Dashboard] Found ${orders.length} orders`);

    // Complete headers matching all your needs
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

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="complete-orders.csv"'
    );
    res.send(csvContent);
  } catch (error) {
    console.error("[Dashboard] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
    });
  }
});

// Complete JSON version for API access
router.get("/excel-data", async (req, res) => {
  try {
    console.log("[Dashboard] Fetching complete order data as JSON...");

    const orders = await Order.find({}).lean();
    console.log(`[Dashboard] Found ${orders.length} orders`);

    const completeData = orders.map((order, index) => {
      // Primary customer info
      const primaryUser = order.userInfo?.[0] || {};

      // Financial calculations
      const totalAmount = order.totalAmount || 0;
      const depositAmount = Math.round(totalAmount * 0.9);
      const remainingAmount = totalAmount - depositAmount;
      const addOnsTotal =
        order.selectedAddOns?.reduce(
          (sum, addon) => sum + (addon.price || 0),
          0
        ) || 0;

      // Dates
      const dateCreated = order.createdAt
        ? new Date(order.createdAt).toISOString()
        : "";
      const paymentDeadline = order.createdAt
        ? new Date(
            new Date(order.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000
          ).toISOString()
        : "";

      return {
        row: index + 1,
        orderId: order._id.toString(),
        dateCreated: dateCreated,

        // Customer Information
        customer: {
          name: primaryUser.name || "N/A",
          email: primaryUser.email || order.userEmail || "N/A",
          phone: primaryUser.phone || order.userPhone || "N/A",
          address: primaryUser.address || "N/A",
          country: primaryUser.country || "N/A",
          dob: primaryUser.dob || "N/A",
          passportId: primaryUser.passportId || "N/A",
        },

        // Package Information
        package: {
          title: order.basePackage?.title || "N/A",
          price: order.basePackage?.price || 0,
          details: order.basePackage?.details || [],
        },

        // Add-ons Information
        addOns: {
          items: order.selectedAddOns || [],
          details:
            order.selectedAddOns?.map(
              (addon) =>
                `${addon.room}${addon.size ? ` (${addon.size})` : ""}: $${
                  addon.price
                }`
            ) || [],
          total: addOnsTotal,
        },

        // Financial Information
        financial: {
          totalAmount: totalAmount,
          depositAmount: depositAmount,
          remainingAmount: remainingAmount,
          paymentDeadline: paymentDeadline,
          paymentStatus: order.paymentStatus || "pending",
          paymentMethod: order.paymentDetails?.method || "N/A",
        },

        // Order Status
        status: {
          orderStatus: order.orderStatus || "pending",
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },

        // Inheritance Contacts
        inheritanceContacts:
          order.inheritanceContacts?.map((contact) => ({
            name: contact.name,
            phone: contact.phoneNumber,
            passportId: contact.passportId || "N/A",
            percentage: contact.percentage || "N/A",
          })) || [],

        // Emergency Contacts
        emergencyContacts:
          order.emergencyContacts?.map((contact) => ({
            name: contact.name,
            phone: contact.phoneNumber,
            passportId: contact.passportId || "N/A",
          })) || [],

        // Billing Details
        billing: {
          name: order.billingDetails
            ? `${order.billingDetails.firstName || ""} ${
                order.billingDetails.lastName || ""
              }`.trim()
            : "N/A",
          email: order.billingDetails?.email || "N/A",
          phone: order.billingDetails?.phone || "N/A",
          country: order.billingDetails?.country || "N/A",
          address: order.billingDetails?.address || "N/A",
          notes: order.billingDetails?.notes || "N/A",
        },
      };
    });

    res.json({
      success: true,
      data: completeData,
      summary: {
        totalOrders: orders.length,
        totalRevenue: completeData.reduce(
          (sum, order) => sum + order.financial.totalAmount,
          0
        ),
        totalDeposits: completeData.reduce(
          (sum, order) => sum + order.financial.depositAmount,
          0
        ),
        paidOrders: completeData.filter(
          (order) => order.financial.paymentStatus === "paid"
        ).length,
        pendingOrders: completeData.filter(
          (order) => order.financial.paymentStatus === "pending"
        ).length,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Dashboard] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
    });
  }
});

// Summary statistics
router.get("/stats", async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    const paidOrders = await Order.countDocuments({ paymentStatus: "paid" });
    const pendingOrders = await Order.countDocuments({
      paymentStatus: "pending",
    });

    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        paidOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Dashboard] Stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Dashboard route is working!",
    endpoints: {
      csv: "/api/dashboard/excel-csv",
      data: "/api/dashboard/excel-data",
      stats: "/api/dashboard/stats",
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
