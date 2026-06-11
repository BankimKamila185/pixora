"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, Heart, Bookmark, Share2, Eye, Calendar, ArrowRight, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import ContentCard from "./ContentCard";

interface DetailModalProps {
  itemId: string;
  onClose: () => void;
  onNavigateToItem?: (id: string) => void;
}

// Generate deterministic creator username and avatar text based on content category and ID
const getCreatorInfo = (category: string, id: string) => {
  const creators: Record<string, string[]> = {
    "Nature": ["eco_traveler", "forest_lens", "earth_spirit", "wild_scenery"],
    "Technology": ["byte_code", "gadget_hub", "synth_wave", "future_tech"],
    "Recipes": ["chef_mario", "baker_bites", "sweet_tooth", "spice_kitchen"],
    "Travel": ["wanderlust_pix", "sky_wanderer", "beach_vibe", "nomad_diary"],
    "Design": ["interior_vibe", "pixel_craft", "architect_mind", "minimal_deco"],
    "Artificial Intelligence": ["neural_art", "ai_dreamer", "code_gpt", "prompt_pro"],
    "Education": ["studious_mind", "book_worm", "brainy_bits", "learn_daily"],
    "Photography": ["bokeh_click", "shutter_style", "neon_glow", "iso_lens"],
    "Fitness": ["gain_train", "yoga_flow", "active_core", "beast_mode"]
  };

  const list = creators[category] || ["pixora_creator", "creative_mind", "visual_art"];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  const index = sum % list.length;
  const username = list[index];

  return {
    username,
    avatarText: username.split('_').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  };
};

