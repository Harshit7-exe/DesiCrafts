import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, requestOtp, signup, verifyOtp } from "../api.js";
import { useAuth } from "../state/AuthContext.jsx";

export default function Auth() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [showOtp, setShowOtp] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", otp: "" });
  const [message, setMessage] = useState("");

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const session = mode === "signup" ? await signup(form) : await login(form);
      setSession(session);
      navigate("/");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="section auth-layout">
      <div className="auth-card">
        <form className="checkout-form" onSubmit={submit}>
          <p className="eyebrow">Account</p>
          <h1>{mode === "signup" ? "Create account" : "Welcome back"}</h1>
          <p className="auth-helper">
            {mode === "signup" ? "Save your addresses, orders, wishlist, and handmade finds." : "Continue shopping, tracking, and managing your orders."}
          </p>
          {mode === "signup" && <input name="name" placeholder="Name" value={form.name} onChange={update} required />}
          <input name="email" placeholder="Email" value={form.email} onChange={update} />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={update} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={update} required />
          <button type="submit">{mode === "signup" ? "Create Account" : "Login"}</button>
          <button className="secondary-button" type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
            {mode === "signup" ? "Already have an account" : "Create a new account"}
          </button>
        </form>

        <div className="optional-auth">
          <button className="text-button" type="button" onClick={() => setShowOtp(!showOtp)}>
            {showOtp ? "Hide OTP login" : "Use OTP instead"}
          </button>
          {showOtp && (
            <div className="otp-panel">
              <p className="muted">Enter your phone number, receive the demo OTP, then verify.</p>
              <div className="inline-form">
                <input name="phone" placeholder="Phone for OTP" value={form.phone} onChange={update} />
                <button type="button" onClick={() => requestOtp(form.phone).then(data => setMessage(`Demo OTP: ${data.demoOtp}`))}>Send OTP</button>
                <input name="otp" placeholder="OTP" value={form.otp} onChange={update} />
                <button
                  type="button"
                  onClick={() =>
                    verifyOtp(form.phone, form.otp).then(session => {
                      setSession(session);
                      navigate("/");
                    })
                  }
                >
                  Verify OTP
                </button>
              </div>
            </div>
          )}
        </div>
        {message && <p className="notice">{message}</p>}
      </div>
    </section>
  );
}
