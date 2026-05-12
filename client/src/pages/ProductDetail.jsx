import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { addRecentlyViewed, createReview, getProduct, getRelatedProducts, getReviews, logCartInteraction, toggleWishlist } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";
import { fallbackProducts } from "../data/fallbackProducts.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useCart } from "../state/CartContext.jsx";
import { formatCurrency } from "../utils/format.js";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(() => fallbackProducts.find(item => item._id === id));
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    if (id?.startsWith("demo-")) {
      return;
    }

    getProduct(id)
      .then(data => {
        setProduct(data);
        setActiveImage(data.images?.[0] || data.image);
        if (isAuthenticated) {
          addRecentlyViewed(id).catch(() => {});
        }
      })
      .catch(() => {});
    getReviews(id).then(setReviews).catch(() => setReviews([]));
    getRelatedProducts(id).then(setRelated).catch(() => setRelated([]));
  }, [id, isAuthenticated]);

  async function submitReview(event) {
    event.preventDefault();
    const review = await createReview(id, reviewForm);
    setReviews([review, ...reviews]);
    setReviewForm({ rating: 5, comment: "" });
  }

  if (!product) {
    return (
      <section className="section">
        <h1>Product not found</h1>
        <Link className="button-link" to="/shop">Back to shop</Link>
      </section>
    );
  }

  return (
    <section className="product-detail">
      <div className="gallery">
        <img src={activeImage || product.image} alt={product.name} />
        <div>
          {(product.images?.length ? product.images : [product.image]).map(image => (
            <button key={image} type="button" onClick={() => setActiveImage(image)}>
              <img src={image} alt={product.name} />
            </button>
          ))}
        </div>
      </div>
      <div className="detail-copy">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <p className="muted">By {product.artisan}</p>
        <p>{product.description}</p>
        <dl>
          <div>
            <dt>Region</dt>
            <dd>{product.region}</dd>
          </div>
          <div>
            <dt>Available</dt>
            <dd>{product.stock} pieces</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>{product.rating} out of 5 ({product.reviewCount || 0} reviews)</dd>
          </div>
          <div>
            <dt>Seller</dt>
            <dd>{product.seller?.storeName || product.artisan}</dd>
          </div>
        </dl>
        <div className="specs">
          <h2>Specifications</h2>
          <p>Material: {product.specifications?.material || "Handmade material"}</p>
          <p>Dimensions: {product.specifications?.dimensions || "Small batch variation"}</p>
          <p>Care: {product.specifications?.care || "Handle with care"}</p>
        </div>
        <strong className="detail-price">{formatCurrency(Math.round(product.price * (1 - (product.discountPercent || 0) / 100)))}</strong>
        <button
          type="button"
          onClick={() => {
            addToCart({ ...product, price: Math.round(product.price * (1 - (product.discountPercent || 0) / 100)) });
            if (isAuthenticated && !product._id?.startsWith("demo-")) {
              logCartInteraction(product._id).catch(() => {});
            }
          }}
        >
          Add to Cart
        </button>
        {isAuthenticated && !product._id?.startsWith("demo-") && (
          <button className="secondary-button compact" type="button" onClick={() => toggleWishlist(product._id)}>
            Add to Wishlist
          </button>
        )}
      </div>

      <section className="reviews-panel">
        <h2>Ratings and Reviews</h2>
        {isAuthenticated ? (
          <form className="inline-form" onSubmit={submitReview}>
            <select value={reviewForm.rating} onChange={event => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}>
              {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} stars</option>)}
            </select>
            <input value={reviewForm.comment} onChange={event => setReviewForm({ ...reviewForm, comment: event.target.value })} placeholder="Share your review" required />
            <button type="submit">Post Review</button>
          </form>
        ) : (
          <p>Login to post a review.</p>
        )}
        {reviews.map(review => (
          <article className="review" key={review._id}>
            <strong>{review.name}</strong>
            <span>{review.rating} stars</span>
            <p>{review.comment}</p>
          </article>
        ))}
      </section>

      <section className="related-panel">
        <h2>Related products</h2>
        <div className="product-grid">
          {related.map(item => <ProductCard key={item._id} product={item} />)}
        </div>
      </section>
    </section>
  );
}
