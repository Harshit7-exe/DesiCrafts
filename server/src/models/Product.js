import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    mlProductId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller"
    },
    artisan: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    region: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    images: [String],
    specifications: {
      material: String,
      dimensions: String,
      care: String,
      weight: String
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 90
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5
    },
    featured: {
      type: Boolean,
      default: false
    },
    popularity: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "rejected"],
      default: "active"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
