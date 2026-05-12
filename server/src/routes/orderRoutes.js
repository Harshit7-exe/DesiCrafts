import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { adminOnly, protect, requireRole } from "../middleware/auth.js";
import { logInteraction } from "../utils/interactionLogger.js";

const router = express.Router();
const coupons = {
  ARTISAN10: 10,
  LOCAL15: 15
};

router.post("/", protect, async (req, res, next) => {
  try {
    const { customerName, email, phone, shippingAddress, items, couponCode, paymentMethod } = req.body;

    if (!items?.length) {
      return res.status(400).json({ message: "Order must include at least one item" });
    }

    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    const orderItems = items.map(item => {
      const product = products.find(entry => entry._id.toString() === item.product);

      if (!product) {
        throw new Error("One or more products are unavailable");
      }

      return {
        product: product._id,
        name: product.name,
        image: product.image,
        price: Math.round(product.price * (1 - (product.discountPercent || 0) / 100)),
        quantity: item.quantity
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountPercent = coupons[couponCode?.toUpperCase()] || 0;
    const discount = Math.round((subtotal * discountPercent) / 100);
    const deliveryFee = subtotal - discount > 2500 ? 0 : 80;
    const total = subtotal - discount + deliveryFee;

    const order = await Order.create({
      user: req.user._id,
      customerName,
      email,
      phone,
      shippingAddress,
      items: orderItems,
      couponCode: couponCode?.toUpperCase(),
      discount,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "Cash on Delivery" ? "pending" : "paid",
      paymentReference: paymentMethod === "Cash on Delivery" ? undefined : `PAY-${Date.now()}`,
      trackingEvents: [{ status: "received", note: "Order placed", location: shippingAddress?.city }]
    });

    await Promise.all(
      orderItems.map(item =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, popularity: item.quantity }
        })
      )
    );
    await Promise.all(
      orderItems.map(item =>
        logInteraction({
          userId: req.user._id,
          productId: item.product,
          actionType: "purchase",
          metadata: { orderId: order._id.toString(), quantity: item.quantity }
        })
      )
    );

    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
});

router.get("/", protect, adminOnly, async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
});

router.get("/mine", protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/status", protect, requireRole("seller", "admin"), async (req, res, next) => {
  try {
    const allowed = ["accepted", "rejected", "packed", "shipped", "delivered", "cancelled", "return_requested", "returned", "replaced"];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        $push: {
          trackingEvents: {
            status: req.body.status,
            note: req.body.note || `Order ${req.body.status}`,
            location: req.body.location
          }
        }
      },
      { new: true }
    );

    return res.json(order);
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/return", protect, async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        status: "return_requested",
        returnReason: req.body.reason,
        $push: { trackingEvents: { status: "return_requested", note: req.body.reason } }
      },
      { new: true }
    );

    return res.json(order);
  } catch (error) {
    return next(error);
  }
});

export default router;
