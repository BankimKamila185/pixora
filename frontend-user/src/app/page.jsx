"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getAuthToken, removeAuthToken, getOptimizedImageUrl, getCategoryFallback } from "@/utils/api";
import DetailModal from "@/components/DetailModal";
import TransitionScreen from "@/components/TransitionScreen";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Search, Compass, Film, MessageSquare, Bell, PlusCircle,
  LogOut, User, Heart, Bookmark, Share2, Send,
  ChevronLeft, ChevronRight, X, MoreHorizontal, Grid3x3
} from "lucide-react";

/* ── Constants ── */
const CATEGORY_ICONS = {
  "Nature": "🌲", "Technology": "💻", "Recipes": "🍕", "Travel": "✈️",
  "Design": "🎨", "Artificial Intelligence": "🤖", "Education": "📚",
  "Photography": "📷", "Fitness": "🏋️"
};

const CREATOR_MAP = {
  "Nature": { name: "Budiarti Rohman", handle: "budiartirohman" },
  "Technology": { name: "Michael Franz", handle: "michael_franz" },
  "Recipes": { name: "Sarah Jenkins", handle: "sarah_bakes" },
  "Travel": { name: "Alex Wanderer", handle: "alex_wander" },
  "Design": { name: "Michelle Soedibjo", handle: "michelle_soedibjo" },
  "Artificial Intelligence": { name: "NeuralDreamer", handle: "neural_dream" },
  "Education": { name: "Learn Daily", handle: "learn_daily" },
  "Photography": { name: "ISO Studio", handle: "iso_studio" },
  "Fitness": { name: "Active Core", handle: "active_core" },
};
const getCreator = (cat) => CREATOR_MAP[cat] || { name: "Pixora User", handle: "pixora_user" };

const HASHTAGS = {
  "Nature": "#nature #earthpix #natgeo",
  "Technology": "#tech #coding #workspace",
  "Recipes": "#foodie #cooking #homechef",
  "Travel": "#travel #wanderlust #explore",
  "Design": "#design #interior #minimal",
  "Artificial Intelligence": "#ai #machinelearning #deeplearning",
  "Education": "#learning #knowledge #edu",
  "Photography": "#photography #bokeh #portrait",
  "Fitness": "#fitness #workout #health",
};

const STORY_AVATARS = [
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format",
];

const MOCK_CONTACTS = [
  { id: "visual_poet", name: "Visual Poet", initials: "VP", lastMessage: "Absolutely loved your feed curation! 🔥", time: "10m", color: "#a855f7" },
  { id: "design_kira", name: "Design Kira", initials: "DK", lastMessage: "Let me check the assets folder.", time: "1h", color: "#ec4899" },
  { id: "photo_mike", name: "Photo Mike", initials: "PM", lastMessage: "We should do a collaboration sometime.", time: "4h", color: "#3b82f6" },
  { id: "nature_vibe", name: "Nature Vibe", initials: "NV", lastMessage: "Starred your latest landscape photo!", time: "1d", color: "#10b981" },
  { id: "code_jay", name: "Code Jay", initials: "CJ", lastMessage: "The new recommendation model looks great.", time: "2d", color: "#f59e0b" },
];

const MOCK_CHAT_HISTORY = {
  "visual_poet": [
    { id: "1", sender_id: "visual_poet", message_text: "Hey! Welcome to Pixora.", timestamp: "2026-06-14T10:00:00Z" },
    { id: "2", sender_id: "me", message_text: "Hi! Thanks for reaching out. The feed is amazing.", timestamp: "2026-06-14T10:02:00Z" },
    { id: "3", sender_id: "visual_poet", message_text: "Absolutely loved your feed curation! 🔥", timestamp: "2026-06-14T10:05:00Z" }
  ],
  "design_kira": [
    { id: "1", sender_id: "design_kira", message_text: "Are you working on the new graphics?", timestamp: "2026-06-14T08:00:00Z" },
    { id: "2", sender_id: "me", message_text: "Yes, I'm setting up the layout now.", timestamp: "2026-06-14T08:15:00Z" },
    { id: "3", sender_id: "design_kira", message_text: "Let me check the assets folder.", timestamp: "2026-06-14T09:00:00Z" }
  ]
};

const SUGGESTED_USERS = [
  { name: "Alex Wanderer", handle: "alex_wander", initials: "AW", img: STORY_AVATARS[0] },
  { name: "ISO Studio", handle: "iso_studio", initials: "IS", img: STORY_AVATARS[1] },
  { name: "Active Core", handle: "active_core", initials: "AC", img: STORY_AVATARS[2] },
  { name: "NeuralDreamer", handle: "neural_dream", initials: "ND", img: STORY_AVATARS[3] },
  { name: "Learn Daily", handle: "learn_daily", initials: "LD", img: STORY_AVATARS[4] },
];

function isSystemDesc(s) {
  return s?.toLowerCase().includes("google drive asset") || s?.toLowerCase().includes("imported into the");
}

function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

/* ── Instagram Camera Logo SVG ── */
function InstagramCameraIcon() {
  return (
    <svg aria-label="Pixora" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 24, height: 24 }}>
      <defs>
        <linearGradient id="ig-cam-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="25%" stopColor="#fa7e1e" />
          <stop offset="50%" stopColor="#d62976" />
          <stop offset="75%" stopColor="#962fbf" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#ig-cam-grad)" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="4" stroke="url(#ig-cam-grad)" strokeWidth="2" fill="none" />
      <circle cx="17.5" cy="6.5" r="1" fill="url(#ig-cam-grad)" />
    </svg>
  );
}

function PixoraWordmark() {
  return (
    <svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 32, width: "auto" }}>
      <defs>
        <linearGradient id="hf-logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#833ab4" />
          <stop offset="50%" stopColor="#fd1d1d" />
          <stop offset="100%" stopColor="#fcb045" />
        </linearGradient>
      </defs>
      <text x="10" y="44" fontFamily="'Dancing Script', cursive" fontSize="44" fontWeight="700" fill="url(#hf-logo-g)" letterSpacing="-1">Pixora</text>
    </svg>
  );
}