export default function DetailModal({ itemId, onClose, onNavigateToItem }: DetailModalProps) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
  const [shared, setShared] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [showHeartPop, setShowHeartPop] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        const data = await api.getContentDetails(itemId);
        setItem(data);
        setLiked(data.liked_by_user || false);
        setSaved(data.saved_by_user || false);
        setLikesCount(data.likes);
        setSavesCount(data.saves);

        // Generate mock comments
        const info = getCreatorInfo(data.category, data.id);
        setComments([
          { user: "explorer_dan", text: `I love this! The vibe of this ${data.category} content is perfect.`, time: "1h" },
          { user: "creative_gal", text: "This is going straight into my inspiration mood board. 🔥", time: "3h" },
          { user: "design_daily", text: "Incredible shot. The composition and spacing are spot on.", time: "5h" }
        ]);

        // Fetch related posts (same category)
        const categoryData = await api.getContent(data.category, 0, 8);
        const filtered = categoryData.filter((i: any) => i.id !== data.id);
        setRelated(filtered);
      } catch (err) {
        console.error("Failed to load content details", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [itemId]);

  // Track dwell time (watch history)
  const viewStartTime = useRef<number>(Date.now());

  useEffect(() => {
    viewStartTime.current = Date.now();

    return () => {
      const duration = (Date.now() - viewStartTime.current) / 1000;
      if (duration > 1.0 && itemId) {
        api.trackWatch(itemId, duration).catch((err) => {
          console.error("Failed to log watch history", err);
        });
      }
    };
  }, [itemId]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleLike = async () => {
    if (!item) return;
    try {
      const res = await api.toggleLike(item.id);
      setLiked(res.liked);
      setLikesCount(res.likes);
    } catch (err) {
      console.error("Error toggling like", err);
    }
  };

  const handleSave = async () => {
    if (!item) return;
    try {
      const res = await api.toggleSave(item.id);
      setSaved(res.saved);
      setSavesCount(res.saves);
    } catch (err) {
      console.error("Error toggling save", err);
    }
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      await api.trackShare(item.id);
      navigator.clipboard.writeText(`${window.location.origin}/?contentId=${item.id}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error("Error sharing content", err);
    }
  };

  const handleDoubleClick = () => {
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 800);
    if (!liked) {
      handleLike();
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const text = commentText;
    setCommentText("");
    
    const newComment = {
      user: "you",
      text: text,
      time: "1s"
    };
    setComments((prev) => [...prev, newComment]);
    
    try {
      await api.postComment(itemId, text);
    } catch (err) {
      console.error("Failed to post comment to backend", err);
    }
  };

  const focusCommentInput = () => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
        <div className="w-12 h-12 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) return null;

  const { username, avatarText } = getCreatorInfo(item.category, item.id);

  return (
    <div 
      className="fixed inset-0 bg-black/75 z-50 overflow-y-auto flex justify-center items-start p-3 sm:p-6 md:p-10 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        className="bg-card w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col mt-4 sm:mt-10 mb-10 border border-border"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all active:scale-95 z-20 border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Details Split Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Image Container with double click pop */}
          <div 
            className="bg-black flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-border relative select-none md:h-[650px]"
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-contain max-h-[60vh] md:max-h-full"
            />
            
            {/* Heart Pop Animation */}
            <AnimatePresence>
              {showHeartPop && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                  <Heart className="w-28 h-28 fill-rose-600 text-rose-600 animate-heart-pop filter drop-shadow-lg" />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Instagram-Style Sidebar details */}
          <div className="flex flex-col justify-between h-full bg-card md:h-[650px]">
            {/* 1. Header (Creator Profile Info) */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-[10px] font-bold text-foreground">
                    {avatarText}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-foreground hover:underline cursor-pointer">
                    {username}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    Original Creator
                  </div>
                </div>
              </div>
              <button className="text-primary font-bold text-xs hover:text-rose-700 transition-colors">
                Follow
              </button>
            </div>

            {/* 2. Scrollable Body: Description, Tags, Comments */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              {/* Category & Title */}
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">
                  {item.category}
                </span>
                <h1 className="text-xl sm:text-2xl font-black mt-3 leading-tight tracking-tight text-foreground">
                  {item.title}
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed mt-2.5">
                  {item.description}
                </p>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium hover:opacity-85 transition-opacity cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comments Section Header */}
              <div className="border-t border-border/60 pt-4">
                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-3">
                  Comments ({comments.length})
                </h3>
                
                {/* Scrollable list of comments */}
                <div className="space-y-4 max-h-[200px] md:max-h-[220px]">
                  {comments.map((comment, index) => (
                    <div key={index} className="flex items-start gap-2.5 text-xs">
                      <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-[9px] uppercase ${
                        comment.user === "you" 
                          ? "bg-primary text-white" 
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {comment.user.substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <span className="font-extrabold text-foreground mr-1.5">{comment.user}</span>
                        <span className="text-muted-foreground leading-normal">{comment.text}</span>
                        <div className="text-[10px] text-muted-foreground/60 mt-1 font-medium">{comment.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Actions Panel & Comment Input (Sticky Bottom) */}
            <div className="border-t border-border bg-card">
              {/* Instagram Icons Row */}
              <div className="p-4 pb-2 flex justify-between items-center">
                <div className="flex gap-4">
                  <button onClick={handleLike} className="text-foreground hover:text-muted-foreground transition-colors">
                    <Heart className={`w-6 h-6 ${liked ? "fill-rose-600 text-rose-600" : ""}`} />
                  </button>
                  <button onClick={focusCommentInput} className="text-foreground hover:text-muted-foreground transition-colors">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <button onClick={handleShare} className="text-foreground hover:text-muted-foreground transition-colors relative">
                    <Share2 className="w-6 h-6" />
                    {shared && (
                      <span className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2.5 py-1 rounded-full shadow-lg border border-zinc-800 whitespace-nowrap z-50">
                        Link copied!
                      </span>
                    )}
                  </button>
                </div>
                
                <button onClick={handleSave} className="text-foreground hover:text-muted-foreground transition-colors">
                  <Bookmark className={`w-6 h-6 ${saved ? "fill-[#e60023] text-[#e60023]" : ""}`} />
                </button>
              </div>

              {/* Likes & Date Details */}
              <div className="px-4 pb-3 flex justify-between items-center text-xs text-muted-foreground font-semibold">
                <div className="flex gap-3 text-foreground font-extrabold">
                  <span>{likesCount} likes</span>
                  <span>{savesCount} saves</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{item.views} views</span>
                  <span>•</span>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Comment Form Input */}
              <form onSubmit={handlePostComment} className="border-t border-border p-3 flex items-center gap-3">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder-muted-foreground/60 py-1"
                />
                <button 
                  type="submit" 
                  disabled={!commentText.trim()}
                  className="text-primary font-bold text-sm hover:text-rose-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Related Recommendations "More Like This" Section */}
        {related.length > 0 && (
          <div className="p-6 sm:p-8 bg-zinc-50 dark:bg-zinc-950 border-t border-border">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="font-black text-lg tracking-tight text-foreground">More like this</h3>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="masonry-grid">
              {related.map((relItem) => (
                <div key={relItem.id} className="w-full">
                  <ContentCard
                    item={relItem}
                    onClick={() => {
                      if (onNavigateToItem) {
                        onNavigateToItem(relItem.id);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
