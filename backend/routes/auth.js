import express from "express";
import { createOAuthClient, getRedirectUri } from "../config/googleClient.js";
import { google } from "googleapis";
import AppUser from "../models/AppUser.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/google", requireAuth, (req, res) => {
  const oauth2Client = createOAuthClient(req);
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
    redirect_uri: getRedirectUri(req),
  };
  if (req.query.force === "true") opts.prompt = "consent";
  if (req.query.login_hint) opts.login_hint = req.query.login_hint;

  const url = oauth2Client.generateAuthUrl(opts);
  res.redirect(url);
});

router.get("/callback", requireAuth, async (req, res) => {
  const code = req.query.code;
  const oauth2Client = createOAuthClient(req);
  const redirectUri = getRedirectUri(req);
  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: redirectUri,
  });
  oauth2Client.setCredentials(tokens);
  // Fetch Google profile
  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const resp = await oauth2.userinfo.get();
  const profile = resp.data;

  // Upsert into connected accounts for the logged-in app user
  const update = {
    $set: {
      "connectedAccounts.$[acc].email": profile.email,
      "connectedAccounts.$[acc].name": profile.name,
      "connectedAccounts.$[acc].picture": profile.picture,
      "connectedAccounts.$[acc].accessToken": tokens.access_token,
      "connectedAccounts.$[acc].refreshToken": tokens.refresh_token,
      "connectedAccounts.$[acc].scope": tokens.scope,
      "connectedAccounts.$[acc].tokenType": tokens.token_type,
      "connectedAccounts.$[acc].expiryDate": tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : undefined,
    },
  };

  const arrayFilters = [{ "acc.googleId": profile.id }];

  const resUpdate = await AppUser.updateOne(
    { _id: req.user.id, "connectedAccounts.googleId": profile.id },
    update,
    { arrayFilters }
  );

  if (resUpdate.modifiedCount === 0) {
    await AppUser.updateOne(
      { _id: req.user.id },
      {
        $addToSet: {
          connectedAccounts: {
            googleId: profile.id,
            email: profile.email,
            name: profile.name,
            picture: profile.picture,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            scope: tokens.scope,
            tokenType: tokens.token_type,
            expiryDate: tokens.expiry_date
              ? new Date(tokens.expiry_date)
              : undefined,
          },
        },
      }
    );
  }

  // Redirect back to frontend without exposing tokens; frontend should refetch account list
  res.redirect(`${process.env.FRONTEND_URL}`);
});

// Save a user record (token, profile fetched on server-side)
// Deprecated: server now saves accounts on callback
router.post("/users", (req, res) => {
  res
    .status(410)
    .json({ error: "Deprecated. Accounts are saved during OAuth callback." });
});

// List saved users
router.get("/users", requireAuth, async (req, res) => {
  try {
    const user = await AppUser.findById(req.user.id, {
      connectedAccounts: 1,
    }).lean();
    const accounts = (user?.connectedAccounts || []).map((a) => ({
      id: a.googleId,
      name: a.name,
      email: a.email,
      picture: a.picture,
      savedAt: a.updatedAt || user?.updatedAt,
    }));
    res.json(accounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// Delete a saved user
router.delete("/users/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  try {
    const result = await AppUser.updateOne(
      { _id: req.user.id },
      {
        $pull: {
          connectedAccounts: { $or: [{ googleId: id }, { email: id }] },
        },
      }
    );
    if (result.modifiedCount === 0)
      return res.status(404).json({ error: "Account not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to delete account", details: err.message });
  }
});

export default router;
