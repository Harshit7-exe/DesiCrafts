import { useEffect, useMemo, useState } from "react";
import { getAutocomplete, getProducts } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";
import { fallbackProducts } from "../data/fallbackProducts.js";

export default function Shop() {
  const [products, setProducts] = useState(fallbackProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("newest");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProducts({ search, category, location, minPrice, maxPrice, rating, sort })
      .then(data => {
        setProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, location, minPrice, maxPrice, rating, sort]);

  useEffect(() => {
    if (search.length < 2) {
      setSuggestions([]);
      return;
    }

    getAutocomplete(search).then(setSuggestions).catch(() => setSuggestions([]));
  }, [search]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map(product => product.category))],
    [products]
  );

  const filteredProducts = products;

  return (
    <section className="section shop-page">
      <div className="section-heading">
        <p className="eyebrow">Shop local</p>
        <h1>Browse artisan goods</h1>
      </div>

      <div className="toolbar">
        <div className="autocomplete">
          <input
            type="search"
            placeholder="Search by product, artisan, or region"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map(item => (
                <button key={item._id} type="button" onClick={() => setSearch(item.name)}>
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <select value={category} onChange={event => setCategory(event.target.value)}>
          {categories.map(item => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <input placeholder="Location" value={location} onChange={event => setLocation(event.target.value)} />
        <input type="number" placeholder="Min price" value={minPrice} onChange={event => setMinPrice(event.target.value)} />
        <input type="number" placeholder="Max price" value={maxPrice} onChange={event => setMaxPrice(event.target.value)} />
        <select value={rating} onChange={event => setRating(event.target.value)}>
          <option value="">Any rating</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
        </select>
        <select value={sort} onChange={event => setSort(event.target.value)}>
          <option value="newest">New arrivals</option>
          <option value="price-low-high">Price low-high</option>
          <option value="price-high-low">Price high-low</option>
          <option value="popularity">Popularity</option>
        </select>
      </div>

      <div className="product-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <div className="skeleton-card" key={index} />)
          : filteredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
      </div>
    </section>
  );
}
