import express from "express";
import Order from "../models/Order.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/intent", protect, (req, res) => {
  res.json({
    provider: "demo",
    methods: ["UPI", "Card", "Net Banking", "Wallet", "Cash on Delivery"],
    paymentReference: `PAY-${Date.now()}`,
    message: "Demo payment intent created. Connect Razorpay/Stripe here for production."
  });
});

router.post("/refund/:orderId", protect, async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, user: req.user._id },
      {
        status: "return_requested",
        refundAmount: req.body.amount,
        $push: { trackingEvents: { status: "refund_requested", note: req.body.reason } }
      },
      { new: true }
    );

    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;

