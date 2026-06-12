"use client";

import React, { useState } from "react";
import { Heart, Bookmark, Share2, MessageCircle, MoreHorizontal } from "lucide-react";
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

// Generate deterministic creator username, handle, and avatar text
const getCreatorInfo = (category: string, id: string) => {
  const creators: Record<string, { name: string; handle: string }> = {
    "Nature": { name: "Budiarti Rohman", handle: "@budiartirohman" },
    "Technology": { name: "Michael Franz", handle: "@michael_franz" },
    "Recipes": { name: "Sarah Jenkins", handle: "@sarah_bakes" },
    "Travel": { name: "Alex Wanderer", handle: "@alex_wander" },
    "Design": { name: "Michelle Soedibjo", handle: "@michelle_soedibjo" },
    "Artificial Intelligence": { name: "Neural Dreamer", handle: "@neural_dream" },
    "Education": { name: "Learn Daily", handle: "@learn_daily" },
    "Photography": { name: "ISO Style Studio", handle: "@isostyle" },
    "Fitness": { name: "Active Core Flow", handle: "@active_core" }
  };

  const defaultCreator = { name: "Budiarti Rohman", handle: "@budiartirohman" };
  const info = creators[category] || defaultCreator;
  
  // Calculate relative time based on ID hash
  const times = ["12m ago", "45m ago", "2h ago", "4h ago", "1d ago"];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  const time = times[sum % times.length];

  const avatarText = info.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return {
    name: info.name,
    handle: info.handle,
    time,
    avatarText
  };
};

const getHashtags = (category: string) => {
  const tags: Record<string, string> = {
    "Nature": "#MindsetMatters #DailyInspo #CityVibes",
    "Technology": "#CodeCraft #MinimalistDesk #Workspace",
    "Recipes": "#SourdoughLove #BakingArt #GourmetFood",
    "Travel": "#Wanderlust #ExploreWorld #NatureEscape",
    "Design": "#InteriorAesthetics #MinimalDeco #ArchitectMind",
    "Artificial Intelligence": "#AIArt #NeuralNetworks #PromptEngine",
    "Education": "#DailyKnowledge #KeepLearning #BrainyBits",
    "Photography": "#BokehClick #ISOStyle #NeonGlow",
    "Fitness": "#YogaFlow #CoreGains #ActiveBody"
  };
  return tags[category] || "#Inspiration #PixoraFeed #Creative";
};

export default function ContentCard({ item, onClick, onLikeToggle, onSaveToggle }: ContentCardProps) {
  const [liked, setLiked] = useState(item.liked_by_user || false);
  const [saved, setSaved] = useState(item.saved_by_user || false);
  const [likesCount, setLikesCount] = useState(item.likes);
  const [savesCount, setSavesCount] = useState(item.saves);
  const [shared, setShared] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);

  const { name, handle, time, avatarText } = getCreatorInfo(item.category, item.id);
  const hashtags = getHashtags(item.category);

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

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M Views`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K Views`;
    return `${views} Views`;
  };

  return (
    <motion.div
      className="masonry-item relative overflow-hidden rounded-3xl bg-card border border-border shadow-md cursor-pointer group flex flex-col"
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* 1. Creator Header Bar (Always visible) */}
      <div className="flex items-center justify-between p-4.5">
        <div className="flex items-center gap-3">
          {/* Avatar Ring */}
          <div className="w-8.5 h-8.5 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600">
            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-[10px] font-black text-white">
              {avatarText}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="text-xs font-black text-foreground leading-tight truncate max-w-[110px]">{name}</span>
              {/* Gold Verification Badge */}
              <span className="inline-flex items-center justify-center bg-primary text-primary-foreground text-[7px] w-3 h-3 rounded-full ml-1 font-black">✓</span>
            </div>
            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{handle}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-full border border-border">
            {time}
          </span>
          <button className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/40 cursor-pointer">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Visual Image Area with double-click pop */}
      <div className="relative overflow-hidden select-none" onDoubleClick={handleDoubleClick}>
        <img
          src={item.image_url}
          alt={item.title}
          loading="lazy"
          className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
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

        {/* Floating Views Counter Pill (Mockup Style) */}
        <div className="absolute bottom-3 left-3 bg-black/50 text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/5 shadow-sm">
          {formatViews(item.views)}
        </div>
      </div>

      {/* 3. Text Details & Social Action Bar */}
      <div className="p-4.5 flex flex-col gap-3">
        {/* Caption & Description */}
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-foreground leading-snug tracking-tight">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {item.description}
          </p>
          <p className="text-xs font-black text-primary leading-snug mt-1 font-sans">
            {hashtags}
          </p>
        </div>

        {/* Separator */}
        <div className="border-t border-border mt-0.5"></div>

        {/* Action Toolbar */}
        <div className="flex justify-between items-center pt-1">
          <div className="flex gap-2">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`p-2 rounded-full transition-all active:scale-90 cursor-pointer flex items-center gap-1.5 text-[10px] font-bold ${
                liked 
                  ? "bg-rose-950/20 text-rose-500 border border-rose-900/30" 
                  : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
              }`}
              title="Like"
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current text-rose-500" : ""}`} />
              <span>{likesCount}</span>
            </button>

            {/* Comment / Category Badge */}
            <div
              className="p-2 px-3 rounded-full bg-muted/30 text-muted-foreground border border-transparent flex items-center gap-1.5 text-[10px] font-bold"
              title="Category"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wide text-[8px] font-black">{item.category}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent transition-all active:scale-90 relative cursor-pointer"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
              {shared && (
                <span className="absolute bottom-11 right-1/2 translate-x-1/2 bg-zinc-950 text-white text-[9px] px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap border border-border">
                  Link copied!
                </span>
              )}
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              className={`p-2 rounded-full transition-all active:scale-90 cursor-pointer flex items-center gap-1.5 text-[10px] font-bold ${
                saved 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
              }`}
              title="Save"
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`} />
              <span>{savesCount}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
