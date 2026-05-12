import { useEffect, useState } from "react";
import { approveArtisan, blockUser, getAdminArtisans, getAdminDashboard, getAdminUsers, getMlStatus, retrainMlModels } from "../api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { formatCurrency } from "../utils/format.js";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [mlStatus, setMlStatus] = useState(null);
  const [mlMessage, setMlMessage] = useState("");

  function load() {
    getAdminDashboard().then(setDashboard).catch(() => {});
    getAdminUsers().then(setUsers).catch(() => {});
    getAdminArtisans().then(setArtisans).catch(() => {});
    getMlStatus().then(setMlStatus).catch(() => setMlStatus(null));
  }

  useEffect(() => {
    if (user?.role === "admin") {
      load();
    }
  }, [user]);

  if (user?.role !== "admin") {
    return <section className="section"><h1>Admin access required.</h1></section>;
  }

  return (
    <section className="section dashboard-grid">
      <div className="panel wide">
        <p className="eyebrow">Admin</p>
        <h1>Platform control</h1>
        {dashboard && (
          <div className="metric-grid">
            <p>Sales: {formatCurrency(dashboard.metrics.totalSales)}</p>
            <p>Revenue: {formatCurrency(dashboard.metrics.revenue)}</p>
            <p>Users: {dashboard.metrics.users}</p>
            <p>Products: {dashboard.metrics.products}</p>
          </div>
        )}
        <div className="admin-ml">
          <button
            type="button"
            onClick={() =>
              retrainMlModels().then(result => {
                setMlStatus(result.metrics);
                setMlMessage(result.message);
              })
            }
          >
            Retrain Recommendation Model
          </button>
          {mlStatus && (
            <p className="muted">
              Source: {mlStatus.source} | Interactions: {mlStatus.interactions} | Precision@5: {mlStatus.precision_at_5}
            </p>
          )}
          {mlMessage && <p className="notice">{mlMessage}</p>}
        </div>
      </div>

      <div className="panel">
        <h2>Users</h2>
        {users.map(item => (
          <article className="order-row" key={item._id}>
            <span>{item.name}</span>
            <span>{item.role}</span>
            <button className="secondary-button compact" onClick={() => blockUser(item._id, !item.isBlocked).then(load)}>
              {item.isBlocked ? "Unblock" : "Block"}
            </button>
          </article>
        ))}
      </div>

      <div className="panel">
        <h2>Artisan Approval</h2>
        {artisans.map(item => (
          <article className="order-row" key={item._id}>
            <span>{item.storeName}</span>
            <span>{item.verificationStatus}</span>
            <button className="secondary-button compact" onClick={() => approveArtisan(item._id).then(load)}>Approve</button>
          </article>
        ))}
      </div>

      <div className="panel wide">
        <h2>Analytics</h2>
        {dashboard?.topCategories?.map(item => <p key={item.category}>{item.category}: {item.count} products</p>)}
      </div>
    </section>
  );
}
