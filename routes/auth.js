const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Resend } = require("resend");
const rateLimit = require("express-rate-limit");
const User = require("../models/User"); // Import User model

// Use environment variable for JWT secret or fallback
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// Initialize Resend with API key
const resend = new Resend("re_hBX59w3u_53X3xJy28Dx96evvJSNV6Fek");

// Send OTP email function using Resend
const sendOtpEmail = async (email, otp) => {
  try {
    console.log("Sending OTP email via Resend to:", email);

    const emailData = {
      from: "My Future Life Bali <info@futurelifebali.com>",
      to: [email],
      subject: "Your Login Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Verification Code</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">My Future Life Bali Login</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #374151; margin-top: 0; font-size: 22px;">Your Verification Code</h2>
              
              <p style="color: #6b7280; line-height: 1.6; font-size: 16px; margin: 20px 0;">
                Please use the following verification code to complete your login:
              </p>
              
              <!-- OTP Code Box -->
              <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin: 30px 0; border: 2px dashed #7c3aed;">
                <h1 style="font-size: 48px; color: #374151; margin: 0; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
              </div>

              <!-- Important Notice -->
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: bold;">
                  ⏰ This code will expire in 10 minutes
                </p>
              </div>

              <p style="color: #6b7280; line-height: 1.6; font-size: 14px; margin: 20px 0;">
                If you didn't request this code, please ignore this email or contact our support team.
              </p>
              
              <!-- Contact Info -->
              <div style="margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 14px; margin: 5px 0;">
                  Need help? Contact us at:
                </p>
                <p style="color: #7c3aed; font-size: 14px; margin: 5px 0; font-weight: bold;">
                  📧 info@futurelifebali.com | 📱 WhatsApp: +62 818-1818-5522
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.4;">
                My Future Life Bali<br>
                Your trusted partner for Bali villa investments
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await resend.emails.send(emailData);
    console.log("OTP email sent successfully via Resend:", result.id);
    return true;
  } catch (error) {
    console.error("Error sending OTP email via Resend:", error);
    throw new Error("Failed to send verification email");
  }
};

module.exports = () => {
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
        expires: 600, // 10 minutes
      },
    },
    {
      timestamps: true,
    }
  );

  const OTP = mongoose.model("OTP", OTPSchema);

  // Token blacklist (in production, use Redis)
  const TokenBlacklist = new Set();

  // UltraMsg credentials
  const ULTRAMSG_INSTANCE_ID =
    process.env.ULTRAMSG_INSTANCE_ID || "instance143389";
  const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || "e5qifsg0mzq0ylng";
  const ULTRAMSG_API_URL = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`;

  // Rate limiting for OTP generation
  const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 OTP requests per windowMs
    message: {
      success: false,
      message: "Too many OTP requests. Please try again in 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiting for OTP verification
  const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 verification attempts per windowMs
    message: {
      success: false,
      message:
        "Too many verification attempts. Please try again in 15 minutes.",
    },
  });

  // Middleware to check token blacklist
  const checkTokenBlacklist = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (token && TokenBlacklist.has(token)) {
      return res.status(401).json({ success: false, message: "Token revoked" });
    }
    next();
  };

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
  router.post("/generate-otp", otpLimiter, async (req, res) => {
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

      // Find or create user
      const userFilter = phone ? { phone } : { email };
      let user = await User.findOne(userFilter);

      if (!user) {
        // Create user with only the provided field
        user = new User();
        if (phone) user.phone = phone;
        if (email) user.email = email;

        try {
          await user.save();
        } catch (saveError) {
          if (saveError.code === 11000) {
            // Duplicate key error - user might have been created between findOne and save
            user = await User.findOne(userFilter);
            if (!user) {
              return res.status(409).json({
                success: false,
                message: "User with this contact information already exists",
              });
            }
          } else {
            throw saveError;
          }
        }
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Generated OTP:", otp, "for", phone || email);

      // Save OTP to database
      const otpData = phone ? { phone, otp } : { email, otp };
      await OTP.findOneAndUpdate(
        phone ? { phone } : { email },
        { ...otpData, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
        { upsert: true, new: true }
      );

      // Handle OTP delivery
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
          });
        }
      } else {
        // Send email via Resend
        try {
          await sendOtpEmail(email, otp);
          res.json({
            success: true,
            message: "OTP sent successfully to your email",
          });
        } catch (emailError) {
          console.error("Email sending failed:", emailError.message);

          // Return OTP as fallback
          res.json({
            success: true,
            message: "OTP generated successfully",
            otp: otp,
            note: "Email service temporarily unavailable. Use this OTP for verification.",
          });
        }
      }
    } catch (error) {
      console.error("OTP generation error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to generate OTP",
      });
    }
  });

  // Verify OTP endpoint
  router.post("/verify-otp", verifyLimiter, async (req, res) => {
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
        await OTP.deleteOne({ _id: otpRecord._id }); // Clean up expired OTP
        return res.status(400).json({
          success: false,
          message: "OTP expired",
        });
      }

      // Find the specific user
      const userFilter = phone ? { phone } : { email };
      const user = await User.findOneAndUpdate(
        userFilter,
        {
          lastLogin: new Date(),
          isVerified: true,
          deviceInfo: req.headers["user-agent"] || "unknown",
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Generate JWT token with user ID and specific login method
      const tokenPayload = {
        userId: user._id.toString(), // Include user ID for precise identification
        loginMethod: phone ? "phone" : "email",
        phone: phone || undefined,
        email: email || undefined,
        iat: Math.floor(Date.now() / 1000), // Add issued at time
        userAgent: req.headers["user-agent"] || "unknown",
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "7d",
      });

      // Clean up OTP
      await OTP.deleteOne({ _id: otpRecord._id });
      console.log("OTP verification successful for user:", user._id);

      res.json({
        success: true,
        token,
        message: "Authentication successful",
        user: {
          id: user._id,
          phone: user.phone,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({
        success: false,
        message: "OTP verification failed",
      });
    }
  });

  // Token verification endpoint
  router.get("/verify-token", checkTokenBlacklist, async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.json({ success: false, message: "No token provided" });
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log("Decoded token:", decoded);

      // Use user ID for precise user lookup
      let user;
      if (decoded.userId) {
        // New token format with user ID
        user = await User.findById(decoded.userId);
      } else {
        // Fallback for old tokens - but use more specific query
        if (decoded.phone && !decoded.email) {
          // Only phone present - find user with ONLY phone
          user = await User.findOne({
            phone: decoded.phone,
            email: { $exists: false },
          });
        } else if (decoded.email && !decoded.phone) {
          // Only email present - find user with ONLY email
          user = await User.findOne({
            email: decoded.email,
            phone: { $exists: false },
          });
        } else if (decoded.phone && decoded.email) {
          // Both fields present - find exact match
          user = await User.findOne({
            phone: decoded.phone,
            email: decoded.email,
          });
        } else {
          return res.json({ success: false, message: "Invalid token format" });
        }
      }

      if (!user) {
        console.log("User not found for token:", decoded);
        return res.json({ success: false, message: "User not found" });
      }

      // Check if this token was issued before user's last token update
      if (decoded.iat && user.lastTokenIssued) {
        const tokenIssuedAt = new Date(decoded.iat * 1000);
        if (tokenIssuedAt < user.lastTokenIssued) {
          console.log("Token revoked - issued before last token update");
          return res.json({ success: false, message: "Token revoked" });
        }
      }

      // Optional: Check device consistency (log warning but don't block)
      const currentUserAgent = req.headers["user-agent"];
      if (user.deviceInfo && currentUserAgent !== user.deviceInfo) {
        console.warn(
          `Device mismatch for user ${user._id}: expected ${user.deviceInfo}, got ${currentUserAgent}`
        );
        // You can choose to revoke token here or just log the warning
      }

      console.log("Token verified for user:", user._id);

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error("Token verification error:", error);
      if (error.name === "JsonWebTokenError") {
        res.json({ success: false, message: "Invalid token" });
      } else if (error.name === "TokenExpiredError") {
        res.json({ success: false, message: "Token expired" });
      } else {
        res.json({ success: false, message: "Token verification failed" });
      }
    }
  });

  // Logout endpoint
  router.post("/logout", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        // Add token to blacklist
        TokenBlacklist.add(token);

        // Update user's lastTokenIssued time to invalidate all tokens
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded.userId) {
            await User.findByIdAndUpdate(decoded.userId, {
              lastTokenIssued: new Date(),
            });
            console.log("User session invalidated:", decoded.userId);
          }
        } catch (e) {
          // Token might be invalid, but still proceed with logout
          console.log("Token verification failed during logout:", e.message);
        }
      }

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }
  });

  // Test Resend email configuration
  router.post("/test-email", async (req, res) => {
    try {
      console.log("[Auth] Testing Resend email configuration...");

      // Send test email
      const testEmailData = {
        from: "My Future Life Bali - Auth Test <info@futurelifebali.com>",
        to: ["bassam.agi@gmail.com"], // Send test to admin email
        subject: "Auth Email Configuration Test - Resend API",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7c3aed;">Auth Email Test Successful!</h2>
            <p>Your authentication email configuration with Resend API is working correctly.</p>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Configuration Details:</h3>
              <ul>
                <li><strong>Email Service:</strong> Resend API</li>
                <li><strong>From Email:</strong> info@futurelifebali.com</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p style="color: #059669; font-weight: bold;">✅ Ready to send OTP emails!</p>
          </div>
        `,
      };

      const result = await resend.emails.send(testEmailData);

      console.log("[Auth] Resend test email sent successfully:", result.id);

      res.status(200).json({
        success: true,
        message: "Auth email configuration with Resend is working correctly",
        messageId: result.id,
      });
    } catch (error) {
      console.error("[Auth] Resend email configuration test failed:", error);

      let errorMessage = "Auth email configuration with Resend failed";
      if (error.message?.includes("API key")) {
        errorMessage = "Resend API key is invalid or expired.";
      } else if (error.message?.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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

  // Debug endpoint to check OTP records (remove in production)
  router.get("/debug-otp", async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          message: "Debug endpoint disabled in production",
        });
      }

      const otpRecords = await OTP.find({}).limit(10);
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

  // Cleanup expired data (run periodically)
  const cleanupExpiredData = async () => {
    try {
      // Clean expired OTPs (handled by MongoDB TTL, but this is backup)
      const deleted = await OTP.deleteMany({ expiresAt: { $lt: new Date() } });
      console.log(`Cleaned up ${deleted.deletedCount} expired OTP records`);

      // Clean old blacklisted tokens (keep for 7 days)
      // In production, implement proper token blacklist cleanup with Redis
      if (TokenBlacklist.size > 1000) {
        TokenBlacklist.clear(); // Simple cleanup for memory-based blacklist
        console.log("Token blacklist cleared");
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  };

  // Run cleanup every hour
  const cleanupInterval = setInterval(cleanupExpiredData, 60 * 60 * 1000);

  // Cleanup on router destruction
  router.cleanup = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
  };

  return router;
};
