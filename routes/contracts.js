// ================================================
// SIMPLIFIED CONTRACT ROUTER - FOR FRONTEND PDF GENERATION
// ================================================
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Get contract data endpoint - provides data for frontend PDF generation
router.get("/data/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    console.log("[Contract Router] Fetching contract data for order:", orderId);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found in database",
      });
    }

    // Prepare contract data for frontend PDF generation
    const contractData = {
      orderId: order._id,
      customerName: order.userInfo?.[0]?.name || "Customer",
      customerEmail: order.userInfo?.[0]?.email || order.userEmail,
      customerPhone: order.userInfo?.[0]?.phone || "",
      customerDob: order.userInfo?.[0]?.dob || "",
      customerAddress: order.userInfo?.[0]?.address || "",
      customerCountry: order.userInfo?.[0]?.country || "",
      customerPassport: order.userInfo?.[0]?.passportId || "",

      // Order details
      basePackage: order.basePackage,
      selectedAddOns: order.selectedAddOns || [],
      totalAmount: order.totalAmount,

      // Contacts
      inheritanceContacts: order.inheritanceContacts || [],
      emergencyContacts: order.emergencyContacts || [],

      // Billing if available
      billingDetails: order.billingDetails,

      // Order metadata
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentDetails: order.paymentDetails,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    console.log("[Contract Router] Contract data prepared for frontend:", {
      orderId: contractData.orderId,
      customerName: contractData.customerName,
      totalAmount: contractData.totalAmount,
      hasInheritanceContacts: contractData.inheritanceContacts.length > 0,
      hasEmergencyContacts: contractData.emergencyContacts.length > 0,
    });

    res.status(200).json({
      success: true,
      message: "Contract data retrieved successfully",
      data: contractData,
    });
  } catch (error) {
    console.error("Error retrieving contract data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contract data",
      error: error.message,
    });
  }
});

// Update contract status after PDF generation
router.post("/generated/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { pdfGeneratedAt } = req.body;

    console.log(
      "[Contract Router] Marking contract as generated for order:",
      orderId
    );

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order to mark contract as generated
    await Order.findByIdAndUpdate(orderId, {
      contractGenerated: true,
      contractGeneratedAt: pdfGeneratedAt || new Date(),
      orderStatus:
        order.orderStatus === "pending" ? "confirmed" : order.orderStatus,
    });

    res.status(200).json({
      success: true,
      message: "Contract generation status updated",
    });
  } catch (error) {
    console.error("Error updating contract status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contract status",
      error: error.message,
    });
  }
});

// Get contract generation status
router.get("/status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const status = {
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      contractGenerated: order.contractGenerated || false,
      contractGeneratedAt: order.contractGeneratedAt,
      customerName: order.userInfo?.[0]?.name || "Customer",
      totalAmount: order.totalAmount,
    };

    res.status(200).json({
      success: true,
      message: "Contract status retrieved",
      status: status,
    });
  } catch (error) {
    console.error("Error checking contract status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check contract status",
      error: error.message,
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Contract service is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
