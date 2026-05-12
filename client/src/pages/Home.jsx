import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPersonalizedRecommendations, getProducts } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";
import { fallbackProducts } from "../data/fallbackProducts.js";
import { useAuth } from "../state/AuthContext.jsx";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [featured, setFeatured] = useState(() => fallbackProducts.filter(product => product.featured));
  const [personalized, setPersonalized] = useState([]);

  useEffect(() => {
    getProducts({ featured: "true" })
      .then(data => {
        if (data.length) {
          setFeatured(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPersonalized([]);
      return;
    }

    getPersonalizedRecommendations().then(setPersonalized).catch(() => setPersonalized([]));
  }, [isAuthenticated]);

  return (
    <>
      <section className="hero">
        <img
          src="https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1600&q=80"
          alt="Artisan table with handmade goods"
        />
        <div className="hero-content">
          <p className="eyebrow">Local artisan marketplace</p>
          <h1>Handmade pieces with stories worth keeping.</h1>
          <p>
            Shop ceramics, textiles, lighting, baskets, and everyday objects made by
            independent makers across India.
          </p>
          <Link className="button-link" to="/shop">Shop the Collection</Link>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Featured</p>
          <h2>Fresh from the workshop</h2>
        </div>
        <div className="product-grid">
          {featured.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {personalized.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Recommended</p>
            <h2>Picked for you</h2>
          </div>
          <div className="product-grid">
            {personalized.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="values">
        <div>
          <h2>Made close to home</h2>
          <p>Every product lists its artisan, region, and craft style clearly.</p>
        </div>
        <div>
          <h2>Small batches</h2>
          <p>Stock stays limited because real hands are making real things.</p>
        </div>
        <div>
          <h2>Thoughtful delivery</h2>
          <p>Free delivery starts at Rs. 2,500 for easy local gifting.</p>
        </div>
      </section>
    </>
  );
}
