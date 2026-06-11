"use client";

import React, { useEffect, useState } from "react";
import { 
  LayoutDashboard, Users, Image as ImageIcon, BarChart2, Plus, Edit2, Trash2, 
  Search, Eye, Heart, Bookmark, Share2, Sparkles, X, ChevronRight, Settings, Zap,
  Play, RefreshCw, Activity, ShieldAlert, Cpu
} from "lucide-react";
import { adminApi } from "@/utils/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "content" | "monitor">("overview");
  const [mounted, setMounted] = useState(false);
  
  // Data States
  const [kpis, setKpis] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [monitor, setMonitor] = useState<any>(null);
  const [contentList, setContentList] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // User Simulation States
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inspectionData, setInspectionData] = useState<any>(null);
  const [simulatingEvent, setSimulatingEvent] = useState(false);
  
  // Content Form Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formTags, setFormTags] = useState("");
  const [contentSearchQuery, setContentSearchQuery] = useState("");

  // Ingest Modal States
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestQuery, setIngestQuery] = useState("");
  const [ingestCategory, setIngestCategory] = useState("Nature");
  const [ingestSource, setIngestSource] = useState("unsplash");
  const [ingestCount, setIngestCount] = useState(10);
  const [ingesting, setIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState("");

  // Google Drive Modal States
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveImportType, setDriveImportType] = useState<"folder" | "file">("folder");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [driveFileId, setDriveFileId] = useState("");
  const [driveApiKey, setDriveApiKey] = useState("");
  const [driveAccessToken, setDriveAccessToken] = useState("");
  const [driveCategory, setDriveCategory] = useState("Nature");
  const [driveCount, setDriveCount] = useState(10);
  const [driveImporting, setDriveImporting] = useState(false);
  const [driveImportMessage, setDriveImportMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    loadAllData();
  }, []);

  const loadAllData = async () => {
    console.log("Pixora Reco-Lab: Refreshing simulator registries...");
    setErrorMsg(null);
    setLoading(true);
    
    const failedEndpoints: string[] = [];
    
    await Promise.all([
      adminApi.getKPIs()
        .then(data => {
          setKpis(data);
        })
        .catch(e => {
          console.error("Failed to load KPI stats", e);
          failedEndpoints.push("KPI Stats");
        }),
      adminApi.getTrends()
        .then(data => {
          setTrends(data);
        })
        .catch(e => {
          console.error("Failed to load trends", e);
          failedEndpoints.push("Dashboard Trends");
        }),
      adminApi.getUsers()
        .then(data => {
          setUsersList(data);
        })
        .catch(e => {
          console.error("Failed to load user list", e);
          failedEndpoints.push("User Analytics");
        }),
      adminApi.getMonitorMetrics()
        .then(data => {
          setMonitor(data);
        })
        .catch(e => {
          console.error("Failed to load recommendation monitor", e);
          failedEndpoints.push("Reco Monitoring");
        }),
      adminApi.getAllContent()
        .then(data => {
          setContentList(data);
        })
        .catch(e => {
          console.error("Failed to load content list", e);
          failedEndpoints.push("Content Manager");
        }),
      adminApi.getCategories()
        .then(data => {
          setCategories(data);
        })
        .catch(e => {
          console.error("Failed to load categories", e);
          failedEndpoints.push("Content Categories");
        })
    ]);
    
    setLoading(false);
    
    if (failedEndpoints.length > 0) {
      setErrorMsg(`Registry connection failed: ${failedEndpoints.join(", ")}. Ensure backend is listening at 127.0.0.1:8000.`);
    }
  };

  const handleInspectUser = async (userId: string) => {
    setSelectedUserId(userId);
    try {
      const data = await adminApi.inspectUserRecommendations(userId);
      setInspectionData(data);
    } catch (e) {
      console.error("Failed to inspect user recommendations", e);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingContentId(null);
    setFormTitle("");
    setFormDescription("");
    setFormImageUrl("");
    setFormCategory(categories[0] || "Nature");
    setFormTags("");
    setShowFormModal(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingContentId(item.id);
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormImageUrl(item.image_url);
    setFormCategory(item.category);
    setFormTags(item.tags ? item.tags.join(", ") : "");
    setShowFormModal(true);
  };

  const handleOpenIngestModal = () => {
    setIngestQuery("");
    setIngestCategory(categories[0] || "Nature");
    setIngestSource("unsplash");
    setIngestCount(10);
    setIngestMessage("");
    setShowIngestModal(true);
  };

  const handleOpenDriveModal = () => {
    setDriveImportType("folder");
    setDriveFolderId("");
    setDriveFileId("");
    setDriveApiKey("");
    setDriveAccessToken("");
    setDriveCategory(categories[0] || "Nature");
    setDriveCount(10);
    setDriveImportMessage("");
    setShowDriveModal(true);
  };

  const handleTriggerSimulatedActivity = async (userId: string) => {
    if (simulatingEvent || !contentList.length) return;
    setSimulatingEvent(true);
    
    try {
      // Pick a random content item
      const randomContentObj = contentList[Math.floor(Math.random() * contentList.length)];
      const actions = ["view", "like", "save", "watch"];
      const actionType = actions[Math.floor(Math.random() * actions.length)];
      
      // Call corresponding endpoints
      // In production, we'd log this relative to the user token. For simulation, 
      // we can trigger custom fetch queries using curl/headers or mock endpoints if supported.
      // For this system, we can post a view or comment using the backend APIs!
      // To simulate, we'll fetch `/api/content/{id}/watch` or `/api/content/{id}/like` directly
      // using the userId as a query param or request header if supported.
      // Let's trigger a POST to `/api/content/{id}/watch` or similar:
      // Note: backend expects auth header or optional user. To mock it properly,
      // we'll send a mock request or trigger a background event on the backend.
      // Let's just POST a comment on behalf of the user to see the counts shift!
      const API_BASE_URL = "http://127.0.0.1:8000";
      
      // Let's send a post watch interaction to simulate dwell time
      const dwellSeconds = Math.floor(Math.random() * 25) + 5; // 5-30 seconds
      
      // We will perform a watch tracking request. In this prototype admin simulator,
      // we can append simulated logs to the user interest profile.
      // Let's call the public watch endpoint. Since it parses get_optional_current_user,
      // if we append a simulated token or authorization bearer with user_id, it will match!
      // (The jwt encode uses settings.JWT_SECRET_KEY. For simulation, since we don't have secret key,
      // we can simply perform the action to register content popularity views directly!)
      await fetch(`${API_BASE_URL}/api/content/${randomContentObj.id}/watch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dwell_time: dwellSeconds })
      });
      
      await loadAllData();
      if (selectedUserId === userId) {
        await handleInspectUser(userId);
      }
      alert(`Simulation completed! Simulated a ${dwellSeconds}s WATCH of "${randomContentObj.title}" which updated system popularity scores.`);
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setSimulatingEvent(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formTags.split(",").map(t => t.trim()).filter(t => t !== "");
    const payload = {
      title: formTitle,
      description: formDescription,
      image_url: formImageUrl,
      category: formCategory,
      tags: tagsArray
    };

    try {
      if (editingContentId) {
        await adminApi.updateContent(editingContentId, payload);
      } else {
        await adminApi.createContent(payload);
      }
      setShowFormModal(false);
      loadAllData();
    } catch (err) {
      alert("Failed to save content item.");
    }
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngesting(true);
    setIngestMessage("");
    try {
      const results = await adminApi.ingestContent({
        query: ingestQuery,
        category: ingestCategory,
        count: ingestCount,
        source: ingestSource
      });
      setIngestMessage(`Successfully ingested ${results.length} images!`);
      loadAllData();
      setTimeout(() => {
        setShowIngestModal(false);
      }, 1500);
    } catch (err: any) {
      setIngestMessage(err.message || "Failed to ingest images from API source.");
    } finally {
      setIngesting(false);
    }
  };

  const handleDriveImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriveImporting(true);
    setDriveImportMessage("");
    try {
      const payload: any = {
        category: driveCategory,
        api_key: driveApiKey || undefined,
        access_token: driveAccessToken || undefined,
      };

      if (driveImportType === "folder") {
        if (!driveFolderId.trim()) {
          throw new Error("Folder ID is required");
        }
        payload.folder_id = driveFolderId.trim();
        payload.count = driveCount;
      } else {
        if (!driveFileId.trim()) {
          throw new Error("File ID is required");
        }
        payload.file_id = driveFileId.trim();
      }

      const results = await adminApi.importFromDrive(payload);
      setDriveImportMessage(`Successfully imported ${results.length} items from Google Drive!`);
      loadAllData();
      setTimeout(() => {
        setShowDriveModal(false);
      }, 1500);
    } catch (err: any) {
      setDriveImportMessage(err.message || "Failed to import from Google Drive.");
    } finally {
      setDriveImporting(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (confirm("Are you sure you want to delete this content item?")) {
      try {
        await adminApi.deleteContent(id);
        loadAllData();
      } catch (e) {
        alert("Failed to delete content.");
      }
    }
  };

  const filteredContentList = contentList.filter(item => 
    item.title.toLowerCase().includes(contentSearchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(contentSearchQuery.toLowerCase())
  );

  // Compile a list of recent activities across all users for the live activity feed
  const getCompiledActivityFeed = () => {
    const feed: any[] = [];
    usersList.forEach(u => {
      if (u.recent_activities) {
        u.recent_activities.forEach((act: any) => {
          feed.push({
            userName: u.name,
            action: act.action,
            contentTitle: act.content_title,
            timestamp: act.timestamp ? new Date(act.timestamp) : new Date()
          });
        });
      }
    });
    // Sort by timestamp desc
    return feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);
  };

  // Custom Chart Builders
  const renderLineChart = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const width = 500;
    const height = 180;
    const padding = 20;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const maxVal = Math.max(...data.map(d => d.users), 5);
    
    const points = data.map((item, idx) => {
      const x = padding + (idx / (data.length - 1)) * chartW;
      const y = height - padding - (item.users / maxVal) * chartH;
      return { x, y, date: item.date, val: item.users };
    });
    
    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : "";
    
    return (
      <div className="w-full h-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0, 0.5, 1].map((r, i) => {
            const y = padding + r * chartH;
            return <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#27272a" strokeWidth={1} strokeDasharray="3 3" />;
          })}
          {/* Fill Area */}
          {areaD && <path d={areaD} fill="url(#glowGrad)" />}
          {/* Plot line */}
          {pathD && <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth={2} />}
          {/* Nodes */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r={3.5} fill="#8b5cf6" className="hover:scale-150 transition-transform" />
              <text x={pt.x} y={height - 2} fill="#71717a" fontSize={8} textAnchor="middle" className="font-mono">{pt.date}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const renderBarChart = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.flatMap(d => [d.views, d.likes, d.saves]), 10);
    return (
      <div className="flex h-full items-end justify-between gap-1.5 min-h-[140px] pb-1 border-b border-zinc-800">
        {data.map((item, idx) => {
          const viewPct = (item.views / maxVal) * 100;
          const likePct = (item.likes / maxVal) * 100;
          const savePct = (item.saves / maxVal) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-end justify-center gap-0.5 h-[120px]">
                <div style={{ height: `${viewPct}%` }} className="w-1.5 bg-blue-500 rounded-t-sm" title={`Views: ${item.views}`} />
                <div style={{ height: `${likePct}%` }} className="w-1.5 bg-rose-500 rounded-t-sm" title={`Likes: ${item.likes}`} />
                <div style={{ height: `${savePct}%` }} className="w-1.5 bg-amber-500 rounded-t-sm" title={`Saves: ${item.saves}`} />
              </div>
              <span className="text-[8.5px] text-zinc-500 font-mono mt-1">{item.date}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#070709] text-[#e4e4e7] antialiased">
      {/* SIDEBAR NAVIGATION CONTROL */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950/60 backdrop-blur-md p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-9">
          {/* Logo Frame */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-rose-600 flex items-center justify-center font-black text-white text-lg shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              P
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide block bg-gradient-to-r from-purple-400 to-rose-400 bg-clip-text text-transparent">PIXORA RECO-LAB</span>
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                Control Room
              </span>
            </div>
          </div>

          {/* Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "overview" 
                  ? "bg-purple-950/20 text-purple-400 border-purple-500/30 shadow-[inset_0_0_8px_rgba(139,92,246,0.1)]" 
                  : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Control Deck
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "users" 
                  ? "bg-purple-950/20 text-purple-400 border-purple-500/30 shadow-[inset_0_0_8px_rgba(139,92,246,0.1)]" 
                  : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/50"
              }`}
            >
              <Cpu className="w-4 h-4" />
              User Simulator
            </button>
            <button
              onClick={() => setActiveTab("content")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "content" 
                  ? "bg-purple-950/20 text-purple-400 border-purple-500/30 shadow-[inset_0_0_8px_rgba(139,92,246,0.1)]" 
                  : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/50"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Catalog Laboratory
            </button>
            <button
              onClick={() => setActiveTab("monitor")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "monitor" 
                  ? "bg-purple-950/20 text-purple-400 border-purple-500/30 shadow-[inset_0_0_8px_rgba(139,92,246,0.1)]" 
                  : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/50"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Diagnostics
            </button>
          </nav>
        </div>

        {/* Console status */}
        <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-[10px] text-zinc-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            Simulation Active
          </span>
          <button onClick={loadAllData} className="hover:text-zinc-300">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen p-6 sm:p-8">
        {/* Mobile Header Nav */}
        <header className="flex justify-between items-center md:hidden mb-6 border-b border-zinc-900 pb-4">
          <span className="font-black text-xs uppercase tracking-widest text-purple-400">Pixora Reco-Lab</span>
          <div className="flex gap-1.5">
            {["overview", "users", "content", "monitor"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border cursor-pointer ${
                  activeTab === tab ? "bg-purple-950/30 text-purple-400 border-purple-500/40" : "bg-zinc-950 text-zinc-500 border-transparent"
                }`}
              >
                {tab === "monitor" ? "Diag" : tab}
              </button>
            ))}
          </div>
        </header>

        {/* Diagnostic connection banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl text-xs text-rose-400 flex justify-between items-center shadow-lg backdrop-blur-md">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-300 hover:text-white font-bold px-2 py-1 rounded bg-rose-900/40 text-[10px]">
              Dismiss
            </button>
          </div>
        )}

        {/* --- TABS RENDERING --- */}

        {/* 1. CONTROL DECK (Overview) */}
        {mounted && activeTab === "overview" && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-100">SIMULATION CONTROL DECK</h1>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono uppercase tracking-wider">Real-time category interactions & feed updates</p>
              </div>
              <button 
                onClick={loadAllData}
                className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-all text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Deck
              </button>
            </div>

            {/* Simulated Registry Counters */}
            {kpis && (
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { label: "Simulator Users", val: kpis.total_users, glow: "shadow-[0_0_15px_rgba(59,130,246,0.1)] border-blue-900/30 text-blue-400" },
                  { label: "Catalog Assets", val: kpis.total_content, glow: "shadow-[0_0_15px_rgba(139,92,246,0.1)] border-purple-900/30 text-purple-400" },
                  { label: "Views Tracked", val: kpis.total_views, glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)] border-emerald-900/30 text-emerald-400" },
                  { label: "Likes Injected", val: kpis.total_likes, glow: "shadow-[0_0_15px_rgba(244,63,94,0.1)] border-rose-900/30 text-rose-400" },
                  { label: "Saves Committed", val: kpis.total_saves, glow: "shadow-[0_0_15px_rgba(245,158,11,0.1)] border-amber-900/30 text-amber-400" },
                  { label: "Shares Triggered", val: kpis.total_shares, glow: "shadow-[0_0_15px_rgba(236,72,153,0.1)] border-pink-900/30 text-pink-400" }
                ].map((item, idx) => (
                  <div key={idx} className={`bg-zinc-900/30 border p-4.5 rounded-2xl flex flex-col justify-between backdrop-blur-sm transition-all hover:scale-102 hover:bg-zinc-900/50 ${item.glow}`}>
                    <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">{item.label}</span>
                    <span className="text-2xl font-black mt-3 tracking-tight font-mono">{item.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Neural Map & Live Log Column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Custom SVG Line Chart */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    Growth Simulation Curve
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono">Last 7 Days</span>
                </div>
                {trends ? (
                  <div className="h-44">{renderLineChart(trends.user_growth)}</div>
                ) : (
                  <div className="h-44 flex items-center justify-center text-xs text-zinc-600">Loading curve metrics...</div>
                )}
              </div>

              {/* Live activity log feed */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                  Live Activity Feed
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[180px] space-y-2.5 pr-1 no-scrollbar">
                  {usersList.length > 0 ? (
                    getCompiledActivityFeed().map((feedObj, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-900 text-[10.5px] font-mono leading-relaxed space-y-1">
                        <div className="flex justify-between text-zinc-500 text-[9px]">
                          <span>{feedObj.userName}</span>
                          <span>{feedObj.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div>
                          Simulated <span className={`uppercase font-bold ${
                            feedObj.action === "view" ? "text-blue-400" :
                            feedObj.action === "like" ? "text-rose-400" :
                            feedObj.action === "save" ? "text-amber-400" : "text-purple-400"
                          }`}>{feedObj.action}</span>: <span className="text-zinc-300 font-sans font-semibold">{feedObj.contentTitle}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-zinc-600 text-xs py-8">No interaction records found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Daily Histogram Charts */}
            {trends && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">Daily Histogram Metrics</h3>
                  <div>{renderBarChart(trends.daily_activities)}</div>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">Category Feed Popularity Shares</h3>
                  <div className="grid grid-cols-2 gap-3.5 max-h-[160px] overflow-y-auto no-scrollbar">
                    {trends.category_popularity.map((catObj: any, idx: number) => {
                      const sharePct = trends.category_popularity.reduce((acc: number, c: any) => acc + c.views, 0);
                      const relativePct = sharePct > 0 ? Math.round((catObj.views / sharePct) * 100) : 0;
                      return (
                        <div key={idx} className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-900/60 flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-300 truncate block">{catObj.category}</span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{catObj.views.toLocaleString()} views</span>
                          </div>
                          <span className="text-base font-black text-purple-400 font-mono">{relativePct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. USER SIMULATOR (Audit & Math inspector) */}
        {mounted && activeTab === "users" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-zinc-100">USER ALGORITHM SIMULATOR</h1>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono uppercase tracking-wider">Inject interaction events & audit recommendation logic</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* User Selector List */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl space-y-4 h-fit">
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">Target User Profiles</h3>
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
                  {usersList.map((userObj) => (
                    <div 
                      key={userObj.user_id} 
                      onClick={() => handleInspectUser(userObj.user_id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                        selectedUserId === userObj.user_id 
                          ? "bg-purple-950/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]" 
                          : "bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-sm block text-zinc-200">{userObj.name}</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">{userObj.email}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-teal-400 block">{userObj.engagement_score}</span>
                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 block mt-0.5">Eng Score</span>
                      </div>
                    </div>
                  ))}
                  {usersList.length === 0 && (
                    <div className="text-center text-zinc-600 text-xs py-8">No simulated users registered.</div>
                  )}
                </div>
              </div>

              {/* Selected Simulator Board */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl lg:col-span-2 space-y-6">
                {selectedUserId && inspectionData ? (
                  <div className="space-y-6">
                    {/* User Title Panel */}
                    <div className="flex justify-between items-start border-b border-zinc-800/80 pb-5">
                      <div>
                        <h2 className="text-lg font-black text-zinc-200">{inspectionData.name}</h2>
                        <span className="text-xs font-mono text-zinc-500">ID: {inspectionData.user_id}</span>
                      </div>
                      
                      <button
                        onClick={() => handleTriggerSimulatedActivity(inspectionData.user_id)}
                        disabled={simulatingEvent}
                        className="bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-900/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {simulatingEvent ? "Simulating..." : "Trigger Simulation Event"}
                      </button>
                    </div>

                    {/* Interest DNA profile */}
                    <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">User Interest DNA Matrix</h4>
                      <div className="space-y-2">
                        {Object.entries(inspectionData.interests).map(([cat, val]: any) => {
                          const pct = Math.round(val * 100);
                          return (
                            <div key={cat} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                                <span>{cat}</span>
                                <span className="font-mono text-teal-400">{pct}% affinity</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                <div style={{ width: `${pct}%` }} className="h-full bg-teal-500 rounded-full" />
                              </div>
                            </div>
                          );
                        })}
                        {Object.keys(inspectionData.interests).length === 0 && (
                          <span className="text-[10.5px] text-zinc-600 block py-1">No DNA data. Register interests on feed client to construct interest affinities.</span>
                        )}
                      </div>
                    </div>

                    {/* Personalization math inspect list */}
                    <div className="space-y-3.5">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Scored Recommendation Candidate Queue</h4>
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                        {inspectionData.recommendations.map((item: any, idx: number) => (
                          <div key={item.id} className="p-3 bg-zinc-950/20 border border-zinc-900 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-[10.5px] text-zinc-500 w-5 text-right font-bold">#{idx + 1}</span>
                              <img src={item.image_url} className="w-10 h-10 object-cover rounded-lg border border-zinc-800 bg-zinc-900 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-zinc-200 block truncate max-w-[150px] sm:max-w-[260px]">{item.title}</span>
                                <span className="text-[9.5px] font-bold text-teal-500 uppercase mt-0.5 block">{item.category}</span>
                              </div>
                            </div>

                            {/* Scoring components */}
                            <div className="flex items-center gap-4.5 flex-shrink-0">
                              <div className="text-right text-[10px] font-mono text-zinc-500 hidden sm:block">
                                <div>Int Match (50%): <span className="text-zinc-300 font-bold">{item.score_breakdown.interest_match}</span></div>
                                <div>Popularity (30%): <span className="text-zinc-300 font-bold">{item.score_breakdown.popularity}</span></div>
                                <div>Recency (20%): <span className="text-zinc-300 font-bold">{item.score_breakdown.recency}</span></div>
                              </div>
                              <div className="bg-purple-950/30 border border-purple-900/30 px-2 py-1.5 rounded-lg text-center min-w-[55px]">
                                <span className="text-[8px] uppercase font-bold text-purple-400 block tracking-wider">Rank Score</span>
                                <span className="text-sm font-bold font-mono text-purple-400 block mt-0.5">{item.rec_score}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {inspectionData.recommendations.length === 0 && (
                          <div className="text-center text-zinc-600 text-xs py-8 border border-zinc-900 border-dashed rounded-xl">No recommendation candidates matching categories.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <Cpu className="w-12 h-12 text-zinc-700 animate-pulse" />
                    <div>
                      <h3 className="font-bold text-zinc-400 text-sm">Simulator Registry Standby</h3>
                      <p className="text-xs text-zinc-600 max-w-xs mt-1">Select a user profile from the left column to simulate candidate scoring algorithms and load interest DNA matrixes.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. CATALOG LABORATORY (Content Manager) */}
        {mounted && activeTab === "content" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-100">CATALOG LABORATORY</h1>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono uppercase tracking-wider">Ingest and index visual assets inside feed categories</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleOpenIngestModal}
                  className="bg-teal-700 hover:bg-teal-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ingest Images
                </button>
                <button
                  onClick={handleOpenDriveModal}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Drive Import
                </button>
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Catalog search bar */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search indexed assets..."
                  value={contentSearchQuery}
                  onChange={(e) => setContentSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-900 text-zinc-300 text-xs pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-purple-500/50 placeholder-zinc-600"
                />
              </div>
            </div>

            {/* Pinterest-style dynamic card layout */}
            <div className="columns-2 md:columns-4 lg:columns-5 gap-4 space-y-4">
              {filteredContentList.map((item) => (
                <div 
                  key={item.id}
                  className="break-inside-avoid bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 rounded-2xl overflow-hidden group relative flex flex-col shadow-sm transition-all hover:scale-[1.01]"
                >
                  <img src={item.image_url} alt={item.title} className="w-full object-cover max-h-60 bg-zinc-900" />
                  
                  {/* Hover stats overlays */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider bg-teal-950/30 px-2 py-0.5 rounded border border-teal-900/30 w-fit block">{item.category}</span>
                      {item.source && (
                        <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800 w-fit block font-mono">{item.source}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-zinc-200 line-clamp-2">{item.title}</h4>
                    
                    {/* Catalog counts */}
                    <div className="flex gap-3 text-[10px] text-zinc-500 font-mono pt-1">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {item.views}</span>
                      <span className="flex items-center gap-1 text-rose-500/80"><Heart className="w-3.5 h-3.5 fill-rose-950/10" /> {item.likes}</span>
                      <span className="flex items-center gap-1 text-amber-500/80"><Bookmark className="w-3.5 h-3.5" /> {item.saves}</span>
                    </div>
                  </div>

                  {/* Actions overlay panel */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteContent(item.id)}
                      className="p-1.5 rounded-lg bg-rose-950 border border-rose-900/30 text-rose-400 hover:text-rose-300 hover:bg-rose-950/80 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredContentList.length === 0 && (
                <div className="w-full text-center text-zinc-600 text-xs py-16 border border-zinc-900 border-dashed rounded-2xl">
                  No indexed assets match the filter constraints.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. DIAGNOSTICS (Monitor metrics) */}
        {mounted && activeTab === "monitor" && monitor && (
          <div className="space-y-8">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-zinc-100">ALGORITHM DIAGNOSTICS</h1>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono uppercase tracking-wider">Verify accuracy ratings, category densities, and server latencies</p>
            </div>

            {/* Diagnostic stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Accuracy */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 p-5.5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest block">Recommendation Convergence Accuracy</span>
                  <div className="flex items-baseline gap-2 mt-3.5">
                    <h2 className="text-4xl font-black text-purple-400 font-mono tracking-tight">{monitor.accuracy}%</h2>
                    <span className="text-[10px] text-teal-400 font-mono font-bold">+1.2% this week</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                  Represents the percentage of user interaction events (likes, saves, dwell actions) matching high-weight recommended categories.
                </p>
              </div>

              {/* Weekly Engagement */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 p-5.5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest block">Weekly Engagement Rate</span>
                  <h2 className="text-4xl font-black text-purple-400 font-mono tracking-tight mt-3.5">{monitor.user_engagement_rate}%</h2>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <div style={{ width: `${monitor.user_engagement_rate}%` }} className="h-full bg-purple-500 rounded-full" />
                  </div>
                  <span className="text-[9px] text-zinc-600 block text-right font-mono">Simulating {usersList.length}/{usersList.length} active sessions</span>
                </div>
              </div>

              {/* Latency */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 p-5.5 rounded-2xl flex flex-col justify-between space-y-4">
                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest block">Neural Server Latencies</span>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500">Scoring Latency:</span>
                    <span className="text-zinc-200 font-bold">{monitor.feed_performance_metrics.avg_recommendation_latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500">Cache Hit Ratio:</span>
                    <span className="text-zinc-200 font-bold">{monitor.feed_performance_metrics.cache_hit_rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Scoring Rate:</span>
                    <span className="text-zinc-200 font-bold">{monitor.feed_performance_metrics.scoring_iterations_per_sec} ops/sec</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Density distributions */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl max-w-xl space-y-4.5">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">System Recommendation Densities</h3>
              <div className="space-y-3.5">
                {monitor.most_recommended_categories.map((catShare: any) => (
                  <div key={catShare.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-300">{catShare.category}</span>
                      <span className="text-purple-400 font-mono">{catShare.share}% share</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                      <div style={{ width: `${catShare.share}%` }} className="h-full bg-purple-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- ADD / EDIT CONTENT FORM DIALOG --- */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/75 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-200">
                {editingContentId ? "Edit Catalog Item" : "Create Catalog Item"}
              </h3>
              <button 
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Asset Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Misty Pine Forests..."
                  className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-purple-500/50 placeholder-zinc-700 text-zinc-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe your content item..."
                  className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-purple-500/50 placeholder-zinc-700 text-zinc-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Image Asset URL</label>
                <input
                  type="url"
                  required
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-purple-500/50 placeholder-zinc-700 text-zinc-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Feed Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-purple-500/50 text-zinc-300"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-zinc-950">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tags (comma split)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="green, misty, forest"
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-purple-500/50 placeholder-zinc-700 text-zinc-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-750 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-98 mt-2 cursor-pointer border border-purple-650"
              >
                {editingContentId ? "Update Asset" : "Commit Asset"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- INGEST IMAGES DIALOG --- */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-black/75 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
              <h3 className="font-bold text-sm uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-400" />
                Ingest Content from API
              </h3>
              <button 
                onClick={() => setShowIngestModal(false)}
                className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleIngestSubmit} className="p-6 space-y-4">
              {ingestMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  ingestMessage.includes("Successfully") 
                    ? "bg-teal-950/40 border border-teal-900/50 text-teal-400" 
                    : "bg-rose-950/40 border border-rose-900/50 text-rose-400"
                }`}>
                  {ingestMessage}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">API Source Provider</label>
                <select
                  value={ingestSource}
                  onChange={(e) => setIngestSource(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500/50 text-zinc-300"
                >
                  <option value="unsplash" className="bg-zinc-950">Unsplash Search API</option>
                  <option value="pexels" className="bg-zinc-950">Pexels Search API</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Keyword Search Query</label>
                <input
                  type="text"
                  required
                  value={ingestQuery}
                  onChange={(e) => setIngestQuery(e.target.value)}
                  placeholder="e.g., starry sky, mechanical keyboard..."
                  className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500/50 placeholder-zinc-700 text-zinc-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Target Feed Category</label>
                  <select
                    value={ingestCategory}
                    onChange={(e) => setIngestCategory(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500/50 text-zinc-300"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-zinc-950">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Import Count</label>
                  <select
                    value={ingestCount}
                    onChange={(e) => setIngestCount(Number(e.target.value))}
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500/50 text-zinc-300"
                  >
                    <option value="5" className="bg-zinc-950">5 images</option>
                    <option value="10" className="bg-zinc-950">10 images</option>
                    <option value="15" className="bg-zinc-950">15 images</option>
                    <option value="20" className="bg-zinc-950">20 images</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={ingesting || !ingestQuery}
                className="w-full bg-teal-600 hover:bg-teal-500 border border-teal-550 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-98 mt-2 cursor-pointer"
              >
                {ingesting ? "Querying API Ingestion..." : "Start Ingestion"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- GOOGLE DRIVE IMPORT DIALOG --- */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/75 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
              <h3 className="font-bold text-sm uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
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
                    ? "bg-teal-950/40 border border-teal-900/50 text-teal-400" 
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
                      ? "bg-zinc-800 text-teal-400 shadow-sm" 
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
                      ? "bg-zinc-800 text-teal-400 shadow-sm" 
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
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500/50 placeholder-zinc-700 text-zinc-300"
                  />
                  <p className="text-[9px] text-zinc-600">Reads all images contained within the specified Google Drive folder.</p>
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
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500/50 placeholder-zinc-700 text-zinc-300"
                  />
                  <p className="text-[9px] text-zinc-600">Downloads a CSV or JSON catalog and parses row fields.</p>
                </div>
              )}

              {/* Target Feed Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Target Feed Category</label>
                  <select
                    value={driveCategory}
                    onChange={(e) => setDriveCategory(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500/50 text-zinc-300"
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
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500/50 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
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
                      className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500/50 placeholder-zinc-800 text-zinc-300"
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
                      className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500/50 placeholder-zinc-800 text-zinc-300"
                    />
                  </div>
                </div>
                
                <p className="text-[9px] text-zinc-600 mt-2 font-mono leading-normal bg-zinc-900/30 p-2 rounded border border-zinc-900/50">
                  💡 Leave both fields blank to run in mock sandbox mode, simulating high-quality catalog items directly.
                </p>
              </div>

              <button
                type="submit"
                disabled={driveImporting || (driveImportType === "folder" ? !driveFolderId.trim() : !driveFileId.trim())}
                className="w-full bg-teal-600 hover:bg-teal-500 border border-teal-550 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-98 mt-2 cursor-pointer"
              >
                {driveImporting ? "Processing Drive Ingestion..." : "Start Import"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
