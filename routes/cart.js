const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const User = require("../models/User");

// Save cart with REAL database operations
router.post("/save", async (req, res) => {
  try {
    const { email, basePackage, selectedAddOns, totalAmount } = req.body;

    console.log("[Cart] Save request received for:", email);

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      console.log("[Cart] Creating new user:", email);
      user = new User({
        email,
        isVerified: true, // Auto-verify for simplicity
        lastLogin: new Date(),
      });
      await user.save();
    }

    console.log("[Cart] User found/created:", user.email);

    // Delete existing active carts for this user
    await Cart.deleteMany({ user: user._id, status: "active" });

    // Create new cart
    const cart = new Cart({
      user: user._id,
      userEmail: email,
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
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required",
      });
    }

    const cart = await Cart.findOne({
      userEmail: email,
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
