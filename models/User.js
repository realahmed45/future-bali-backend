const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      sparse: true,
      unique: true,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add validation to ensure at least one field is provided
UserSchema.pre("save", function (next) {
  if (!this.phone && !this.email) {
    const error = new Error("User must have either phone or email");
    return next(error);
  }
  next();
});

// Create the model
const User = mongoose.model("User", UserSchema);

module.exports = User;
