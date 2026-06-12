"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, Bookmark, Heart, Clock, User as UserIcon, BarChart2, 
  Home, Compass, MessageCircle, PlusSquare, Moon, Sun, Settings, Grid, Info, Search 
} from "lucide-react";
import { api, removeAuthToken, getAuthToken } from "@/utils/api";
import ContentCard from "@/components/ContentCard";
import DetailModal from "@/components/DetailModal";

// Emojis for Instagram-style Highlights mapping
const CATEGORY_EMOJIS: Record<string, string> = {
  "Nature": "🌲",
  "Technology": "💻",
  "Recipes": "🍕",
  "Travel": "✈️",
  "Design": "🎨",
  "Artificial Intelligence": "🤖",
  "Education": "📚",
  "Photography": "📷",
  "Fitness": "🏋️"
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"saved" | "liked" | "activity">("saved");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }

    // Initialize Dark Mode
    const savedTheme = localStorage.getItem("pixora_theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const darkActive = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    if (darkActive) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }

    async function loadProfile() {
      try {
        setLoading(true);
        const data = await api.getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile", err);
        removeAuthToken();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("pixora_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("pixora_theme", "light");
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-9 h-9 border-3 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  const { user, saved_posts, liked_posts, recent_activities } = profile;

  // Retrieve user interest tags sorted by weight
  const sortedInterests = Object.entries(user.interests || {})
    .sort((a: any, b: any) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* 1. Desktop Side Navigation Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 border-r border-border bg-background flex-col justify-between py-7 px-5 z-40">
        <div className="space-y-8">
          {/* Logo */}
          <div onClick={() => router.push("/")} className="flex items-center gap-3 cursor-pointer pl-2">
            <div className="w-8.5 h-8.5 bg-primary rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md shadow-primary/10">
              P
            </div>
            <span className="font-black text-xl tracking-tight">Pixora</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => router.push("/")}
              className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>

            <button
              onClick={() => {
                router.push("/?trending=true");
              }}
              className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
            >
              <Compass className="w-5 h-5" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => showToast("Direct Messages coming soon!")}
              className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Messages</span>
            </button>

            <button
              onClick={() => showToast("No new notifications")}
              className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
            >
              <Heart className="w-5 h-5" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => showToast("Creation tool coming soon!")}
              className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
            >
              <PlusSquare className="w-5 h-5" />
              <span>Create</span>
            </button>

            <button
              onClick={() => {}}
              className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold bg-secondary text-foreground transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{user.name}</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions (Theme & Logout) */}
        <div className="border-t border-border pt-4 space-y-1">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Top Navigation Header */}
      <header className="lg:hidden sticky top-0 bg-background/90 backdrop-blur-md border-b border-border/50 z-30 px-4 py-3.5 flex items-center justify-between">
        <div onClick={() => router.push("/")} className="flex items-center gap-2 cursor-pointer">
          <div className="w-7.5 h-7.5 bg-primary rounded-xl flex items-center justify-center font-black text-lg text-white">
            P
          </div>
          <span className="font-extrabold text-lg tracking-tight">Pixora</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleDarkMode} className="text-foreground">
            {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-secondary text-rose-600 border border-border/30"
          >
            Logout
          </button>
        </div>
      </header>

      {/* 3. Profile Content Area */}
      <div className="flex-1 lg:pl-64 min-h-screen flex flex-col pb-24 lg:pb-8">
        <main className="max-w-4xl w-full mx-auto px-4 sm:px-8 mt-10 flex-1">
          
          {/* Instagram Profile Header Section */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center border-b border-border pb-10">
            {/* Left: Avatar with colorful gradient ring */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-background border-4 border-background flex items-center justify-center text-foreground font-black text-3xl sm:text-4xl uppercase select-none">
                  {user.name.charAt(0)}
                </div>
              </div>
            </div>

            {/* Right: User Bio, Stats & Actions */}
            <div className="flex-1 text-center md:text-left space-y-4 w-full">
              {/* Row 1: Name and Profile Options */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">{user.name}</h1>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => showToast("Profile settings are mock-only")}
                    className="px-6 py-2 bg-secondary text-foreground text-xs font-bold rounded-lg border border-border/30 hover:opacity-90 active:scale-95 transition-all"
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => showToast("Opening settings...")}
                    className="p-2 bg-secondary text-foreground rounded-lg border border-border/30 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: Stats (Posts, Saved, Liked, Followers) */}
              <div className="flex justify-center md:justify-start gap-8 text-sm text-foreground">
                <div>
                  <span className="font-extrabold">{saved_posts.length}</span>{" "}
                  <span className="text-muted-foreground text-xs font-medium">pins</span>
                </div>
                <div>
                  <span className="font-extrabold">{liked_posts.length}</span>{" "}
                  <span className="text-muted-foreground text-xs font-medium">liked</span>
                </div>
                <div>
                  <span className="font-extrabold">184</span>{" "}
                  <span className="text-muted-foreground text-xs font-medium">followers</span>
                </div>
                <div>
                  <span className="font-extrabold">260</span>{" "}
                  <span className="text-muted-foreground text-xs font-medium">following</span>
                </div>
              </div>

              {/* Row 3: Biography */}
              <div className="text-sm leading-relaxed max-w-md">
                <p className="font-black text-foreground">@{user.email.split("@")[0]}</p>
                <p className="text-muted-foreground font-medium mt-1">
                  Visual storyteller. Curating visual ideas in design, technology, and travel. Powered by Pixora Recommendations.
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2 justify-center md:justify-start font-semibold">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Joined Pixora on {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Instagram highlights: Top categories */}
          {sortedInterests.length > 0 && (
            <div className="py-8 border-b border-border">
              <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-5">
                Saved Interests
              </h3>
              <div className="flex gap-6 overflow-x-auto pb-2 no-scrollbar select-none">
                {sortedInterests.map(([cat, val]: any) => {
                  const emoji = CATEGORY_EMOJIS[cat] || "✨";
                  return (
                    <div 
                      key={cat} 
                      onClick={() => router.push(`/?category=${encodeURIComponent(cat)}`)}
                      className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 group"
                    >
                      <div className="w-14 h-14 rounded-full p-[2px] bg-secondary border border-border group-hover:border-primary/50 transition-all flex items-center justify-center bg-card shadow-sm">
                        <span className="text-2xl group-hover:scale-110 transition-transform">{emoji}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors max-w-[65px] truncate text-center">
                        {cat}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Selection Layout (Instagram Profile style) */}
          <div className="flex justify-center border-t border-transparent gap-12 sm:gap-20 text-xs font-bold text-muted-foreground mt-2">
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-1.5 py-4 border-t-2 uppercase tracking-widest transition-all ${
                activeTab === "saved"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved Pins ({saved_posts.length})
            </button>
            
            <button
              onClick={() => setActiveTab("liked")}
              className={`flex items-center gap-1.5 py-4 border-t-2 uppercase tracking-widest transition-all ${
                activeTab === "liked"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Liked ({liked_posts.length})
            </button>
            
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex items-center gap-1.5 py-4 border-t-2 uppercase tracking-widest transition-all ${
                activeTab === "activity"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Activities
            </button>
          </div>

          {/* Grid Layouts for Saved/Liked posts (Instagram Photo Grid) */}
          <div className="mt-6">
            {activeTab === "saved" && (
              <div>
                {saved_posts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 sm:gap-6">
                    {saved_posts.map((item: any) => (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border/20 cursor-pointer group bg-zinc-950 flex items-center justify-center"
                      >
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Hover Overlay with Likes/Saves (Instagram style) */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-5 text-white font-extrabold text-xs sm:text-sm transition-opacity">
                          <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 fill-current text-white" /> {item.likes}</span>
                          <span className="flex items-center gap-1.5"><Bookmark className="w-4 h-4 fill-current text-white" /> {item.saves}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-secondary/15 rounded-3xl border border-dashed border-border/60">
                    <Bookmark className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                    <h3 className="font-extrabold text-base">No saved pins</h3>
                    <p className="text-muted-foreground text-xs mt-1">Pins you bookmark will organize here.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "liked" && (
              <div>
                {liked_posts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 sm:gap-6">
                    {liked_posts.map((item: any) => (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border/20 cursor-pointer group bg-zinc-950 flex items-center justify-center"
                      >
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-5 text-white font-extrabold text-xs sm:text-sm transition-opacity">
                          <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 fill-current text-white" /> {item.likes}</span>
                          <span className="flex items-center gap-1.5"><Bookmark className="w-4 h-4 fill-current text-white" /> {item.saves}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-secondary/15 rounded-3xl border border-dashed border-border/60">
                    <Heart className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                    <h3 className="font-extrabold text-base">No liked pins</h3>
                    <p className="text-muted-foreground text-xs mt-1">Visual ideas you heart will compile here.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm max-w-xl mx-auto">
                {recent_activities.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {recent_activities.map((activity: any, idx: number) => (
                        <li key={idx}>
                          <div className="relative pb-8">
                            {idx !== recent_activities.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                            )}
                            <div className="relative flex space-x-3.5">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-card ${
                                  activity.action === "like"
                                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20"
                                    : activity.action === "save"
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                                    : "bg-blue-50 text-blue-600 dark:bg-blue-950/20"
                                }`}>
                                  {activity.action === "like" ? (
                                    <Heart className="w-4 h-4 fill-current" />
                                  ) : activity.action === "save" ? (
                                    <Bookmark className="w-4 h-4 fill-current" />
                                  ) : (
                                    <UserIcon className="w-4 h-4" />
                                  )}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-xs text-foreground font-semibold">
                                    You <span className="text-primary font-bold">{activity.action}d</span>{" "}
                                    <span className="underline cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedItemId(activity.content_id)}>
                                      {activity.content_title}
                                    </span>
                                  </p>
                                </div>
                                <div className="text-right text-[10px] whitespace-nowrap text-muted-foreground font-medium">
                                  {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-sm font-medium">
                    No recent activity logs recorded.
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation Bar (Floating Mockup Style) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 rounded-full border border-white/10 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-around z-40 lg:hidden px-4 shadow-2xl">
        <button 
          onClick={() => router.push("/")} 
          className="p-2 rounded-full text-muted-foreground transition-colors cursor-pointer"
        >
          <Home className="w-5.5 h-5.5" />
        </button>
        <button 
          onClick={() => router.push("/?trending=true")}
          className="p-2 rounded-full text-muted-foreground transition-colors cursor-pointer"
        >
          <Compass className="w-5.5 h-5.5" />
        </button>
        
        {/* Central Add Button */}
        <button 
          onClick={() => showToast("Creation tool coming soon!")} 
          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
        >
          <PlusSquare className="w-5.5 h-5.5" />
        </button>
        
        <button 
          onClick={() => showToast("No new notifications")} 
          className="p-2 rounded-full text-muted-foreground cursor-pointer"
        >
          <Heart className="w-5.5 h-5.5" />
        </button>
        <button 
          onClick={() => {}} 
          className="p-0.5 rounded-full border border-primary cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </button>
      </div>

      {/* 5. Custom notification toast overlay */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-y-1/2 lg:left-76 lg:-translate-y-0 bg-foreground text-background px-5 py-3 rounded-2xl shadow-2xl z-50 text-xs font-extrabold flex items-center gap-2 border border-border/20 transition-all duration-300">
          <Info className="w-4 h-4 text-primary animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 6. Detail Modal Overlay */}
      {selectedItemId && (
        <DetailModal
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
          onNavigateToItem={(id) => setSelectedItemId(id)}
        />
      )}
    </div>
  );
}
