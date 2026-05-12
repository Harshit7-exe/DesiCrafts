import { useEffect, useState } from "react";
import { createSellerProduct, getSellerDashboard, getSellerProducts, onboardSeller, updateOrderStatus } from "../api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { formatCurrency } from "../utils/format.js";

const emptyProduct = {
  name: "",
  category: "Home Decor",
  region: "",
  description: "",
  image: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80",
  price: 999,
  stock: 10
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(emptyProduct);
  const [onboarding, setOnboarding] = useState({ storeName: "", bio: "", city: "", state: "" });
  const [message, setMessage] = useState("");

  function load() {
    getSellerDashboard().then(setDashboard).catch(() => {});
    getSellerProducts().then(setProducts).catch(() => {});
  }

  useEffect(() => {
    if (user?.role === "seller" || user?.role === "admin") {
      load();
    }
  }, [user]);

  if (!user) {
    return <section className="section"><h1>Login to open seller tools.</h1></section>;
  }

  return (
    <section className="section dashboard-grid">
      <div className="panel">
        <p className="eyebrow">Seller</p>
        <h1>Artisan dashboard</h1>
        {dashboard ? (
          <>
            <p>Sales: {formatCurrency(dashboard.metrics.totalSales)}</p>
            <p>Earnings: {formatCurrency(dashboard.metrics.earnings)}</p>
            <p>Orders: {dashboard.metrics.orders}</p>
          </>
        ) : (
          <p>Register your artisan store for approval.</p>
        )}
      </div>

      <form className="panel" onSubmit={event => {
        event.preventDefault();
        onboardSeller({
          storeName: onboarding.storeName,
          bio: onboarding.bio,
          location: { city: onboarding.city, state: onboarding.state }
        }).then(() => setMessage("Seller profile submitted for admin approval."));
      }}>
        <h2>Seller Onboarding</h2>
        <input placeholder="Store name" value={onboarding.storeName} onChange={event => setOnboarding({ ...onboarding, storeName: event.target.value })} />
        <input placeholder="Bio" value={onboarding.bio} onChange={event => setOnboarding({ ...onboarding, bio: event.target.value })} />
        <input placeholder="City" value={onboarding.city} onChange={event => setOnboarding({ ...onboarding, city: event.target.value })} />
        <input placeholder="State" value={onboarding.state} onChange={event => setOnboarding({ ...onboarding, state: event.target.value })} />
        <button>Submit Store</button>
        {message && <p className="notice">{message}</p>}
      </form>

      <form className="panel wide" onSubmit={event => {
        event.preventDefault();
        createSellerProduct(product).then(next => {
          setProducts([next, ...products]);
          setProduct(emptyProduct);
        });
      }}>
        <h2>Product Management</h2>
        <div className="form-row">
          <input placeholder="Product name" value={product.name} onChange={event => setProduct({ ...product, name: event.target.value })} />
          <input placeholder="Category" value={product.category} onChange={event => setProduct({ ...product, category: event.target.value })} />
        </div>
        <input placeholder="Region" value={product.region} onChange={event => setProduct({ ...product, region: event.target.value })} />
        <input placeholder="Image URL" value={product.image} onChange={event => setProduct({ ...product, image: event.target.value })} />
        <textarea placeholder="Description" value={product.description} onChange={event => setProduct({ ...product, description: event.target.value })} />
        <div className="form-row">
          <input type="number" value={product.price} onChange={event => setProduct({ ...product, price: Number(event.target.value) })} />
          <input type="number" value={product.stock} onChange={event => setProduct({ ...product, stock: Number(event.target.value) })} />
        </div>
        <button>Add Product</button>
      </form>

      <div className="panel wide">
        <h2>Inventory and Fulfillment</h2>
        {products.map(item => <p key={item._id}>{item.name}: {item.stock} in stock, {item.status}</p>)}
        {dashboard?.recentOrders?.map(order => (
          <article className="order-row" key={order._id}>
            <strong>{order._id}</strong>
            <span>{order.status}</span>
            <button className="secondary-button compact" onClick={() => updateOrderStatus(order._id, { status: "packed", note: "Packed by artisan" }).then(load)}>Mark Packed</button>
            <button className="secondary-button compact" onClick={() => updateOrderStatus(order._id, { status: "shipped", note: "Handed to courier" }).then(load)}>Ship</button>
          </article>
        ))}
      </div>
    </section>
  );
}

