const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// USE THE SAME SECRET as in auth.js
const JWT_SECRET = "your_jwt_secret_here";

// Helper function to get user from token
const getUserFromToken = async (req) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return null;
    }

    // Use the same secret
    const decoded = jwt.verify(token, "your_jwt_secret_here");

    // Find user by email or phone from the token
    const user = await User.findOne({
      $or: [{ email: decoded.email }, { phone: decoded.phone }],
    });

    return user;
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
};

// Create new order - REAL DATABASE SAVING
router.post("/create", async (req, res) => {
  try {
    const { cartId, basePackage, selectedAddOns, totalAmount } = req.body;

    console.log("[Orders] Creating order with data:", req.body);

    // Get user from token
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    console.log("[Orders] Found user:", user.email || user.phone);

    // Create order
    const order = new Order({
      userEmail: user.email || null,
      userPhone: user.phone || null,
      cartId,
      basePackage,
      selectedAddOns,
      totalAmount,
      orderStatus: "pending",
      createdAt: new Date(),
    });

    const savedOrder = await order.save();

    // Update cart status if cartId provided
    if (cartId) {
      console.log("[Orders] Updating cart status to ordered");
      await Cart.findOneAndUpdate(
        {
          $or: [{ userEmail: user.email }, { userPhone: user.phone }],
          status: "active",
        },
        { status: "ordered" }
      );
    }

    console.log("[Orders] Order created successfully:", savedOrder._id);

    res.status(201).json({
      success: true,
      order: savedOrder,
      orderId: savedOrder._id,
      message: "Order created and saved to database",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order in database",
      error: error.message,
    });
  }
});
// Add this route to your orders router (after the existing routes)

// Update order with payment details - REAL DATABASE UPDATE
router.put("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;

    console.log("[Orders] Updating order with payment details:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("[Orders] Order updated successfully with payment details");

    res.status(200).json({
      success: true,
      order,
      message: "Order updated successfully with payment information",
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order in database",
      error: error.message,
    });
  }
});
// Save user information - REAL DATABASE UPDATE
router.post("/save-user-info", async (req, res) => {
  try {
    const { userInfo, orderId } = req.body;

    console.log("[Orders] Saving user info for order:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        userInfo: userInfo,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("[Orders] User info saved successfully to database");

    res.status(200).json({
      success: true,
      order,
      message: "User information saved to database successfully",
    });
  } catch (error) {
    console.error("Error saving user info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save user information to database",
      error: error.message,
    });
  }
});

// Save inheritance contacts - REAL DATABASE UPDATE
router.post("/save-inheritance", async (req, res) => {
  try {
    const { contacts, orderId } = req.body;

    console.log("[Orders] Saving inheritance contacts for order:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        inheritanceContacts: contacts,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("[Orders] Inheritance contacts saved successfully to database");

    res.status(200).json({
      success: true,
      order,
      message: "Inheritance contacts saved to database successfully",
    });
  } catch (error) {
    console.error("Error saving inheritance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save inheritance contacts to database",
      error: error.message,
    });
  }
});

// Save emergency contacts - REAL DATABASE UPDATE
router.post("/save-emergency", async (req, res) => {
  try {
    const { contacts, orderId } = req.body;

    console.log("[Orders] Saving emergency contacts for order:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        emergencyContacts: contacts,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("[Orders] Emergency contacts saved successfully to database");

    res.status(200).json({
      success: true,
      order,
      message: "Emergency contacts saved to database successfully",
    });
  } catch (error) {
    console.error("Error saving emergency contacts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save emergency contacts to database",
      error: error.message,
    });
  }
});

// Finalize order with billing details - REAL DATABASE UPDATE
router.post("/finalize", async (req, res) => {
  try {
    const { orderId, billingDetails } = req.body;

    console.log("[Orders] Finalizing order:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        billingDetails,
        orderStatus: "confirmed",
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("[Orders] Order finalized successfully in database");

    res.status(200).json({
      success: true,
      order,
      message: "Order finalized and saved to database successfully",
    });
  } catch (error) {
    console.error("Error finalizing order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to finalize order in database",
      error: error.message,
    });
  }
});

// Get single order - REAL DATABASE FETCH
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("[Orders] Fetching order:", orderId);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found in database",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order from database",
      error: error.message,
    });
  }
});

// Get user orders - REAL DATABASE FETCH
router.get("/my-orders", async (req, res) => {
  try {
    // Get user from request
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Find orders by either email or phone
    const orders = await Order.find({
      $or: [{ userEmail: user.email }, { userPhone: user.phone }],
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders from database",
      error: error.message,
    });
  }
});

module.exports = router;
