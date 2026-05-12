import { Link } from "react-router-dom";
import { logCartInteraction, toggleWishlist } from "../api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useCart } from "../state/CartContext.jsx";
import { formatCurrency } from "../utils/format.js";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const salePrice = Math.round(product.price * (1 - (product.discountPercent || 0) / 100));

  return (
    <article className="product-card">
      <Link to={`/product/${product._id}`} className="product-image-link">
        <img src={product.image} alt={product.name} />
      </Link>
      <div className="product-card-body">
        <p className="eyebrow">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="muted">{product.artisan}</p>
        <div className="product-meta">
          <strong>{formatCurrency(salePrice)}</strong>
          <span>{product.rating} star</span>
        </div>
        {product.discountPercent > 0 && <p className="discount">{product.discountPercent}% off</p>}
        <button
          type="button"
          onClick={() => {
            addToCart({ ...product, price: salePrice });
            if (isAuthenticated && !product._id?.startsWith("demo-")) {
              logCartInteraction(product._id).catch(() => {});
            }
          }}
        >
          Add to Cart
        </button>
        {isAuthenticated && (
          <button className="secondary-button" type="button" onClick={() => toggleWishlist(product._id)}>
            Wishlist
          </button>
        )}
      </div>
    </article>
  );
}
