import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import { useCart } from "../state/CartContext.jsx";

export default function Header() {
  const { count } = useCart();
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <Link className="brand" to="/">
        DesiCrafts
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/shop">Shop</NavLink>
        <NavLink to="/wishlist">Wishlist</NavLink>
        {user?.role === "seller" && <NavLink to="/seller">Seller</NavLink>}
        {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        <NavLink to="/cart">Cart <span>{count}</span></NavLink>
        {user ? <NavLink to="/profile">{user.name}</NavLink> : <NavLink to="/auth">Login</NavLink>}
        {user && <button className="link-button" type="button" onClick={logout}>Logout</button>}
      </nav>
    </header>
  );
}
