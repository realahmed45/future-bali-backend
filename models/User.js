const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      sparse: true,
      unique: true, // This already creates an index
      validate: {
        validator: function (v) {
          // If phone is provided, ensure it's unique
          if (!v) return true; // Allow empty/null values

          // Check for existing phone number (excluding current document)
          return this.constructor
            .findOne({
              phone: v,
              _id: { $ne: this._id },
            })
            .then((user) => !user);
        },
        message: "Phone number already exists",
      },
    },
    email: {
      type: String,
      sparse: true,
      unique: true, // This already creates an index
      validate: {
        validator: function (v) {
          // If email is provided, ensure it's unique
          if (!v) return true; // Allow empty/null values

          // Check for existing email (excluding current document)
          return this.constructor
            .findOne({
              email: v,
              _id: { $ne: this._id },
            })
            .then((user) => !user);
        },
        message: "Email already exists",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    // Add session tracking for better security
    lastTokenIssued: {
      type: Date,
      default: Date.now,
    },
    deviceInfo: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// REMOVED: These duplicate index definitions were causing the error
// UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
// UserSchema.index({ email: 1 }, { unique: true, sparse: true });

// Enhanced validation to ensure at least one field is provided
UserSchema.pre("save", function (next) {
  if (!this.phone && !this.email) {
    const error = new Error("User must have either phone or email");
    return next(error);
  }

  // Ensure a user doesn't have both phone and email initially (for cleaner data)
  // This prevents confusion in token verification
  if (this.isNew && this.phone && this.email) {
    const error = new Error(
      "User should be created with either phone OR email, not both"
    );
    return next(error);
  }

  next();
});

// Add method to safely update last token issued time
UserSchema.methods.updateTokenTime = function () {
  this.lastTokenIssued = new Date();
  return this.save();
};

// Add method to check if user session is valid
UserSchema.methods.isSessionValid = function (tokenIssuedAt) {
  // Token should be issued after the user's last token time
  return tokenIssuedAt >= this.lastTokenIssued;
};

// Create the model
const User = mongoose.model("User", UserSchema);
//new deployement
module.exports = User;
