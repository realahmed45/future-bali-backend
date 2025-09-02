const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User"); // Import User model

// ADD THIS LINE - Use the same secret everywhere
const JWT_SECRET = "your_jwt_secret_here";

module.exports = () => {
  // REMOVE the (JWT_SECRET) parameter
  const router = require("express").Router();

  // OTP Schema
  const OTPSchema = new mongoose.Schema(
    {
      phone: String,
      email: String,
      otp: {
        type: String,
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
        default: Date.now,
        expires: 600,
      },
    },
    {
      timestamps: true,
    }
  );

  const OTP = mongoose.model("OTP", OTPSchema);

  // Your UltraMsg credentials
  const ULTRAMSG_INSTANCE_ID = "instance100246";
  const ULTRAMSG_TOKEN = "9vj68bxsruo8xd5o";
  const ULTRAMSG_API_URL = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`;

  // WhatsApp message function using UltraMsg
  const sendWhatsAppMessage = async (phone, message) => {
    try {
      // Format phone number (remove all non-digit characters including +)
      const formattedPhone = phone.replace(/[^0-9]/g, "");

      console.log("Sending WhatsApp via UltraMsg to:", formattedPhone);

      const response = await axios.post(
        ULTRAMSG_API_URL,
        {
          token: ULTRAMSG_TOKEN,
          to: `${formattedPhone}@c.us`,
          body: message,
          priority: 1,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 15000,
        }
      );

      console.log("UltraMsg API response:", response.data);

      if (response.data && response.data.sent === true) {
        console.log("WhatsApp message sent successfully via UltraMsg");
        return true;
      }

      throw new Error(
        "Failed to send WhatsApp message: " + JSON.stringify(response.data)
      );
    } catch (error) {
      console.error("UltraMsg API error:", error.message);

      if (error.response) {
        console.error("API response error:", error.response.data);
        console.error("API status code:", error.response.status);
      }

      throw new Error("Could not send WhatsApp verification code.");
    }
  };

  // Generate OTP endpoint
  router.post("/generate-otp", async (req, res) => {
    try {
      const { phone, email } = req.body;

      if (!phone && !email) {
        return res.status(400).json({
          success: false,
          message: "Phone number or email is required",
        });
      }

      // Validate format
      if (phone && !/^\+[1-9]\d{1,14}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format. Use format: +1234567890",
        });
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      // Find or create user - USING IMPORTED USER MODEL
      const userFilter = phone ? { phone } : { email };
      let user = await User.findOne(userFilter);

      if (!user) {
        // Create user with only the provided field
        user = new User();
        if (phone) user.phone = phone;
        if (email) user.email = email;
        await user.save();
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Generated OTP:", otp, "for", phone || email);

      // Save OTP to database
      const otpData = phone ? { phone, otp } : { email, otp };
      await OTP.findOneAndUpdate(
        otpData,
        { ...otpData, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
        { upsert: true, new: true }
      );

      // Return OTP to frontend (frontend will handle email, backend handles WhatsApp)
      if (phone) {
        // Send WhatsApp via UltraMsg
        try {
          const message = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;
          await sendWhatsAppMessage(phone, message);

          res.json({
            success: true,
            message: "OTP sent successfully to your WhatsApp",
          });
        } catch (whatsappError) {
          console.error("WhatsApp sending failed:", whatsappError.message);

          // Return OTP as fallback
          res.json({
            success: true,
            message: "OTP generated successfully",
            otp: otp,
            note: "WhatsApp service unavailable. Use this OTP for verification.",
          });
        }
      } else {
        // For email, just return OTP - frontend will handle email sending
        res.json({
          success: true,
          otp: otp,
          message: "OTP generated successfully",
        });
      }
    } catch (error) {
      console.error("OTP generation error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to generate OTP",
      });
    }
  });
  // In your auth.js router
  router.get("/verify-token", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.json({ success: false });

      // Verify token
      // In verify-token endpoint:
      const decoded = jwt.verify(token, "your_jwt_secret_here");

      // Check if user exists by either email or phone
      const user = await User.findOne({
        $or: [{ email: decoded.email }, { phone: decoded.phone }],
      });

      if (!user) {
        return res.json({ success: false });
      }

      res.json({
        success: true,
        user: {
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error("Token verification error:", error);
      res.json({ success: false });
    }
  });
  // Verify OTP endpoint
  router.post("/verify-otp", async (req, res) => {
    try {
      const { phone, email, otp } = req.body;
      console.log("Verification request:", { phone, email, otp });

      if (!otp || otp.length !== 6) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP format",
        });
      }

      if (!phone && !email) {
        return res.status(400).json({
          success: false,
          message: "Phone or email required",
        });
      }

      // Find OTP record
      let otpRecord;
      if (phone) {
        otpRecord = await OTP.findOne({ phone, otp });
        console.log("Found OTP record for phone:", otpRecord);
      } else {
        otpRecord = await OTP.findOne({ email, otp });
        console.log("Found OTP record for email:", otpRecord);
      }

      if (!otpRecord) {
        console.log("Invalid OTP: No matching record found");
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      if (otpRecord.otp !== otp) {
        console.log("Invalid OTP: OTP mismatch");
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      if (otpRecord.expiresAt < new Date()) {
        console.log("OTP expired:", otpRecord.expiresAt);
        return res.status(400).json({
          success: false,
          message: "OTP expired",
        });
      }

      // Update user - USING IMPORTED USER MODEL
      const userFilter = phone ? { phone } : { email };
      await User.findOneAndUpdate(
        userFilter,
        { lastLogin: new Date(), isVerified: true },
        { new: true }
      );

      // Generate JWT token with both email and phone
      const tokenPayload = {
        phone: phone || null,
        email: email || null,
      };
      // In verify-otp endpoint:
      const token = jwt.sign(tokenPayload, "your_jwt_secret_here", {
        expiresIn: "7d",
      });
      // Clean up OTP
      await OTP.deleteOne({ _id: otpRecord._id });
      console.log("OTP verification successful");

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

  // Test UltraMsg connection endpoint
  router.get("/test-ultramsg", async (req, res) => {
    try {
      const testPhone = "1234567890"; // Replace with a test number
      const testMessage = "Test message from UltraMsg API";

      const response = await axios.post(
        ULTRAMSG_API_URL,
        {
          token: ULTRAMSG_TOKEN,
          to: `${testPhone}@c.us`,
          body: testMessage,
          priority: 1,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 15000,
        }
      );

      res.json({
        success: true,
        message: "UltraMsg test successful",
        response: response.data,
      });
    } catch (error) {
      res.json({
        success: false,
        message: "UltraMsg test failed",
        error: error.message,
      });
    }
  });

  // Debug endpoint to check OTP records
  router.get("/debug-otp", async (req, res) => {
    try {
      const otpRecords = await OTP.find({});
      res.json({
        success: true,
        records: otpRecords,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch OTP records",
      });
    }
  });

  return router;
};
