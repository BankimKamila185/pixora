"use client";

import React, { useEffect, useState, useRef } from "react";
import { api, getOptimizedImageUrl } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageSquare, Share2, Bookmark, X, ChevronLeft, ChevronRight, CornerDownRight } from "lucide-react";

const CREATOR_MAP = {
  "Nature": { name: "Budiarti Rohman", handle: "budiartirohman" },
  "Technology": { name: "Michael Franz", handle: "michael_franz" },
  "Recipes": { name: "Sarah Jenkins", handle: "sarah_bakes" },
  "Travel": { name: "Alex Wanderer", handle: "alex_wander" },
  "Design": { name: "Michelle Soedibjo", handle: "michelle_soedibjo" },
  "Artificial Intelligence": { name: "Neural Dreamer", handle: "neural_dream" },
  "Education": { name: "Learn Daily", handle: "learn_daily" },
  "Photography": { name: "ISO Style Studio", handle: "isostyle" },
  "Fitness": { name: "Active Core Flow", handle: "active_core" },
};

const LOCATIONS = {
  "Nature": "Bali, Indonesia",
  "Technology": "San Francisco, CA",
  "Recipes": "Paris, France",
  "Travel": "Tokyo, Japan",
  "Design": "Milan, Italy",
  "Artificial Intelligence": "London, UK",
  "Education": "New York, NY",
  "Photography": "New York, NY",
  "Fitness": "Los Angeles, CA",
};

const MOCK_COMMENTS = [
  { user: "alex_wander", text: "Absolutely stunning! 🔥", time: "1h" },
  { user: "sarah_bakes", text: "This is incredible, going on my mood board! ✨", time: "2h" },
  { user: "design_daily", text: "The composition here is perfect. Love it!", time: "4h" },
  { user: "michael_f", text: "Saved for inspiration 🙏", time: "6h" },
];

