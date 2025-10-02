const mongoose = require("mongoose");

// Update your OTP schema to include phone field
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false, // Make email optional
    },
    phone: {
      type: String,
      required: false, // Make phone optional
    },
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

// Add validation to ensure either email or phone is provided
otpSchema.pre("save", function (next) {
  if (!this.email && !this.phone) {
    return next(new Error("Either email or phone must be provided"));
  }
  next();
});

module.exports = mongoose.model("OTP", otpSchema);
