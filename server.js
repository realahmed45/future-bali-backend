// No need for dotenv since we're hardcoding everything
const express = require("express");
const cors = require("cors"); // Added CORS import
const mongoose = require("mongoose");
const path = require("path");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const contractRoutes = require("./routes/contracts");

const app = express();
const PORT = 5000; // Hardcoded port

// JWT Configuration (hardcoded)
const JWT_SECRET = "my-super-secret-jwt-key-for-villa-investment-platform-2024";

// CORS Middleware - Allow all origins
app.use(cors()); // This allows all origins

// Serve static files from frontend assets folder
// Serve images from backend's public folder
app.use(
  "/media-preview/images",
  express.static(path.join(__dirname, "public/assets"))
);
// Other Middleware
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

// MongoDB Connection (hardcoded)
mongoose
  .connect(
    "mongodb+srv://realahmedali4:ggMfUxp9hkAGRG6D@cluster0000.f770vio.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0000",
    {
      useNewUrlParser: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Routes
app.use("/api/auth", authRoutes(JWT_SECRET));
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/email", require("./routes/email"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/media", require("./routes/media"));

// Test endpoint to verify routes are working
app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is working!",
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

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
    stack: err.stack, // Always show stack trace
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: development`);
  console.log(``);
});
