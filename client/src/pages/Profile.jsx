import { useEffect, useState } from "react";
import {
  addAddress,
  addSavedPayment,
  getAddresses,
  getOrders,
  getSavedPayments,
  requestReturn,
  updateProfile
} from "../api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { formatCurrency } from "../utils/format.js";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [address, setAddress] = useState({ label: "Home", fullName: "", phone: "", street: "", city: "", state: "", postalCode: "" });
  const [payment, setPayment] = useState({ type: "UPI", label: "UPI", maskedValue: "name@upi" });

  useEffect(() => {
    if (!user) {
      return;
    }

    getAddresses().then(setAddresses).catch(() => {});
    getSavedPayments().then(setPayments).catch(() => {});
    getOrders().then(setOrders).catch(() => {});
  }, [user]);

  if (!user) {
    return <section className="section"><h1>Login to manage your profile.</h1></section>;
  }

  return (
    <section className="section dashboard-grid">
      <form
        className="panel"
        onSubmit={event => {
          event.preventDefault();
          updateProfile(profile).then(next => {
            setUser(next);
            localStorage.setItem("artisan-user", JSON.stringify(next));
          });
        }}
      >
        <p className="eyebrow">Profile</p>
        <h1>{user.name}</h1>
        <input value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} />
        <input value={profile.email || ""} onChange={event => setProfile({ ...profile, email: event.target.value })} />
        <input value={profile.phone || ""} onChange={event => setProfile({ ...profile, phone: event.target.value })} />
        <button>Save Profile</button>
      </form>

      <div className="panel">
        <h2>Address Book</h2>
        <div className="inline-form">
          {["fullName", "phone", "street", "city", "state", "postalCode"].map(field => (
            <input key={field} placeholder={field} value={address[field]} onChange={event => setAddress({ ...address, [field]: event.target.value })} />
          ))}
          <button type="button" onClick={() => addAddress(address).then(setAddresses)}>Add Address</button>
        </div>
        {addresses.map(item => <p key={item._id}>{item.label}: {item.street}, {item.city}</p>)}
      </div>

      <div className="panel">
        <h2>Saved Payments and Wallet</h2>
        <p>Wallet balance: {formatCurrency(user.walletBalance || 0)}</p>
        <div className="inline-form">
          <select value={payment.type} onChange={event => setPayment({ ...payment, type: event.target.value })}>
            <option>UPI</option>
            <option>Card</option>
            <option>Net Banking</option>
            <option>Wallet</option>
          </select>
          <input value={payment.maskedValue} onChange={event => setPayment({ ...payment, maskedValue: event.target.value })} />
          <button type="button" onClick={() => addSavedPayment(payment).then(setPayments)}>Save Payment</button>
        </div>
        {payments.map(item => <p key={item._id}>{item.type}: {item.maskedValue}</p>)}
      </div>

      <div className="panel wide">
        <h2>Orders and Tracking</h2>
        {orders.map(order => (
          <article className="order-row" key={order._id}>
            <strong>{order._id}</strong>
            <span>{order.status}</span>
            <span>{formatCurrency(order.total)}</span>
            <button
              className="secondary-button compact"
              type="button"
              onClick={() => requestReturn(order._id, "Customer requested return").then(next => setOrders(orders.map(item => (item._id === next._id ? next : item))))}
            >
              Return
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

