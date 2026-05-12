import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { rateLimit } from "./middleware/rateLimit.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

app.get("/", (req, res) => {
  res.json({ message: "DesiCrafts API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/me", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || "Server error"
  });
});

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
  })
  .catch(error => {
    console.error(error.message);
    process.exit(1);
  });
