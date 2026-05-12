import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    password: {
      type: String,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer"
    },
    authProvider: {
      type: String,
      enum: ["local", "otp"],
      default: "local"
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    addresses: [
      {
        label: String,
        fullName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
        isDefault: {
          type: Boolean,
          default: false
        }
      }
    ],
    savedPaymentMethods: [
      {
        type: {
          type: String,
          enum: ["UPI", "Card", "Net Banking", "Wallet", "Cash on Delivery"],
          default: "UPI"
        },
        label: String,
        maskedValue: String,
        isDefault: {
          type: Boolean,
          default: false
        }
      }
    ],
    walletBalance: {
      type: Number,
      default: 0
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ],
    recentlyViewed: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        viewedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.password || !this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
