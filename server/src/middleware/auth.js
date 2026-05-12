import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user || req.user.isBlocked) {
      return res.status(401).json({ message: "Account is not available" });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
}

export function adminOnly(req, res, next) {
  return requireRole("admin")(req, res, next);
}

export function sellerOnly(req, res, next) {
  return requireRole("seller", "admin")(req, res, next);
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: `${roles.join(" or ")} access required` });
    }

    return next();
  };
}
