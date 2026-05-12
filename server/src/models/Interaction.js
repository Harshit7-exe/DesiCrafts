import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    userKey: {
      type: String,
      required: true,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    mlProductId: {
      type: String,
      required: true,
      index: true
    },
    actionType: {
      type: String,
      enum: ["view", "wishlist", "cart", "purchase", "review"],
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model("Interaction", interactionSchema);

