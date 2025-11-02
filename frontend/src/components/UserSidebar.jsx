import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import Avatar from "./Avatar";

const UserSidebar = ({
  users = [],
  onSelectUser,
  onSignIn,
  selectedUserId,
  onDeleteUser,
  onToggleSidebar, // optional: used in mobile off-canvas to close
  isMobilePanel = false,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <div className="sidebar p-3 flex flex-col h-full relative">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          {onToggleSidebar && isMobilePanel && (
            <button
              aria-label="Close sidebar"
              className="md:hidden card-glass p-2 rounded-lg hover:bg-white/10 transition"
              onClick={onToggleSidebar}
              title="Close sidebar"
            >
              {/* X icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          <h2 className="m-0 logo-animated font-bold">MailVerse</h2>
        </div>
        <button
          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm px-3 py-1.5 shadow-sm transition"
          onClick={onSignIn}
        >
          <span className="text-base leading-none">+</span>
          <span>Add</span>
        </button>
      </div>

      <div className="mt-3">
        <input
          className="form-control form-control-sm"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Scrollable user list area */}
      <div className="flex-1 overflow-y-auto pb-16" style={{ marginTop: 12 }}>
        {filtered.length === 0 && (
          <div className="text-muted">No users found</div>
        )}

        <div className="mt-2 space-y-2">
          {filtered.map((u) => (
            <div
              key={u.id}
              className={`card-glass d-flex align-items-center justify-content-between px-2 py-2 rounded-xl transition cursor-pointer w-full overflow-hidden ${
                selectedUserId === u.id
                  ? "ring-1 ring-brand-500/60"
                  : "hover:bg-white/10"
              }`}
            >
              <button
                type="button"
                className="d-flex align-items-center user-item-left flex-1 min-w-0 bg-transparent border-0 p-0 text-start"
                aria-label={`Select user ${u.email}`}
                onClick={() => onSelectUser(u)}
              >
                <Avatar
                  src={u.picture}
                  name={u.name}
                  size={32}
                  borderRadius={8}
                  className="user-avatar-img"
                />
                <div
                  className="user-meta ms-2 min-w-0"
                  style={{ overflow: "hidden" }}
                >
                  <div className="user-name text-truncate truncate">
                    {u.name}
                  </div>
                  <div className="user-email text-muted text-truncate truncate">
                    {u.email}
                  </div>
                </div>
              </button>

              <div className="d-flex align-items-center shrink-0 ms-2">
                <button
                  className="inline-flex items-center rounded-md border border-white/20 px-2 py-1 text-xs hover:bg-white/10 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (globalThis.confirm(`Delete user ${u.email}?`))
                      onDeleteUser(u.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute left-0 right-0 bottom-0 p-3 border-top border-black/10 dark:border-white/10 text-xs bg-white/70 dark:bg-white/5 backdrop-blur text-slate-700 dark:text-white">
        <div className="d-flex align-items-center justify-content-between">
          <span>© 2025 MailVerse</span>
        </div>
        <div className="mt-2">
          <div className="d-flex align-items-center gap-4 mt-1">
            {/* Prajnesh - LinkedIn icon with hover tooltip */}
            <a
              href="https://www.linkedin.com/in/prajnesh-kumar-593560331"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center"
              aria-label="Prajnesh Kumar on LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-[#0A66C2]"
              >
                <path d="M4.983 3.5C4.983 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.483 1.12 2.483 2.5zM.24 8.25h4.52V23.5H.24V8.25zM8.31 8.25h4.33v2.08h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9V23.5h-4.72v-6.74c0-1.6-.03-3.66-2.23-3.66-2.23 0-2.57 1.74-2.57 3.54V23.5H8.31V8.25z" />
              </svg>
              <span className="sr-only">Prajnesh Kumar</span>
              {/* Tooltip */}
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition">
                Prajnesh Kumar
              </span>
              <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-black/80 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"></span>
            </a>

            {/* Shreekara - LinkedIn icon with hover tooltip */}
            <a
              href="https://www.linkedin.com/in/shreekara-m-61440b285"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center"
              aria-label="Shreekara M on LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-[#0A66C2]"
              >
                <path d="M4.983 3.5C4.983 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.483 1.12 2.483 2.5zM.24 8.25h4.52V23.5H.24V8.25zM8.31 8.25h4.33v2.08h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9V23.5h-4.72v-6.74c0-1.6-.03-3.66-2.23-3.66-2.23 0-2.57 1.74-2.57 3.54V23.5H8.31V8.25z" />
              </svg>
              <span className="sr-only">Shreekara</span>
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition">
                Shreekara
              </span>
              <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-black/80 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"></span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

UserSidebar.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      email: PropTypes.string,
      picture: PropTypes.string,
    })
  ),
  onSelectUser: PropTypes.func,
  onSignIn: PropTypes.func,
  selectedUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onDeleteUser: PropTypes.func,
  onToggleSidebar: PropTypes.func,
  isMobilePanel: PropTypes.bool,
};

export default UserSidebar;
