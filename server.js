// No need for dotenv since we're hardcoding everything
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const contractRoutes = require("./routes/contracts");

const app = express();
const PORT = process.env.PORT || 5000; // Use environment port for Render

// JWT Configuration (hardcoded)
const JWT_SECRET = "my-super-secret-jwt-key-for-villa-investment-platform-2024";

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (
    req.body &&
    Object.keys(req.body).length > 0 &&
    req.path !== "/api/contracts/generate-and-send"
  ) {
    console.log("Request body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// MongoDB connection state tracking
let mongoConnected = false;
let mongoError = null;

// MongoDB Connection with enhanced error handling
const connectToMongoDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");

    await mongoose.connect(
      "mongodb+srv://realahmedali4:ggMfUxp9hkAGRG6D@cluster0000.f770vio.mongodb.net/villa-investment?retryWrites=true&w=majority&appName=Cluster0000",
      {
        // Connection timeouts
        serverSelectionTimeoutMS: 15000, // Reduced from 30s
        connectTimeoutMS: 15000, // Reduced from 30s
        socketTimeoutMS: 20000, // Reduced from 45s

        // Connection pool settings
        maxPoolSize: 5, // Reduced for Render
        minPoolSize: 1, // Reduced minimum
        maxIdleTimeMS: 20000, // Reduced idle time
        waitQueueTimeoutMS: 15000, // Reduced wait time

        // Retry settings
        retryWrites: true,
        retryReads: true,

        // Additional settings for stability
        bufferCommands: false, // Disable mongoose buffering
        bufferMaxEntries: 0, // Disable mongoose buffering
        heartbeatFrequencyMS: 10000, // Send heartbeat every 10s
      }
    );

    mongoConnected = true;
    mongoError = null;
    console.log("MongoDB connected successfully");

    // Test the connection with a simple operation
    await mongoose.connection.db.admin().ping();
    console.log("MongoDB ping successful");
  } catch (error) {
    mongoConnected = false;
    mongoError = error.message;
    console.error("MongoDB connection error:", error);

    // Retry connection after 5 seconds
    setTimeout(() => {
      console.log("Retrying MongoDB connection...");
      connectToMongoDB();
    }, 5000);
  }
};

// MongoDB event handlers
mongoose.connection.on("connected", () => {
  mongoConnected = true;
  mongoError = null;
  console.log("MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  mongoConnected = false;
  mongoError = err.message;
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  mongoConnected = false;
  console.log("MongoDB disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
});

// MongoDB connection middleware
const ensureMongoConnection = (req, res, next) => {
  if (!mongoConnected) {
    return res.status(503).json({
      success: false,
      message: "Database temporarily unavailable. Please try again.",
      error: mongoError || "Database not connected",
    });
  }
  next();
};

// Health check endpoint with detailed MongoDB status
app.get("/health", async (req, res) => {
  const healthStatus = {
    status: mongoConnected ? "OK" : "ERROR",
    timestamp: new Date().toISOString(),
    mongodb: {
      connected: mongoConnected,
      readyState: mongoose.connection.readyState,
      error: mongoError,
    },
    server: "Running",
  };

  // Try to ping MongoDB for additional verification
  if (mongoConnected) {
    try {
      await mongoose.connection.db.admin().ping();
      healthStatus.mongodb.ping = "Success";
    } catch (error) {
      healthStatus.mongodb.ping = "Failed";
      healthStatus.mongodb.pingError = error.message;
    }
  }

  const statusCode = mongoConnected ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// Apply MongoDB connection check to all API routes
app.use("/api", ensureMongoConnection);

// Routes
app.use("/api/auth", authRoutes(JWT_SECRET));
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contracts", contractRoutes);

// Test endpoint to verify routes are working
app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is working!",
    mongodb: mongoConnected ? "Connected" : "Disconnected",
    routes: {
      auth: "/api/auth",
      cart: "/api/cart",
      orders: "/api/orders",
      contracts: "/api/contracts",
    },
  });
});

// Simple file upload endpoint for Base64
app.post("/api/upload", (req, res) => {
  const { file, fileName } = req.body;
  if (!file) {
    return res.status(400).json({ message: "No file provided" });
  }

  // In a real app, you might want to store the Base64 string in your database
  // Here we just return a mock response
  res.json({
    success: true,
    filePath: `data:image/jpeg;base64,${file}`,
  });
});

// Enhanced error handling middleware with MongoDB-specific handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  // Handle MongoDB-specific errors
  if (err.name === "MongoTimeoutError" || err.name === "MongoNetworkError") {
    return res.status(503).json({
      success: false,
      message: "Database temporarily unavailable. Please try again.",
      type: "database_error",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Invalid data provided",
      details: err.message,
      type: "validation_error",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
      type: "cast_error",
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
    type: "server_error",
    // Only show stack trace in development
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Initialize MongoDB connection
connectToMongoDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check available at: /health`);
});
