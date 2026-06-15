"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { api, removeAuthToken, getAuthToken, getOptimizedImageUrl } from "@/utils/api";
import DetailModal from "@/components/DetailModal";
import { motion } from "framer-motion";
import {
  Home, Search, Compass, Film, MessageSquare, LogOut,
  Heart, Bookmark, Calendar, User, ChevronLeft, Bell, PlusCircle, Settings, Grid3x3
} from "lucide-react";

const CATEGORY_EMOJIS = {
  "Nature": "🌲", "Technology": "💻", "Recipes": "🍕", "Travel": "✈️",
  "Design": "🎨", "Artificial Intelligence": "🤖", "Education": "📚",
  "Photography": "📷", "Fitness": "🏋️"
};

function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function PixoraWordmark({ small = false }) {
  return (
    <svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ height: small ? "28px" : "36px", width: "auto" }}>
      <defs>
        <linearGradient id="pf-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#833ab4" />
          <stop offset="50%" stopColor="#fd1d1d" />
          <stop offset="100%" stopColor="#fcb045" />
        </linearGradient>
      </defs>
      <text x="10" y="44" fontFamily="'Dancing Script', cursive" fontSize="44" fontWeight="700" fill="url(#pf-logo-grad)" letterSpacing="-1">Pixora</text>
    </svg>
  );
}

