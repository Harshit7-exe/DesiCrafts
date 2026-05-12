import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { requireFields } from "../middleware/validate.js";
import { createToken } from "../utils/token.js";

const router = express.Router();
const otpStore = new Map();

function sendSession(res, user) {
  return res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      walletBalance: user.walletBalance
    },
    token: createToken(user._id)
  });
}

router.post("/register", requireFields("name", "password"), async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    const existingUser = await User.findOne({
      $or: [email ? { email } : null, phone ? { phone } : null].filter(Boolean)
    });

    if (existingUser) {
      return res.status(409).json({ message: "Account is already registered" });
    }

    const user = await User.create({ name, email, phone, password });
    return sendSession(res.status(201), user);
  } catch (error) {
    return next(error);
  }
});

router.post("/login", requireFields("password"), async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    const user = await User.findOne(email ? { email } : { phone });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return sendSession(res, user);
  } catch (error) {
    return next(error);
  }
});

router.post("/otp/request", requireFields("phone"), (req, res) => {
  otpStore.set(req.body.phone, "123456");
  res.json({ message: "Demo OTP sent", demoOtp: "123456" });
});

router.post("/otp/verify", requireFields("phone", "otp"), async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (otpStore.get(phone) !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const user = await User.findOneAndUpdate(
      { phone },
      { $setOnInsert: { name: `Customer ${phone.slice(-4)}`, authProvider: "otp" } },
      { new: true, upsert: true }
    );

    otpStore.delete(phone);
    return sendSession(res, user);
  } catch (error) {
    return next(error);
  }
});

router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

router.put("/profile", protect, async (req, res, next) => {
  try {
    const allowed = ["name", "email", "phone"];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });

    await req.user.save();
    return res.json(req.user);
  } catch (error) {
    return next(error);
  }
});

export default router;
