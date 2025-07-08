module.exports = (JWT_SECRET) => {
  const router = require("express").Router();
  const mongoose = require("mongoose");
  const OTP = require("../models/OTP");
  const jwt = require("jsonwebtoken");
  const User = require("../models/User");

  router.post("/generate-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email is required" });
      }

      // Check if user exists or create new user
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ email });
        await user.save();
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Generated OTP:", otp);

      await OTP.findOneAndUpdate(
        { email },
        { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
        { upsert: true, new: true }
      );

      res.json({ success: true, otp });
    } catch (error) {
      console.error("OTP generation error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate OTP",
      });
    }
  });

  router.post("/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;

      // Verify OTP
      const otpRecord = await OTP.findOne({ email });
      if (!otpRecord || otpRecord.otp !== otp) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      if (otpRecord.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: "OTP expired" });
      }

      // Update user last login
      await User.findOneAndUpdate(
        { email },
        { lastLogin: new Date(), isVerified: true },
        { new: true }
      );

      // Generate JWT token
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

      // Clean up OTP
      await OTP.deleteOne({ email });

      res.json({
        success: true,
        token,
        message: "Authentication successful",
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({
        success: false,
        message: "OTP verification failed",
      });
    }
  });

  router.get("/verify-token", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.json({ success: false });

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if user exists
      const user = await User.findOne({ email: decoded.email });
      if (!user) {
        return res.json({ success: false });
      }

      res.json({ success: true, user: { email: user.email } });
    } catch (error) {
      console.error("Token verification error:", error);
      res.json({ success: false });
    }
  });

  return router;
};
