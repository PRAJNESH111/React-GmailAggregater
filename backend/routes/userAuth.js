import express from "express";
import bcrypt from "bcryptjs";
import AppUser from "../models/AppUser.js";
import {
  issueAuthCookie,
  clearAuthCookie,
  requireAuth,
} from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    const exists = await AppUser.findOne({ email });
    if (exists)
      return res.status(409).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const user = await AppUser.create({
      email,
      name: name || email.split("@")[0],
      passwordHash: hash,
    });
    issueAuthCookie(res, user._id);
    res.json({ id: String(user._id), email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ error: "Failed to sign up", details: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });
    const user = await AppUser.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    issueAuthCookie(res, user._id);
    res.json({ id: String(user._id), email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ error: "Failed to login", details: err.message });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await AppUser.findById(req.user.id, {
    email: 1,
    name: 1,
    connectedAccounts: 1,
  }).lean();
  res.json({
    id: String(user._id),
    email: user.email,
    name: user.name,
    accounts: user.connectedAccounts || [],
  });
});

export default router;
