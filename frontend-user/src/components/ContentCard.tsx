"use client";

import React, { useState } from "react";
import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";

interface ContentCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    image_url: string;
    category: string;
    likes: number;
    saves: number;
    views: number;
    liked_by_user?: boolean;
    saved_by_user?: boolean;
  };
  onClick: () => void;
  onLikeToggle?: () => void;
  onSaveToggle?: () => void;
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

export default function ContentCard({ item, onClick, onLikeToggle, onSaveToggle }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(item.liked_by_user || false);
  const [saved, setSaved] = useState(item.saved_by_user || false);
  const [likesCount, setLikesCount] = useState(item.likes);
  const [savesCount, setSavesCount] = useState(item.saves);
  const [shared, setShared] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);

  const { username, avatarText } = getCreatorInfo(item.category, item.id);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleLike(item.id);
      setLiked(res.liked);
      setLikesCount(res.likes);
      if (onLikeToggle) onLikeToggle();
    } catch (err) {
      console.error("Failed to like content", err);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleSave(item.id);
      setSaved(res.saved);
      setSavesCount(res.saves);
      if (onSaveToggle) onSaveToggle();
    } catch (err) {
      console.error("Failed to save content", err);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.trackShare(item.id);
      navigator.clipboard.writeText(`${window.location.origin}/?contentId=${item.id}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error("Failed to share content", err);
    }
  };

  const handleDoubleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 800);

    if (!liked) {
      try {
        const res = await api.toggleLike(item.id);
        setLiked(res.liked);
        setLikesCount(res.likes);
        if (onLikeToggle) onLikeToggle();
      } catch (err) {
        console.error("Failed to like content", err);
      }
    }
  };

  return (
    <motion.div
      className="masonry-item relative overflow-hidden rounded-2xl bg-card border border-border/40 shadow-sm cursor-pointer group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Mobile Top Header: Creator info */}
      <div className="flex items-center justify-between p-3 sm:hidden border-b border-border/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-[9px] font-bold text-foreground">
              {avatarText}
            </div>
          </div>
          <span className="text-xs font-bold text-foreground">{username}</span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
          {item.category}
        </span>
      </div>

      {/* Visual Image and Double-click area */}
      <div className="relative overflow-hidden select-none" onDoubleClick={handleDoubleClick}>
        <img
          src={item.image_url}
          alt={item.title}
          loading="lazy"
          className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
          style={{ maxHeight: "600px", minHeight: "220px" }}
        />

        {/* Double click heart animation pop */}
        <AnimatePresence>
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <Heart className="w-24 h-24 fill-rose-600 text-rose-600 animate-heart-pop filter drop-shadow-md" />
            </div>
          )}
        </AnimatePresence>

        {/* Desktop Hover Overlays */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-black/40 hidden sm:flex flex-col justify-between p-4.5 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Top Bar: Creator Info & Save Button */}
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2 bg-black/30 p-1.5 pr-3 rounded-full backdrop-blur-md">
                  <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[9px] font-bold text-white">
                      {avatarText}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white truncate max-w-[90px]">{username}</span>
                </div>
                
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-1 px-4.5 py-2.5 rounded-full font-bold text-sm transition-all shadow-md active:scale-95 ${
                    saved
                      ? "bg-black text-white hover:bg-zinc-900 border border-zinc-800"
                      : "bg-[#e60023] text-white hover:bg-[#ff1a40]"
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  {saved ? "Saved" : "Save"}
                </button>
              </div>

              {/* Bottom Bar: Title & Social Interaction */}
              <div className="flex flex-col gap-2.5 text-white">
                <h3 className="font-bold text-sm. sm:text-base line-clamp-2 leading-tight tracking-tight drop-shadow-sm">
                  {item.title}
                </h3>
                
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-white/10">
                  {/* Stats */}
                  <div className="flex gap-3 text-xs text-zinc-300 font-medium">
                    <span>{likesCount} likes</span>
                    <span>{savesCount} saves</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleLike}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-90"
                      title="Like"
                    >
                      <Heart className={`w-4 h-4 ${liked ? "fill-rose-500 text-rose-500" : "text-white"}`} />
                    </button>
                    <button
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-90"
                      title="Comment"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-90 relative"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                      {shared && (
                        <span className="absolute bottom-11 right-1/2 translate-x-1/2 bg-black text-white text-[10px] px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap border border-zinc-800">
                          Link copied!
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile-Only Feed Stats and Description Card style (Instagram style layout below image) */}
      <div className="p-3.5 sm:hidden flex flex-col gap-1.5 border-t border-border/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleLike} className="text-foreground transition-all active:scale-90">
              <Heart className={`w-5 h-5 ${liked ? "fill-rose-600 text-rose-600" : "text-foreground"}`} />
            </button>
            <button className="text-foreground transition-all active:scale-90">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button onClick={handleShare} className="text-foreground transition-all active:scale-90 relative">
              <Share2 className="w-5 h-5" />
              {shared && (
                <span className="absolute bottom-7 left-0 bg-black text-white text-[9px] px-2 py-0.5 rounded shadow whitespace-nowrap z-40">
                  Copied!
                </span>
              )}
            </button>
          </div>
          
          <button onClick={handleSave} className="text-foreground transition-all active:scale-90">
            <Bookmark className={`w-5 h-5 ${saved ? "fill-primary text-primary" : "text-foreground"}`} />
          </button>
        </div>

        <div className="text-xs font-extrabold text-foreground">
          {likesCount} likes • {savesCount} saves
        </div>

        <div className="text-xs text-foreground leading-snug">
          <span className="font-extrabold mr-1.5">{username}</span>
          <span className="text-muted-foreground">{item.title}</span>
        </div>
      </div>
    </motion.div>
  );
}
