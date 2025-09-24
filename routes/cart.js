const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Cart = require("../models/Cart");
const User = require("../models/User");

// Use the same JWT secret as auth routes
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// FIXED: Proper authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("[Cart Auth] Decoded token:", decoded);

    // Find user by ID (new token format) or fallback to old format
    let user;
    if (decoded.userId) {
      user = await User.findById(decoded.userId);
    } else {
      // Fallback for old tokens
      if (decoded.phone && !decoded.email) {
        user = await User.findOne({
          phone: decoded.phone,
          email: { $exists: false },
        });
      } else if (decoded.email && !decoded.phone) {
        user = await User.findOne({
          email: decoded.email,
          phone: { $exists: false },
        });
      } else if (decoded.phone && decoded.email) {
        user = await User.findOne({
          phone: decoded.phone,
          email: decoded.email,
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token - user not found",
      });
    }

    // Check if token is still valid (not revoked)
    if (decoded.iat && user.lastTokenIssued) {
      const tokenIssuedAt = new Date(decoded.iat * 1000);
      if (tokenIssuedAt < user.lastTokenIssued) {
        return res.status(401).json({
          success: false,
          message: "Token revoked",
        });
      }
    }

    // Attach user to request
    req.user = user;
    req.tokenData = decoded;

    console.log("[Cart Auth] User authenticated:", user._id);
    next();
  } catch (error) {
    console.error("[Cart Auth] Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// FIXED: Save cart with proper authentication
router.post("/save", authenticateUser, async (req, res) => {
  try {
    const { basePackage, selectedAddOns, totalAmount } = req.body;
    const user = req.user; // Now we get user from authentication middleware

    console.log("[Cart] Save request received for user:", user._id);
    console.log("[Cart] User details:", {
      id: user._id,
      email: user.email,
      phone: user.phone,
    });

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
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
      },
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

// FIXED: Get active cart with proper authentication
router.get("/active", authenticateUser, async (req, res) => {
  try {
    const user = req.user; // Now we get user from authentication middleware

    console.log("[Cart] Fetching active cart for user:", user._id);

    const cart = await Cart.findOne({
      user: user._id,
      status: "active",
    }).populate("user");

    console.log("[Cart] Found cart:", cart ? cart._id : "none");

    res.status(200).json({
      success: true,
      cart: cart || null,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
      },
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

// Get all carts for user (optional - for debugging)
router.get("/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;

    const carts = await Cart.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate("user");

    res.status(200).json({
      success: true,
      carts: carts,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error fetching all carts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch carts",
      error: error.message,
    });
  }
});

// Update cart status
router.patch("/:cartId/status", authenticateUser, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { status } = req.body;
    const user = req.user;

    const cart = await Cart.findOneAndUpdate(
      { _id: cartId, user: user._id },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart status updated",
      cart: cart,
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message,
    });
  }
});

// Delete cart
router.delete("/:cartId", authenticateUser, async (req, res) => {
  try {
    const { cartId } = req.params;
    const user = req.user;

    const cart = await Cart.findOneAndDelete({
      _id: cartId,
      user: user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete cart",
      error: error.message,
    });
  }
});

module.exports = router;
