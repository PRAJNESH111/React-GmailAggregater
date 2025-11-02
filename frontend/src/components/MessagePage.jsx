import React, { useEffect, useState } from "react";
import axios, { API_BASE_URL } from "../api";

const MessagePage = ({ route, onClose }) => {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthProblem, setIsAuthProblem] = useState(false);

  useEffect(() => {
    // Use any email from history state for instant render, but still fetch full body.
    const stateEmail = globalThis.history.state?.email;
    if (stateEmail) {
      setMessage(stateEmail);
      setError(null);
    }

    const params = new URLSearchParams(
      (route && route.split("?")[1]) || globalThis.location.search
    );
    const userId = params.get("userId");
    const id = params.get("id");
    if (!userId || !id) {
      setError("Missing userId or message id in URL");
      return;
    }

    const fetchMessage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `/gmail/message?userId=${encodeURIComponent(
            userId
          )}&id=${encodeURIComponent(id)}`
        );
        setMessage(res.data);
      } catch (err) {
        const details =
          err?.response?.data?.details ||
          err?.message ||
          "Failed to load message";
        setError(details);
        const status = err?.response?.status;
        const authProblem =
          status === 401 ||
          (typeof details === "string" &&
            (details.toLowerCase().includes("insufficient") ||
              details.toLowerCase().includes("authentication") ||
              details.toLowerCase().includes("invalid")));
        setIsAuthProblem(Boolean(authProblem));
      } finally {
        setLoading(false);
      }
    };

    // Always fetch full message to avoid showing only a snippet
    fetchMessage();
  }, [route]);

  return (
    <div className="card-glass p-3 h-full flex flex-col overflow-hidden">
      <div className="d-flex justify-content-between mb-3 shrink-0">
        <div>
          <button
            className="inline-flex items-center rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 transition"
            onClick={onClose}
          >
            Back
          </button>
        </div>
      </div>

      {loading && <div>Loading message…</div>}
      {error && <div className="text-danger">{error}</div>}

      {isAuthProblem && (
        <div className="mt-2">
          <button
            className="inline-flex items-center rounded-md bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 text-sm transition"
            onClick={() => {
              // Force re-auth flow
              globalThis.location.href = `${API_BASE_URL}/auth/google?force=true`;
            }}
          >
            Re-authenticate
          </button>
        </div>
      )}
      {message && (
        <div className="flex-1 min-h-0 overflow-auto">
          <h5 className="mb-2">{message.subject}</h5>
          <div className="text-muted small mb-3">
            From: {message.from} — {message.date}
          </div>
          <div
            className="message-body"
            style={{ color: "var(--fg)", wordBreak: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: message.body || message.snippet,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MessagePage;
