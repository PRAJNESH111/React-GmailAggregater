import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { motion as Motion } from "framer-motion";

export default function SignUp() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(name, email, password);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-4">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card-glass w-full max-w-md p-6"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-slate-400">Join to get started</p>
        </div>
        {error && (
          <div className="mb-3 text-sm text-red-300 bg-red-500/10 border border-red-300/30 rounded px-3 py-2">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brand-500 bg-white/5 text-slate-900 placeholder-slate-500 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-400 dark:border-white/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brand-500 bg-white/5 text-slate-900 placeholder-slate-500 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-400 dark:border-white/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-brand-500 bg-white/5 text-slate-900 placeholder-slate-500 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-400 dark:border-white/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            className="w-full inline-flex justify-center items-center rounded-lg bg-brand-600 hover:bg-brand-500 transition px-4 py-2 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>
      </Motion.div>
    </div>
  );
}
