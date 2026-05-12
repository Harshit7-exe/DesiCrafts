import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  addAddress,
  addSavedPayment,
  createOrder,
  createPaymentIntent,
  getAddresses,
  getSavedPayments
} from "../api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useCart } from "../state/CartContext.jsx";
import { formatCurrency } from "../utils/format.js";

const initialForm = {
  customerName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: ""
};

export default function Checkout() {
  const cart = useCart();
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState("");
  const hasDemoItems = cart.items.some(item => item._id?.startsWith("demo-"));

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    getAddresses().then(setAddresses).catch(() => setAddresses([]));
    getSavedPayments().then(setPayments).catch(() => setPayments([]));
  }, [isAuthenticated]);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submitOrder(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      setMessage("Login before checkout so your order history, address book, and payment choice are saved.");
      return;
    }

    if (hasDemoItems) {
      setMessage("Your cart has demo products. Clear the cart, open Shop after the API loads live MongoDB products, then add those products again.");
      return;
    }

    setMessage("Placing your order...");

    try {
      if (paymentMethod !== "Cash on Delivery") {
        await createPaymentIntent({ amount: cart.total, paymentMethod });
      }

      const order = await createOrder({
        customerName: form.customerName,
        email: form.email,
        phone: form.phone,
        shippingAddress: {
          street: form.street,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode
        },
        couponCode,
        paymentMethod,
        items: cart.items.map(item => ({
          product: item._id,
          quantity: item.quantity
        }))
      });

      cart.clearCart();
      setForm(initialForm);
      setMessage(`Order ${order._id} received. The artisan team will contact you soon.`);
    } catch (error) {
      setMessage(`${error.message}. Check that the API is running, MongoDB is connected, and products are seeded.`);
    }
  }

  if (!cart.items.length && !message) {
    return (
      <section className="section empty-state">
        <h1>Your cart is empty.</h1>
        <Link className="button-link" to="/shop">Back to shop</Link>
      </section>
    );
  }

  return (
    <section className="section checkout-layout">
      <form className="checkout-form" onSubmit={submitOrder}>
        <p className="eyebrow">Checkout</p>
        <h1>Delivery details</h1>
        {!isAuthenticated && <p className="notice">Login is required for live checkout.</p>}
        {addresses.length > 0 && (
          <select
            onChange={event => {
              const address = addresses.find(item => item._id === event.target.value);
              if (address) {
                setForm({
                  customerName: address.fullName,
                  email: user?.email || "",
                  phone: address.phone,
                  street: address.street,
                  city: address.city,
                  state: address.state,
                  postalCode: address.postalCode
                });
              }
            }}
          >
            <option value="">Select saved address</option>
            {addresses.map(address => (
              <option key={address._id} value={address._id}>{address.label} - {address.city}</option>
            ))}
          </select>
        )}
        <input required name="customerName" placeholder="Full name" value={form.customerName} onChange={updateField} />
        <input required type="email" name="email" placeholder="Email" value={form.email} onChange={updateField} />
        <input required name="phone" placeholder="Phone" value={form.phone} onChange={updateField} />
        <input required name="street" placeholder="Street address" value={form.street} onChange={updateField} />
        <div className="form-row">
          <input required name="city" placeholder="City" value={form.city} onChange={updateField} />
          <input required name="state" placeholder="State" value={form.state} onChange={updateField} />
        </div>
        <input required name="postalCode" placeholder="Postal code" value={form.postalCode} onChange={updateField} />
        <div className="form-row">
          <input placeholder="Coupon code: ARTISAN10" value={couponCode} onChange={event => setCouponCode(event.target.value)} />
          <select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}>
            <option>Cash on Delivery</option>
            <option>UPI</option>
            <option>Card</option>
            <option>Net Banking</option>
            <option>Wallet</option>
          </select>
        </div>
        {payments.length > 0 && <p className="muted">Saved payment: {payments[0].label} ({payments[0].maskedValue})</p>}
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            addAddress({
              label: "Checkout",
              fullName: form.customerName,
              phone: form.phone,
              street: form.street,
              city: form.city,
              state: form.state,
              postalCode: form.postalCode
            }).then(setAddresses);
            addSavedPayment({
              type: paymentMethod,
              label: paymentMethod,
              maskedValue: paymentMethod === "UPI" ? "saved@upi" : "Saved method"
            }).then(setPayments);
          }}
          disabled={!isAuthenticated}
        >
          Save Address and Payment
        </button>
        <button type="submit" disabled={!cart.items.length || hasDemoItems}>Place Order</button>
        {hasDemoItems && (
          <button className="secondary-button" type="button" onClick={cart.clearCart}>
            Clear Demo Cart
          </button>
        )}
        {message && <p className="notice">{message}</p>}
      </form>

      <aside className="summary">
        <h2>Order summary</h2>
        <p><span>Subtotal</span><strong>{formatCurrency(cart.subtotal)}</strong></p>
        <p><span>Delivery</span><strong>{formatCurrency(cart.deliveryFee)}</strong></p>
        <p><span>Coupon</span><strong>{couponCode ? "Applied at API" : "None"}</strong></p>
        <p><span>Payment</span><strong>{paymentMethod}</strong></p>
        <p className="summary-total"><span>Total</span><strong>{formatCurrency(cart.total)}</strong></p>
      </aside>
    </section>
  );
}
