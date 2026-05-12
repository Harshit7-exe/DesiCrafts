const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("artisan-token");
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message);
  }

  return response.json();
}

export function getProducts(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined)
  ).toString();

  return request(`/products${query ? `?${query}` : ""}`);
}

export function getAutocomplete(search) {
  return request(`/products/autocomplete?search=${encodeURIComponent(search)}`);
}

export function getProduct(id) {
  return request(`/products/${id}`);
}

export function getRelatedProducts(id) {
  return request(`/products/${id}/related`);
}

export function getPersonalizedRecommendations() {
  return request("/recommendations/me");
}

export function getReviews(id) {
  return request(`/products/${id}/reviews`);
}

export function createReview(id, review) {
  return request(`/products/${id}/reviews`, {
    method: "POST",
    body: JSON.stringify(review)
  });
}

export function createOrder(order) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(order)
  });
}

export function login(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export function signup(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function requestOtp(phone) {
  return request("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone })
  });
}

export function verifyOtp(phone, otp) {
  return request("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone, otp })
  });
}

export function getMe() {
  return request("/auth/me");
}

export function updateProfile(payload) {
  return request("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getAddresses() {
  return request("/me/addresses");
}

export function addAddress(payload) {
  return request("/me/addresses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getSavedPayments() {
  return request("/me/payments");
}

export function addSavedPayment(payload) {
  return request("/me/payments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getWishlist() {
  return request("/me/wishlist");
}

export function toggleWishlist(productId) {
  return request(`/me/wishlist/${productId}`, { method: "POST" });
}

export function addRecentlyViewed(productId) {
  return request(`/me/recently-viewed/${productId}`, { method: "POST" });
}

export function logCartInteraction(productId) {
  return request(`/me/interactions/cart/${productId}`, { method: "POST" });
}

export function getOrders() {
  return request("/orders/mine");
}

export function updateOrderStatus(orderId, payload) {
  return request(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function requestReturn(orderId, reason) {
  return request(`/orders/${orderId}/return`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

export function createPaymentIntent(payload) {
  return request("/payments/intent", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function onboardSeller(payload) {
  return request("/seller/onboard", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getSellerDashboard() {
  return request("/seller/dashboard");
}

export function getSellerProducts() {
  return request("/seller/products");
}

export function createSellerProduct(payload) {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getAdminDashboard() {
  return request("/admin/dashboard");
}

export function getMlStatus() {
  return request("/admin/ml/status");
}

export function retrainMlModels() {
  return request("/admin/ml/retrain", { method: "POST" });
}

export function getAdminUsers() {
  return request("/admin/users");
}

export function getAdminArtisans() {
  return request("/admin/artisans");
}

export function approveArtisan(id, status = "approved") {
  return request(`/admin/artisans/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function blockUser(id, isBlocked) {
  return request(`/admin/users/${id}/block`, {
    method: "PATCH",
    body: JSON.stringify({ isBlocked })
  });
}
