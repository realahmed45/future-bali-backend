// routes/dashboard.js - Add this to your routes folder
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");

// Excel Dashboard Data Endpoint
router.get("/excel-data", async (req, res) => {
  try {
    console.log("[Dashboard] Fetching Excel dashboard data...");

    // Fetch all orders with populated user data
    const orders = await Order.find({})
      .populate("user", "phone email")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[Dashboard] Found ${orders.length} orders`);

    // Transform data to match Excel columns
    const excelData = orders.map((order, index) => {
      // Extract user info (first person from userInfo array)
      const primaryUser = order.userInfo?.[0] || {};

      // Calculate dates
      const signDate = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString()
        : "";
      const transferDeadline = order.createdAt
        ? new Date(
            new Date(order.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000
          ).toLocaleDateString()
        : "";

      // Calculate amounts
      const totalAmount = order.totalAmount || 0;
      const depositAmount = Math.round(totalAmount * 0.9); // 90% deposit
      const remainingAmount = totalAmount - depositAmount; // 10% remaining

      // Calculate total add-ons
      const totalAddons =
        order.selectedAddOns?.reduce(
          (sum, addon) => sum + (addon.price || 0),
          0
        ) || 0;

      // Get contract phone numbers (up to 3)
      const contractPhones = [];
      if (primaryUser.phone) contractPhones.push(primaryUser.phone);
      if (order.inheritanceContacts?.length > 0) {
        order.inheritanceContacts.slice(0, 2).forEach((contact) => {
          if (contact.phoneNumber) contractPhones.push(contact.phoneNumber);
        });
      }
      if (order.emergencyContacts?.length > 0 && contractPhones.length < 3) {
        order.emergencyContacts
          .slice(0, 3 - contractPhones.length)
          .forEach((contact) => {
            if (contact.phoneNumber) contractPhones.push(contact.phoneNumber);
          });
      }

      return {
        // Row number (Excel row)
        row: index + 2, // Starting from row 2 (after header)

        // Column B: Date of sign
        dateOfSign: signDate,

        // Column C: Deposit + transfer deadline
        depositTransfer: `${depositAmount} (due: ${transferDeadline})`,

        // Column D: Paid full status
        paidFull: order.paymentStatus === "paid" ? "YES" : "NO",

        // Column E: Name of person
        nameOfPerson: primaryUser.name || "N/A",

        // Column F: Contract phone #1
        contractPhone1: contractPhones[0] || "",

        // Column G: Contract phone #2
        contractPhone2: contractPhones[1] || "",

        // Column H: Contract phone #3
        contractPhone3: contractPhones[2] || "",

        // Column I: Contract number (Order ID)
        contractNumber: order._id.toString(),

        // Column J: Package
        package: order.basePackage?.title || "N/A",

        // Column K: Price (base package price)
        price: order.basePackage?.price || 0,

        // Column L: Add-ons description
        addOns:
          order.selectedAddOns
            ?.map(
              (addon) =>
                `${addon.room}${addon.size ? ` (${addon.size})` : ""}: $${
                  addon.price
                }`
            )
            .join("; ") || "None",

        // Column M: Total add-ons amount
        totalAddons: totalAddons,

        // Column N: Total all (total investment)
        totalAll: totalAmount,

        // Additional useful data
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        customerEmail: primaryUser.email || order.userEmail || "",
        customerCountry: primaryUser.country || "",
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    // Return data in format suitable for Excel/Google Sheets
    res.json({
      success: true,
      data: excelData,
      summary: {
        totalOrders: orders.length,
        totalRevenue: excelData.reduce((sum, row) => sum + row.totalAll, 0),
        paidOrders: excelData.filter((row) => row.paidFull === "YES").length,
        pendingOrders: excelData.filter((row) => row.paidFull === "NO").length,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Dashboard] Error fetching Excel data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
});

// Excel-friendly CSV export endpoint
router.get("/excel-csv", async (req, res) => {
  try {
    console.log("[Dashboard] Generating CSV export...");

    // Fetch all orders with populated user data (same logic as excel-data)
    const orders = await Order.find({})
      .populate("user", "phone email")
      .sort({ createdAt: -1 })
      .lean();

    // Transform data to match Excel columns (same logic as excel-data)
    const excelData = orders.map((order, index) => {
      const primaryUser = order.userInfo?.[0] || {};
      const signDate = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString()
        : "";
      const transferDeadline = order.createdAt
        ? new Date(
            new Date(order.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000
          ).toLocaleDateString()
        : "";

      const totalAmount = order.totalAmount || 0;
      const depositAmount = Math.round(totalAmount * 0.9);
      const totalAddons =
        order.selectedAddOns?.reduce(
          (sum, addon) => sum + (addon.price || 0),
          0
        ) || 0;

      const contractPhones = [];
      if (primaryUser.phone) contractPhones.push(primaryUser.phone);
      if (order.inheritanceContacts?.length > 0) {
        order.inheritanceContacts.slice(0, 2).forEach((contact) => {
          if (contact.phoneNumber) contractPhones.push(contact.phoneNumber);
        });
      }
      if (order.emergencyContacts?.length > 0 && contractPhones.length < 3) {
        order.emergencyContacts
          .slice(0, 3 - contractPhones.length)
          .forEach((contact) => {
            if (contact.phoneNumber) contractPhones.push(contact.phoneNumber);
          });
      }

      return {
        dateOfSign: signDate,
        depositTransfer: `${depositAmount} (due: ${transferDeadline})`,
        paidFull: order.paymentStatus === "paid" ? "YES" : "NO",
        nameOfPerson: primaryUser.name || "N/A",
        contractPhone1: contractPhones[0] || "",
        contractPhone2: contractPhones[1] || "",
        contractPhone3: contractPhones[2] || "",
        contractNumber: order._id.toString(),
        package: order.basePackage?.title || "N/A",
        price: order.basePackage?.price || 0,
        addOns:
          order.selectedAddOns
            ?.map(
              (addon) =>
                `${addon.room}${addon.size ? ` (${addon.size})` : ""}: ${
                  addon.price
                }`
            )
            .join("; ") || "None",
        totalAddons: totalAddons,
        totalAll: totalAmount,
      };
    });

    // Generate CSV headers matching your Excel columns
    const headers = [
      "Date of Sign",
      "Deposit + Transfer (100%) Max 2 Weeks",
      "Paid Full",
      "Name of Person",
      "Contract Phone #1",
      "Contract Phone #2",
      "Contract Phone #3",
      "Contract #",
      "Package",
      "Price",
      "Add Ons",
      "Total Add-ons",
      "Total All",
    ];

    // Generate CSV rows
    const csvRows = [
      headers.join(","), // Header row
      ...excelData.map((row) =>
        [
          `"${row.dateOfSign}"`,
          `"${row.depositTransfer}"`,
          `"${row.paidFull}"`,
          `"${row.nameOfPerson}"`,
          `"${row.contractPhone1}"`,
          `"${row.contractPhone2}"`,
          `"${row.contractPhone3}"`,
          `"${row.contractNumber}"`,
          `"${row.package}"`,
          row.price,
          `"${row.addOns}"`,
          row.totalAddons,
          row.totalAll,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="villa-orders-${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error("[Dashboard] Error generating CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate CSV",
      error: error.message,
    });
  }
});

// Summary statistics endpoint
router.get("/stats", async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
          paidOrders: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    const monthlyStats = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      overall: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        paidOrders: 0,
        pendingOrders: 0,
      },
      monthly: monthlyStats,
    });
  } catch (error) {
    console.error("[Dashboard] Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

module.exports = router;