/* ── Post Card ── */
function PostCard({ item, onOpen, avatarImg }) {
  const [liked, setLiked] = useState(item.liked_by_user || false);
  const [saved, setSaved] = useState(item.saved_by_user || false);
  const [likesCount, setLikesCount] = useState(item.likes || 0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [likeScale, setLikeScale] = useState(1);
  const [comments, setComments] = useState([
    { user: "alex_wander", text: "Stunning shot! 😍" },
    { user: "design_kira", text: "Pure aesthetic vibes ✨" }
  ]);
  const [newComment, setNewComment] = useState("");
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // ── Dwell-time tracking (Instagram-style: time in viewport = signal) ──
  const cardRef = useRef(null);
  const dwellStartRef = useRef(null);
  const dwellReportedRef = useRef(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          dwellStartRef.current = Date.now();
          dwellReportedRef.current = false;
        } else {
          if (dwellStartRef.current && !dwellReportedRef.current) {
            const seconds = (Date.now() - dwellStartRef.current) / 1000;
            // Only report if user spent at least 2 seconds on this post (meaningful signal)
            if (seconds >= 2) {
              dwellReportedRef.current = true;
              api.trackWatch(item.id, Math.round(seconds)).catch(() => {});
            }
            dwellStartRef.current = null;
          }
        }
      },
      { threshold: 0.6 } // 60% of card must be visible
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [item.id]);

  const creator = getCreator(item.category);
  const primaryImgUrl = getOptimizedImageUrl(item.thumbnail_url, item.image_url);
  const imgUrl = imgError ? getCategoryFallback(item.category) : primaryImgUrl;

  // ── BUG FIX: use functional updater so we don't close over stale `liked` ──
  const likedRef = useRef(liked);
  useEffect(() => { likedRef.current = liked; }, [liked]);

  const handleLike = async () => {
    setLikeScale(0.7);
    setTimeout(() => setLikeScale(1.35), 100);
    setTimeout(() => setLikeScale(1), 250);
    try {
      const r = await api.toggleLike(item.id);
      setLiked(r.liked); setLikesCount(r.likes);
    } catch {
      // Use ref so we always read the CURRENT value, not stale closure value
      const wasLiked = likedRef.current;
      setLiked(!wasLiked);
      setLikesCount(p => wasLiked ? Math.max(0, p - 1) : p + 1);
    }
  };

  const handleSave = async () => {
    try { const r = await api.toggleSave(item.id); setSaved(r.saved); }
    catch { setSaved(p => !p); }
  };

  const handleDoubleClick = () => {
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 900);
    if (!liked) { setLiked(true); setLikesCount(p => p + 1); api.toggleLike(item.id).catch(() => {}); }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments(p => [...p, { user: "you", text: newComment }]);
    setNewComment("");
    api.postComment(item.id, newComment).catch(() => {});
  };

  return (
    <article ref={cardRef} style={{
      background: "#000",
      borderBottom: "1px solid #262626",
      marginBottom: 0,
      maxWidth: 470,
      width: "100%",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Story ring with real image */}
          <div style={{ width: 38, height: 38, borderRadius: "50%", padding: 2, background: "linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)", flexShrink: 0 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "2px solid #000", overflow: "hidden", background: "#262626" }}>
              <img src={avatarImg} alt={creator.handle} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.currentTarget.style.display = "none"; }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#f5f5f5", cursor: "pointer" }}>{creator.handle}</span>
              <span style={{ color: "#a8a8a8", fontSize: 13, lineHeight: 1 }}>•</span>
              <span style={{ fontSize: 13, color: "#a8a8a8" }}>2h</span>
            </div>
            {/* Show real category as "Recommended because you liked {category}" */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#a8a8a8" }}>Based on your </span>
              <span style={{ fontSize: 12, color: "#0095f6", fontWeight: 600 }}>{CATEGORY_ICONS[item.category] || "📷"} {item.category}</span>
              <span style={{ fontSize: 12, color: "#a8a8a8" }}> interest</span>
            </div>
          </div>
        </div>
        <button onClick={onOpen} style={{ background: "none", border: "none", cursor: "pointer", color: "#f5f5f5", padding: 4, display: "flex" }}>
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Image — full width, no rounded corners */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1", background: "#1a1a1a", overflow: "hidden" }} onDoubleClick={handleDoubleClick}>
        {/* Skeleton shimmer shown until image loads */}
        {!imgLoaded && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#1a1a1a 25%,#2a2a2a 50%,#1a1a1a 75%)", backgroundSize: "200% 100%", animation: "hf-shimmer 1.5s infinite" }} />
        )}
        <img
          src={imgUrl}
          alt={item.title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            if (!imgError) {
              setImgError(true);
              setImgLoaded(false);
            } else {
              setImgLoaded(true); // fallback loaded
            }
          }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: imgLoaded ? "block" : "block", opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s ease" }}
        />
        <AnimatePresence>
          {showHeartPop && (
            <motion.div
              style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <Heart size={90} fill="white" color="white" style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.5))" }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div style={{ padding: "8px 12px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 14 }}>
          <motion.button onClick={handleLike} animate={{ scale: likeScale }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: liked ? "#ed4956" : "#f5f5f5" }}>
            <Heart size={24} fill={liked ? "#ed4956" : "none"} />
          </motion.button>
          <button onClick={onOpen} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: "#f5f5f5" }}>
            <MessageSquare size={24} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: "#f5f5f5" }}>
            {/* Share icon — angled paper plane like Instagram */}
            <Share2 size={24} />
          </button>
        </div>
        <button onClick={handleSave} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: "#f5f5f5" }}>
          <Bookmark size={24} fill={saved ? "#f5f5f5" : "none"} />
        </button>
      </div>

      {/* Caption area */}
      <div style={{ padding: "2px 16px 14px" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5", margin: "0 0 6px" }}>{fmtNum(likesCount)} likes</p>
        <p style={{ fontSize: 14, color: "#f5f5f5", margin: "0 0 4px", lineHeight: 1.55 }}>
          <span style={{ fontWeight: 700, marginRight: 6, cursor: "pointer" }}>{creator.handle}</span>
          <span>{item.title}</span>
        </p>
        {!isSystemDesc(item.description) && (
          <p style={{ fontSize: 14, color: "#f5f5f5", margin: "0 0 4px", lineHeight: 1.55, opacity: 0.7 }}>{item.description}</p>
        )}
        <p style={{ fontSize: 14, color: "#0095f6", margin: "0 0 6px" }}>
          {HASHTAGS[item.category] || "#pixora"}
        </p>

        {comments.length > 0 && (
          <button onClick={onOpen} style={{ background: "none", border: "none", cursor: "pointer", color: "#a8a8a8", fontSize: 14, padding: 0, marginBottom: 4, display: "block", textAlign: "left" }}>
            View all {comments.length} comments
          </button>
        )}
        {comments.slice(-1).map((c, i) => (
          <p key={i} style={{ fontSize: 14, color: "#f5f5f5", margin: "2px 0" }}>
            <span style={{ fontWeight: 700, marginRight: 6 }}>{c.user}</span>
            <span style={{ color: "#f5f5f5" }}>{c.text}</span>
          </p>
        ))}
        <p style={{ fontSize: 11, color: "#a8a8a8", textTransform: "uppercase", letterSpacing: "0.3px", margin: "8px 0 0" }}>
          2 hours ago
        </p>
      </div>

      {/* Comment input */}
      <form onSubmit={handleAddComment} style={{ display: "flex", alignItems: "center", borderTop: "1px solid #262626", padding: "10px 16px", gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#333", flexShrink: 0, overflow: "hidden" }}>
          <img src={avatarImg} alt="you" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => {}} />
        </div>
        <input
          type="text"
          placeholder="Add a comment…"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "#f5f5f5", fontFamily: "inherit" }}
        />
        {newComment.trim() && (
          <button type="submit" style={{ background: "none", border: "none", cursor: "pointer", color: "#0095f6", fontSize: 14, fontWeight: 700, padding: 0, fontFamily: "inherit" }}>Post</button>
        )}
      </form>
    </article>
  );
}