export default function DetailModal({ itemId, onClose, onNavigateToItem }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [shared, setShared] = useState(false);
  const [relatedIdx, setRelatedIdx] = useState(0);

  const commentInputRef = useRef(null);
  const viewStartTime = useRef(Date.now());

  useEffect(() => {
    viewStartTime.current = Date.now();
    return () => {
      const duration = (Date.now() - viewStartTime.current) / 1000;
      if (duration > 1 && itemId) api.trackWatch(itemId, duration).catch(() => {});
    };
  }, [itemId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.getContentDetails(itemId);
        setItem(data);
        setLiked(data.liked_by_user || false);
        setSaved(data.saved_by_user || false);
        setLikesCount(data.likes || 0);
        setComments(MOCK_COMMENTS);
        const cat = await api.getContent(data.category, 0, 9);
        setRelated(cat.filter((i) => i.id !== data.id));
        setRelatedIdx(0);
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    }
    load();
  }, [itemId]);

  const handleLike = async () => {
    try {
      const r = await api.toggleLike(item.id);
      setLiked(r.liked);
      setLikesCount(r.likes);
    } catch {
      setLiked(p => !p);
      setLikesCount(p => liked ? p - 1 : p + 1);
    }
  };

  const handleSave = async () => {
    try {
      const r = await api.toggleSave(item.id);
      setSaved(r.saved);
    } catch {
      setSaved(p => !p);
    }
  };

  const handleShare = async () => {
    try {
      await api.trackShare(item.id);
      navigator.clipboard.writeText(`${window.location.origin}/?contentId=${item.id}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {}
  };

  const handleDoubleClick = () => {
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 900);
    if (!liked) handleLike();
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText("");
    setComments(p => [...p, { user: "you", text, time: "Just now" }]);
    api.postComment(itemId, text).catch(() => {});
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#020204]/85 backdrop-blur-md z-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!item) return null;

  const creator = CREATOR_MAP[item.category] || { name: "Pixora Creator", handle: "pixora_creator" };
  const location = LOCATIONS[item.category] || "Worldwide";
  const initials = creator.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const cleanTitle = item.title;
  const cleanDesc = item.description;
  const imgUrl = getOptimizedImageUrl(item.thumbnail_url, item.image_url);

  return (
    <div
      className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-md select-none"
      onClick={onClose}
    >
      {/* Floating close button */}
      <button
        onClick={onClose}
        className="fixed top-6 right-6 p-2.5 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-white cursor-pointer hover:rotate-90 transition-transform duration-300"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main glass box container - Responsive split structure */}
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel-glow w-full max-w-[400px] md:max-w-4xl h-[85vh] md:h-[75vh] rounded-[2rem] overflow-hidden flex flex-col md:flex-row bg-[#050508] relative border border-white/5"
      >
        
        {/* Left Column: Image (Desktop only, or full on top for mobile) */}
        <div 
          className="w-full md:w-1/2 h-[35vh] md:h-full bg-[#06060c] relative overflow-hidden cursor-pointer group flex-shrink-0"
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={imgUrl}
            alt={cleanTitle}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          {/* Heart Pop Animation */}
          <AnimatePresence>
            {showHeartPop && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="animate-heart-pop">
                  <Heart className="w-20 h-20 fill-white text-white drop-shadow-[0_0_15px_rgba(255,0,127,0.6)]" />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Scrollable Details & Comments */}
        <div className="flex-1 flex flex-col h-[50vh] md:h-full justify-between relative bg-[#050508]">
          {/* Scrollable details body */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
            
            {/* Top Header Selector */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#000000]/85 sticky top-0 backdrop-blur-md z-10">
              <button
                onClick={onClose}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-full text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2">
                <select className="bg-zinc-900 border border-white/10 rounded-lg text-[10px] font-bold text-zinc-300 py-1.5 px-2 focus:outline-none">
                  <option>Profile Board</option>
                  <option>Inspiration</option>
                  <option>Design Ideas</option>
                </select>
                <button 
                  onClick={handleSave} 
                  className={`text-xs font-black px-4 py-1.5 rounded-full transition-all cursor-pointer shadow-md ${
                    saved 
                      ? "bg-zinc-800 text-zinc-350" 
                      : "bg-primary text-white hover:bg-primary-hover"
                  }`}
                >
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            {/* Content Details */}
            <div className="px-5 py-4 flex flex-col gap-3">
              {/* Creator Card */}
              <div className="flex items-center gap-3">
                <div className="w-[42px] h-[42px] rounded-full p-[1.5px] bg-gradient-to-tr from-cyber-purple to-cyber-pink flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-xs font-black text-white uppercase select-none">
                    {initials}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-black text-zinc-100 text-sm block truncate">{creator.handle}</span>
                  <span className="text-[11px] text-zinc-400 block truncate">{location} • 12.5k followers</span>
                </div>
                <button 
                  onClick={() => setFollowed(p => !p)} 
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    followed 
                      ? "bg-zinc-800 text-zinc-400 border border-zinc-700" 
                      : "bg-primary text-white font-black"
                  }`}
                >
                  {followed ? "Following" : "Follow"}
                </button>
              </div>

              {/* Title & Description */}
              <div className="text-xs mt-2 border-t border-white/5 pt-3.5">
                <h3 className="font-black text-zinc-100 text-base mb-1">{cleanTitle}</h3>
                <p className="text-zinc-300 leading-relaxed font-semibold">{cleanDesc}</p>
                <span className="text-[9px] text-zinc-500 block font-bold mt-2.5 uppercase">
                  {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3">
              <button onClick={handleLike} className={`p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors cursor-pointer ${liked ? "text-cyber-pink bg-cyber-pink/5 border border-cyber-pink/15" : "text-zinc-350"}`}>
                <Heart className="w-4.5 h-4.5 fill-current" />
              </button>
              <button onClick={handleShare} className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-300 cursor-pointer relative">
                <Share2 className="w-4.5 h-4.5" />
                {shared && (
                  <span className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-0.5 rounded-full border border-zinc-800 whitespace-nowrap">Copied!</span>
                )}
              </button>
            </div>

            {/* Comments List */}
            <div className="px-4 py-2 space-y-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block px-1">Comments</span>
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3 items-start bg-zinc-900/10 p-2.5 rounded-2xl border border-white/[0.02]">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 flex-shrink-0">
                    {c.user.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-black text-white">{c.user}</span>
                      <span className="text-[9px] text-zinc-500 font-bold">{c.time}</span>
                    </div>
                    <p className="text-zinc-300 font-medium leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Related items in Masonry Grid */}
            {related.length > 0 && (
              <div className="px-4 py-4 border-t border-white/5 mt-4">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-wider font-display block mb-3">More Like This</span>
                <div className="pins-masonry-grid columns-2 gap-3 w-full">
                  {related.map((rel, relIdx) => {
                    const aspectRatios = ["aspect-[3/4]", "aspect-[4/5]", "aspect-[2/3]"];
                    const aspectClass = aspectRatios[relIdx % aspectRatios.length];
                    return (
                      <div
                        key={rel.id}
                        onClick={() => onNavigateToItem && onNavigateToItem(rel.id)}
                        className="pins-masonry-item break-inside-avoid mb-3 cursor-pointer group"
                      >
                        <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden bg-zinc-900 border border-white/5`}>
                          <img
                            src={getOptimizedImageUrl(rel.thumbnail_url, rel.image_url)}
                            alt={rel.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Sticky Comment form */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-[#050508]/95 p-3 flex gap-2 items-center z-10">
            <form onSubmit={handlePostComment} className="w-full flex gap-2 items-center">
              <input
                ref={commentInputRef}
                type="text"
                placeholder="Add a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="flex-1 bg-zinc-900/60 border border-white/5 rounded-xl text-xs font-semibold text-[#f0f0f5] placeholder-zinc-650 px-3 py-2 focus:outline-none focus:border-zinc-700"
              />
              {commentText.trim() && (
                <button type="submit" className="text-xs font-black text-primary hover:text-primary-hover px-2.5 cursor-pointer">Post</button>
              )}
            </form>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
