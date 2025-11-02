import React, { useMemo } from "react";
import PropTypes from "prop-types";

const MailTable = ({ emails = [], onOpenMessage, loading = false }) => {
  const senderName = (from) => {
    if (!from) return "";
    // Extract display name before <email>
    const m = from.match(/^(.*?)(?: <|$)/);
    let name = m?.[1] || from;
    // Remove surrounding quotes and any remaining quotes
    name = name
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");
    name = name.replaceAll('"', "").replaceAll("'", "");
    return name;
  };

  const initialFor = (name) =>
    name ? name.trim().charAt(0).toUpperCase() : "?";

  const formatDateOnly = (value) => {
    if (!value) return "";
    // Try to parse as Date and return date-only
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      try {
        return d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        // fall through to string fallback
      }
    }
    // Fallback: remove common time patterns from string
    let s = String(value);
    // remove hh:mm(:ss) with optional AM/PM
    s = s.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s?(AM|PM)?\b/i, "").trim();
    // remove trailing commas or dashes left behind
    s = s.replace(/[,-]\s*$/, "").trim();
    return s;
  };

  const skeletonKeys = useMemo(
    () => Array.from({ length: 8 }, (_, i) => `sk-${i}-${Date.now()}`),
    []
  );

  return (
    <div className="mt-2 mail-list">
      {loading ? (
        <div className="space-y-2">
          {skeletonKeys.map((key) => (
            <div
              key={key}
              className="card-glass rounded-xl px-3 py-3 overflow-hidden"
            >
              <div className="skeleton-shimmer skeleton-card rounded-md w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map((email, idx) => {
            const id = email.id || idx;
            const sender = email.from || "";
            const isRecruiter = !!email.isRecruiter;
            const replyCount = email.replyCountRecruiter;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOpenMessage?.(id)}
                className={`w-full text-left card-glass rounded-xl px-3 py-3 transition transform hover:-translate-y-0.5 hover:shadow-xl ${
                  email.unread ? "ring-1 ring-brand-500/60" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="mail-avatar hidden md:inline-flex">
                      {initialFor(senderName(sender))}
                    </div>
                    <div className="truncate">
                      <span className="font-medium">{senderName(sender)}</span>
                      {isRecruiter ? (
                        <span className="badge badge-warning ml-2 hidden md:inline-flex">
                          Recruiter
                        </span>
                      ) : null}
                      {typeof replyCount === "number" ? (
                        <span className="badge badge-muted ml-2 hidden md:inline-flex">
                          Replies: {replyCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mail-date text-sm text-muted whitespace-nowrap">
                    <span className="md:hidden">
                      {formatDateOnly(email.date)}
                    </span>
                    <span className="hidden md:inline">{email.date}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MailTable;

MailTable.propTypes = {
  emails: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      from: PropTypes.string,
      subject: PropTypes.string,
      snippet: PropTypes.string,
      date: PropTypes.string,
      isRecruiter: PropTypes.bool,
      replyCountRecruiter: PropTypes.number,
      unread: PropTypes.bool,
    })
  ),
  onOpenMessage: PropTypes.func,
  loading: PropTypes.bool,
};
