"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, getAuthToken } from "@/utils/api";

const ONBOARDING_CATEGORIES = [
  { label: "Weddings", backendCat: "Travel", img: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=300&auto=format&fit=crop" },
  { label: "Cars", backendCat: "Technology", img: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?q=80&w=300&auto=format&fit=crop" },
  { label: "Relaxation", backendCat: "Photography", img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=300&auto=format&fit=crop" },
  { label: "Workouts", backendCat: "Fitness", img: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop" },
  { label: "Small spaces", backendCat: "Design", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=300&auto=format&fit=crop" },
  { label: "Anime & comics", backendCat: "Artificial Intelligence", img: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&auto=format&fit=crop" },
  { label: "Home décor", backendCat: "Nature", img: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=300&auto=format&fit=crop" },
  { label: "Home renovation", backendCat: "Education", img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=300&auto=format&fit=crop" },
  { label: "Cute greetings", backendCat: "Recipes", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=300&auto=format&fit=crop" },
];

function PixoraWordmark() {
  return (
    <svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: "42px", width: "auto" }}>
      <defs>
        <linearGradient id="ob-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#833ab4" />
          <stop offset="50%" stopColor="#fd1d1d" />
          <stop offset="100%" stopColor="#fcb045" />
        </linearGradient>
      </defs>
      <text x="10" y="44" fontFamily="'Dancing Script', cursive" fontSize="44" fontWeight="700" fill="url(#ob-logo-grad)" letterSpacing="-1">Pixora</text>
    </svg>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAuthToken()) { router.push("/login"); }
  }, [router]);

  const toggleSelect = (backendCat) => {
    setSelected(prev =>
      prev.includes(backendCat)
        ? prev.filter(i => i !== backendCat)
        : [...prev, backendCat]
    );
  };

  const handleComplete = async () => {
    if (selected.length < 3) {
      setError("Please select at least 3 interests to continue.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.submitOnboarding(selected);
      router.push("/");
    } catch (err) {
      setError(err.message || "Failed to save interests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const remaining = Math.max(0, 3 - selected.length);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');

        .ob-page {
          min-height: 100vh;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #262626;
        }

        .ob-header {
          width: 100%;
          max-width: 600px;
          padding: 32px 24px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }

        .ob-step-dots {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .ob-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #dbdbdb;
        }
        .ob-dot.active {
          background: #262626;
          width: 20px;
          border-radius: 3px;
        }

        .ob-title {
          font-size: 22px;
          font-weight: 700;
          color: #262626;
          line-height: 1.2;
          margin: 0;
        }

        .ob-subtitle {
          font-size: 14px;
          color: #8e8e8e;
          margin: 0;
        }

        .ob-error {
          width: 100%;
          max-width: 600px;
          padding: 0 24px;
          color: #ed4956;
          font-size: 13px;
          text-align: center;
          margin-top: 8px;
        }

        .ob-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 20px 24px 120px;
          width: 100%;
          max-width: 600px;
          overflow-y: auto;
        }
        @media (min-width: 480px) {
          .ob-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .ob-card {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          aspect-ratio: 4/5;
          border: 3px solid transparent;
          transition: border-color 0.2s ease, transform 0.15s ease;
          background: #dbdbdb;
        }
        .ob-card.selected {
          border-color: #0095f6;
          transform: scale(0.97);
        }
        .ob-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ob-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%);
        }
        .ob-card-label {
          position: absolute;
          bottom: 8px;
          left: 6px;
          right: 6px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          line-height: 1.3;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
        .ob-card-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #0095f6;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        .ob-card-selected-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 149, 246, 0.12);
        }

        .ob-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(250,250,250,0.95);
          backdrop-filter: blur(8px);
          border-top: 1px solid #dbdbdb;
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 50;
        }

        .ob-next-btn {
          width: 100%;
          max-width: 360px;
          height: 44px;
          background: #0095f6;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .ob-next-btn:hover:not(:disabled) { background: #1877f2; }
        .ob-next-btn:disabled {
          background: #b2dffc;
          cursor: not-allowed;
        }

        .ob-count-text {
          font-size: 12px;
          color: #8e8e8e;
        }
        .ob-count-text strong {
          color: #262626;
        }
      `}</style>

      <div className="ob-page">
        {/* Header */}
        <div className="ob-header">
          <PixoraWordmark />

          <div className="ob-step-dots">
            <div className="ob-dot" />
            <div className="ob-dot" />
            <div className="ob-dot active" />
          </div>

          <h1 className="ob-title">Choose your interests</h1>
          <p className="ob-subtitle">Select at least 3 to personalise your Pixora experience.</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              className="ob-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Category Grid */}
        <div className="ob-grid">
          {ONBOARDING_CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.backendCat);
            return (
              <motion.div
                key={cat.label}
                className={`ob-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleSelect(cat.backendCat)}
                whileTap={{ scale: 0.95 }}
              >
                <img src={cat.img} alt={cat.label} />
                <div className="ob-card-overlay" />
                {isSelected && <div className="ob-card-selected-overlay" />}
                <div className="ob-card-label">{cat.label}</div>
                {isSelected && (
                  <div className="ob-card-check">
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Sticky Footer */}
        <div className="ob-footer">
          {remaining > 0 && (
            <p className="ob-count-text">
              Select <strong>{remaining} more</strong> to continue
            </p>
          )}
          <button
            className="ob-next-btn"
            onClick={handleComplete}
            disabled={loading || selected.length < 3}
          >
            {loading ? "Saving…" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
}
