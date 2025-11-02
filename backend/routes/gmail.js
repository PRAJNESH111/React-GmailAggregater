import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();
import AppUser from "../models/AppUser.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Heuristic: classify if a message looks recruitment-related
function isRecruiterLike(from = "", subject = "", snippet = "") {
  const text = `${from} ${subject} ${snippet}`.toLowerCase();
  const keywords = [
    "recruiter",
    "talent acquisition",
    "hiring",
    "opportunity",
    "opening",
    "job",
    "career",
    "interview",
  ];
  const domains = [
    "@indeed.com",
    "@linkedin.com",
    "@naukri.com",
    "@monster.com",
    "@glassdoor.com",
    "@ziprecruiter.com",
  ];
  if (keywords.some((k) => text.includes(k))) return true;
  const fromLower = String(from).toLowerCase();
  if (domains.some((d) => fromLower.includes(d))) return true;
  return false;
}

// GET /gmail/emails?userId=<id>
router.get("/emails", requireAuth, async (req, res) => {
  try {
    const userId = req.query.userId;
    const includeReplyCounts =
      String(req.query.includeReplyCounts || "false").toLowerCase() === "true";
    let token = null;
    if (userId) {
      const user = await AppUser.findById(req.user.id, {
        connectedAccounts: 1,
      }).lean();
      const acc = (user?.connectedAccounts || []).find(
        (a) =>
          String(a.googleId) === String(userId) ||
          String(a.email) === String(userId)
      );
      token = acc?.accessToken || null;
    }
    if (!token)
      return res
        .status(400)
        .json({ error: "No account token found for this user" });

    // create a fresh client for this request with app credentials
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    client.setCredentials({ access_token: token });

    const gmail = google.gmail({ version: "v1", auth: client });

    // Fetch up to 100 message ids
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 100,
    });
    const messages = listRes.data.messages || [];

    const emailList = await Promise.all(
      messages.map(async (msg) => {
        const msgData = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });
        const headers = msgData.data.payload.headers || [];
        const from = headers.find((h) => h.name === "From")?.value || "";
        const subject = headers.find((h) => h.name === "Subject")?.value || "";
        const date = headers.find((h) => h.name === "Date")?.value || "";
        const snippet = msgData.data.snippet || "";
        const recruiter = isRecruiterLike(from, subject, snippet);

        let replyCountRecruiter = undefined;
        if (includeReplyCounts && msgData.data.threadId) {
          try {
            const thread = await gmail.users.threads.get({
              userId: "me",
              id: msgData.data.threadId,
            });
            const msgs = thread.data.messages || [];
            replyCountRecruiter = msgs.reduce((acc, m) => {
              const hs = m.payload?.headers || [];
              const f = hs.find((h) => h.name === "From")?.value || "";
              const s = hs.find((h) => h.name === "Subject")?.value || "";
              const sn = m.snippet || "";
              return acc + (isRecruiterLike(f, s, sn) ? 1 : 0);
            }, 0);
          } catch (e) {
            replyCountRecruiter = 0;
          }
        }

        return {
          id: msg.id,
          threadId: msgData.data.threadId,
          from,
          subject,
          date,
          snippet,
          isRecruiter: recruiter,
          replyCountRecruiter,
        };
      })
    );

    res.json(emailList);
  } catch (err) {
    console.error("/gmail/emails error:", err?.message || err);
    // If Google API returned an auth error, surface 401 so frontend can prompt re-auth
    const msg = err?.message || "Unknown error";
    if (
      msg.toLowerCase().includes("invalid") ||
      msg.toLowerCase().includes("expected oauth") ||
      err?.code === 401 ||
      err?.response?.status === 401
    ) {
      return res
        .status(401)
        .json({ error: "Authentication error", details: msg });
    }
    res.status(500).json({ error: "Failed to fetch emails", details: msg });
  }
});

// GET /gmail/auth
router.get("/auth", requireAuth, async (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "profile",
    "email",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: req.query.force === "true" ? "consent" : undefined, // force re-consent when asked
  });

  res.json({ url });
});

// GET /gmail/callback
router.get("/callback", requireAuth, async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  // save tokens server-side (access_token, refresh_token, scope, expiry_date)
  // e.g. await saveTokens(tokens);
  // redirect to frontend without sending token in URL
  res.redirect(process.env.FRONTEND_URL);
});

// GET single message body: /gmail/message?userId=...&id=...
router.get("/message", requireAuth, async (req, res) => {
  try {
    const userId = req.query.userId;
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "message id required" });

    let token = null;
    if (userId) {
      const user = await AppUser.findById(req.user.id, {
        connectedAccounts: 1,
      }).lean();
      const acc = (user?.connectedAccounts || []).find(
        (a) =>
          String(a.googleId) === String(userId) ||
          String(a.email) === String(userId)
      );
      token = acc?.accessToken || null;
    }
    if (!token)
      return res
        .status(400)
        .json({ error: "No account token found for this user" });

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    client.setCredentials({ access_token: token });
    const gmail = google.gmail({ version: "v1", auth: client });

    const msgData = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });
    const headers = msgData.data.payload.headers || [];

    function extractBody(payload) {
      if (!payload) return "";
      if (payload.body && payload.body.data) return payload.body.data;
      if (payload.parts && Array.isArray(payload.parts)) {
        // prefer html then plain
        for (const p of payload.parts) {
          if (p.mimeType === "text/html" && p.body?.data) return p.body.data;
        }
        for (const p of payload.parts) {
          if (p.mimeType === "text/plain" && p.body?.data) return p.body.data;
        }
        // nested
        for (const p of payload.parts) {
          if (p.parts) {
            const nested = extractBody(p);
            if (nested) return nested;
          }
        }
      }
      return "";
    }

    const rawBody = extractBody(msgData.data.payload);
    let body = "";
    if (rawBody) {
      try {
        const b64 = rawBody.replace(/-/g, "+").replace(/_/g, "/");
        body = Buffer.from(b64, "base64").toString("utf8");
      } catch (e) {
        body = rawBody;
      }
    }

    const result = {
      id,
      from: headers.find((h) => h.name === "From")?.value || "",
      subject: headers.find((h) => h.name === "Subject")?.value || "",
      date: headers.find((h) => h.name === "Date")?.value || "",
      snippet: msgData.data.snippet || "",
      body,
    };

    res.json(result);
  } catch (err) {
    console.error("/gmail/message error:", err?.message || err);
    const msg = err?.message || "Unknown error";
    if (
      msg.toLowerCase().includes("not found") ||
      err?.code === 404 ||
      err?.response?.status === 404
    ) {
      return res.status(404).json({ error: "Message not found", details: msg });
    }
    if (
      msg.toLowerCase().includes("invalid") ||
      msg.toLowerCase().includes("expected oauth") ||
      err?.code === 401 ||
      err?.response?.status === 401
    ) {
      return res
        .status(401)
        .json({ error: "Authentication error", details: msg });
    }
    res.status(500).json({ error: "Failed to fetch message", details: msg });
  }
});

export default router;
