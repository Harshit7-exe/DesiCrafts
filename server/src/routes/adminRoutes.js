import express from "express";
import Category from "../models/Category.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Seller from "../models/Seller.js";
import User from "../models/User.js";
import { adminOnly, protect } from "../middleware/auth.js";
import { readMlMetrics, retrainMlModels } from "../services/mlTrainingService.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard", async (req, res, next) => {
  try {
    const [users, sellers, orders, products, categories] = await Promise.all([
      User.countDocuments(),
      Seller.countDocuments(),
      Order.find(),
      Product.find(),
      Product.distinct("category")
    ]);
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const revenue = Math.round(totalSales * 0.1);

    res.json({
      metrics: {
        users,
        sellers,
        orders: orders.length,
        products: products.length,
        totalSales,
        revenue
      },
      topCategories: categories.map(category => ({
        category,
        count: products.filter(product => product.category === category).length
      })),
      recentOrders: orders.slice(-8).reverse()
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    res.json(await User.find().select("-password").sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id/block", async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: req.body.isBlocked }, { new: true }).select("-password");
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.get("/artisans", async (req, res, next) => {
  try {
    res.json(await Seller.find().populate("user", "name email phone role").sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.patch("/artisans/:id/approve", async (req, res, next) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: req.body.status || "approved" },
      { new: true }
    );
    res.json(seller);
  } catch (error) {
    next(error);
  }
});

router.patch("/products/:id/status", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    res.json(await Category.find().sort({ name: 1 }));
  } catch (error) {
    next(error);
  }
});

router.post("/categories", async (req, res, next) => {
  try {
    res.status(201).json(await Category.create(req.body));
  } catch (error) {
    next(error);
  }
});

router.get("/settlements", async (req, res, next) => {
  try {
    const sellers = await Seller.find().populate("user", "name email");
    res.json(
      sellers.map(seller => ({
        seller,
        commissionRate: seller.commissionRate,
        settlementDue: seller.settlementDue
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post("/refunds/:orderId/approve", async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { paymentStatus: "refunded", refundAmount: req.body.amount, status: "returned" },
      { new: true }
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.get("/ml/status", async (req, res, next) => {
  try {
    res.json(await readMlMetrics());
  } catch (error) {
    next(error);
  }
});

router.post("/ml/retrain", async (req, res, next) => {
  try {
    const output = await retrainMlModels();
    const metrics = await readMlMetrics();
    res.json({ message: "ML retraining completed", output, metrics });
  } catch (error) {
    next(error);
  }
});

export default router;
