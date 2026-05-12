import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: String,
    image: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    customerName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String
    },
    items: {
      type: [orderItemSchema],
      validate: value => value.length > 0
    },
    couponCode: String,
    discount: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      required: true
    },
    deliveryFee: {
      type: Number,
      default: 80
    },
    total: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "Net Banking", "Wallet", "Cash on Delivery"],
      default: "Cash on Delivery"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    paymentReference: String,
    status: {
      type: String,
      enum: ["received", "accepted", "rejected", "packed", "shipped", "delivered", "cancelled", "return_requested", "returned", "replaced"],
      default: "received"
    },
    trackingEvents: [
      {
        status: String,
        note: String,
        location: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    returnReason: String,
    refundAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
