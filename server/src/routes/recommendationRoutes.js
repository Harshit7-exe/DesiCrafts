import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { getHistoryMlRecommendations } from "../services/recommendationService.js";

const router = express.Router();

async function popularFallback(excludeIds = [], limit = 6) {
  return Product.find({
    status: "active",
    _id: { $nin: excludeIds }
  })
    .sort({ popularity: -1, rating: -1, featured: -1 })
    .limit(limit)
    .populate("seller", "storeName location verificationStatus");
}

router.get("/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist").populate("recentlyViewed.product");
    const orders = await Order.find({ user: req.user._id }).select("items.product createdAt");

    const orderedProductIds = orders.flatMap(order => order.items.map(item => item.product.toString()));
    const sourceIds = [
      ...user.recentlyViewed.map(item => item.product?._id?.toString()).filter(Boolean),
      ...user.wishlist.map(item => item._id.toString()),
      ...orderedProductIds
    ];

    if (!sourceIds.length) {
      const fallback = await popularFallback([], 6);
      return res.json(fallback);
    }

    const historyProducts = await Product.find({ _id: { $in: [...new Set(sourceIds)] } }).select("mlProductId");
    const mlProductIds = historyProducts.map(product => product.mlProductId).filter(Boolean);

    if (!mlProductIds.length) {
      const fallback = await popularFallback(sourceIds, 6);
      return res.json(fallback);
    }

    const recommendations = await getHistoryMlRecommendations(mlProductIds, 6);
    const idsInOrder = recommendations.map(item => item.product_id);
    const products = await Product.find({ mlProductId: { $in: idsInOrder }, status: "active" }).populate(
      "seller",
      "storeName location verificationStatus"
    );
    const productMap = new Map(products.map(product => [product.mlProductId, product]));
    const orderedProducts = idsInOrder.map(id => productMap.get(id)).filter(Boolean);

    if (orderedProducts.length >= 6) {
      return res.json(orderedProducts.slice(0, 6));
    }

    const topUp = await popularFallback(
      [...new Set([...sourceIds, ...orderedProducts.map(product => product._id)])],
      6 - orderedProducts.length
    );

    return res.json([...orderedProducts, ...topUp]);
  } catch (error) {
    return next(error);
  }
});

export default router;
