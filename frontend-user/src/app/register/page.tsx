"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await api.register({ name, email, password });
      await api.login({ email, password });
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Registration failed. Email might already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-background overflow-hidden px-4 py-12">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-rose-500/10 dark:bg-rose-950/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 dark:bg-purple-950/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col gap-3.5 relative z-10 select-none">
        
        {/* Instagram-style Primary Signup Box */}
        <motion.div
          className="w-full bg-card border border-border rounded-2xl p-9 flex flex-col items-center shadow-md"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-7 text-center">
            <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md shadow-primary/10 mb-4.5">
              P
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Create Account</h2>
            <p className="text-muted-foreground text-xs font-semibold mt-1">Join Pixora to save and like visual ideas</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400 text-xs font-bold text-center leading-normal">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4.5">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-secondary text-foreground border border-border/30 rounded-xl py-3 pl-11 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/50 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Email Address</label>
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
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
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
              {loading ? "Creating account..." : "Sign Up"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </motion.div>

        {/* Instagram-style Secondary Box (Log in callout) */}
        <motion.div
          className="w-full bg-card border border-border rounded-xl py-4.5 text-center text-xs text-muted-foreground shadow-sm"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        >
          <span>Already have an account? </span>
          <Link href="/login" className="text-primary font-black hover:underline">
            Log in
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
