import React, { useState } from "react";

const MailTable = ({ emails = [], onOpenMessage }) => {
  const [starred, setStarred] = useState(new Set());

  const toggleStar = (id) => {
    const s = new Set(starred);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setStarred(s);
  };

  const senderName = (from) => {
    if (!from) return "";
    // try to extract display name before <email>
    const m = from.match(/^(.*?)(?: <|$)/);
    return (m && m[1]) || from;
  };

  const initialFor = (name) =>
    name ? name.trim().charAt(0).toUpperCase() : "?";

  return (
    <div
      className="mt-2 mail-list"
      style={{ maxHeight: "100vh", overflowY: "auto" }}
    >
      <table className="table mail-table mb-0">
        <thead>
          <tr className="mail-header small text-muted">
            {/* <th style={{ width: 36 }}>
              <input type="checkbox" aria-label="select all" />
            </th> */}
            <th style={{ width: 36 }}></th>
            <th>From</th>
            <th>Subject</th>
            <th style={{ width: 120 }} className="text-end">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {emails.map((email, idx) => {
            const id = email.id || idx;
            const isStarred = starred.has(id);
            const sender = email.from || "";
            const subject = email.subject || "(no subject)";
            const snippet = email.snippet || "";
            return (
              <tr
                key={id}
                className={`mail-row ${email.unread ? "unread" : ""}`}
                onClick={() => onOpenMessage?.(id)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`star-btn ${isStarred ? "starred" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(id);
                    }}
                  >
                    {isStarred ? "★" : "☆"}
                  </button>
                </td>
                <td style={{ maxWidth: 220 }}>
                  <div className="d-flex align-items-center">
                    <div className="mail-avatar">
                      {initialFor(senderName(sender))}
                    </div>
                    <div className="mail-sender text-truncate">
                      {senderName(sender)}
                    </div>
                  </div>
                </td>
                <td className="mail-subject-cell">
                  <div className="mail-subject text-truncate">{subject}</div>
                  <div className="mail-snippet text-truncate">{snippet}</div>
                </td>
                <td
                  className="mail-date text-muted small text-end"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {email.date}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MailTable;
