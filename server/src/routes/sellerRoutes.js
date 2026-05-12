import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Seller from "../models/Seller.js";
import { protect, sellerOnly } from "../middleware/auth.js";
import { requireFields } from "../middleware/validate.js";

const router = express.Router();

router.post("/onboard", protect, requireFields("storeName"), async (req, res, next) => {
  try {
    req.user.role = "seller";
    await req.user.save();

    const seller = await Seller.findOneAndUpdate(
      { user: req.user._id },
      {
        storeName: req.body.storeName,
        bio: req.body.bio,
        location: req.body.location,
        verificationStatus: "pending"
      },
      { new: true, upsert: true }
    );

    return res.status(201).json(seller);
  } catch (error) {
    return next(error);
  }
});

router.get("/me", protect, sellerOnly, async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    return res.json(seller);
  } catch (error) {
    return next(error);
  }
});

router.get("/dashboard", protect, sellerOnly, async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const products = await Product.find({ seller: seller?._id });
    const productIds = products.map(product => product._id);
    const orders = await Order.find({ "items.product": { $in: productIds } }).sort({ createdAt: -1 });
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const topProducts = products.sort((a, b) => b.popularity - a.popularity).slice(0, 5);

    return res.json({
      seller,
      metrics: {
        products: products.length,
        orders: orders.length,
        totalSales,
        earnings: Math.round(totalSales * 0.9)
      },
      topProducts,
      recentOrders: orders.slice(0, 8)
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/products", protect, sellerOnly, async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const products = await Product.find({ seller: seller?._id }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return next(error);
  }
});

router.get("/orders", protect, sellerOnly, async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const products = await Product.find({ seller: seller?._id }).select("_id");
    const orders = await Order.find({ "items.product": { $in: products.map(product => product._id) } });
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
});

router.get("/orders/:id/invoice", protect, sellerOnly, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    return res.json({
      invoiceNo: `INV-${order._id.toString().slice(-6).toUpperCase()}`,
      issuedAt: new Date(),
      order
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

