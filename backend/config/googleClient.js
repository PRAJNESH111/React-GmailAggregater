import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const ensureCallbackPath = (base) => {
  const trimmed = base.replace(/\/$/, "");
  return trimmed.endsWith("/auth/callback")
    ? trimmed
    : `${trimmed}/auth/callback`;
};

const safeHostFromUrl = (value) => {
  try {
    return new URL(value).host;
  } catch (err) {
    return null;
  }
};

const isLocalHost = (host) => {
  if (!host) return false;
  const lower = host.toLowerCase();
  return (
    lower.includes("localhost") ||
    lower.startsWith("127.") ||
    lower.startsWith("0.0.0.0")
  );
};

const buildRequestUri = (req) => {
  if (!req) return null;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const proto =
    (forwardedProto && forwardedProto.split(",")[0].trim()) ||
    req.protocol ||
    "http";
  const host =
    (forwardedHost && forwardedHost.split(",")[0].trim()) ||
    req.get("host") ||
    null;
  if (!host) return null;
  return `${proto}://${host}/auth/callback`;
};

const buildRedirectUri = (req) => {
  const requestUri = buildRequestUri(req);

  const explicitBase = process.env.BACKEND_BASE_URL;
  if (explicitBase) {
    const candidate = ensureCallbackPath(explicitBase);
    const envHost = safeHostFromUrl(candidate);
    const requestHost = safeHostFromUrl(requestUri || "");
    if (
      envHost &&
      requestHost &&
      isLocalHost(envHost) &&
      !isLocalHost(requestHost)
    ) {
      return requestUri;
    }
    return candidate;
  }

  const envRedirect = process.env.REDIRECT_URI;
  if (envRedirect) {
    const envHost = safeHostFromUrl(envRedirect);
    const requestHost = safeHostFromUrl(requestUri || "");
    if (
      envHost &&
      requestHost &&
      isLocalHost(envHost) &&
      !isLocalHost(requestHost)
    ) {
      return requestUri;
    }
    return envRedirect;
  }

  if (requestUri) return requestUri;

  return "http://localhost:5000/auth/callback";
};

export const getRedirectUri = (req) => buildRedirectUri(req);

export const createOAuthClient = (req) =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    buildRedirectUri(req)
  );
