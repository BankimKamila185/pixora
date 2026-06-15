"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, getAuthToken } from "@/utils/api";
import { auth } from "@/utils/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// ── Phone mockup image carousel (Instagram-style app previews) ──
const PHONE_SCREENS = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=400&auto=format&fit=crop",
];

const MOCK_EMAILS = [
  "budiartirohman@gmail.com",
  "michael.franz@gmail.com",
  "sarah_bakes@gmail.com",
];

// ── Pixora wordmark logo (Instagram-style cursive) ──
function PixoraWordmark() {
  return (
    <svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 w-auto">
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#833ab4" />
          <stop offset="50%" stopColor="#fd1d1d" />
          <stop offset="100%" stopColor="#fcb045" />
        </linearGradient>
      </defs>
      <text
        x="10"
        y="44"
        fontFamily="'Dancing Script', 'Pacifico', cursive"
        fontSize="44"
        fontWeight="700"
        fill="url(#logo-grad)"
        letterSpacing="-1"
      >
        Pixora
      </text>
    </svg>
  );
}

// ── Phone Mockup with sliding screens ──
function PhoneMockup({ currentScreen }) {
  return (
    <div
      style={{
        position: "relative",
        width: "250px",
        height: "500px",
        flexShrink: 0,
      }}
    >
      {/* Phone frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "36px",
          background: "#1a1a1a",
          boxShadow:
            "0 0 0 2px #333, 0 0 0 3px #555, 0 24px 60px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.08)",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80px",
            height: "20px",
            background: "#1a1a1a",
            borderRadius: "10px",
            zIndex: 10,
          }}
        />

        {/* Screen content */}
        <div
          style={{
            position: "absolute",
            inset: "2px",
            borderRadius: "34px",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentScreen}
              src={PHONE_SCREENS[currentScreen]}
              alt="Pixora app preview"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          </AnimatePresence>

          {/* Overlay gradient */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "120px",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* Side buttons */}
      <div
        style={{
          position: "absolute",
          right: "-3px",
          top: "100px",
          width: "3px",
          height: "40px",
          background: "#444",
          borderRadius: "0 2px 2px 0",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-3px",
          top: "80px",
          width: "3px",
          height: "30px",
          background: "#444",
          borderRadius: "2px 0 0 2px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-3px",
          top: "120px",
          width: "3px",
          height: "30px",
          background: "#444",
          borderRadius: "2px 0 0 2px",
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState(1);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone carousel
  const [currentScreen, setCurrentScreen] = useState(0);

  // Simulator modal
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockEmail, setMockEmail] = useState("");
  const [mockName, setMockName] = useState("");

  useEffect(() => {
    if (getAuthToken()) {
      router.push("/");
    }
  }, [router]);

  // Auto-cycle phone screens
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % PHONE_SCREENS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const isMock = MOCK_EMAILS.includes(email.trim().toLowerCase());
      setIsNewUser(!isMock);
      setStep(2);
    } catch {
      setIsNewUser(true);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isNewUser) {
        if (!name.trim()) {
          setError("Please enter a username.");
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          setLoading(false);
          return;
        }
        await api.register({ name, email, password });
        await api.login({ email, password });
        router.push("/onboarding");
      } else {
        await api.login({ email, password });
        const user = await api.getMe();
        if (!user.followed_categories || user.followed_categories.length === 0) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      if (!auth) {
        setShowMockModal(true);
        setLoading(false);
        return;
      }
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const idToken = await res.user.getIdToken();
      await api.loginWithGoogle(
        idToken,
        res.user.email || undefined,
        res.user.displayName || undefined
      );
      const user = await api.getMe();
      if (!user.followed_categories || user.followed_categories.length === 0) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.warn("Firebase Google login failed, opening simulator fallback:", err);
      setShowMockModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMockSignIn = async (mEmail, mName) => {
    setLoading(true);
    setError("");
    setShowMockModal(false);
    try {
      const mockToken = `mock_google_${mEmail}_${Date.now()}`;
      await api.loginWithGoogle(mockToken, mEmail, mName);
      const user = await api.getMe();
      if (!user.followed_categories || user.followed_categories.length === 0) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err.message || "Simulator Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Load Dancing Script font for logo */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');

        .ig-page {
          min-height: 100vh;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #262626;
        }

        .ig-main {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          padding: 40px 20px;
          max-width: 940px;
          width: 100%;
          flex: 1;
        }

        /* ── Left: Phone Mockup (hidden on mobile) ── */
        .ig-phone-col {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .ig-phone-col { display: none; }
          .ig-main { gap: 0; }
        }

        /* ── Right: Form Column ── */
        .ig-form-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 350px;
          flex-shrink: 0;
        }

        /* ── Login Box ── */
        .ig-box {
          background: #fff;
          border: 1px solid #dbdbdb;
          border-radius: 2px;
          padding: 40px 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* ── Logo ── */
        .ig-logo {
          margin-bottom: 20px;
        }

        /* ── Error ── */
        .ig-error {
          width: 100%;
          color: #ed4956;
          font-size: 13px;
          font-weight: 400;
          text-align: center;
          margin-bottom: 10px;
          line-height: 1.4;
        }

        /* ── Form ── */
        .ig-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* ── Input Wrapper ── */
        .ig-input-wrap {
          position: relative;
          width: 100%;
        }
        .ig-input {
          width: 100%;
          height: 38px;
          background: #fafafa;
          border: 1px solid #dbdbdb;
          border-radius: 3px;
          padding: 9px 36px 9px 8px;
          font-size: 12px;
          color: #262626;
          outline: none;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
        }
        .ig-input:focus {
          border-color: #8e8e8e;
          background: #fff;
        }
        .ig-input::placeholder {
          color: #8e8e8e;
          font-size: 12px;
        }
        .ig-eye-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #262626;
          font-weight: 600;
          font-size: 12px;
          padding: 0;
          line-height: 1;
        }
        .ig-eye-icon {
          display: flex;
          align-items: center;
          color: #8e8e8e;
        }

        /* ── Submit Button ── */
        .ig-submit-btn {
          width: 100%;
          height: 32px;
          background: #0095f6;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: opacity 0.15s ease;
          letter-spacing: 0.3px;
        }
        .ig-submit-btn:hover:not(:disabled) {
          background: #1877f2;
        }
        .ig-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Forgot password ── */
        .ig-forgot {
          text-align: center;
          margin-top: 12px;
          margin-bottom: 4px;
        }
        .ig-forgot a {
          font-size: 12px;
          color: #00376b;
          text-decoration: none;
          font-weight: 600;
        }
        .ig-forgot a:hover {
          color: #000;
          text-decoration: underline;
        }

        /* ── OR Divider ── */
        .ig-divider {
          display: flex;
          align-items: center;
          gap: 18px;
          width: 100%;
          margin: 16px 0;
        }
        .ig-divider-line {
          flex: 1;
          height: 1px;
          background: #dbdbdb;
        }
        .ig-divider-text {
          color: #8e8e8e;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1px;
        }

        /* ── Google Login Button ── */
        .ig-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #385185;
          font-size: 14px;
          font-weight: 700;
          padding: 8px;
          transition: color 0.15s ease;
        }
        .ig-google-btn:hover {
          color: #1877f2;
        }
        .ig-google-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ig-google-icon {
          width: 20px;
          height: 20px;
        }

        /* ── Sign up box ── */
        .ig-signup-box {
          background: #fff;
          border: 1px solid #dbdbdb;
          border-radius: 2px;
          padding: 20px 40px;
          text-align: center;
          font-size: 14px;
          color: #262626;
        }
        .ig-signup-box a {
          color: #0095f6;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }
        .ig-signup-box a:hover {
          color: #1877f2;
        }

        /* ── App Store Badges ── */
        .ig-badges {
          text-align: center;
          margin-top: 16px;
        }
        .ig-badges p {
          font-size: 13px;
          color: #262626;
          margin-bottom: 12px;
        }
        .ig-badge-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .ig-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 12px;
          background: #000;
          border-radius: 6px;
          color: #fff;
          text-decoration: none;
          transition: opacity 0.15s ease;
        }
        .ig-badge:hover {
          opacity: 0.85;
        }
        .ig-badge-text {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .ig-badge-text .top {
          font-size: 9px;
          color: #ccc;
          line-height: 1;
        }
        .ig-badge-text .bottom {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          line-height: 1.2;
        }

        /* ── Footer ── */
        .ig-footer {
          width: 100%;
          max-width: 940px;
          padding: 24px 20px;
          text-align: center;
        }
        .ig-footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px 16px;
          margin-bottom: 16px;
        }
        .ig-footer-links a {
          font-size: 12px;
          color: #8e8e8e;
          text-decoration: none;
        }
        .ig-footer-links a:hover {
          text-decoration: underline;
          color: #262626;
        }
        .ig-footer-copy {
          font-size: 12px;
          color: #8e8e8e;
        }

        /* ── Change email link ── */
        .ig-change-email {
          background: none;
          border: none;
          color: #8e8e8e;
          font-size: 12px;
          cursor: pointer;
          text-align: center;
          margin-top: 4px;
          text-decoration: underline;
        }
        .ig-change-email:hover {
          color: #262626;
        }

        /* ── Loading Spinner ── */
        @keyframes ig-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .ig-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: ig-spin 0.7s linear infinite;
          display: inline-block;
        }

        /* ── Mock Modal ── */
        .ig-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .ig-modal {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          max-width: 360px;
          width: 100%;
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
        }
        .ig-modal h3 {
          font-size: 16px;
          font-weight: 600;
          color: #262626;
          text-align: center;
          margin-bottom: 6px;
        }
        .ig-modal p {
          font-size: 13px;
          color: #8e8e8e;
          text-align: center;
          margin-bottom: 16px;
          line-height: 1.4;
        }
        .ig-modal-profile-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          background: #fafafa;
          border: 1px solid #dbdbdb;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 8px;
          transition: background 0.15s ease;
        }
        .ig-modal-profile-btn:hover {
          background: #f0f0f0;
        }
        .ig-modal-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
        }
        .ig-modal-info {
          text-align: left;
          flex: 1;
          min-width: 0;
        }
        .ig-modal-info .nm {
          font-size: 13px;
          font-weight: 600;
          color: #262626;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ig-modal-info .em {
          font-size: 11px;
          color: #8e8e8e;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ig-modal-input {
          width: 100%;
          height: 38px;
          background: #fafafa;
          border: 1px solid #dbdbdb;
          border-radius: 3px;
          padding: 9px 8px;
          font-size: 12px;
          color: #262626;
          outline: none;
          margin-bottom: 8px;
          box-sizing: border-box;
        }
        .ig-modal-input:focus {
          border-color: #8e8e8e;
          background: #fff;
        }
        .ig-modal-input::placeholder {
          color: #8e8e8e;
        }
        .ig-modal-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .ig-modal-close {
          flex: 1;
          height: 36px;
          background: #fafafa;
          border: 1px solid #dbdbdb;
          border-radius: 8px;
          color: #262626;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .ig-modal-close:hover {
          background: #f0f0f0;
        }
        .ig-modal-inject {
          flex: 1;
          height: 36px;
          background: #0095f6;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .ig-modal-inject:hover {
          background: #1877f2;
        }
        .ig-modal-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0;
        }
        .ig-modal-divider-line {
          flex: 1;
          height: 1px;
          background: #dbdbdb;
        }
        .ig-modal-divider-text {
          font-size: 11px;
          font-weight: 600;
          color: #8e8e8e;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      `}</style>

      <div className="ig-page">
        <div className="ig-main">
          {/* ── Left: Phone Mockup Column ── */}
          <div className="ig-phone-col">
            <PhoneMockup currentScreen={currentScreen} />
          </div>

          {/* ── Right: Form Column ── */}
          <div className="ig-form-col">
            {/* Login Box */}
            <div className="ig-box">
              {/* Logo */}
              <div className="ig-logo">
                <PixoraWordmark />
              </div>

              {/* Error */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.p
                    className="ig-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Form */}
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.form
                    key="step1"
                    className="ig-form"
                    onSubmit={handleEmailSubmit}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="ig-input-wrap">
                      <input
                        id="login-email"
                        type="email"
                        className="ig-input"
                        placeholder="Phone number, username or email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>

                    <button
                      id="login-continue-btn"
                      type="submit"
                      className="ig-submit-btn"
                      disabled={loading || !email.trim()}
                    >
                      {loading ? <span className="ig-spinner" /> : "Continue"}
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="step2"
                    className="ig-form"
                    onSubmit={handleAuthSubmit}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isNewUser && (
                      <div className="ig-input-wrap">
                        <input
                          id="login-name"
                          type="text"
                          className="ig-input"
                          placeholder="Full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          autoComplete="name"
                        />
                      </div>
                    )}

                    <div className="ig-input-wrap">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        className="ig-input"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete={isNewUser ? "new-password" : "current-password"}
                      />
                      {password && (
                        <button
                          type="button"
                          className="ig-eye-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          <span className="ig-eye-icon">
                            {showPassword ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </span>
                        </button>
                      )}
                    </div>

                    <button
                      id="login-submit-btn"
                      type="submit"
                      className="ig-submit-btn"
                      disabled={loading || !password.trim()}
                    >
                      {loading ? (
                        <span className="ig-spinner" />
                      ) : isNewUser ? (
                        "Sign up"
                      ) : (
                        "Log in"
                      )}
                    </button>

                    <button
                      type="button"
                      className="ig-change-email"
                      onClick={() => {
                        setStep(1);
                        setPassword("");
                        setError("");
                      }}
                    >
                      Use a different email
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* OR Divider */}
              <div className="ig-divider">
                <div className="ig-divider-line" />
                <span className="ig-divider-text">OR</span>
                <div className="ig-divider-line" />
              </div>

              {/* Google Sign In */}
              <button
                id="login-google-btn"
                type="button"
                className="ig-google-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="ig-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Log in with Google
              </button>

              {/* Forgot Password */}
              <div className="ig-forgot">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Password recovery coming soon!");
                  }}
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Sign Up Box */}
            <div className="ig-signup-box">
              {isNewUser && step === 2
                ? "Already have an account? "
                : "Don't have an account? "}
              <a
                id="login-signup-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Reset to email step but mark as new user flow
                  setStep(1);
                  setEmail("");
                  setPassword("");
                  setName("");
                  setError("");
                }}
              >
                {isNewUser && step === 2 ? "Log in" : "Sign up"}
              </a>
            </div>

            {/* App Store Badges */}
            <div className="ig-badges">
              <p>Get the app.</p>
              <div className="ig-badge-row">
                <a
                  href="#"
                  className="ig-badge"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Download on App Store"
                >
                  <svg width="18" height="22" viewBox="0 0 24 28" fill="white">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.37.74 3.18.78 1.21-.24 2.37-.94 3.67-.84 1.56.13 2.74.8 3.5 2.06-3.22 1.93-2.45 6.17.79 7.36-.57 1.62-1.32 3.22-3.14 4.52zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="ig-badge-text">
                    <span className="top">Download on the</span>
                    <span className="bottom">App Store</span>
                  </div>
                </a>
                <a
                  href="#"
                  className="ig-badge"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Get it on Google Play"
                >
                  <svg width="18" height="20" viewBox="0 0 24 26" fill="white">
                    <path d="M3.18 1.53C2.47 2.08 2 3.05 2 4.29v17.42c0 1.24.47 2.21 1.18 2.76l.14.11 9.75-9.75v-.23L3.32 1.42l-.14.11zM16.33 18.04l-3.25-3.25v-.23l3.25-3.25.07.04 3.85 2.19c1.1.63 1.1 1.64 0 2.27l-3.85 2.19-.07.04zM3.32 24.58c.37.39.87.62 1.42.52L14.8 18.1l-3.26-3.26-8.22 8.22.14.11.86.51z"/>
                  </svg>
                  <div className="ig-badge-text">
                    <span className="top">Get it on</span>
                    <span className="bottom">Google Play</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="ig-footer">
          <div className="ig-footer-links">
            {[
              "Meta", "About", "Blog", "Jobs", "Help", "API",
              "Privacy", "Terms", "Locations", "Instagram Lite",
              "Threads", "Contact Uploading & Non-Users",
            ].map((link) => (
              <a key={link} href="#" onClick={(e) => e.preventDefault()}>
                {link}
              </a>
            ))}
          </div>
          <p className="ig-footer-copy">
            English &nbsp;·&nbsp; © 2025 Pixora from Meta
          </p>
        </footer>
      </div>

      {/* ── Auth Simulator Modal ── */}
      <AnimatePresence>
        {showMockModal && (
          <motion.div
            className="ig-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMockModal(false)}
          >
            <motion.div
              className="ig-modal"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Log in with Google</h3>
              <p>
                Firebase is not configured in this environment. Select a test
                profile to continue:
              </p>

              {[
                { name: "Budi Rohman", email: "budiartirohman@gmail.com", avatar: "BR" },
                { name: "Michael Franz", email: "michael.franz@gmail.com", avatar: "MF" },
                { name: "Sarah Jenkins", email: "sarah_bakes@gmail.com", avatar: "SJ" },
              ].map((p) => (
                <button
                  key={p.email}
                  type="button"
                  className="ig-modal-profile-btn"
                  onClick={() => handleMockSignIn(p.email, p.name)}
                >
                  <div className="ig-modal-avatar">{p.avatar}</div>
                  <div className="ig-modal-info">
                    <span className="nm">{p.name}</span>
                    <span className="em">{p.email}</span>
                  </div>
                  <ArrowRight size={14} color="#8e8e8e" />
                </button>
              ))}

              <div className="ig-modal-divider">
                <div className="ig-modal-divider-line" />
                <span className="ig-modal-divider-text">or custom</span>
                <div className="ig-modal-divider-line" />
              </div>

              <input
                type="text"
                className="ig-modal-input"
                placeholder="Name"
                value={mockName}
                onChange={(e) => setMockName(e.target.value)}
              />
              <input
                type="email"
                className="ig-modal-input"
                placeholder="Email"
                value={mockEmail}
                onChange={(e) => setMockEmail(e.target.value)}
              />

              <div className="ig-modal-actions">
                <button
                  type="button"
                  className="ig-modal-close"
                  onClick={() => setShowMockModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ig-modal-inject"
                  onClick={() =>
                    handleMockSignIn(
                      mockEmail || "sandbox_user@gmail.com",
                      mockName || "Sandbox User"
                    )
                  }
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