// Instagram-style sidebar nav item
function SideNavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "12px 12px",
        borderRadius: "8px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        transition: "background 0.15s ease",
        color: "#f5f5f5",
        fontSize: "16px",
        fontWeight: active ? "700" : "400",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        textAlign: "left",
        position: "relative",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ display: "flex", alignItems: "center", flexShrink: 0, position: "relative" }}>
        {icon}
        {badge && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            background: "#ed4956", color: "#fff",
            fontSize: "10px", fontWeight: "700",
            borderRadius: "50%", width: "16px", height: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{badge}</span>
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

function ProfileContent() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("saved");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!getAuthToken()) { router.push("/login"); return; }
    api.getProfile()
      .then(setProfile)
      .catch(() => { removeAuthToken(); router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => { removeAuthToken(); router.push("/login"); };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid #363636", borderTopColor: "#0095f6", borderRadius: "50%", animation: "ig-profile-spin 0.7s linear infinite" }} />
        <style>{`@keyframes ig-profile-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!profile) return null;

  const { user, saved_posts, liked_posts, recent_activities } = profile;
  const initials = user.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const sortedInterests = Object.entries(user.interests || {}).sort((a, b) => b[1] - a[1]);
  const posts = activeTab === "saved" ? saved_posts : activeTab === "liked" ? liked_posts : [];
  const postCount = (saved_posts?.length || 0) + (liked_posts?.length || 0);
  const username = user.email?.split("@")[0] || "pixora_user";

  const navItems = [
    { id: "home", label: "Home", icon: <Home size={24} /> },
    { id: "explore", label: "Explore", icon: <Compass size={24} /> },
    { id: "reels", label: "For You", icon: <Film size={24} /> },
    { id: "profile", label: "Profile", icon: (
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "9px", fontWeight: "700", outline: "2px solid #fff", outlineOffset: 1 }}>
        {initials}
      </div>
    ), active: true },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        @keyframes ig-profile-spin { to { transform: rotate(360deg); } }

        .igp-page {
          min-height: 100vh;
          background: #000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #f5f5f5;
          display: flex;
        }

        /* ── Sidebar ── */
        .igp-sidebar {
          width: 245px;
          min-height: 100vh;
          position: fixed;
          top: 0; left: 0;
          background: #000;
          border-right: 1px solid #262626;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px 12px;
          z-index: 40;
        }
        @media (max-width: 768px) { .igp-sidebar { display: none; } }

        .igp-sidebar-logo { padding: 16px 12px 24px; }

        /* ── Mobile Header ── */
        .igp-mobile-header {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          background: #000;
          border-bottom: 1px solid #262626;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 40;
        }
        @media (max-width: 768px) { .igp-mobile-header { display: flex; } }

        /* ── Main Content ── */
        .igp-main {
          flex: 1;
          padding-left: 245px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 0;
          padding-bottom: 80px;
        }
        @media (max-width: 768px) {
          .igp-main { padding-left: 0; padding-top: 56px; padding-bottom: 64px; }
        }

        .igp-content {
          width: 100%;
          max-width: 935px;
          padding: 30px 20px 0;
        }

        /* ── Profile Header ── */
        .igp-profile-header {
          display: flex;
          gap: 48px;
          align-items: flex-start;
          padding-bottom: 24px;
          border-bottom: 1px solid #262626;
          margin-bottom: 16px;
        }
        @media (max-width: 600px) {
          .igp-profile-header { gap: 24px; }
        }

        .igp-avatar-col { flex-shrink: 0; }

        .igp-avatar {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          color: #fff;
          border: 3px solid #dbdbdb;
          padding: 3px;
          box-sizing: border-box;
        }
        .igp-avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          color: #f5f5f5;
          overflow: hidden;
        }
        @media (max-width: 600px) {
          .igp-avatar { width: 80px; height: 80px; }
          .igp-avatar-inner { font-size: 28px; }
        }

        .igp-info-col { flex: 1; min-width: 0; }

        .igp-username-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .igp-username {
          font-size: 20px;
          font-weight: 300;
          color: #f5f5f5;
        }
        .igp-btn {
          height: 32px;
          padding: 0 16px;
          border-radius: 8px;
          border: 1px solid #363636;
          background: transparent;
          color: #f5f5f5;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
          white-space: nowrap;
        }
        .igp-btn:hover { background: #1a1a1a; }
        .igp-btn-primary {
          background: #0095f6;
          border-color: #0095f6;
          color: #fff;
        }
        .igp-btn-primary:hover { background: #1877f2; border-color: #1877f2; }

        .igp-stats {
          display: flex;
          gap: 32px;
          margin-bottom: 16px;
        }
        .igp-stat { text-align: center; }
        .igp-stat-num {
          font-size: 16px;
          font-weight: 700;
          color: #f5f5f5;
          display: block;
        }
        .igp-stat-label {
          font-size: 14px;
          color: #f5f5f5;
        }

        .igp-bio {
          font-size: 14px;
          color: #f5f5f5;
          line-height: 1.5;
          margin: 0;
        }
        .igp-display-name {
          font-weight: 700;
          font-size: 14px;
          color: #f5f5f5;
          margin: 0 0 4px;
        }

        /* ── Highlights ── */
        .igp-highlights {
          display: flex;
          gap: 20px;
          padding: 16px 0 8px;
          overflow-x: auto;
          border-bottom: 1px solid #262626;
          margin-bottom: 0;
        }
        .igp-highlight-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .igp-highlight-circle {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          border: 2px solid #363636;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: transform 0.15s ease;
        }
        .igp-highlight-item:hover .igp-highlight-circle { transform: scale(1.05); }
        .igp-highlight-label {
          font-size: 12px;
          color: #f5f5f5;
          text-align: center;
          max-width: 70px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Tabs ── */
        .igp-tabs {
          display: flex;
          justify-content: center;
          border-bottom: 1px solid #262626;
          gap: 0;
        }
        .igp-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 16px 24px;
          background: transparent;
          border: none;
          border-top: 2px solid transparent;
          margin-top: -1px;
          cursor: pointer;
          color: #8e8e8e;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .igp-tab.active {
          color: #f5f5f5;
          border-top-color: #f5f5f5;
        }
        .igp-tab:hover:not(.active) { color: #aaa; }

        /* ── Grid ── */
        .igp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px;
          margin-top: 3px;
        }
        .igp-grid-item {
          aspect-ratio: 1;
          overflow: hidden;
          background: #262626;
          cursor: pointer;
          position: relative;
        }
        .igp-grid-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }
        .igp-grid-item:hover img { transform: scale(1.03); }
        .igp-grid-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          transition: opacity 0.2s ease;
        }
        .igp-grid-item:hover .igp-grid-overlay { opacity: 1; }
        .igp-grid-stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ── Empty state ── */
        .igp-empty {
          text-align: center;
          padding: 64px 24px;
          color: #8e8e8e;
          font-size: 14px;
        }
        .igp-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2px solid #363636;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        /* ── Activity logs ── */
        .igp-activity-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px 0;
          max-width: 600px;
          margin: 0 auto;
        }
        .igp-activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #1a1a1a;
          border: 1px solid #262626;
          border-radius: 8px;
        }
        .igp-activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #262626;
          border: 1px solid #363636;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .igp-activity-text {
          flex: 1;
          min-width: 0;
        }
        .igp-activity-desc {
          font-size: 13px;
          color: #f5f5f5;
          margin: 0 0 2px;
          line-height: 1.4;
        }
        .igp-activity-time {
          font-size: 11px;
          color: #8e8e8e;
        }

        /* ── Mobile Bottom Nav ── */
        .igp-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 56px;
          background: #000;
          border-top: 1px solid #262626;
          align-items: center;
          justify-content: space-around;
          z-index: 40;
        }
        @media (max-width: 768px) { .igp-bottom-nav { display: flex; } }
        .igp-bottom-nav-btn {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Toast ── */
        .igp-toast {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a1a;
          color: #f5f5f5;
          border: 1px solid #363636;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 6px;
          z-index: 9999;
          white-space: nowrap;
        }

        /* ── Sidebar user row ── */
        .igp-sidebar-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .igp-sidebar-user:hover { background: #1a1a1a; }
        .igp-sidebar-user-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0;
        }
        .igp-sidebar-user-info { flex: 1; min-width: 0; }
        .igp-sidebar-username {
          font-size: 14px; font-weight: 600; color: #f5f5f5;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .igp-sidebar-handle {
          font-size: 12px; color: #8e8e8e;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>

      <div className="igp-page">

        {/* ── Left Sidebar (Desktop) ── */}
        <aside className="igp-sidebar">
          <div>
            <div className="igp-sidebar-logo">
              <PixoraWordmark />
            </div>
            <nav>
              {navItems.map(item => (
                <SideNavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={item.active}
                  badge={item.badge}
                  onClick={() => {
                    if (item.id === "profile") return;
                    if (item.id === "home") { router.push("/"); return; }
                    router.push(`/?tab=${item.id}`);
                  }}
                />
              ))}
            </nav>
          </div>

          {/* Sidebar bottom: user + logout */}
          <div>
            <div className="igp-sidebar-user" onClick={() => {}}>
              <div className="igp-sidebar-user-avatar">{initials}</div>
              <div className="igp-sidebar-user-info">
                <div className="igp-sidebar-username">{user.name}</div>
                <div className="igp-sidebar-handle">@{username}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                title="Logout"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#8e8e8e", display: "flex", alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.color = "#ed4956"}
                onMouseLeave={e => e.currentTarget.style.color = "#8e8e8e"}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Mobile Header ── */}
        <header className="igp-mobile-header">
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ChevronLeft size={24} color="#f5f5f5" />
          </button>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#f5f5f5" }}>{username}</span>
          <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "#ed4956", fontSize: 13, fontWeight: 700 }}>
            Log out
          </button>
        </header>

        {/* ── Main Content ── */}
        <main className="igp-main">
          <div className="igp-content">

            {/* Profile Header */}
            <div className="igp-profile-header">
              {/* Avatar */}
              <div className="igp-avatar-col">
                <div className="igp-avatar">
                  <div className="igp-avatar-inner">{initials}</div>
                </div>
              </div>

              {/* Info */}
              <div className="igp-info-col">
                {/* Username row */}
                <div className="igp-username-row">
                  <span className="igp-username">{username}</span>
                  <button className="igp-btn" onClick={() => showToast("Edit profile coming soon!")}>Edit profile</button>
                  <button className="igp-btn" onClick={() => showToast("Archive coming soon!")}>View archive</button>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "#262626", padding: 4 }} onClick={() => showToast("Settings coming soon!")}>
                    <Settings size={20} />
                  </button>
                </div>

                {/* Stats */}
                <div className="igp-stats">
                  <div className="igp-stat">
                    <span className="igp-stat-num">{postCount}</span>
                    <span className="igp-stat-label">posts</span>
                  </div>
                  <div className="igp-stat">
                    <span className="igp-stat-num">348</span>
                    <span className="igp-stat-label">followers</span>
                  </div>
                  <div className="igp-stat">
                    <span className="igp-stat-num">182</span>
                    <span className="igp-stat-label">following</span>
                  </div>
                </div>

                {/* Bio */}
                <p className="igp-display-name">{user.name}</p>
                <p className="igp-bio">
                  {user.bio || `Exploring visual categories on Pixora. Curating the best content daily. ✨`}
                </p>
              </div>
            </div>

            {/* Highlights Row */}
            {sortedInterests.length > 0 && (
              <div className="igp-highlights">
                {sortedInterests.slice(0, 8).map(([cat]) => (
                  <div key={cat} className="igp-highlight-item">
                    <div className="igp-highlight-circle">
                      {CATEGORY_EMOJIS[cat] || "✨"}
                    </div>
                    <span className="igp-highlight-label">{cat.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="igp-tabs">
              {[
                { id: "saved", label: "Posts", icon: <Grid3x3 size={12} /> },
                { id: "liked", label: "Liked", icon: <Heart size={12} /> },
                { id: "activity", label: "Tagged", icon: <Calendar size={12} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`igp-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ marginTop: 0 }}>
              {activeTab !== "activity" ? (
                posts && posts.length > 0 ? (
                  <div className="igp-grid">
                    {posts.map(item => (
                      <div
                        key={item.id}
                        className="igp-grid-item"
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <img
                          src={getOptimizedImageUrl(item.thumbnail_url, item.image_url)}
                          alt={item.title}
                          loading="lazy"
                        />
                        <div className="igp-grid-overlay">
                          <div className="igp-grid-stat">
                            <Heart size={16} fill="white" color="white" />
                            {fmtNum(item.likes)}
                          </div>
                          <div className="igp-grid-stat">
                            <span>👁</span>
                            {fmtNum(item.views)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="igp-empty">
                    <div className="igp-empty-icon">
                      <Bookmark size={28} color="#dbdbdb" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 22, color: "#262626", margin: "0 0 8px" }}>No Posts Yet</p>
                    <p style={{ margin: 0 }}>When you save or like posts, they'll appear here.</p>
                  </div>
                )
              ) : (
                recent_activities && recent_activities.length > 0 ? (
                  <div className="igp-activity-list">
                    {recent_activities.slice(0, 10).map((act, i) => (
                      <div key={i} className="igp-activity-item">
                        <div className="igp-activity-icon">
                          {act.action === "like" ? "❤️" : act.action === "save" ? "🔖" : act.action === "view" ? "👁️" : "💬"}
                        </div>
                        <div className="igp-activity-text">
                          <p className="igp-activity-desc">
                            You {act.action === "like" ? "liked" : act.action === "save" ? "saved" : act.action === "view" ? "viewed" : "commented on"}{" "}
                            <strong>{act.content_title || "a post"}</strong>
                          </p>
                          <span className="igp-activity-time">
                            {new Date(act.timestamp).toLocaleDateString()} · {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="igp-empty">
                    <div className="igp-empty-icon">
                      <Calendar size={28} color="#dbdbdb" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 22, color: "#262626", margin: "0 0 8px" }}>No Activity Yet</p>
                    <p style={{ margin: 0 }}>Your activity on Pixora will show up here.</p>
                  </div>
                )
              )}
            </div>

          </div>
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="igp-bottom-nav">
          {[
            { icon: <Home size={24} />, onClick: () => router.push("/") },
            { icon: <Compass size={24} />, onClick: () => router.push("/?tab=explore") },
            { icon: <Film size={24} />, onClick: () => router.push("/?tab=reels") },
            { icon: <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "10px", fontWeight: "700", border: "2px solid #262626" }}>{initials}</div>, active: true },
          ].map((item, i) => (
            <button key={i} className="igp-bottom-nav-btn" onClick={item.onClick}>
              {item.icon}
            </button>
          ))}
        </nav>

        {/* Detail Modal */}
        {selectedItemId && (
          <DetailModal
            itemId={selectedItemId}
            onClose={() => setSelectedItemId(null)}
            onNavigateToItem={setSelectedItemId}
          />
        )}

        {/* Toast */}
        {toast && <div className="igp-toast">{toast}</div>}
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid #dbdbdb", borderTopColor: "#0095f6", borderRadius: "50%", animation: "ig-profile-spin 0.7s linear infinite" }} />
        <style>{`@keyframes ig-profile-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
