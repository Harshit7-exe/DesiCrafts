import express from "express";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import Seller from "../models/Seller.js";
import { adminOnly, protect, sellerOnly } from "../middleware/auth.js";
import { getRelatedMlRecommendations } from "../services/recommendationService.js";
import { logInteraction } from "../utils/interactionLogger.js";

const router = express.Router();

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

router.get("/", async (req, res, next) => {
  try {
    const { category, search, featured, minPrice, maxPrice, rating, location, sort } = req.query;
    const filter = { status: "active" };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (featured === "true") {
      filter.featured = true;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    if (location) {
      filter.region = { $regex: location, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { artisan: { $regex: search, $options: "i" } },
        { region: { $regex: search, $options: "i" } }
      ];
    }

    const sortMap = {
      "price-low-high": { price: 1 },
      "price-high-low": { price: -1 },
      popularity: { popularity: -1, rating: -1 },
      newest: { createdAt: -1 }
    };
    const products = await Product.find(filter)
      .populate("seller", "storeName location verificationStatus")
      .sort(sortMap[sort] || { featured: -1, createdAt: -1 });

    return res.json(products);
  } catch (error) {
    return next(error);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await Product.distinct("category");
    return res.json(["All", ...categories.sort()]);
  } catch (error) {
    return next(error);
  }
});

router.get("/autocomplete", async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const products = await Product.find({
      status: "active",
      name: { $regex: search, $options: "i" }
    })
      .limit(6)
      .select("name category region");

    return res.json(products);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { popularity: 1 } },
      { new: true }
    ).populate("seller", "storeName bio location verificationStatus");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/reviews", async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/reviews", protect, async (req, res, next) => {
  try {
    const review = await Review.create({
      product: req.params.id,
      user: req.user._id,
      name: req.user.name,
      rating: req.body.rating,
      comment: req.body.comment
    });

    const reviews = await Review.find({ product: req.params.id });
    const rating = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(req.params.id, {
      rating: Number(rating.toFixed(1)),
      reviewCount: reviews.length
    });
    await logInteraction({
      userId: req.user._id,
      productId: req.params.id,
      actionType: "review",
      metadata: { rating: req.body.rating }
    });

    return res.status(201).json(review);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/related", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.mlProductId) {
      try {
        const recommendations = await getRelatedMlRecommendations(product.mlProductId, 4);
        const idsInOrder = recommendations.map(item => item.product_id);
        const products = await Product.find({
          _id: { $ne: req.params.id },
          mlProductId: { $in: idsInOrder },
          status: "active"
        }).limit(4);
        const productMap = new Map(products.map(item => [item.mlProductId, item]));
        const orderedProducts = idsInOrder.map(id => productMap.get(id)).filter(Boolean);

        if (orderedProducts.length) {
          return res.json(orderedProducts);
        }
      } catch (error) {
        console.warn("ML related-products fallback triggered:", error.message);
      }
    }

    const related = await Product.find({
      _id: { $ne: req.params.id },
      status: "active",
      $or: [{ category: product.category }, { region: product.region }]
    }).limit(4);

    return res.json(related);
  } catch (error) {
    return next(error);
  }
});

router.post("/", protect, sellerOnly, async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const product = await Product.create({
      ...req.body,
      seller: seller?._id,
      artisan: req.body.artisan || seller?.storeName || req.user.name,
      slug: `${slugify(req.body.name)}-${Date.now()}`
    });
    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", protect, sellerOnly, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    return res.json({ message: "Product deleted" });
  } catch (error) {
    return next(error);
  }
});

export default router;
