import express from "express";
import { oauth2Client } from "../config/googleClient.js";
import { saveUser, listUsers } from "../controllers/authController.js";
import { deleteUserById } from "../controllers/authController.js";

const router = express.Router();

router.get("/google", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "profile",
    "email",
  ];
  // allow forcing re-consent (prompt=consent) and pre-filling account via login_hint
  const opts = {
    access_type: "offline",
    scope: scopes,
    include_granted_scopes: true,
  };
  if (req.query.force === "true") opts.prompt = "consent";
  if (req.query.login_hint) opts.login_hint = req.query.login_hint;

  const url = oauth2Client.generateAuthUrl(opts);
  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  // Redirect to frontend with the access token. Frontend will send it to backend to save the user.
  res.redirect(`${process.env.FRONTEND_URL}?token=${tokens.access_token}`);
});

// Save a user record (token, profile fetched on server-side)
router.post("/users", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token required" });
  try {
    const user = await saveUser(token);
    res.json(user);
  } catch (err) {
    console.error(err);
    // Return the message to help debugging in dev (avoid leaking in production)
    res
      .status(500)
      .json({ error: "Failed to save user", details: err.message });
  }
});

// List saved users
router.get("/users", async (req, res) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// Delete a saved user
router.delete("/users/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const ok = await deleteUserById(id);
    if (!ok) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to delete user", details: err.message });
  }
});

export default router;
