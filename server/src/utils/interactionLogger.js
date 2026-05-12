import Interaction from "../models/Interaction.js";
import Product from "../models/Product.js";

const actionWeights = {
  view: 1,
  wishlist: 2,
  cart: 2,
  purchase: 3,
  review: 3
};

export async function logInteraction({ userId, productId, actionType, metadata = {} }) {
  const product = await Product.findById(productId).select("mlProductId");

  if (!product?.mlProductId) {
    return null;
  }

  return Interaction.create({
    user: userId || undefined,
    userKey: userId ? `U-${userId}` : `anon-${productId}`,
    product: productId,
    mlProductId: product.mlProductId,
    actionType,
    rating: actionWeights[actionType] || 1,
    metadata
  });
}

