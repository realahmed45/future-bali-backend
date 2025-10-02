const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// USE THE SAME SECRET as in auth.js
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// Configure router for large payloads and extended timeouts
router.use(
  express.json({
    limit: "100mb", // Increased to 100MB for orders with multiple images
    extended: true,
  })
);

router.use(
  express.urlencoded({
    limit: "100mb",
    extended: true,
    parameterLimit: 100000, // Increased parameter limit
  })
);

// Set timeout for all order routes to handle large file uploads
router.use((req, res, next) => {
  // Set server timeout to 15 minutes (900,000ms) for orders with multiple images
  req.setTimeout(900000);
  res.setTimeout(900000);

  // Add request start time for monitoring
  req.startTime = Date.now();

  console.log(
    `[Orders] Request started: ${req.method} ${
      req.path
    } at ${new Date().toISOString()}`
  );

  // Override res.json to add timing info
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - req.startTime;
    console.log(`[Orders] Request completed in ${duration}ms`);

    if (data && typeof data === "object") {
      data.processingTime = `${duration}ms`;
    }

    return originalJson.call(this, data);
  };

  next();
});

// Enhanced authentication middleware with timeout handling
const authenticateUser = async (req) => {
  try {
    const authStartTime = Date.now();
    console.log("[Orders Auth] Starting authentication...");

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return null;
    }

    // Verify the JWT token with timeout
    const decoded = await Promise.race([
      new Promise((resolve, reject) => {
        try {
          const result = jwt.verify(token, JWT_SECRET);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Token verification timeout")), 5000)
      ),
    ]);

    console.log(
      "[Orders Auth] Token verified in",
      Date.now() - authStartTime,
      "ms"
    );

    // Find user with timeout protection
    const userLookupStart = Date.now();
    let user;

    if (decoded.userId) {
      user = await Promise.race([
        User.findById(decoded.userId).lean(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("User lookup timeout")), 10000)
        ),
      ]);
    } else {
      // Fallback for old token format
      const userQuery = User.findOne({
        $or: [
          { email: decoded.email },
          { phone: decoded.phone },
          { email: decoded.email, phone: decoded.phone },
        ],
      }).lean();

      user = await Promise.race([
        userQuery,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("User lookup timeout")), 10000)
        ),
      ]);
    }

    console.log(
      "[Orders Auth] User lookup completed in",
      Date.now() - userLookupStart,
      "ms"
    );
    console.log(
      "[Orders Auth] Authentication completed in",
      Date.now() - authStartTime,
      "ms"
    );

    return user;
  } catch (error) {
    console.error("[Orders Auth] Authentication error:", error);
    return null;
  }
};

