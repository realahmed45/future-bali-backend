const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const User = require("../models/User");

// Middleware to get user identifier from token
const getUserIdentifier = (req) => {
  // This should extract user info from JWT token
  // For now, we'll use a simple approach
  return req.body.email || req.body.phone || req.query.email || req.query.phone;
};

// Save cart with REAL database operations
router.post("/save", async (req, res) => {
  try {
    const { basePackage, selectedAddOns, totalAmount } = req.body;

    // Get user identifier from request (could be email or phone)
    const userIdentifier = getUserIdentifier(req);

    if (!userIdentifier) {
      return res.status(400).json({
        success: false,
        message: "User identifier (email or phone) is required",
      });
    }

    console.log("[Cart] Save request received for:", userIdentifier);

    // Find user by email or phone
    let user = await User.findOne({
      $or: [{ email: userIdentifier }, { phone: userIdentifier }],
    });

    if (!user) {
      console.log("[Cart] Creating new user:", userIdentifier);
      user = new User();

      // Determine if identifier is email or phone
      if (userIdentifier.includes("@")) {
        user.email = userIdentifier;
      } else {
        user.phone = userIdentifier;
      }

      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
    }

    console.log("[Cart] User found/created:", user.email || user.phone);

    // Delete existing active carts for this user
    await Cart.deleteMany({ user: user._id, status: "active" });

    // Create new cart
    const cart = new Cart({
      user: user._id,
      userEmail: user.email || null,
      userPhone: user.phone || null,
      basePackage,
      selectedAddOns,
      totalAmount,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedCart = await cart.save();
    console.log("[Cart] Cart saved successfully:", savedCart._id);

    res.status(200).json({
      success: true,
      message: "Cart saved successfully to database",
      cart: savedCart,
    });
  } catch (error) {
    console.error("Cart save error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save cart to database",
      error: error.message,
    });
  }
});

// Get active cart
router.get("/active", async (req, res) => {
  try {
    const userIdentifier = getUserIdentifier(req);

    if (!userIdentifier) {
      return res.status(400).json({
        success: false,
        message: "User identifier (email or phone) is required",
      });
    }

    // Find user first
    const user = await User.findOne({
      $or: [{ email: userIdentifier }, { phone: userIdentifier }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cart = await Cart.findOne({
      user: user._id,
      status: "active",
    }).populate("user");

    res.status(200).json({
      success: true,
      cart: cart || null,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
});

module.exports = router;
