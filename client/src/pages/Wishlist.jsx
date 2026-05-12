import { useEffect, useState } from "react";
import { getWishlist } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Wishlist() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getWishlist().then(setProducts).catch(() => setProducts([]));
  }, []);

  return (
    <section className="section">
      <p className="eyebrow">Wishlist</p>
      <h1>Saved products</h1>
      <div className="product-grid">
        {products.map(product => <ProductCard key={product._id} product={product} />)}
      </div>
      {products.length === 0 && <p>Login and save products to see them here.</p>}
    </section>
  );
}