/* ── Sidebar Nav Button ── */
function SideNavBtn({ icon, label, active, onClick, badge, collapsed }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={collapsed ? label : undefined}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        gap: collapsed ? 0 : 16,
        padding: collapsed ? "14px" : "12px 12px",
        borderRadius: 8,
        background: hover ? "rgba(255,255,255,0.1)" : "transparent",
        border: "none", cursor: "pointer", color: "#f5f5f5",
        fontSize: 16, fontWeight: active ? 700 : 400,
        fontFamily: "inherit", textAlign: "left", position: "relative",
        transition: "background 0.15s ease",
        justifyContent: collapsed ? "center" : "flex-start",
      }}
    >
      <span style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
        {icon}
        {badge && (
          <span style={{ position: "absolute", top: -6, right: -6, background: "#ed4956", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>
        )}
      </span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

/* ═══ Main Home Feed ═══ */
function HomeFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activePage, setActivePage] = useState("home");

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTrending, setIsTrending] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const feedEndRef = useRef(null);
  const searchRef = useRef(null);

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatBottomRef = useRef(null);

  const [reelsIdx, setReelsIdx] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [profile, setProfile] = useState(null);
  const [suggestedFollowed, setSuggestedFollowed] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // For You tab — separate state, fetched from trending (completely different from Home)
  const [forYouItems, setForYouItems] = useState([]);
  const [forYouLoading, setForYouLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && getAuthToken()) {
      api.getProfile().then(setProfile).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = getAuthToken();
      if (!token) { router.push("/login"); return; }
      const hasShown = sessionStorage.getItem("pixora_transition_shown");
      if (!hasShown) { setShowTransition(true); sessionStorage.setItem("pixora_transition_shown", "true"); }
    }
  }, [router]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    const trending = searchParams.get("trending");
    const contentId = searchParams.get("contentId");
    const tab = searchParams.get("tab");
    if (trending === "true") setIsTrending(true);
    if (contentId) setSelectedItemId(contentId);
    if (tab) {
      if (tab === "explore" || tab === "reels" || tab === "home") {
        setActivePage(tab);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true); setItems([]); setHasMore(true);
    async function fetchFeed() {
      try {
        let data;
        if (isTrending) data = await api.getTrending(0, 12);
        else if (selectedCategory) data = await api.getContent(selectedCategory, 0, 12);
        else data = await api.getContent(null, 0, 12);
        setItems(data);
        setHasMore(data.length === 12);
      } catch { showToast("Backend offline — showing demo content."); }
      finally { setLoading(false); }
    }
    fetchFeed();
  }, [selectedCategory, isTrending]);

  useEffect(() => {
    const obs = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && activePage === "home") {
        setLoadingMore(true);
        try {
          const nextPage = Math.floor(items.length / 12);
          let more = isTrending
            ? await api.getTrending(nextPage * 12, 12)
            : selectedCategory ? await api.getContent(selectedCategory, nextPage * 12, 12)
              : await api.getContent(null, nextPage * 12, 12);
          // ── BUG FIX: Deduplicate by id before appending to prevent duplicate posts ──
          setItems(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const fresh = more.filter(i => !existingIds.has(i.id));
            return [...prev, ...fresh];
          });
          setHasMore(more.length === 12);
        } catch { setHasMore(false); }
        finally { setLoadingMore(false); }
      }
    }, { threshold: 0.1 });
    if (feedEndRef.current) obs.observe(feedEndRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, items.length, selectedCategory, isTrending, activePage]);

  useEffect(() => { if (showSearch && searchRef.current) searchRef.current.focus(); }, [showSearch]);

  useEffect(() => {
    if (activePage === "messages") {
      api.getContacts().then(data => setContacts(data.length > 0 ? data : MOCK_CONTACTS)).catch(() => setContacts(MOCK_CONTACTS));
    }
    // For You: always re-fetch on tab open so content changes every time
    if (activePage === "reels") {
      setForYouLoading(true);
      setForYouItems([]);
      // Use a random skip offset (0–60) so we get different items from the trending pool each visit
      const randomSkip = Math.floor(Math.random() * 60);
      api.getTrending(randomSkip, 20)
        .then(data => {
          // If we got fewer than 10 items (hit end of pool), fetch from start instead
          if (data.length < 10) return api.getTrending(0, 20);
          return data;
        })
        .then(data => setForYouItems(data))
        .catch(() => setForYouItems([...items].sort(() => Math.random() - 0.5)))
        .finally(() => setForYouLoading(false));
    }
  }, [activePage]);

  useEffect(() => {
    if (selectedContact) {
      setLoadingMessages(true);
      api.getMessages(selectedContact.id)
        .then(setMessages)
        .catch(() => setMessages(MOCK_CHAT_HISTORY[selectedContact.id] || []))
        .finally(() => { setLoadingMessages(false); setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100); });
    }
  }, [selectedContact]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedContact) return;
    const txt = newMessageText; setNewMessageText("");
    const newMsg = { id: `m-${Date.now()}`, sender_id: "me", recipient_id: selectedContact.id, message_text: txt, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newMsg]);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    api.sendMessage(selectedContact.id, txt).catch(() => {});
  };

  const handleLogout = () => { removeAuthToken(); router.push("/login"); };

  const filteredItems = searchQuery
    ? items.filter(i => i.title?.toLowerCase().includes(searchQuery.toLowerCase()) || i.category?.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const userInitials = profile?.user?.name ? profile.user.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() : "U";
  const username = profile?.user?.email?.split("@")[0] || "pixora_user";

  const storyItems = [
    { label: "Your story", isYou: true, img: null, idx: -1 },
    ...categories.slice(0, 7).map((cat, i) => ({
      label: cat.split(" ")[0], isYou: false,
      img: STORY_AVATARS[i % STORY_AVATARS.length], idx: i, cat
    }))
  ];

  const navItems = [
    { id: "home", label: "Home", icon: <Home size={24} strokeWidth={activePage === "home" ? 2.5 : 1.5} /> },
    { id: "explore", label: "Explore", icon: <Compass size={24} strokeWidth={activePage === "explore" ? 2.5 : 1.5} /> },
    { id: "reels", label: "For You", icon: <Film size={24} strokeWidth={activePage === "reels" ? 2.5 : 1.5} /> },
    {
      id: "profile-nav", label: "Profile",
      icon: (
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 9, fontWeight: 700,
          outline: activePage === "profile-nav" ? "2px solid #fff" : "none",
          outlineOffset: 1,
        }}>{userInitials}</div>
      )
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        @keyframes hf-spin { to { transform: rotate(360deg); } }
        @keyframes hf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        * { box-sizing: border-box; }

        body { background: #000; }

        .hf-page {
          min-height: 100vh;
          background: #000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #f5f5f5;
          display: flex;
        }

        /* ── Sidebar ── */
        .hf-sidebar {
          width: 245px;
          min-height: 100vh;
          position: fixed;
          top: 0; left: 0;
          background: #000;
          border-right: 1px solid #262626;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px 12px 20px;
          z-index: 40;
          transition: width 0.2s ease;
        }
        .hf-sidebar.collapsed { width: 72px; }
        @media (max-width: 1263px) { .hf-sidebar { width: 72px; } }
        @media (max-width: 768px) { .hf-sidebar { display: none; } }

        .hf-sidebar-logo { padding: 16px 12px 24px; }
        .hf-sidebar.collapsed .hf-sidebar-logo { display: flex; justify-content: center; padding: 16px 12px 24px; }

        /* ── Mobile Header ── */
        .hf-mobile-header {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 54px;
          background: #000;
          border-bottom: 1px solid #262626;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 40;
        }
        @media (max-width: 768px) { .hf-mobile-header { display: flex; } }

        /* ── Main ── */
        .hf-main {
          flex: 1;
          padding-left: 245px;
          display: flex;
          justify-content: center;
          padding-top: 0;
          gap: 0;
          min-height: 100vh;
        }
        @media (max-width: 1263px) { .hf-main { padding-left: 72px; } }
        @media (max-width: 768px) { .hf-main { padding-left: 0; padding-top: 54px; padding-bottom: 60px; } }

        /* ── Center feed column ── */
        .hf-feed-col {
          width: 100%;
          max-width: 470px;
          padding-top: 24px;
          padding-bottom: 40px;
        }
        @media (max-width: 768px) { .hf-feed-col { max-width: 100%; padding-top: 0; } }

        /* ── Right panel ── */
        .hf-right-col {
          width: 319px;
          padding-top: 40px;
          padding-left: 32px;
          flex-shrink: 0;
        }
        @media (max-width: 1100px) { .hf-right-col { display: none; } }

        /* ── Stories ── */
        .hf-stories-wrap {
          border-bottom: 1px solid #262626;
          padding: 16px 0 16px;
          margin-bottom: 0;
          overflow-x: auto;
          display: flex;
          gap: 14px;
          scrollbar-width: none;
          padding-left: 16px;
          padding-right: 16px;
        }
        .hf-stories-wrap::-webkit-scrollbar { display: none; }

        .hf-story-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          min-width: 64px;
        }
        .hf-story-ring {
          width: 64px; height: 64px;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5);
        }
        .hf-story-ring.you { background: #363636; }
        .hf-story-inner {
          width: 100%; height: 100%;
          border-radius: 50%;
          background: #1a1a1a;
          border: 2px solid #000;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }
        .hf-story-inner img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hf-story-label {
          font-size: 12px;
          color: #f5f5f5;
          max-width: 66px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }
        .hf-story-add-btn {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #0095f6;
          border: 2px solid #000;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 16px; font-weight: 700;
          position: absolute; bottom: 0; right: 0;
          line-height: 1;
        }

        /* ── Search ── */
        .hf-search-box {
          background: #000;
          border-bottom: 1px solid #262626;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .hf-search-input {
          flex: 1;
          background: #262626;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          color: #f5f5f5;
          outline: none;
          font-family: inherit;
        }
        .hf-search-input::placeholder { color: #8e8e8e; }

        /* ── Skeleton ── */
        .hf-skeleton {
          background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
          background-size: 200% 100%;
          animation: hf-shimmer 1.5s infinite;
          border-radius: 3px;
        }

        /* ── Messages ── */
        .hf-messages-panel {
          display: flex;
          background: #000;
          border: 1px solid #262626;
          border-radius: 4px;
          height: 70vh;
          max-width: 900px;
          width: 100%;
          margin: 24px auto;
          overflow: hidden;
        }

        .hf-contacts-list {
          width: 300px;
          border-right: 1px solid #262626;
          overflow-y: auto;
          flex-shrink: 0;
        }
        .hf-contact-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.12s;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          border-bottom: 1px solid #1a1a1a;
        }
        .hf-contact-row:hover, .hf-contact-row.active { background: #1a1a1a; }

        .hf-msg-bubble {
          max-width: 65%;
          padding: 10px 14px;
          border-radius: 22px;
          font-size: 14px;
          line-height: 1.4;
        }
        .hf-msg-bubble.me { background: #3797f0; color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; }
        .hf-msg-bubble.other { background: #262626; color: #f5f5f5; border-bottom-left-radius: 4px; align-self: flex-start; }

        /* ── Explore grid ── */
        .hf-explore-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px;
          padding: 3px 0;
        }

        /* ── Create form ── */
        .hf-create-form input, .hf-create-form textarea, .hf-create-form select {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #363636;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 14px;
          color: #f5f5f5;
          outline: none;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .hf-create-form input:focus, .hf-create-form textarea:focus, .hf-create-form select:focus { border-color: #8e8e8e; }
        .hf-create-form select option { background: #1a1a1a; }

        /* ── Bottom Nav ── */
        .hf-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 50px;
          background: #000;
          border-top: 1px solid #262626;
          align-items: center;
          justify-content: space-around;
          z-index: 40;
        }
        @media (max-width: 768px) { .hf-bottom-nav { display: flex; } }
        .hf-bottom-btn {
          background: none; border: none; padding: 8px;
          cursor: pointer; color: #f5f5f5;
          display: flex; align-items: center; justify-content: center;
        }

        /* ── Toast ── */
        .hf-toast {
          position: fixed;
          bottom: 70px; left: 50%; transform: translateX(-50%);
          background: #1a1a1a;
          color: #f5f5f5;
          border: 1px solid #363636;
          font-size: 13px; font-weight: 500;
          padding: 12px 20px;
          border-radius: 8px;
          z-index: 9999;
          white-space: nowrap;
        }

        /* ── Sidebar user row ── */
        .hf-sidebar-user {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 8px; cursor: pointer;
          transition: background 0.15s;
        }
        .hf-sidebar-user:hover { background: #1a1a1a; }

        .hf-more-btn {
          display: flex; align-items: center; gap: 16px;
          padding: 12px 12px; border-radius: 8px; cursor: pointer;
          width: 100%; background: none; border: none;
          color: #f5f5f5; font-size: 16px; font-weight: 400;
          font-family: inherit;
          transition: background 0.15s;
        }
        .hf-more-btn:hover { background: #1a1a1a; }

        /* Suggested avatar in right panel */
        .hf-sugg-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
        }
        .hf-sugg-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          overflow: hidden; flex-shrink: 0;
          border: 1px solid #363636;
        }
        .hf-sugg-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* For You (Reels) vertical scroll snapping */
        .hf-foryou-container {
          height: calc(100vh - 20px);
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scrollbar-width: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 10px 0 120px;
        }
        .hf-foryou-container::-webkit-scrollbar {
          display: none;
        }
        .hf-foryou-card {
          scroll-snap-align: center;
          scroll-snap-stop: always;
          position: relative;
          width: 100%;
          max-width: 380px;
          height: calc(100vh - 120px);
          max-height: 680px;
          border-radius: 12px;
          overflow: hidden;
          background: #1a1a1a;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          border: 1px solid #262626;
        }
        @media (max-width: 768px) {
          .hf-foryou-container {
            height: calc(100vh - 104px);
            padding: 0 0 60px;
            gap: 0;
          }
          .hf-foryou-card {
            border-radius: 0;
            border: none;
            max-height: none;
            height: calc(100vh - 104px);
            scroll-snap-align: start;
          }
        }
      `}</style>

      <div className="hf-page">
        <AnimatePresence>
          {showTransition && <TransitionScreen onComplete={() => setShowTransition(false)} />}
        </AnimatePresence>

        {/* ── Left Sidebar ── */}
        <aside className={`hf-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div>
            {/* Logo */}
            <div className="hf-sidebar-logo">
              {sidebarCollapsed ? <InstagramCameraIcon /> : <PixoraWordmark />}
            </div>

            {/* Nav items */}
            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {navItems.map(item => (
                <SideNavBtn
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activePage === item.id}
                  badge={item.badge}
                  collapsed={sidebarCollapsed}
                  onClick={() => {
                    if (item.id === "profile-nav") { router.push("/profile"); return; }
                    setSidebarCollapsed(false);
                    setActivePage(item.id);
                  }}
                />
              ))}
            </nav>
          </div>

          {/* Bottom: More + user */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <button className="hf-more-btn" onClick={() => setSidebarCollapsed(p => !p)} style={{ justifyContent: sidebarCollapsed ? "center" : "flex-start" }}>
              <span style={{ display: "flex", alignItems: "center" }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </span>
              {!sidebarCollapsed && <span>More</span>}
            </button>

            {!sidebarCollapsed && profile?.user && (
              <div className="hf-sidebar-user" onClick={() => router.push("/profile")}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{userInitials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#f5f5f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</div>
                  <div style={{ fontSize: 12, color: "#a8a8a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.user.name}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleLogout(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#a8a8a8", padding: 2, display: "flex" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#ed4956"}
                  onMouseLeave={e => e.currentTarget.style.color = "#a8a8a8"}
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Mobile Header ── */}
        <header className="hf-mobile-header">
          <PixoraWordmark />
        </header>

        {/* ── Main ── */}
        <main className="hf-main">
          <div className="hf-feed-col">



            {/* ── HOME ── */}
            {activePage === "home" && (
              <div>
                {/* Stories */}
                <div className="hf-stories-wrap">
                  {storyItems.map((story, i) => (
                    <button key={story.label + i} className="hf-story-btn" onClick={() => {
                      if (story.isYou) showToast("Your story settings coming soon!");
                      else if (story.cat) { setSelectedCategory(story.cat); setIsTrending(false); }
                    }}>
                      <div style={{ position: "relative" }}>
                        <div className={`hf-story-ring ${story.isYou ? "you" : ""}`}>
                          <div className="hf-story-inner">
                            {story.img ? (
                              <img src={story.img} alt={story.label} />
                            ) : (
                              <span style={{ fontSize: 22 }}>{CATEGORY_ICONS[story.cat] || "📷"}</span>
                            )}
                          </div>
                        </div>
                        {story.isYou && (
                          <div className="hf-story-add-btn">+</div>
                        )}
                      </div>
                      <span className="hf-story-label">{story.isYou ? "Your story" : story.label}</span>
                    </button>
                  ))}
                </div>

                {/* Category filter */}
                {selectedCategory && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid #262626", background: "#000" }}>
                    <span style={{ fontSize: 13, color: "#a8a8a8" }}>Showing:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f5f5f5" }}>{selectedCategory}</span>
                    <button onClick={() => { setSelectedCategory(""); setIsTrending(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#a8a8a8", padding: 0, display: "flex" }}><X size={14} /></button>
                  </div>
                )}

                {/* Posts */}
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {[0, 1].map(i => (
                      <div key={i} style={{ borderBottom: "1px solid #262626", paddingBottom: 16, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 10px" }}>
                          <div className="hf-skeleton" style={{ width: 38, height: 38, borderRadius: "50%" }} />
                          <div style={{ flex: 1 }}>
                            <div className="hf-skeleton" style={{ height: 12, width: "30%", marginBottom: 6 }} />
                            <div className="hf-skeleton" style={{ height: 11, width: "20%" }} />
                          </div>
                        </div>
                        <div className="hf-skeleton" style={{ width: "100%", aspectRatio: "1", borderRadius: 0 }} />
                        <div style={{ padding: "12px 16px 0" }}>
                          <div className="hf-skeleton" style={{ height: 12, width: "25%", marginBottom: 8 }} />
                          <div className="hf-skeleton" style={{ height: 12, width: "70%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "64px 24px", color: "#8e8e8e" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                    <p style={{ fontWeight: 700, color: "#f5f5f5", margin: "0 0 6px" }}>No posts found</p>
                    <p style={{ margin: 0, fontSize: 14 }}>Try browsing another category.</p>
                  </div>
                ) : (
                  <div>
                    {filteredItems.map((item, idx) => (
                      <PostCard
                        key={item.id}
                        item={item}
                        avatarImg={STORY_AVATARS[idx % STORY_AVATARS.length]}
                        onOpen={() => setSelectedItemId(item.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={feedEndRef} style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {loadingMore && <div style={{ width: 24, height: 24, border: "2px solid #363636", borderTopColor: "#0095f6", borderRadius: "50%", animation: "hf-spin 0.7s linear infinite" }} />}
                </div>
              </div>
            )}

            {/* ── EXPLORE ── */}
            {activePage === "explore" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #262626" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f5", margin: 0 }}>Explore</h2>
                </div>
                <div className="hf-explore-grid">
                  {[
                    { label: "Weddings", cat: "Travel", img: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=300&auto=format&fit=crop" },
                    { label: "Cars", cat: "Technology", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=300&auto=format&fit=crop" },
                    { label: "Relaxation", cat: "Photography", img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=300&auto=format&fit=crop" },
                    { label: "Workouts", cat: "Fitness", img: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop" },
                    { label: "Small spaces", cat: "Design", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=300&auto=format&fit=crop" },
                    { label: "Anime", cat: "Artificial Intelligence", img: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&auto=format&fit=crop" },
                    { label: "Home décor", cat: "Nature", img: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=300&auto=format&fit=crop" },
                    { label: "Renovation", cat: "Education", img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=300&auto=format&fit=crop" },
                    { label: "Food", cat: "Recipes", img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=300&auto=format&fit=crop" },
                  ].map((item, idx) => (
                    <div key={item.label} onClick={() => { setSelectedCategory(item.cat); setIsTrending(false); setActivePage("home"); }}
                      style={{ position: "relative", aspectRatio: idx === 0 ? "auto" : "1", overflow: "hidden", cursor: "pointer", background: "#1a1a1a", gridRow: idx === 0 ? "span 2" : "auto" }}>
                      <img src={item.img} alt={item.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s ease" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── FOR YOU (REELS / TRENDING) ── */}
            {activePage === "reels" && (
              <div className="hf-foryou-container">
                {forYouLoading ? (
                  // Loading skeletons for For You
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="hf-foryou-card" style={{ background: "#111" }}>
                      <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg,#1a1a1a 25%,#2a2a2a 50%,#1a1a1a 75%)", backgroundSize: "200% 100%", animation: "hf-shimmer 1.5s infinite" }} />
                    </div>
                  ))
                ) : forYouItems.length > 0 ? (
                  forYouItems.map((item, idx) => {
                    const creator = getCreator(item.category);
                    const imgUrl = getOptimizedImageUrl(item.thumbnail_url, item.image_url);
                    const fallback = getCategoryFallback(item.category);
                    return (
                      <div key={item.id || idx} className="hf-foryou-card">
                        <img
                          src={imgUrl || fallback}
                          alt={item.title || "For You"}
                          onError={e => { e.currentTarget.src = fallback; }}
                          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                        />
                        {/* Dark overlay */}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.35) 100%)", pointerEvents: "none" }} />

                        {/* Top label */}
                        <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
                          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "0.3px" }}>For You</span>
                          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, background: "rgba(0,0,0,0.3)", padding: "2px 8px", borderRadius: 20 }}>#{item.category}</span>
                        </div>


                        {/* Left: Info */}
                        <div style={{ position: "absolute", bottom: 24, left: 16, right: 72, color: "#fff", zIndex: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {creator.handle.substring(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{creator.handle}</span>
                            <button
                              onClick={() => showToast("Following!")}
                              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 4, padding: "2px 10px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", flexShrink: 0 }}
                            >Follow</button>
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px", lineHeight: 1.3 }}>
                            {item.title && !item.title.match(/^[a-f0-9]{20,}$/) ? item.title : `✨ ${item.category} Highlight`}
                          </p>
                          <p style={{ fontSize: 12, margin: 0, opacity: 0.75, lineHeight: 1.4 }}>
                            {isSystemDesc(item.description) ? `🔥 ${fmtNum(item.likes || 0)} people loved this` : (item.description?.substring(0, 80) + (item.description?.length > 80 ? "…" : ""))}
                          </p>
                        </div>

                        {/* Right: Action sidebar */}
                        <div style={{ position: "absolute", bottom: 24, right: 12, display: "flex", flexDirection: "column", gap: 22, alignItems: "center", zIndex: 10 }}>
                          {[
                            {
                              icon: <Heart size={28} fill={item.liked_by_user ? "#ed4956" : "none"} color={item.liked_by_user ? "#ed4956" : "white"} />,
                              label: fmtNum(item.likes || 0),
                              action: () => {
                                setForYouItems(prev => prev.map(p => p.id === item.id
                                  ? { ...p, liked_by_user: !p.liked_by_user, likes: p.liked_by_user ? (p.likes || 1) - 1 : (p.likes || 0) + 1 }
                                  : p));
                                api.toggleLike(item.id).catch(() => {});
                              }
                            },
                            {
                              icon: <MessageSquare size={28} color="white" />,
                              label: String(item.comments || 0),
                              action: () => showToast("Comments coming soon!")
                            },
                            {
                              icon: <Share2 size={28} color="white" />,
                              label: fmtNum(item.shares || 0),
                              action: () => { api.trackShare(item.id).catch(() => {}); showToast("🔗 Link Copied!"); }
                            },
                            {
                              icon: <Bookmark size={28} fill={item.saved_by_user ? "#fcb045" : "none"} color={item.saved_by_user ? "#fcb045" : "white"} />,
                              action: () => {
                                setForYouItems(prev => prev.map(p => p.id === item.id ? { ...p, saved_by_user: !p.saved_by_user } : p));
                                api.toggleSave(item.id).catch(() => {});
                              }
                            },
                          ].map((btn, i) => (
                            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                              <button onClick={btn.action} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 0, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.6))" }}>
                                {btn.icon}
                              </button>
                              {btn.label !== undefined && <span style={{ fontSize: 12, color: "#fff", fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{btn.label}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "#a8a8a8" }}>
                    <Film size={48} strokeWidth={1} />
                    <p style={{ margin: 0, fontSize: 16 }}>No trending content yet</p>
                  </div>
                )}
              </div>
            )}

            {/* ── CREATE ── */}
            {activePage === "create" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "24px 16px" }}>
                <div style={{ background: "#000", border: "1px solid #262626", borderRadius: 4, padding: "32px 24px", maxWidth: 450, margin: "0 auto" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f5f5f5", margin: "0 0 4px", textAlign: "center" }}>Create new post</h2>
                  <p style={{ fontSize: 14, color: "#a8a8a8", margin: "0 0 24px", textAlign: "center" }}>Share ideas with the Pixora community</p>
                  <form className="hf-create-form" onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const title = form.elements.namedItem("title").value;
                    const desc = form.elements.namedItem("desc").value;
                    const category = form.elements.namedItem("category").value;
                    const imgs = { "Nature": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&auto=format&fit=crop", "Technology": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=400&auto=format&fit=crop", "Recipes": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=400&auto=format&fit=crop", "Travel": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400&auto=format&fit=crop", "Design": "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=400&auto=format&fit=crop" };
                    const img = imgs[category] || imgs["Design"];
                    setItems(prev => [{ id: `pin-${Date.now()}`, title: title || "Untitled", description: desc || ".", category, thumbnail_url: img, image_url: img, likes: 0, views: 1, created_at: new Date().toISOString(), liked_by_user: false, saved_by_user: true }, ...prev]);
                    showToast("✅ Post shared!");
                    setActivePage("home");
                  }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <input name="title" type="text" placeholder="Write a caption…" required />
                    <textarea name="desc" rows={3} placeholder="Add a description…" style={{ resize: "none" }} />
                    <select name="category">
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button type="submit" style={{ width: "100%", height: 44, background: "#0095f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1877f2"}
                      onMouseLeave={e => e.currentTarget.style.background = "#0095f6"}
                    >Share</button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── MESSAGES ── */}
            {activePage === "messages" && (
              <div className="hf-messages-panel">
                {/* Contacts */}
                <div className="hf-contacts-list" style={{ display: selectedContact ? "none" : "block" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #262626", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#f5f5f5" }}>{username}</span>
                    <PlusCircle size={20} color="#f5f5f5" style={{ cursor: "pointer" }} />
                  </div>
                  {contacts.map(c => (
                    <button key={c.id} className={`hf-contact-row ${selectedContact?.id === c.id ? "active" : ""}`} onClick={() => setSelectedContact(c)}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0, position: "relative" }}>
                        {c.initials}
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: "#3fc04e", border: "2px solid #000" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#f5f5f5" }}>{c.name}</span>
                          <span style={{ fontSize: 12, color: "#a8a8a8" }}>{c.time}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#a8a8a8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Chat */}
                <div style={{ flex: 1, display: selectedContact ? "flex" : "flex", flexDirection: "column", alignItems: selectedContact ? "stretch" : "center", justifyContent: selectedContact ? "flex-start" : "center" }}>
                  {selectedContact ? (
                    <>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #262626", display: "flex", alignItems: "center", gap: 12 }}>
                        <button onClick={() => setSelectedContact(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f5f5f5", padding: 4, display: "flex" }}><ChevronLeft size={20} /></button>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: selectedContact.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{selectedContact.initials}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5" }}>{selectedContact.name}</div>
                          <div style={{ fontSize: 12, color: "#3fc04e" }}>Active now</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                        {loadingMessages ? (
                          <div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: 24, height: 24, border: "2px solid #363636", borderTopColor: "#0095f6", borderRadius: "50%", animation: "hf-spin 0.7s linear infinite" }} /></div>
                        ) : messages.map((m, idx) => {
                          const isMe = m.sender_id === "me" || m.sender_id === "you";
                          return (
                            <motion.div key={m.id || idx} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                              <div className={`hf-msg-bubble ${isMe ? "me" : "other"}`}>{m.message_text}</div>
                            </motion.div>
                          );
                        })}
                        <div ref={chatBottomRef} />
                      </div>
                      <form onSubmit={handleSendMessage} style={{ padding: "12px 16px", borderTop: "1px solid #262626", display: "flex", gap: 10, alignItems: "center" }}>
                        <input type="text" placeholder="Message…" value={newMessageText} onChange={e => setNewMessageText(e.target.value)} style={{ flex: 1, background: "#1a1a1a", border: "1px solid #363636", borderRadius: 22, padding: "10px 16px", fontSize: 14, color: "#f5f5f5", outline: "none", fontFamily: "inherit" }} />
                        {newMessageText.trim() ? (
                          <button type="submit" style={{ background: "none", border: "none", cursor: "pointer", color: "#0095f6", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>Send</button>
                        ) : (
                          <button type="button" onClick={() => showToast("❤️")} style={{ background: "none", border: "none", cursor: "pointer", color: "#f5f5f5", display: "flex" }}><Heart size={22} /></button>
                        )}
                      </form>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#8e8e8e" }}>
                      <MessageSquare size={48} color="#363636" />
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f5", margin: 0 }}>Your messages</p>
                      <p style={{ fontSize: 14, margin: 0, textAlign: "center", maxWidth: 200 }}>Send private messages to a friend.</p>
                      <button onClick={() => setSelectedContact(contacts[0])} style={{ background: "#0095f6", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>Send message</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right panel ── */}
          {activePage === "home" && (
            <div className="hf-right-col">
              {profile?.user && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{userInitials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#f5f5f5", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} onClick={() => router.push("/profile")}>{username}</div>
                    <div style={{ fontSize: 14, color: "#a8a8a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.user.name}</div>
                  </div>
                  <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "#0095f6", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>Switch</button>
                </div>
              )}

              {/* ── Interest Algorithm Panel (Instagram-style) ── */}
              {profile?.user && Object.keys(profile.user.interests || {}).length > 0 && (
                <div style={{ background: "#111", border: "1px solid #262626", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f5f5f5" }}>🧠 Your Interest Profile</span>
                    <span style={{ fontSize: 11, color: "#a8a8a8" }}>How your feed is ranked</span>
                  </div>
                  {Object.entries(profile.user.interests)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([cat, score]) => {
                      const pct = Math.round(score * 100);
                      const barColor = {
                        "Nature": "#22c55e", "Technology": "#3b82f6", "Recipes": "#f97316",
                        "Travel": "#a855f7", "Design": "#ec4899", "Artificial Intelligence": "#06b6d4",
                        "Education": "#eab308", "Photography": "#6366f1", "Fitness": "#ef4444"
                      }[cat] || "#0095f6";
                      return (
                        <div key={cat} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "#f5f5f5" }}>{CATEGORY_ICONS[cat]} {cat}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{pct}%</span>
                          </div>
                          <div style={{ height: 4, background: "#262626", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 2, transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  <p style={{ fontSize: 11, color: "#737373", margin: "10px 0 0", lineHeight: 1.5 }}>
                    Interact with posts (like, save, watch) to refine your feed.
                  </p>
                </div>
              )}

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#a8a8a8" }}>Suggested for you</span>
                  <button onClick={() => showToast("See all suggestions")} style={{ background: "none", border: "none", cursor: "pointer", color: "#f5f5f5", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>See all</button>
                </div>
                {SUGGESTED_USERS.map((u, i) => (
                  <div key={u.handle} className="hf-sugg-row">
                    <div className="hf-sugg-avatar">
                      <img src={u.img} alt={u.handle} onError={e => { e.currentTarget.style.display = "none"; }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f5f5f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.handle}</div>
                      <div style={{ fontSize: 12, color: "#a8a8a8" }}>Suggested for you</div>
                    </div>
                    <button
                      onClick={() => setSuggestedFollowed(p => ({ ...p, [u.handle]: !p[u.handle] }))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: suggestedFollowed[u.handle] ? "#a8a8a8" : "#0095f6", fontSize: 13, fontWeight: 700, padding: 0, fontFamily: "inherit" }}
                    >
                      {suggestedFollowed[u.handle] ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px", marginBottom: 12 }}>
                  {["About", "Help", "Press", "API", "Jobs", "Privacy", "Terms", "Locations", "Language"].map(link => (
                    <a key={link} href="#" onClick={e => e.preventDefault()} style={{ fontSize: 11, color: "#737373", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>{link}</a>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "#737373", margin: 0 }}>© 2025 PIXORA FROM META</p>
              </div>
            </div>
          )}
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="hf-bottom-nav">
          {[
            { id: "home", icon: <Home size={24} strokeWidth={activePage === "home" ? 2.5 : 1.5} /> },
            { id: "explore", icon: <Compass size={24} strokeWidth={activePage === "explore" ? 2.5 : 1.5} /> },
            { id: "reels", icon: <Film size={24} strokeWidth={activePage === "reels" ? 2.5 : 1.5} /> },
            { id: "profile-nav", icon: <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, outline: activePage === "profile-nav" ? "2px solid #fff" : "none", outlineOffset: 1 }}>{userInitials}</div> },
          ].map(item => (
            <button key={item.id} className="hf-bottom-btn"
              style={{ color: activePage === item.id ? "#f5f5f5" : "#8e8e8e" }}
              onClick={() => { if (item.id === "profile-nav") { router.push("/profile"); return; } setActivePage(item.id); }}
            >
              {item.icon}
            </button>
          ))}
        </nav>

        {/* Detail Modal */}
        {selectedItemId && <DetailModal itemId={selectedItemId} onClose={() => setSelectedItemId(null)} onNavigateToItem={setSelectedItemId} />}

        {/* Toast */}
        {toast && <div className="hf-toast">{toast}</div>}
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid #363636", borderTopColor: "#0095f6", borderRadius: "50%", animation: "hf-spin 0.7s linear infinite" }} />
        <style>{`@keyframes hf-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <HomeFeedContent />
    </Suspense>
  );
}
