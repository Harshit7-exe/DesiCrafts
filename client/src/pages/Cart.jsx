import { Link } from "react-router-dom";
import { useCart } from "../state/CartContext.jsx";
import { formatCurrency } from "../utils/format.js";

export default function Cart() {
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    clearCart,
    saveForLater,
    savedForLater,
    moveToCart
  } = useCart();

  if (!items.length) {
    return (
      <section className="section empty-state">
        <h1>Your cart is waiting for something handmade.</h1>
        <Link className="button-link" to="/shop">Find a Piece</Link>
      </section>
    );
  }

  return (
    <section className="section cart-layout">
      <div>
        <p className="eyebrow">Cart</p>
        <h1>Your selected pieces</h1>
        <div className="cart-items">
          {items.map(item => (
            <article className="cart-item" key={item._id}>
              <img src={item.image} alt={item.name} />
              <div>
                <h3>{item.name}</h3>
                <p>{formatCurrency(item.price)}</p>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={event => updateQuantity(item._id, Number(event.target.value))}
                  />
                </label>
                <button className="secondary-button compact" type="button" onClick={() => saveForLater(item._id)}>
                  Save for Later
                </button>
              </div>
            </article>
          ))}
        </div>
        {savedForLater.length > 0 && (
          <div className="cart-items">
            <h2>Saved for later</h2>
            {savedForLater.map(item => (
              <article className="cart-item" key={item._id}>
                <img src={item.image} alt={item.name} />
                <div>
                  <h3>{item.name}</h3>
                  <p>{formatCurrency(item.price)}</p>
                  <button className="secondary-button compact" type="button" onClick={() => moveToCart(item._id)}>
                    Move to Cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <aside className="summary">
        <h2>Order summary</h2>
        <p><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></p>
        <p><span>Delivery</span><strong>{formatCurrency(deliveryFee)}</strong></p>
        <p className="summary-total"><span>Total</span><strong>{formatCurrency(total)}</strong></p>
        <Link className="button-link" to="/checkout">Checkout</Link>
        <button className="secondary-button" type="button" onClick={clearCart}>
          Clear Cart
        </button>
      </aside>
    </section>
  );
}
