const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    userPhone: {
      type: String,
      required: false,
      trim: true,
    },
    cartId: {
      type: String,
      required: false,
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
          type: String,
          required: true,
        },
        address: {
          type: String,
          required: true,
          trim: true,
        },
        country: {
          type: String,
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
        // Store base64 encoded images directly
        frontImage: {
          type: String, // Base64 string
          required: false,
        },
        backImage: {
          type: String, // Base64 string
          required: false,
        },
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
          type: String,
          required: false,
        },
        // ADDED: Passport image field for inheritance contacts
        passportImage: {
          type: String, // Base64 string
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
        idImage: {
          type: String, // Base64 string
          required: false,
        },
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
      paymentType: String,
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
