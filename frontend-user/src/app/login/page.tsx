"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { api, getAuthToken } from "@/utils/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (getAuthToken()) {
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.login({ email, password });
      const user = await api.getMe();
      if (!user.followed_categories || user.followed_categories.length === 0) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-background overflow-hidden px-4 py-12">
      {/* Dynamic Instagram Gradient background blur */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-rose-500/10 dark:bg-rose-950/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 dark:bg-purple-950/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col gap-3.5 relative z-10 select-none">
        
        {/* Instagram-style Primary Login Box */}
        <motion.div
          className="w-full bg-card border border-border rounded-2xl p-9 flex flex-col items-center shadow-md"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-9">
            <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md shadow-primary/10 mb-4.5">
              P
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Pixora</h2>
            <p className="text-muted-foreground text-xs font-semibold mt-1">Discover your next visual inspiration</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400 text-xs font-bold text-center leading-normal">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4.5">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-secondary text-foreground border border-border/30 rounded-xl py-3 pl-11 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/50 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center pl-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Password</label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="text-primary text-[10px] font-black hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-secondary text-foreground border border-border/30 rounded-xl py-3 pl-11 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/50 transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e60023] hover:bg-[#ff1a40] text-white font-extrabold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs active:scale-97 disabled:opacity-40 disabled:cursor-not-allowed mt-2 cursor-pointer"
            >
              {loading ? "Logging in..." : "Log In"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </motion.div>

        {/* Instagram-style Secondary Box (Sign up callout) */}
        <motion.div
          className="w-full bg-card border border-border rounded-xl py-4.5 text-center text-xs text-muted-foreground shadow-sm"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        >
          <span>Don't have an account? </span>
          <Link href="/register" className="text-primary font-black hover:underline">
            Sign up
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
