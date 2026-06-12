"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, User, Compass, TrendingUp, Info, Sparkles, RefreshCw, 
  Home, MessageCircle, Heart, PlusSquare, Moon, Sun, X 
} from "lucide-react";
import { api, getAuthToken, removeAuthToken } from "@/utils/api";
import ContentCard from "@/components/ContentCard";
import DetailModal from "@/components/DetailModal";

function HomeFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTrending, setIsTrending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Custom states for hybrid UI
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Pagination
  const [skip, setSkip] = useState(0);
  const LIMIT = 15;
  const [hasMore, setHasMore] = useState(true);

  // Google Drive Modal States
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveImportType, setDriveImportType] = useState<"folder" | "file">("folder");
  const [driveFolderId, setDriveFolderId] = useState("1KC3NJ4JzpmaBdgsDOJQXszfyqijL58kY");
  const [driveFileId, setDriveFileId] = useState("");
  const [driveApiKey, setDriveApiKey] = useState("");
  const [driveAccessToken, setDriveAccessToken] = useState("");
  const [driveCategory, setDriveCategory] = useState("Nature");
  const [driveCount, setDriveCount] = useState(10);
  const [driveImporting, setDriveImporting] = useState(false);
  const [driveImportMessage, setDriveImportMessage] = useState("");
  const [isParentFolder, setIsParentFolder] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load user status, categories, theme and initial feed
  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
    
    // Initialize dark/light mode
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

    async function init() {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        
        if (token) {
          try {
            const me = await api.getMe();
            setUser(me);
          } catch (e) {
            console.error("Token expired or invalid", e);
            removeAuthToken();
            setIsLoggedIn(false);
          }
        }
      } catch (err) {
        console.error("Initialization error", err);
      }
    }
    init();
  }, []);

  // Fetch content based on filters
  useEffect(() => {
    async function fetchFeed() {
      try {
        setLoading(true);
        let data = [];
        if (searchQuery) {
          data = await api.search(searchQuery, selectedCategory || undefined);
          setHasMore(false); // Search is not paginated in basic API
        } else if (isTrending) {
          data = await api.getTrending(0, LIMIT);
          setHasMore(data.length === LIMIT);
        } else {
          data = await api.getContent(selectedCategory || undefined, 0, LIMIT);
          setHasMore(data.length === LIMIT);
        }
        setItems(data);
        setSkip(LIMIT);
      } catch (err) {
        console.error("Failed to load feed", err);
      } finally {
        setLoading(false);
      }
    }
    
    // Check if deep linked contentId exists in URL search params
    const contentIdParam = searchParams.get("contentId");
    if (contentIdParam) {
      setSelectedItemId(contentIdParam);
    }
    
    fetchFeed();
  }, [selectedCategory, searchQuery, isTrending, searchParams, refreshTrigger]);

  // Load more pagination
  const handleLoadMore = async () => {
    try {
      let data = [];
      if (isTrending) {
        data = await api.getTrending(skip, LIMIT);
      } else {
        data = await api.getContent(selectedCategory || undefined, skip, LIMIT);
      }
      if (data.length > 0) {
        setItems((prev) => [...prev, ...data]);
        setSkip((prev) => prev + LIMIT);
        if (data.length < LIMIT) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error loading more", e);
    }
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

  const handleResetFeed = () => {
    setSelectedCategory("");
    setSearchQuery("");
    setIsTrending(false);
    router.push("/");
  };

  const handleDriveImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriveImporting(true);
    setDriveImportMessage("");
    try {
      const payload: any = {
        api_key: driveApiKey || undefined,
        access_token: driveAccessToken || undefined,
      };

      if (driveImportType === "folder") {
        if (!driveFolderId.trim()) {
          throw new Error("Folder ID is required");
        }
        payload.folder_id = driveFolderId.trim();
        payload.count = driveCount;
        payload.is_parent_folder = isParentFolder;
        if (!isParentFolder) {
          payload.category = driveCategory;
        }
      } else {
        if (!driveFileId.trim()) {
          throw new Error("File ID is required");
        }
        payload.file_id = driveFileId.trim();
        payload.category = driveCategory;
      }

      const results = await api.importFromDrive(payload);
      
      const updatedCats = await api.getCategories();
      setCategories(updatedCats);

      setDriveImportMessage(`Successfully imported ${results.length} items from Google Drive!`);
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => {
        setShowDriveModal(false);
      }, 1500);
    } catch (err: any) {
      setDriveImportMessage(err.message || "Failed to import from Google Drive.");
    } finally {
      setDriveImporting(false);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSearchQuery("");
    setIsTrending(false);
    if (selectedCategory === cat) {
      setSelectedCategory(""); // Toggle off
    } else {
      setSelectedCategory(cat);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* 1. Desktop Side Navigation Sidebar (Instagram style) */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 border-r border-border bg-background flex-col justify-between py-7 px-5 z-40">
        <div className="space-y-8">
          {/* Logo */}
          <div onClick={handleResetFeed} className="flex items-center gap-3 cursor-pointer pl-2">
            <div className="w-8.5 h-8.5 bg-primary rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md shadow-primary/10">
              P
            </div>
            <span className="font-black text-xl tracking-tight">Pixora</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={handleResetFeed}
              className={`w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold transition-all ${
                !selectedCategory && !searchQuery && !isTrending
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                const searchEl = document.getElementById("desktop-search-input");
                if (searchEl) searchEl.focus();
              }}
              className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>

            <button
              onClick={() => {
                setIsTrending(true);
                setSelectedCategory("");
                setSearchQuery("");
              }}
              className={`w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold transition-all ${
                isTrending
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
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
              onClick={() => setShowDriveModal(true)}
              className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
            >
              <PlusSquare className="w-5 h-5" />
              <span>Create</span>
            </button>

            {isLoggedIn ? (
              <button
                onClick={() => router.push("/profile")}
                className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="truncate">{user?.name || "Profile"}</span>
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-primary hover:bg-primary/5 transition-all"
              >
                <User className="w-5 h-5" />
                <span>Log In</span>
              </button>
            )}
          </nav>
        </div>

        {/* Bottom Actions (Theme Switcher) */}
        <div className="border-t border-border pt-4">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Top Navigation Header */}
      <header className="lg:hidden sticky top-0 bg-background/90 backdrop-blur-md border-b border-border/50 z-30 px-4 py-3.5 flex items-center justify-between gap-4">
        {/* Mobile Logo */}
        <div onClick={handleResetFeed} className="flex items-center gap-2 cursor-pointer">
          <div className="w-7.5 h-7.5 bg-primary rounded-xl flex items-center justify-center font-black text-lg text-white">
            P
          </div>
          <span className="font-extrabold text-lg tracking-tight">Pixora</span>
        </div>

        {/* Compact Search Form */}
        <form onSubmit={(e) => e.preventDefault()} className="flex-1 max-w-[180px] relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setIsTrending(false);
              setSearchQuery(e.target.value);
            }}
            className="w-full bg-secondary/80 rounded-full py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
          />
        </form>

        {/* Theme / DMs mobile buttons */}
        <div className="flex items-center gap-2.5">
          <button onClick={toggleDarkMode} className="text-foreground">
            {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button onClick={() => showToast("Direct Messages coming soon!")} className="text-foreground">
            <MessageCircle className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 lg:pl-64 min-h-screen flex flex-col pb-28 lg:pb-8">
        
        {/* Dynamic Guest Banner */}
        {!isLoggedIn && (
          <div className="bg-primary text-primary-foreground py-3 px-6 text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2 relative z-30 shadow-md">
            <Sparkles className="w-4 h-4 animate-bounce" />
            <span>Sign up to customize recommendations according to your taste!</span>
            <button 
              onClick={() => router.push("/login")}
              className="ml-3 bg-white text-zinc-950 px-3.5 py-1.5 rounded-full text-[10px] font-black shadow hover:bg-zinc-100 transition-all active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Feed Content Area */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 mt-6 flex-1">
          
          {/* Discover Header */}
          <div className="flex justify-between items-end mb-6">
            <div className="space-y-0.5">
              <h1 className="text-3xl font-black tracking-tight text-foreground">Discover</h1>
              <p className="text-xs text-muted-foreground">Find your favorite content</p>
            </div>
            
            <button
              onClick={() => {
                const searchEl = document.getElementById("desktop-search-input");
                if (searchEl) {
                  searchEl.focus();
                  searchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="w-10 h-10 rounded-full bg-secondary border border-border/40 flex items-center justify-center text-foreground hover:bg-secondary/80 active:scale-95 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Stories Categories Selector Carousel */}
          <div className="flex items-center gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar select-none border-b border-border/40 mb-6">
            {/* Add Story Button (All Topics) */}
            <div className="flex flex-col items-center gap-1.5 flex-none">
              <button
                onClick={handleResetFeed}
                className={`w-16 h-16 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  !selectedCategory && !isTrending
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <PlusSquare className="w-6 h-6" />
              </button>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                !selectedCategory && !isTrending ? "text-primary font-black" : "text-muted-foreground"
              }`}>
                All
              </span>
            </div>

            {/* Category Circles */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const label = cat.split(' ')[0];
              const initials = cat.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
              
              return (
                <div key={cat} className="flex flex-col items-center gap-1.5 flex-none">
                  <button
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-16 h-16 rounded-full p-[2.5px] transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 ring-2 ring-primary/20"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-xs font-black text-white">
                      {initials}
                    </div>
                  </button>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${
                    isSelected ? "text-primary font-black" : "text-muted-foreground"
                  }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Desktop Search Row */}
          <div className="hidden lg:block mb-8 relative max-w-xl">
            <Search className="w-4 h-4 text-muted-foreground absolute left-4.5 top-1/2 -translate-y-1/2" />
            <input
              id="desktop-search-input"
              type="text"
              placeholder="Search for designs, setups, sourdough, photography..."
              value={searchQuery}
              onChange={(e) => {
                setIsTrending(false);
                setSearchQuery(e.target.value);
              }}
              className="w-full bg-secondary hover:bg-secondary/80 border border-border/20 rounded-full py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all text-foreground"
            />
          </div>

          {/* Header Title */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground">
                {searchQuery
                  ? `Search results for "${searchQuery}"`
                  : isTrending
                  ? "Trending Showcase"
                  : selectedCategory
                  ? `${selectedCategory} Collection`
                  : isLoggedIn
                  ? "Recommended For You"
                  : "Discover Visual Ideas"}
              </h2>
              {isLoggedIn && !selectedCategory && !searchQuery && !isTrending && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                  Customized dynamically based on your liked/saved interaction history.
                </p>
              )}
            </div>
          </div>

          {/* Feed Layout */}
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-9 h-9 border-3 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-muted-foreground mt-4 font-semibold">Curating personalized pins...</p>
            </div>
          ) : items.length > 0 ? (
            <div>
              {/* Pinterest-style Masonry Columns */}
              <div className="masonry-grid">
                {items.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItemId(item.id)}
                    onLikeToggle={() => {}}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && !searchQuery && (
                <div className="flex justify-center mt-14">
                  <button
                    onClick={handleLoadMore}
                    className="flex items-center gap-2 px-6 py-4 bg-secondary hover:bg-secondary/70 text-foreground text-xs font-extrabold rounded-full transition-all active:scale-95 shadow-sm border border-border/20 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                    Load more inspiration
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-28 bg-secondary/15 rounded-3xl border border-dashed border-border/60">
              <Compass className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
              <h3 className="font-extrabold text-lg text-foreground">No recommendations found</h3>
              <p className="text-muted-foreground text-xs mt-1.5 max-w-sm mx-auto">Try typing a different keyword or browsing another category.</p>
            </div>
          )}
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation Bar (Floating Mockup Style) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 rounded-full border border-white/10 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-around z-40 lg:hidden px-4 shadow-2xl">
        <button 
          onClick={handleResetFeed} 
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            !selectedCategory && !searchQuery && !isTrending ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Home className="w-5.5 h-5.5" />
        </button>
        <button 
          onClick={() => {
            setIsTrending(true);
            setSelectedCategory("");
            setSearchQuery("");
          }}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            isTrending ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Compass className="w-5.5 h-5.5" />
        </button>
        
        {/* Central Add Button */}
        <button 
          onClick={() => setShowDriveModal(true)} 
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
        {isLoggedIn ? (
          <button 
            onClick={() => router.push("/profile")} 
            className="p-0.5 rounded-full border border-primary/45 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </button>
        ) : (
          <button 
            onClick={() => router.push("/login")} 
            className="p-2 rounded-full text-muted-foreground cursor-pointer"
          >
            <User className="w-5.5 h-5.5" />
          </button>
        )}
      </div>

      {/* 5. Custom notification toast overlay */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 lg:left-76 lg:-translate-y-0 bg-foreground text-background px-5 py-3 rounded-2xl shadow-2xl z-50 text-xs font-extrabold flex items-center gap-2 border border-border/20 transition-all duration-300">
          <Info className="w-4 h-4 text-primary animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 6. Detail Modal Overlay */}
      {selectedItemId && (
        <DetailModal
          itemId={selectedItemId}
          onClose={() => {
            setSelectedItemId(null);
            // Clean contentId search param from URL on close
            const params = new URLSearchParams(window.location.search);
            params.delete("contentId");
            const newUrl = params.toString() ? `/?${params.toString()}` : "/";
            window.history.replaceState({}, "", newUrl);
          }}
          onNavigateToItem={(id) => setSelectedItemId(id)}
        />
      )}

      {/* --- GOOGLE DRIVE IMPORT DIALOG --- */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/75 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative text-zinc-300">
            {/* Header */}
            <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
              <h3 className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                Google Drive Ingestion
              </h3>
              <button 
                onClick={() => setShowDriveModal(false)}
                className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDriveImportSubmit} className="p-6 space-y-4">
              {driveImportMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  driveImportMessage.includes("Successfully") 
                    ? "bg-amber-950/40 border border-amber-900/50 text-primary" 
                    : "bg-rose-950/40 border border-rose-900/50 text-rose-400"
                }`}>
                  {driveImportMessage}
                </div>
              )}

              {/* Import Type Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-900">
                <button
                  type="button"
                  onClick={() => setDriveImportType("folder")}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    driveImportType === "folder" 
                      ? "bg-zinc-800 text-primary shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Folder Import
                </button>
                <button
                  type="button"
                  onClick={() => setDriveImportType("file")}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    driveImportType === "file" 
                      ? "bg-zinc-800 text-primary shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Catalog File (CSV/JSON)
                </button>
              </div>

              {driveImportType === "folder" ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Google Drive Folder ID</label>
                  <input
                    type="text"
                    required
                    value={driveFolderId}
                    onChange={(e) => setDriveFolderId(e.target.value)}
                    placeholder="e.g., 1A2b3C4d5E6f_..."
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-amber-500/50 placeholder-zinc-700 text-zinc-300"
                  />
                  <p className="text-[9px] text-zinc-600">Reads all images contained within the specified Google Drive folder.</p>
                  
                  {/* Parent Ingestion Checkbox */}
                  <div className="flex items-center gap-2 pt-2 select-none">
                    <input
                      type="checkbox"
                      id="is-parent-folder"
                      checked={isParentFolder}
                      onChange={(e) => setIsParentFolder(e.target.checked)}
                      className="w-3.5 h-3.5 accent-amber-500 bg-zinc-900 rounded border-zinc-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="is-parent-folder" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 cursor-pointer">
                      Contains Category Subfolders (Parent Ingestion)
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Google Drive File ID / Name</label>
                  <input
                    type="text"
                    required
                    value={driveFileId}
                    onChange={(e) => setDriveFileId(e.target.value)}
                    placeholder="e.g., catalog_data.csv, 1g2h3i4j_..."
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-amber-500/50 placeholder-zinc-700 text-zinc-300"
                  />
                  <p className="text-[9px] text-zinc-600">Downloads a CSV or JSON catalog and parses row fields.</p>
                </div>
              )}

              {/* Target Feed Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Target Feed Category</label>
                  <select
                    disabled={driveImportType === "folder" && isParentFolder}
                    value={driveCategory}
                    onChange={(e) => setDriveCategory(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-amber-500/50 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-zinc-950">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {driveImportType === "folder" ? "Max Folder Items" : "File Settings"}
                  </label>
                  <select
                    disabled={driveImportType !== "folder"}
                    value={driveCount}
                    onChange={(e) => setDriveCount(Number(e.target.value))}
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-amber-500/50 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="5" className="bg-zinc-950">5 items</option>
                    <option value="10" className="bg-zinc-950">10 items</option>
                    <option value="15" className="bg-zinc-950">15 items</option>
                    <option value="20" className="bg-zinc-950">20 items</option>
                  </select>
                </div>
              </div>

              {/* Credentials Header */}
              <div className="border-t border-zinc-900 pt-3 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Google Cloud Authentication (Optional)</span>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 flex justify-between">
                      <span>Google API Key</span>
                      <span className="text-zinc-600 font-normal normal-case">For public files/folders</span>
                    </label>
                    <input
                      type="password"
                      value={driveApiKey}
                      onChange={(e) => setDriveApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-amber-500/50 placeholder-zinc-800 text-zinc-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 flex justify-between">
                      <span>OAuth2 Access Token</span>
                      <span className="text-zinc-600 font-normal normal-case">For private content</span>
                    </label>
                    <input
                      type="text"
                      value={driveAccessToken}
                      onChange={(e) => setDriveAccessToken(e.target.value)}
                      placeholder="ya29.a0AfH6SM..."
                      className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-amber-500/50 placeholder-zinc-800 text-zinc-300"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-850 text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={driveImporting || (driveImportType === "folder" ? !driveFolderId.trim() : !driveFileId.trim())}
                  className="flex-1 bg-primary hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-xs py-3.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  {driveImporting ? "Processing..." : "Ingest from Google Drive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomeFeed() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-9 h-9 border-3 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <HomeFeedContent />
    </Suspense>
  );
}
