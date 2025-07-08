const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    cartId: {
      type: String, // Changed to String to accept mock cart IDs
      required: false, // Made optional
    },
    // Multiple users can be on one order
    userInfo: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        phone: {
          type: String,
          required: true,
          trim: true,
        },
        dob: {
          type: String, // Changed to String to handle date inputs better
          required: true,
        },
        address: {
          type: String,
          required: true,
          trim: true,
        },
        country: {
          type: String, // Simplified - just store country name
          required: true,
        },
        email: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
          match: [/.+\@.+\..+/, "Please fill a valid email address"],
        },
        passportId: {
          type: String,
          required: true,
          trim: true,
        },
        frontImage: String,
        backImage: String,
      },
    ],
    inheritanceContacts: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        phoneNumber: {
          type: String,
          required: true,
          trim: true,
        },
        passportId: {
          type: String,
          trim: true,
        },
        percentage: {
          type: String, // Changed to String to handle input better
          required: false,
        },
      },
    ],
    emergencyContacts: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        phoneNumber: {
          type: String,
          required: true,
          trim: true,
        },
        passportId: {
          type: String,
          trim: true,
        },
        idImage: String,
      },
    ],
    basePackage: {
      title: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      duration: {
        type: String,
        required: false,
      },
      details: [
        {
          label: {
            type: String,
            required: true,
          },
          size: {
            type: String,
            required: true,
          },
        },
      ],
    },
    selectedAddOns: [
      {
        room: {
          type: String,
          required: true,
        },
        size: {
          type: String,
          required: false,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    billingDetails: {
      firstName: String,
      lastName: String,
      phone: String,
      email: String,
      country: String,
      address: String,
      notes: String,
      saveDetails: Boolean,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "processing", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentDetails: {
      method: String,
      transactionId: String,
      paymentDate: Date,
      amount: Number,
      paymentType: String, // "full" or "partial"
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add virtual for formatted order date
orderSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

module.exports = mongoose.model("Order", orderSchema);
