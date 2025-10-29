import React, { useState, useEffect } from "react";
import axios, { API_BASE_URL } from "./api";
import UserSidebar from "./components/UserSidebar";
import MailTable from "./components/MailTable";
import MessagePage from "./components/MessagePage";
import Avatar from "./components/Avatar";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [emails, setEmails] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [route, setRoute] = useState(
    window.location.pathname + window.location.search
  );

  useEffect(() => {
    // If redirected from OAuth with token, save it to backend
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      // send token to backend to create/save user
      axios
        .post("/auth/users", { token: tokenFromUrl })
        .then(() => {
          // remove token from url
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
          fetchUsers();
        })
        .catch((e) => {
          // Show more details when available to help debugging
          const details =
            e?.response?.data?.details || e?.message || "Unknown error";
          console.error("Failed to save user", details, e);
          // For now show an alert so the developer sees the error in the browser
          alert(`Failed to save user: ${details}`);
        });
    } else {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/auth/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axios.delete(`/auth/users/${encodeURIComponent(userId)}`);
      // if the deleted user was selected, clear emails
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setEmails([]);
      }
      fetchUsers();
    } catch (err) {
      const details = err?.response?.data?.details || err?.message || "Unknown";
      console.error("Failed to delete user", details, err);
      alert(`Failed to delete user: ${details}`);
    }
  };

  const fetchEmailsForUser = async (user) => {
    if (!user || !user.id) return;
    setSelectedUser(user);
    try {
      const res = await axios.get(
        `/gmail/emails?userId=${encodeURIComponent(user.id)}`
      );
      setEmails(res.data || []);
    } catch (err) {
      const details =
        err?.response?.data?.details || err?.message || "Unknown error";
      console.error("Failed to fetch emails", details, err);
      // If scopes are insufficient or credentials invalid, prompt user to re-auth with consent
      const status = err?.response?.status;
      const isAuthProblem =
        status === 401 ||
        (typeof details === "string" &&
          (details.toLowerCase().includes("insufficient") ||
            details.toLowerCase().includes("authentication") ||
            details.toLowerCase().includes("invalid")));

      if (isAuthProblem) {
        const doReauth = window.confirm(
          "This user needs additional permissions or needs to re-authenticate. Re-authenticate now?"
        );
        if (doReauth) {
          // open auth flow and hint the user's email so Google can pre-select account
          const url = `${API_BASE_URL}/auth/google?force=true&login_hint=${encodeURIComponent(
            user.email || ""
          )}`;
          window.location.href = url;
          return;
        }
      }
      alert(`Failed to fetch emails: ${details}`);
      setEmails([]);
    }
  };

  // simple client-side routing state to support opening a message on a separate page
  useEffect(() => {
    const onPop = () =>
      setRoute(window.location.pathname + window.location.search);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openMessagePage = (user, messageId) => {
    if (!user || !user.id || !messageId) return;
    const url = `/message?userId=${encodeURIComponent(
      user.id
    )}&id=${encodeURIComponent(messageId)}`;
    // include the email object from the currently loaded emails if available so MessagePage can render without fetching
    const emailObj = emails.find((e) => String(e.id) === String(messageId));
    window.history.pushState({ email: emailObj || null }, "", url);
    setRoute(window.location.pathname + window.location.search);
  };

  const onSignIn = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="d-flex">
      <UserSidebar
        users={users}
        onSelectUser={fetchEmailsForUser}
        onSignIn={onSignIn}
        selectedUserId={selectedUser?.id}
        onDeleteUser={deleteUser}
      />

      <div className="container-fluid p-4 d-flex" style={{ gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedUser ? (
            <div className="d-flex align-items-center mb-3">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginRight: 12,
                  minWidth: 48,
                }}
              >
                <Avatar
                  src={selectedUser?.picture}
                  name={selectedUser?.name}
                  size={36}
                  borderRadius={8}
                  className="user-avatar-img"
                />
              </div>

              <div>
                <h5 className="mb-0">{selectedUser.name}</h5>
                <div className="text-muted small">{selectedUser.email}</div>
              </div>
            </div>
          ) : (
            <h4>Select a user</h4>
          )}

          {route.startsWith("/message") ? (
            <MessagePage
              route={route}
              onClose={() => {
                window.history.pushState({}, "", "/");
                setRoute("/");
              }}
            />
          ) : (
            <>
              <div className="mail-toolbar">
                {/* tabs removed as requested */}
              </div>

              <MailTable
                emails={emails}
                onOpenMessage={(id) => openMessagePage(selectedUser, id)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
