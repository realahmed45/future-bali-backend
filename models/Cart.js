const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: false, // Changed to optional
      index: true,
    },
    userPhone: {
      type: String,
      required: false, // Added phone support
      index: true,
    },
    basePackage: {
      title: { type: String, required: true },
      price: { type: Number, required: true },
      duration: { type: String },
      details: [
        {
          label: String,
          size: String,
        },
      ],
    },
    selectedAddOns: [
      {
        room: { type: String, required: true },
        size: { type: String },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "ordered", "abandoned"],
      default: "active",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
cartSchema.index({ user: 1, status: 1 });
cartSchema.index({ userEmail: 1, status: 1 });
cartSchema.index({ userPhone: 1, status: 1 }); // Added phone index

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