// Helper function to validate data size
const validateDataSize = (data, maxSizeMB = 90) => {
  const dataSize = JSON.stringify(data).length;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  console.log("[Orders] Data size:", (dataSize / 1024 / 1024).toFixed(2), "MB");

  if (dataSize > maxSizeBytes) {
    return {
      valid: false,
      size: dataSize,
      message: `Order data too large (${(dataSize / 1024 / 1024).toFixed(
        2
      )}MB). Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return {
    valid: true,
    size: dataSize,
  };
};
// Add this NEW route to your existing orders.js file
// Place it BEFORE the generic "router.get('/', ...)" route

// OPTIMIZED: Get user-specific orders with proper filtering
router.get("/user-orders", async (req, res) => {
  try {
    const fetchStartTime = Date.now();

    // Get user from token
    const user = await Promise.race([
      authenticateUser(req),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Authentication timeout")), 30000)
      ),
    ]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    console.log("[Orders] Fetching orders for user:", user.email || user.phone);

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Build filter query - Match user by email OR phone in userInfo array
    const filterQuery = {
      $or: [],
    };

    // Add email filter if user has email
    if (user.email) {
      filterQuery.$or.push({ "userInfo.email": user.email });
    }

    // Add phone filter if user has phone
    if (user.phone) {
      filterQuery.$or.push({ "userInfo.phone": user.phone });
    }

    // Fallback: Also check old fields (userEmail, userPhone) for backward compatibility
    if (user.email) {
      filterQuery.$or.push({ userEmail: user.email });
    }
    if (user.phone) {
      filterQuery.$or.push({ userPhone: user.phone });
    }

    console.log("[Orders] Filter query:", JSON.stringify(filterQuery));

    // Fetch orders and count
    const [orders, totalCount] = await Promise.all([
      Promise.race([
        Order.find(filterQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Orders fetch timeout")), 45000)
        ),
      ]),
      Order.countDocuments(filterQuery),
    ]);

    console.log(
      "[Orders] Found",
      orders.length,
      "orders for user in",
      Date.now() - fetchStartTime,
      "ms"
    );

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1,
      },
      fetchTime: Date.now() - fetchStartTime + "ms",
    });
  } catch (error) {
    console.error("[Orders] Fetch user orders error:", error);

    let errorMessage = "Failed to fetch orders from database";
    if (error.message === "Authentication timeout") {
      errorMessage = "Authentication timed out. Please try again.";
    } else if (error.message === "Orders fetch timeout") {
      errorMessage = "Orders fetch timed out. Please try again.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
// OPTIMIZED: Create new order with extended timeout
router.post("/create", async (req, res) => {
  try {
    const createStartTime = Date.now();
    const { cartId, basePackage, selectedAddOns, totalAmount } = req.body;

    console.log("[Orders] Creating order with data size check...");

    // Validate data size
    const sizeValidation = validateDataSize(req.body);
    if (!sizeValidation.valid) {
      return res.status(413).json({
        success: false,
        message: sizeValidation.message,
      });
    }

    // Get user from token with timeout
    const user = await Promise.race([
      authenticateUser(req),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Authentication timeout")), 30000)
      ),
    ]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    console.log("[Orders] Found user:", user.email || user.phone);

    // Validate required fields
    if (!basePackage || typeof totalAmount !== "number") {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: basePackage and totalAmount are required",
      });
    }

    // Create order with metadata
    const orderData = {
      user: user._id,
      userEmail: user.email || null,
      userPhone: user.phone || null,
      cartId,
      basePackage,
      selectedAddOns: selectedAddOns || [],
      totalAmount,
      orderStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add metadata for debugging
      dataSize: sizeValidation.size,
      processingStarted: createStartTime,
    };

    const order = new Order(orderData);

    // Save with timeout protection
    const saveOperation = async () => {
      const saveStartTime = Date.now();
      const savedOrder = await order.save();
      console.log(
        "[Orders] Order saved to database in",
        Date.now() - saveStartTime,
        "ms"
      );
      return savedOrder;
    };

    const savedOrder = await Promise.race([
      saveOperation(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Order save timeout after 120 seconds")),
          120000
        )
      ),
    ]);

    // Update cart status if cartId provided
    if (cartId) {
      console.log("[Orders] Updating cart status to ordered");
      const cartUpdateStart = Date.now();

      try {
        await Promise.race([
          Cart.findOneAndUpdate(
            {
              $or: [
                { userEmail: user.email },
                { userPhone: user.phone },
                { user: user._id },
              ],
              status: "active",
            },
            { status: "ordered", updatedAt: new Date() }
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Cart update timeout")), 30000)
          ),
        ]);

        console.log(
          "[Orders] Cart updated in",
          Date.now() - cartUpdateStart,
          "ms"
        );
      } catch (cartError) {
        console.warn(
          "[Orders] Cart update failed (non-critical):",
          cartError.message
        );
        // Don't fail the order creation if cart update fails
      }
    }

    console.log(
      "[Orders] Order created successfully:",
      savedOrder._id,
      "Total time:",
      Date.now() - createStartTime,
      "ms"
    );

    res.status(201).json({
      success: true,
      order: {
        _id: savedOrder._id,
        orderStatus: savedOrder.orderStatus,
        totalAmount: savedOrder.totalAmount,
        createdAt: savedOrder.createdAt,
        dataSize: savedOrder.dataSize,
      },
      orderId: savedOrder._id,
      message: "Order created and saved to database",
      performance: {
        totalProcessingTime: Date.now() - createStartTime,
        dataSizeMB: (sizeValidation.size / 1024 / 1024).toFixed(2),
      },
    });
  } catch (error) {
    console.error("[Orders] Create error:", error);

    let errorMessage = "Failed to create order in database";
    let statusCode = 500;

    if (error.message === "Order save timeout after 120 seconds") {
      errorMessage =
        "Order creation timed out. Please try again with smaller data.";
      statusCode = 408;
    } else if (error.message === "Authentication timeout") {
      errorMessage = "Authentication timed out. Please try again.";
      statusCode = 408;
    } else if (error.code === 11000) {
      errorMessage = "Duplicate order detected";
      statusCode = 409;
    } else if (error.name === "ValidationError") {
      errorMessage = "Order data validation failed: " + error.message;
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      processingTime: Date.now() - req.startTime + "ms",
    });
  }
});

// OPTIMIZED: Update order with payment details
router.put("/:orderId", async (req, res) => {
  try {
    const updateStartTime = Date.now();
    const { orderId } = req.params;
    const updateData = req.body;

    console.log("[Orders] Updating order with payment details:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Validate data size
    const sizeValidation = validateDataSize(updateData, 50); // 50MB limit for updates
    if (!sizeValidation.valid) {
      return res.status(413).json({
        success: false,
        message: sizeValidation.message,
      });
    }

    const updateOperation = Order.findByIdAndUpdate(
      orderId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true, lean: true }
    );

    const order = await Promise.race([
      updateOperation,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Order update timeout after 60 seconds")),
          60000
        )
      ),
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(
      "[Orders] Order updated successfully in",
      Date.now() - updateStartTime,
      "ms"
    );

    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt,
      },
      message: "Order updated successfully with payment information",
      updateTime: Date.now() - updateStartTime + "ms",
    });
  } catch (error) {
    console.error("[Orders] Update error:", error);

    let errorMessage = "Failed to update order in database";
    if (error.message === "Order update timeout after 60 seconds") {
      errorMessage = "Order update timed out. Please try again.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// OPTIMIZED: Save user information with large file handling
router.post("/save-user-info", async (req, res) => {
  try {
    const saveStartTime = Date.now();
    const { userInfo, orderId } = req.body;

    console.log("[Orders] Saving user info for order:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Validate data size - user info can be large with images
    const sizeValidation = validateDataSize({ userInfo }, 80); // 80MB limit for user info with images
    if (!sizeValidation.valid) {
      return res.status(413).json({
        success: false,
        message: sizeValidation.message,
      });
    }

    const updateOperation = Order.findByIdAndUpdate(
      orderId,
      {
        userInfo: userInfo,
        updatedAt: new Date(),
      },
      { new: true, lean: true }
    );

    const order = await Promise.race([
      updateOperation,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("User info save timeout after 120 seconds")),
          120000
        )
      ),
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(
      "[Orders] User info saved successfully in",
      Date.now() - saveStartTime,
      "ms"
    );

    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        updatedAt: order.updatedAt,
      },
      message: "User information saved to database successfully",
      saveTime: Date.now() - saveStartTime + "ms",
      dataSizeMB: (sizeValidation.size / 1024 / 1024).toFixed(2),
    });
  } catch (error) {
    console.error("[Orders] Save user info error:", error);

    let errorMessage = "Failed to save user information to database";
    if (error.message === "User info save timeout after 120 seconds") {
      errorMessage =
        "User information save timed out. Please try again with smaller images.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// OPTIMIZED: Save inheritance contacts with image handling
router.post("/save-inheritance", async (req, res) => {
  try {
    const saveStartTime = Date.now();
    const { contacts, orderId } = req.body;

    console.log("[Orders] Saving inheritance contacts for order:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Validate data size - inheritance contacts can have passport images
    const sizeValidation = validateDataSize({ contacts }, 30); // 30MB limit for inheritance contacts
    if (!sizeValidation.valid) {
      return res.status(413).json({
        success: false,
        message: sizeValidation.message,
      });
    }

    const updateOperation = Order.findByIdAndUpdate(
      orderId,
      {
        inheritanceContacts: contacts,
        updatedAt: new Date(),
      },
      { new: true, lean: true }
    );

    const order = await Promise.race([
      updateOperation,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Inheritance save timeout after 90 seconds")),
          90000
        )
      ),
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(
      "[Orders] Inheritance contacts saved successfully in",
      Date.now() - saveStartTime,
      "ms"
    );

    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        updatedAt: order.updatedAt,
      },
      message: "Inheritance contacts saved to database successfully",
      saveTime: Date.now() - saveStartTime + "ms",
      dataSizeMB: (sizeValidation.size / 1024 / 1024).toFixed(2),
    });
  } catch (error) {
    console.error("[Orders] Save inheritance error:", error);

    let errorMessage = "Failed to save inheritance contacts to database";
    if (error.message === "Inheritance save timeout after 90 seconds") {
      errorMessage =
        "Inheritance contacts save timed out. Please try again with smaller images.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// OPTIMIZED: Save emergency contacts with image handling
router.post("/save-emergency", async (req, res) => {
  try {
    const saveStartTime = Date.now();
    const { contacts, orderId } = req.body;

    console.log("[Orders] Saving emergency contacts for order:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Validate data size - emergency contacts can have ID images
    const sizeValidation = validateDataSize({ contacts }, 20); // 20MB limit for emergency contacts
    if (!sizeValidation.valid) {
      return res.status(413).json({
        success: false,
        message: sizeValidation.message,
      });
    }

    const updateOperation = Order.findByIdAndUpdate(
      orderId,
      {
        emergencyContacts: contacts,
        updatedAt: new Date(),
      },
      { new: true, lean: true }
    );

    const order = await Promise.race([
      updateOperation,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Emergency save timeout after 60 seconds")),
          60000
        )
      ),
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(
      "[Orders] Emergency contacts saved successfully in",
      Date.now() - saveStartTime,
      "ms"
    );

    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        updatedAt: order.updatedAt,
      },
      message: "Emergency contacts saved to database successfully",
      saveTime: Date.now() - saveStartTime + "ms",
      dataSizeMB: (sizeValidation.size / 1024 / 1024).toFixed(2),
    });
  } catch (error) {
    console.error("[Orders] Save emergency error:", error);

    let errorMessage = "Failed to save emergency contacts to database";
    if (error.message === "Emergency save timeout after 60 seconds") {
      errorMessage =
        "Emergency contacts save timed out. Please try again with smaller images.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// OPTIMIZED: Finalize order with billing details
router.post("/finalize", async (req, res) => {
  try {
    const finalizeStartTime = Date.now();
    const { orderId, billingDetails } = req.body;

    console.log("[Orders] Finalizing order:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Validate data size
    const sizeValidation = validateDataSize({ billingDetails }, 10); // 10MB limit for billing details
    if (!sizeValidation.valid) {
      return res.status(413).json({
        success: false,
        message: sizeValidation.message,
      });
    }

    const updateOperation = Order.findByIdAndUpdate(
      orderId,
      {
        billingDetails,
        orderStatus: "confirmed",
        updatedAt: new Date(),
      },
      { new: true, lean: true }
    );

    const order = await Promise.race([
      updateOperation,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Finalize timeout after 30 seconds")),
          30000
        )
      ),
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(
      "[Orders] Order finalized successfully in",
      Date.now() - finalizeStartTime,
      "ms"
    );

    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt,
      },
      message: "Order finalized and saved to database successfully",
      finalizeTime: Date.now() - finalizeStartTime + "ms",
    });
  } catch (error) {
    console.error("[Orders] Finalize error:", error);

    let errorMessage = "Failed to finalize order in database";
    if (error.message === "Finalize timeout after 30 seconds") {
      errorMessage = "Order finalization timed out. Please try again.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// OPTIMIZED: Get single order with timeout protection
router.get("/:orderId", async (req, res) => {
  try {
    const fetchStartTime = Date.now();
    const { orderId } = req.params;

    console.log("[Orders] Fetching order:", orderId);

    const fetchOperation = Order.findById(orderId).lean();

    const order = await Promise.race([
      fetchOperation,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Order fetch timeout after 30 seconds")),
          30000
        )
      ),
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found in database",
      });
    }

    console.log("[Orders] Order fetched in", Date.now() - fetchStartTime, "ms");

    res.status(200).json({
      success: true,
      order,
      fetchTime: Date.now() - fetchStartTime + "ms",
    });
  } catch (error) {
    console.error("[Orders] Fetch error:", error);

    let errorMessage = "Failed to fetch order from database";
    if (error.message === "Order fetch timeout after 30 seconds") {
      errorMessage = "Order fetch timed out. Please try again.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// OPTIMIZED: Get user orders with pagination
router.get("/", async (req, res) => {
  try {
    const fetchStartTime = Date.now();

    // Get user from token
    const user = await Promise.race([
      authenticateUser(req),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Authentication timeout")), 30000)
      ),
    ]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 orders
    const skip = (page - 1) * limit;

    // Find orders by user with pagination
    const [orders, totalCount] = await Promise.all([
      Promise.race([
        Order.find({
          $or: [
            { userEmail: user.email },
            { userPhone: user.phone },
            { user: user._id },
          ],
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Orders fetch timeout")), 45000)
        ),
      ]),
      Order.countDocuments({
        $or: [
          { userEmail: user.email },
          { userPhone: user.phone },
          { user: user._id },
        ],
      }),
    ]);

    console.log(
      "[Orders] Orders fetched in",
      Date.now() - fetchStartTime,
      "ms"
    );

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1,
      },
      fetchTime: Date.now() - fetchStartTime + "ms",
    });
  } catch (error) {
    console.error("[Orders] Fetch orders error:", error);

    let errorMessage = "Failed to fetch orders from database";
    if (error.message === "Authentication timeout") {
      errorMessage = "Authentication timed out. Please try again.";
    } else if (error.message === "Orders fetch timeout") {
      errorMessage = "Orders fetch timed out. Please try again.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Health check endpoint
router.get("/health/check", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Orders service is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware for the orders router
router.use((error, req, res, next) => {
  console.error("[Orders] Unhandled error:", error);

  // Handle specific error types
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request payload too large. Maximum size is 100MB.",
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID format",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error in orders service",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

module.exports = router;
