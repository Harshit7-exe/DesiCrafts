import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    storeName: {
      type: String,
      required: true,
      trim: true
    },
    bio: {
      type: String,
      default: ""
    },
    location: {
      city: String,
      state: String,
      address: String
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    commissionRate: {
      type: Number,
      default: 10
    },
    settlementDue: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Seller", sellerSchema);

