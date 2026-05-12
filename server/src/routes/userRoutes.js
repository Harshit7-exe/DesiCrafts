import express from "express";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { logInteraction } from "../utils/interactionLogger.js";

const router = express.Router();

router.use(protect);

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

router.get("/addresses", (req, res) => {
  res.json(req.user.addresses);
});

router.post("/addresses", asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    req.user.addresses.forEach(address => {
      address.isDefault = false;
    });
  }

  req.user.addresses.push(req.body);
  await req.user.save();
  res.status(201).json(req.user.addresses);
}));

router.put("/addresses/:addressId", asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);

  if (!address) {
    return res.status(404).json({ message: "Address not found" });
  }

  Object.assign(address, req.body);
  await req.user.save();
  return res.json(req.user.addresses);
}));

router.delete("/addresses/:addressId", asyncHandler(async (req, res) => {
  req.user.addresses.pull(req.params.addressId);
  await req.user.save();
  res.json(req.user.addresses);
}));

router.get("/payments", (req, res) => {
  res.json(req.user.savedPaymentMethods);
});

router.post("/payments", asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    req.user.savedPaymentMethods.forEach(method => {
      method.isDefault = false;
    });
  }

  req.user.savedPaymentMethods.push(req.body);
  await req.user.save();
  res.status(201).json(req.user.savedPaymentMethods);
}));

router.delete("/payments/:paymentId", asyncHandler(async (req, res) => {
  req.user.savedPaymentMethods.pull(req.params.paymentId);
  await req.user.save();
  res.json(req.user.savedPaymentMethods);
}));

router.get("/wishlist", asyncHandler(async (req, res) => {
  await req.user.populate("wishlist");
  res.json(req.user.wishlist);
}));

router.post("/wishlist/:productId", asyncHandler(async (req, res) => {
  const freshUser = await User.findById(req.user._id);
  const exists = freshUser.wishlist.some(item => item.toString() === req.params.productId);

  if (exists) {
    freshUser.wishlist.pull(req.params.productId);
  } else {
    freshUser.wishlist.push(req.params.productId);
    await logInteraction({
      userId: req.user._id,
      productId: req.params.productId,
      actionType: "wishlist"
    });
  }

  await freshUser.save();
  await freshUser.populate("wishlist");
  res.json(freshUser.wishlist);
}));

router.get("/recently-viewed", asyncHandler(async (req, res) => {
  await req.user.populate("recentlyViewed.product");
  res.json(req.user.recentlyViewed);
}));

router.post("/recently-viewed/:productId", asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const freshUser = await User.findById(req.user._id);
  freshUser.recentlyViewed = freshUser.recentlyViewed.filter(
    item => item.product.toString() !== req.params.productId
  );
  freshUser.recentlyViewed.unshift({ product: req.params.productId, viewedAt: new Date() });
  freshUser.recentlyViewed = freshUser.recentlyViewed.slice(0, 10);
  await freshUser.save();
  await logInteraction({
    userId: req.user._id,
    productId: req.params.productId,
    actionType: "view"
  });
  res.json(freshUser.recentlyViewed);
}));

router.post("/interactions/cart/:productId", asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await logInteraction({
    userId: req.user._id,
    productId: req.params.productId,
      actionType: "cart"
  });
  return res.json({ message: "Cart interaction recorded" });
}));

export default router;
