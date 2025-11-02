import jwt from "jsonwebtoken";
import AppUser from "../models/AppUser.js";

const COOKIE_NAME = "auth_token";

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_change_me"
    );
    const user = await AppUser.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ error: "Invalid session" });
    req.user = { id: String(user._id), email: user.email, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Auth failed", details: err.message });
  }
};

export const issueAuthCookie = (res, userId) => {
  const token = jwt.sign(
    { sub: String(userId) },
    process.env.JWT_SECRET || "dev_secret_change_me",
    {
      expiresIn: "7d",
    }
  );
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 7 * 24 * 3600 * 1000,
    path: "/",
  });
};

export const clearAuthCookie = (res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
  });
};
