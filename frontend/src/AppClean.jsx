import React, { useState, useEffect } from "react";
import axios, { API_BASE_URL } from "./api";
import UserSidebar from "./components/UserSidebar";
import MailTable from "./components/MailTable";
import MessagePage from "./components/MessagePage";
import Avatar from "./components/Avatar";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from "./auth/AuthContext.jsx";
import SignIn from "./components/SignIn.jsx";
import SignUp from "./components/SignUp.jsx";

function AppClean() {
  const auth = useAuth();

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved;
    } catch {
      /* ignore */
    }
    const prefersDark =
      typeof globalThis !== "undefined" &&
      globalThis.matchMedia &&
      globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  const [emails, setEmails] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [route, setRoute] = useState(
    globalThis.location.pathname + globalThis.location.search
  );
  const [authMode, setAuthMode] = useState("signin");
  const [filterRecruiterOnly, setFilterRecruiterOnly] = useState(false);
  const [filterNonRecruiterOnly, setFilterNonRecruiterOnly] = useState(false);
  const [filterRecruiterByKeywordsOnly, setFilterRecruiterByKeywordsOnly] =
    useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [showReplyCounts, setShowReplyCounts] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  useEffect(() => {
    if (auth?.user) fetchUsers();
  }, [auth?.user]);

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
    if (!user?.id) return;
    setSelectedUser(user);
    setLoadingEmails(true);
    try {
      const res = await axios.get(
        `/gmail/emails?userId=${encodeURIComponent(
          user.id
        )}&includeReplyCounts=${showReplyCounts}`
      );
      setEmails(res.data || []);
    } catch (err) {
      const details =
        err?.response?.data?.details || err?.message || "Unknown error";
      console.error("Failed to fetch emails", details, err);
      const status = err?.response?.status;
      const isAuthProblem =
        status === 401 ||
        (typeof details === "string" &&
          (details.toLowerCase().includes("insufficient") ||
            details.toLowerCase().includes("authentication") ||
            details.toLowerCase().includes("invalid")));
      if (isAuthProblem) {
        const doReauth = globalThis.confirm(
          "This user needs additional permissions or needs to re-authenticate. Re-authenticate now?"
        );
        if (doReauth) {
          const url = `${API_BASE_URL}/auth/google?force=true&login_hint=${encodeURIComponent(
            user.email || ""
          )}`;
          globalThis.location.href = url;
          return;
        }
      }
      alert(`Failed to fetch emails: ${details}`);
      setEmails([]);
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    const onPop = () =>
      setRoute(globalThis.location.pathname + globalThis.location.search);
    globalThis.addEventListener("popstate", onPop);
    return () => globalThis.removeEventListener("popstate", onPop);
  }, []);

  const openMessagePage = (user, messageId) => {
    if (!user?.id || !messageId) return;
    const url = `/message?userId=${encodeURIComponent(
      user.id
    )}&id=${encodeURIComponent(messageId)}`;
    const emailObj = emails.find((e) => String(e.id) === String(messageId));
    globalThis.history.pushState({ email: emailObj || null }, "", url);
    setRoute(globalThis.location.pathname + globalThis.location.search);
  };

  const onSignIn = () => {
    globalThis.location.href = `${API_BASE_URL}/auth/google`;
  };

  // Simple keyword-based recruiter detector (subject/snippet/from)
  const recruiterKeywords = [
    // application/thanks
    "thanks for applying",
    "thank you for applying",
    "application received",
    "we received your application",
    "your application",
    // interview/schedule/shortlist
    "interview",
    "schedule",
    "scheduled",
    "scheduling",
    "reschedule",
    "shortlist",
    "shortlisted",
    "screening",
    "next steps",
    // tests/assignments
    "assessment",
    "coding test",
    "online test",
    "assignment",
    "challenge",
    // job opportunity
    "job opportunity",
    "opening for",
    "opportunity at",
    "hiring",
    // common recruiter terms
    "recruiter",
    "talent acquisition",
    "hr@",
    "@careers",
    "@jobs",
  ];

  // Dropdown keyword options provided by user
  const keywordOptions = [
    "interview",
    "hiring",
    "job opportunity",
    "selected",
    "shortlisted",
    "offer letter",
    "application",
    "opportunity at",
    "resume shortlisted",
    "schedule a call",
    "recruitment",
    "profile matches",
    "we are interested",
  ];

  const isKeywordRecruiter = (email) => {
    if (!email) return false;
    const subject = String(email.subject || "").toLowerCase();
    const snippet = String(email.snippet || "").toLowerCase();
    const from = String(email.from || "").toLowerCase();
    return recruiterKeywords.some(
      (kw) => subject.includes(kw) || snippet.includes(kw) || from.includes(kw)
    );
  };

  const matchesKeyword = (email, kw) => {
    if (!email || !kw) return false;
    const needle = kw.toLowerCase();
    const subject = String(email.subject || "").toLowerCase();
    const snippet = String(email.snippet || "").toLowerCase();
    const from = String(email.from || "").toLowerCase();
    return (
      subject.includes(needle) ||
      snippet.includes(needle) ||
      from.includes(needle)
    );
  };

  if (auth?.loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!auth?.user) {
    return (
      <div className="h-full overflow-hidden relative">
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
          <button
            aria-label="Toggle theme"
            className="card-glass p-2 rounded-lg hover:bg-white/10 transition"
            onClick={toggleTheme}
            title="Toggle dark/light"
          >
            {theme === "dark" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
                <path
                  fillRule="evenodd"
                  d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zm0 16.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V19.5a.75.75 0 01.75-.75zM4.72 4.72a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06L4.72 5.78a.75.75 0 010-1.06zm12.44 12.44a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM2.25 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zm16.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM4.72 19.28a.75.75 0 010-1.06l1.06-1.06a.75.75 0 011.06 1.06L5.78 19.28a.75.75 0 01-1.06 0zm12.44-12.44a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06L18.22 6.78a.75.75 0 01-1.06 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M21.752 15.002A9 9 0 0112.998 3.25a.75.75 0 00-1.102-.83 9.75 9.75 0 1012.684 12.684.75.75 0 00-.828-1.102z" />
              </svg>
            )}
          </button>
        </div>
        <div className="absolute top-6 left-0 right-0 z-40 flex justify-center">
          <div className="inline-flex bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              className={`px-4 py-1.5 rounded-md text-sm ${
                authMode === "signin"
                  ? "bg-brand-600 text-white"
                  : "hover:bg-white/10"
              }`}
              onClick={() => setAuthMode("signin")}
            >
              Sign in
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm ${
                authMode === "signup"
                  ? "bg-brand-600 text-white"
                  : "hover:bg-white/10"
              }`}
              onClick={() => setAuthMode("signup")}
            >
              Sign up
            </button>
          </div>
        </div>
        {authMode === "signin" ? <SignIn /> : <SignUp />}
      </div>
    );
  }

  return (
    <div className="d-flex overflow-hidden h-full w-full">
      {/* Top-right controls */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
        <button
          aria-label="Toggle theme"
          className="card-glass p-2 rounded-lg hover:bg-white/10 transition"
          onClick={toggleTheme}
          title="Toggle dark/light"
        >
          {theme === "dark" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
              <path
                fillRule="evenodd"
                d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zm0 16.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V19.5a.75.75 0 01.75-.75zM4.72 4.72a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06L4.72 5.78a.75.75 0 010-1.06zm12.44 12.44a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM2.25 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zm16.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM4.72 19.28a.75.75 0 010-1.06l1.06-1.06a.75.75 0 011.06 1.06L5.78 19.28a.75.75 0 01-1.06 0zm12.44-12.44a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06L18.22 6.78a.75.75 0 01-1.06 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M21.752 15.002A9 9 0 0112.998 3.25a.75.75 0 00-1.102-.83 9.75 9.75 0 1012.684 12.684.75.75 0 00-.828-1.102z" />
            </svg>
          )}
        </button>
        <button
          className="inline-flex items-center rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 transition"
          onClick={auth.logout}
        >
          Logout
        </button>
      </div>

      {/* Hamburger (mobile) */}
      <button
        aria-label="Toggle sidebar"
        className="fixed top-3 left-3 z-50 md:hidden card-glass p-2 rounded-lg hover:bg-white/10 transition"
        onClick={() => setSidebarOpen((v) => !v)}
        title="Toggle sidebar"
      >
        {sidebarOpen ? (
          // X icon
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
        ) : (
          // Hamburger icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zM3.75 12a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15A.75.75 0 013.75 12zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" />
          </svg>
        )}
      </button>

      {/* Mobile off-canvas sidebar */}
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Panel */}
      <div
        className={`fixed z-50 inset-y-0 left-0 w-64 md:hidden transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto bg-white/70 dark:bg-white/5 border-r border-black/10 dark:border-white/10 backdrop-blur">
          <UserSidebar
            users={users}
            onSelectUser={(u) => {
              fetchEmailsForUser(u);
              setSidebarOpen(false);
            }}
            onSignIn={onSignIn}
            selectedUserId={selectedUser?.id}
            onDeleteUser={deleteUser}
            onToggleSidebar={() => setSidebarOpen(false)}
            isMobilePanel
          />
        </div>
      </div>

      {/* Desktop static sidebar with divider */}
      <div
        className="hidden md:block h-full overflow-y-hidden border-r border-black/10 dark:border-white/10"
        style={{ width: 256, flex: "0 0 auto" }}
      >
        <UserSidebar
          users={users}
          onSelectUser={fetchEmailsForUser}
          onSignIn={onSignIn}
          selectedUserId={selectedUser?.id}
          onDeleteUser={deleteUser}
        />
      </div>

      <div
        className="container-fluid p-4 d-flex overflow-hidden h-full"
        style={{ gap: 16 }}
      >
        <div
          className="d-flex flex-column h-full overflow-hidden"
          style={{ flex: 1, minWidth: 0 }}
        >
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
            <div className="flex-1 min-h-0 overflow-hidden">
              <MessagePage
                route={route}
                onClose={() => {
                  globalThis.history.pushState({}, "", "/");
                  setRoute("/");
                }}
              />
            </div>
          ) : (
            <>
              <div className="mail-toolbar">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div className="form-check">
                    <input
                      id="fltRecruiter"
                      className="form-check-input"
                      type="checkbox"
                      checked={filterRecruiterOnly}
                      onChange={(e) => {
                        setFilterRecruiterOnly(e.target.checked);
                        if (e.target.checked) {
                          setFilterNonRecruiterOnly(false);
                          setFilterRecruiterByKeywordsOnly(false);
                        }
                      }}
                    />
                    <label className="form-check-label" htmlFor="fltRecruiter">
                      Recruiter emails only
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      id="fltNonRecruiter"
                      className="form-check-input"
                      type="checkbox"
                      checked={filterNonRecruiterOnly}
                      onChange={(e) => {
                        setFilterNonRecruiterOnly(e.target.checked);
                        if (e.target.checked) {
                          setFilterRecruiterOnly(false);
                          setFilterRecruiterByKeywordsOnly(false);
                        }
                      }}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="fltNonRecruiter"
                    >
                      Non-recruiter emails only
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      id="fltRecruiterKw"
                      className="form-check-input"
                      type="checkbox"
                      checked={filterRecruiterByKeywordsOnly}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setFilterRecruiterByKeywordsOnly(val);
                        if (val) {
                          setFilterRecruiterOnly(false);
                          setFilterNonRecruiterOnly(false);
                        }
                      }}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="fltRecruiterKw"
                    >
                      Recruiter by keywords
                    </label>
                    {/* Keyword select (Tailwind styled) */}
                    <select
                      value={selectedKeyword}
                      onChange={(e) => setSelectedKeyword(e.target.value)}
                      disabled={!filterRecruiterByKeywordsOnly}
                      className={`ml-2 rounded-md px-2 py-1 text-sm border outline-none 
                        bg-white/5 text-slate-900 border-white/10 
                        dark:bg-slate-800/50 dark:text-white dark:border-white/20 
                        ${
                          !filterRecruiterByKeywordsOnly
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }
                      `}
                      title="Choose a specific keyword to filter"
                    >
                      <option value="">All keywords</option>
                      {keywordOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-check ms-3 hidden md:block">
                    <input
                      id="showReplies"
                      className="form-check-input"
                      type="checkbox"
                      checked={showReplyCounts}
                      onChange={async (e) => {
                        const val = e.target.checked;
                        setShowReplyCounts(val);
                        if (selectedUser) {
                          try {
                            setLoadingEmails(true);
                            const res = await axios.get(
                              `/gmail/emails?userId=${encodeURIComponent(
                                selectedUser.id
                              )}&includeReplyCounts=${val}`
                            );
                            setEmails(res.data || []);
                          } catch (err) {
                            console.error(
                              "Failed to refetch with reply counts",
                              err
                            );
                          } finally {
                            setLoadingEmails(false);
                          }
                        }
                      }}
                    />
                    <label className="form-check-label" htmlFor="showReplies">
                      Show recruiter replies count
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                <MailTable
                  emails={emails.filter((m) => {
                    if (filterRecruiterByKeywordsOnly) {
                      if (selectedKeyword)
                        return matchesKeyword(m, selectedKeyword);
                      return isKeywordRecruiter(m);
                    }
                    if (filterRecruiterOnly) return m.isRecruiter;
                    if (filterNonRecruiterOnly)
                      return !m.isRecruiter && !isKeywordRecruiter(m);
                    return true;
                  })}
                  loading={loadingEmails}
                  onOpenMessage={(id) => openMessagePage(selectedUser, id)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppClean;
