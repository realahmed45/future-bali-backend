// routes/dashboard.js - SIMPLIFIED VERSION
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Simple test endpoint - just return raw order data
router.get("/test-orders", async (req, res) => {
  try {
    console.log("[Dashboard] Testing order fetch...");

    // Get just 3 orders to test
    const orders = await Order.find({}).limit(3).lean();

    console.log(`[Dashboard] Found ${orders.length} orders`);

    res.json({
      success: true,
      count: orders.length,
      orders: orders,
      message: "Raw order data (limited to 3 orders)",
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

// Very simple CSV endpoint - no complex logic
router.get("/simple-csv", async (req, res) => {
  try {
    console.log("[Dashboard] Simple CSV test...");

    const orders = await Order.find({}).limit(10).lean();

    // Create simple CSV with basic data
    const headers = ["Order ID", "Total Amount", "Created Date", "Status"];
    const csvRows = [
      headers.join(","),
      ...orders.map((order) =>
        [
          order._id,
          order.totalAmount || 0,
          order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "",
          order.orderStatus || "unknown",
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="simple-orders.csv"'
    );
    res.send(csvContent);
  } catch (error) {
    console.error("[Dashboard] Simple CSV Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
