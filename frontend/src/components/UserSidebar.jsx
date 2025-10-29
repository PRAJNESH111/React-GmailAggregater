import React, { useState, useMemo } from "react";
import Avatar from "./Avatar";

const UserSidebar = ({
  users = [],
  onSelectUser,
  onSignIn,
  selectedUserId,
  onDeleteUser,
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
    <div className="sidebar p-3">
      <div className="d-flex align-items-center justify-content-between">
        <h5 className="m-0">Users</h5>
        <button className="btn btn-sm btn-outline-light" onClick={onSignIn}>
          + Add
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

      <div style={{ marginTop: 12 }}>
        {filtered.length === 0 && (
          <div className="text-muted">No users found</div>
        )}
        <ul className="list-group list-group-flush mt-2">
          {filtered.map((u) => (
            <li
              key={u.id}
              className={`list-group-item d-flex align-items-center justify-content-between ${
                selectedUserId === u.id ? "active" : ""
              } user-list-item`}
            >
              <div
                className="d-flex align-items-center user-item-left"
                style={{ cursor: "pointer" }}
                onClick={() => onSelectUser(u)}
              >
                <Avatar
                  src={u.picture}
                  name={u.name}
                  size={32}
                  borderRadius={8}
                  className="user-avatar-img"
                />
                <div className="user-meta" style={{ overflow: "hidden" }}>
                  <div className="user-name">{u.name}</div>
                  <div className="user-email text-muted">{u.email}</div>
                </div>
              </div>

              <div className="d-flex align-items-center">
                <button
                  className="btn btn-sm btn-outline-secondary user-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete user ${u.email}?`))
                      onDeleteUser(u.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserSidebar;
