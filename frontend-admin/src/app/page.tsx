"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Image as ImageIcon, BarChart2, Plus, Edit2, Trash2,
  Search, Eye, Heart, Bookmark, Share2, Sparkles, X, ChevronRight, Settings, Zap,
  Play, RefreshCw, Activity, ShieldAlert, Cpu, Database, Server, Info, Terminal
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
  const [driveFolderId, setDriveFolderId] = useState("1KC3NJ4JzpmaBdgsDOJQXszfyqijL58kY");
  const [driveFileId, setDriveFileId] = useState("");
  const [driveApiKey, setDriveApiKey] = useState("");
  const [driveAccessToken, setDriveAccessToken] = useState("");
  const [driveCategory, setDriveCategory] = useState("Nature");
  const [driveCount, setDriveCount] = useState(10);
  const [driveImporting, setDriveImporting] = useState(false);
  const [driveImportMessage, setDriveImportMessage] = useState("");
  const [isParentFolder, setIsParentFolder] = useState(true);

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
      const randomContentObj = contentList[Math.floor(Math.random() * contentList.length)];
      const API_BASE_URL = "http://127.0.0.1:8000";
      const dwellSeconds = Math.floor(Math.random() * 25) + 5; // 5-30 seconds
      const actionType = Math.random() < 0.35 ? "like" : "watch";

      const res = await fetch(`${API_BASE_URL}/api/admin/simulate/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          content_id: randomContentObj.id,
          action_type: actionType,
          dwell_time: actionType === "watch" ? dwellSeconds : null
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      await loadAllData();
      if (selectedUserId === userId) {
        await handleInspectUser(userId);
      }

      const feedbackMsg = actionType === "watch"
        ? `Simulated a ${dwellSeconds}s WATCH of "${randomContentObj.title}" (Category: ${randomContentObj.category})`
        : `Simulated a LIKE of "${randomContentObj.title}" (Category: ${randomContentObj.category})`;
      alert(`Simulation completed! ${feedbackMsg}`);
    } catch (err) {
      console.error("Simulation failed", err);
      alert("Simulation failed to commit activity event.");
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
    return feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);
  };

  // Modern SVG Line Chart Builder
  const renderLineChart = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const width = 500;
    const height = 180;
    const padding = 24;
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
      <div className="w-full h-full relative select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="neonGlowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bef200" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#bef200" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((r, i) => {
            const y = padding + r * chartH;
            return <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1e1e2f" strokeWidth={1} strokeDasharray="3 3" />;
          })}

          {/* Fill Area */}
          {areaD && <path d={areaD} fill="url(#neonGlowGrad)" />}

          {/* Plot line */}
          {pathD && <path d={pathD} fill="none" stroke="#bef200" strokeWidth={2.5} />}

          {/* Nodes */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r={4} fill="#bef200" className="cursor-pointer hover:r-6 transition-all" />
              <text x={pt.x} y={height - 4} fill="#64748b" fontSize={7.5} fontWeight="bold" textAnchor="middle" className="font-mono">{pt.date}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Modern Bar Chart Builder
  const renderBarChart = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.flatMap(d => [d.views, d.likes, d.saves]), 10);
    return (
      <div className="flex h-full items-end justify-between gap-2 min-h-[140px] pb-2 border-b border-zinc-900 select-none">
        {data.map((item, idx) => {
          const viewPct = (item.views / maxVal) * 100;
          const likePct = (item.likes / maxVal) * 100;
          const savePct = (item.saves / maxVal) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group">
              <div className="w-full flex items-end justify-center gap-0.5 h-[120px] relative">
                <div style={{ height: `${viewPct}%` }} className="w-1.5 bg-blue-500 rounded-t-sm transition-all" title={`Views: ${item.views}`} />
                <div style={{ height: `${likePct}%` }} className="w-1.5 bg-rose-500 rounded-t-sm transition-all" title={`Likes: ${item.likes}`} />
                <div style={{ height: `${savePct}%` }} className="w-1.5 bg-amber-500 rounded-t-sm transition-all" title={`Saves: ${item.saves}`} />
              </div>
              <span className="text-[8px] text-zinc-500 font-bold font-mono mt-1.5">{item.date}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#050508] text-[#f0f0f5] antialiased font-sans">

      {/* ══════════ SIDEBAR NAVIGATION ══════════ */}
      <aside className="w-64 border-r border-white/5 bg-zinc-950/60 backdrop-blur-xl p-6 flex flex-col justify-between hidden md:flex z-45 select-none">
        <div className="space-y-9">

          {/* Logo Frame */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyber-purple via-cyber-pink to-primary flex items-center justify-center font-black text-black text-xl shadow-lg">
              P
            </div>
            <div>
              <span className="font-black text-sm tracking-tight block text-white font-display">PIXORA RECO-LAB</span>
              <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                Control Room
              </span>
            </div>
          </div>

          {/* Links */}
          <nav className="space-y-1.5">
            {[
              { id: "overview", label: "Control Deck", icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: "users", label: "User Simulator", icon: <Cpu className="w-4 h-4" /> },
              { id: "content", label: "Catalog Lab", icon: <ImageIcon className="w-4 h-4" /> },
              { id: "monitor", label: "Diagnostics", icon: <BarChart2 className="w-4 h-4" /> },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as any)}
                className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                  activeTab === link.id
                    ? "bg-zinc-900 border-zinc-800 text-white shadow-lg"
                    : "text-zinc-500 border-transparent hover:text-zinc-350 hover:bg-zinc-900/40"
                }`}
              >
                {link.icon}
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Telemetry Status Console */}
        <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-2xl text-[10px] text-zinc-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <Server className="w-3.5 h-3.5 text-primary" />
            Simulation Active
          </span>
          <button onClick={loadAllData} className="hover:text-zinc-300 transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT PANEL ══════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen p-6 sm:p-8 z-10 relative">

        {/* Mobile Header Navigation */}
        <header className="flex justify-between items-center md:hidden mb-6 border-b border-white/5 pb-4 select-none">
          <span className="font-black text-xs uppercase tracking-widest text-primary font-display">Pixora Reco-Lab</span>
          <div className="flex gap-1.5">
            {["overview", "users", "content", "monitor"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border cursor-pointer transition-colors ${
                  activeTab === tab ? "bg-zinc-900 text-white border-zinc-800" : "bg-transparent text-zinc-500 border-transparent"
                }`}
              >
                {tab === "monitor" ? "Diag" : tab}
              </button>
            ))}
          </div>
        </header>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl text-xs text-rose-400 flex justify-between items-center shadow-lg backdrop-blur-md">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-300 hover:text-white font-bold px-3 py-1.5 rounded-lg bg-rose-900/40 text-[10px] cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* ─── TABS CONTENT ─── */}

        {/* 1. CONTROL DECK OVERVIEW */}
        {mounted && activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end select-none">
              <div>
                <h1 className="text-lg font-black tracking-tight text-white font-display uppercase">Simulation Control Deck</h1>
                <p className="text-xs text-zinc-500 mt-0.5 font-bold uppercase tracking-wider font-mono">Real-time category interactions & feed updates</p>
              </div>
              <button
                onClick={loadAllData}
                className="p-2.5 rounded-2xl border border-white/5 bg-zinc-900/60 hover:bg-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-all text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Registry
              </button>
            </div>

            {/* Simulated Registry Counters */}
            {kpis && (
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { label: "Simulator Users", val: kpis.total_users, color: "text-blue-400 border-blue-950/40" },
                  { label: "Catalog Assets", val: kpis.total_content, color: "text-purple-400 border-purple-950/40" },
                  { label: "Views Tracked", val: kpis.total_views, color: "text-emerald-400 border-emerald-950/40" },
                  { label: "Likes Injected", val: kpis.total_likes, color: "text-rose-400 border-rose-950/40" },
                  { label: "Saves Committed", val: kpis.total_saves, color: "text-amber-400 border-amber-950/40" },
                  { label: "Shares Triggered", val: kpis.total_shares, color: "text-pink-400 border-pink-950/40" }
                ].map((item, idx) => (
                  <div key={idx} className={`glass-panel border p-4.5 rounded-2xl flex flex-col justify-between transition-transform hover:scale-[1.02] ${item.color}`}>
                    <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">{item.label}</span>
                    <span className="text-2xl font-black mt-3.5 tracking-tight font-mono">{item.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Neural Map & Activity Ticker */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Curve chart */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center select-none">
                  <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 flex items-center gap-2 font-display">
                    <Activity className="w-4 h-4 text-primary animate-pulse" />
                    Growth Simulation Curve
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-bold font-mono">Telemetry Line</span>
                </div>
                {trends ? (
                  <div className="h-44">{renderLineChart(trends.user_growth)}</div>
                ) : (
                  <div className="h-44 flex items-center justify-center text-xs text-zinc-600">Loading curve metrics...</div>
                )}
              </div>

              {/* Console log activity logs */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 flex items-center gap-2 font-display select-none">
                  <Terminal className="w-4 h-4 text-rose-500" />
                  Telemetry Log Ticker
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[180px] space-y-2 pr-1 no-scrollbar select-none">
                  {usersList.length > 0 ? (
                    getCompiledActivityFeed().map((feedObj, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-zinc-950/80 border border-white/5 text-[10.5px] font-mono leading-relaxed space-y-1">
                        <div className="flex justify-between text-zinc-500 text-[9px] font-bold">
                          <span>{feedObj.userName}</span>
                          <span>{feedObj.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="font-medium text-zinc-350">
                          Simulated <span className={`uppercase font-black ${
                            feedObj.action === "view" ? "text-blue-400" :
                            feedObj.action === "like" ? "text-rose-400" :
                            feedObj.action === "save" ? "text-cyber-amber" : "text-cyber-purple"
                          }`}>{feedObj.action}</span>: <span className="text-zinc-200 font-sans font-bold">{feedObj.contentTitle}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-zinc-600 text-xs py-8 font-semibold">No interaction records found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Daily stats histograms */}
            {trends && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs uppercase font-black tracking-widest text-zinc-500 font-display select-none">Daily Interaction Telemetry</h3>
                  <div>{renderBarChart(trends.daily_activities)}</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs uppercase font-black tracking-widest text-zinc-500 font-display select-none">Category Feed Popularity Shares</h3>
                  <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto no-scrollbar">
                    {trends.category_popularity.map((catObj: any, idx: number) => {
                      const sharePct = trends.category_popularity.reduce((acc: number, c: any) => acc + c.views, 0);
                      const relativePct = sharePct > 0 ? Math.round((catObj.views / sharePct) * 100) : 0;
                      return (
                        <div key={idx} className="p-3 bg-zinc-950/40 rounded-2xl border border-white/5 flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="text-xs font-black text-zinc-300 truncate block">{catObj.category}</span>
                            <span className="text-[10px] text-zinc-500 font-bold font-mono mt-0.5 block">{catObj.views.toLocaleString()} views</span>
                          </div>
                          <span className="text-base font-black text-primary font-mono">{relativePct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. USER SIMULATOR (Audit & Inspect) */}
        {mounted && activeTab === "users" && (
          <div className="space-y-6 animate-fade-in">
            <div className="select-none">
              <h1 className="text-lg font-black tracking-tight text-white font-display uppercase">User Algorithm Simulator</h1>
              <p className="text-xs text-zinc-500 mt-0.5 font-bold uppercase tracking-wider font-mono">Inject interaction events & audit recommendation logic</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Target User List */}
              <div className="glass-panel p-5 rounded-2xl space-y-4 h-fit">
                <h3 className="text-xs uppercase font-black tracking-widest text-zinc-500 font-display select-none">Simulator Target Profiles</h3>
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar select-none">
                  {usersList.map((userObj) => (
                    <div
                      key={userObj.user_id}
                      onClick={() => handleInspectUser(userObj.user_id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                        selectedUserId === userObj.user_id
                          ? "bg-zinc-900 border-zinc-800 text-white"
                          : "bg-zinc-950/40 border-white/5 text-zinc-400 hover:border-zinc-800"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-black text-sm block text-zinc-200 truncate">{userObj.name}</span>
                        <span className="text-[10px] text-zinc-500 block truncate font-bold mt-0.5">{userObj.email}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-mono font-black text-teal-400 block">{userObj.engagement_score}</span>
                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 block font-bold mt-0.5">Eng Score</span>
                      </div>
                    </div>
                  ))}
                  {usersList.length === 0 && (
                    <div className="text-center text-zinc-600 text-xs py-8 font-semibold">No simulated users registered.</div>
                  )}
                </div>
              </div>

              {/* Inspector details panel */}
              <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
                {selectedUserId && inspectionData ? (
                  <div className="space-y-6">

                    {/* User Profile info */}
                    <div className="flex justify-between items-start border-b border-white/5 pb-5 select-none">
                      <div>
                        <h2 className="text-lg font-black text-zinc-200 uppercase font-display">{inspectionData.name}</h2>
                        <span className="text-[10px] font-mono text-zinc-500 font-bold block mt-0.5">UUID: {inspectionData.user_id}</span>
                      </div>

                      <button
                        onClick={() => handleTriggerSimulatedActivity(inspectionData.user_id)}
                        disabled={simulatingEvent}
                        className="bg-primary hover:bg-primary-hover disabled:opacity-40 text-black font-black font-display px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {simulatingEvent ? "Simulating..." : "Trigger Activity Event"}
                      </button>
                    </div>

                    {/* Interest DNA profile */}
                    <div className="space-y-3 bg-zinc-950/40 p-4.5 rounded-2xl border border-white/5 select-none">
                      <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500">User Interest DNA affinity</h4>
                      <div className="space-y-2">
                        {inspectionData.interests_details && Object.entries(inspectionData.interests_details).length > 0 ? (
                          Object.entries(inspectionData.interests_details).map(([cat, info]: any) => {
                            const pct = Math.round(info.weight * 100);
                            return (
                              <div key={cat} className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                                  <span>{cat}</span>
                                  <div className="flex gap-2 items-center font-mono">
                                    <span className="text-[10px] text-zinc-500 font-normal">({info.likes} likes, {info.views} views)</span>
                                    <span className="text-teal-400">{pct}% affinity</span>
                                  </div>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                  <div style={{ width: `${pct}%` }} className="h-full bg-teal-500 rounded-full" />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          Object.entries(inspectionData.interests).map(([cat, val]: any) => {
                            const pct = Math.round(val * 100);
                            return (
                              <div key={cat} className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                                  <span>{cat}</span>
                                  <span className="font-mono text-teal-400">{pct}% affinity</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                  <div style={{ width: `${pct}%` }} className="h-full bg-teal-500 rounded-full" />
                                </div>
                              </div>
                            );
                          })
                        )}
                        {(!inspectionData.interests_details || Object.keys(inspectionData.interests_details).length === 0) && Object.keys(inspectionData.interests).length === 0 && (
                          <span className="text-[10.5px] text-zinc-650 block py-1 font-semibold">No DNA data. Register interests on feed client to construct interest affinities.</span>
                        )}
                      </div>
                    </div>

                    {/* Personalization scored queue list */}
                    <div className="space-y-3.5">
                      <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 select-none">Scored Recommendation Candidate Queue</h4>
                      <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 no-scrollbar">
                        {inspectionData.recommendations.map((item: any, idx: number) => (
                          <div key={item.id} className="p-3 bg-zinc-950/20 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <span className="font-mono text-xs text-zinc-500 w-5 text-right font-black">#{idx + 1}</span>
                              <img src={item.image_url} className="w-10 h-10 object-cover rounded-xl border border-white/5 bg-zinc-900 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-zinc-200 block truncate max-w-[150px] sm:max-w-[240px]">{item.title}</span>
                                <span className="text-[9px] font-black text-teal-400 uppercase mt-0.5 block">{item.category}</span>
                              </div>
                            </div>

                            {/* Score parameters */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <div className="text-right text-[9px] font-mono text-zinc-500 hidden sm:block font-bold">
                                <div>DNA MATCH (50%): <span className="text-zinc-350">{item.score_breakdown.interest_match}</span></div>
                                <div>POPULARITY (30%): <span className="text-zinc-350">{item.score_breakdown.popularity}</span></div>
                                <div>RECENCY (20%): <span className="text-zinc-350">{item.score_breakdown.recency}</span></div>
                              </div>
                              <div className="bg-zinc-900 border border-white/5 px-2.5 py-1.5 rounded-xl text-center min-w-[58px]">
                                <span className="text-[8px] uppercase font-black text-zinc-400 block tracking-widest">Weight</span>
                                <span className="text-xs font-black font-mono text-primary block mt-0.5">{item.rec_score}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {inspectionData.recommendations.length === 0 && (
                          <div className="text-center text-zinc-600 text-xs py-8 border border-white/5 border-dashed rounded-2xl select-none font-semibold">No recommendation candidates matching categories.</div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 select-none">
                    <Cpu className="w-12 h-12 text-zinc-700 animate-pulse" />
                    <div>
                      <h3 className="font-bold text-zinc-400 text-sm">Simulator Registry Standby</h3>
                      <p className="text-xs text-zinc-650 max-w-xs mt-1 font-semibold">Select a user profile from the left column to simulate candidate scoring algorithms and load interest DNA matrixes.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 3. CATALOG LABORATORY */}
        {mounted && activeTab === "content" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
              <div>
                <h1 className="text-lg font-black tracking-tight text-white font-display uppercase">Catalog Laboratory</h1>
                <p className="text-xs text-zinc-500 mt-0.5 font-bold uppercase tracking-wider font-mono">Ingest and index visual assets inside feed categories</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleOpenIngestModal}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-primary px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ingest Images
                </button>
                <button
                  onClick={handleOpenDriveModal}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <Database className="w-3.5 h-3.5" />
                  Drive Import
                </button>
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-primary hover:bg-primary-hover text-black px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Catalog search bar */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search indexed catalog assets..."
                  value={contentSearchQuery}
                  onChange={(e) => setContentSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/40 border border-white/5 text-zinc-350 text-xs pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:border-zinc-700 placeholder-zinc-650 font-semibold"
                />
              </div>
            </div>

            {/* Masonry image catalog */}
            <div className="columns-2 md:columns-4 lg:columns-5 gap-4 space-y-4">
              {filteredContentList.map((item) => (
                <div
                  key={item.id}
                  className="break-inside-avoid bg-zinc-950/60 border border-white/5 hover:border-zinc-800 rounded-2xl overflow-hidden group relative flex flex-col shadow-sm transition-all"
                >
                  <img src={item.image_url} alt={item.title} className="w-full object-cover max-h-56 bg-zinc-900 select-none pointer-events-none" />

                  {/* Info block */}
                  <div className="p-3.5 space-y-2 select-none">
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[8.5px] uppercase font-black text-teal-400 tracking-widest bg-teal-950/20 px-2 py-0.5 rounded border border-teal-900/30 w-fit block">{item.category}</span>
                      {item.source && (
                        <span className="text-[8.5px] uppercase font-black text-zinc-500 tracking-widest bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5 w-fit block font-mono">{item.source}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-zinc-200 line-clamp-2 leading-relaxed">{item.title}</h4>

                    {/* Metrics */}
                    <div className="flex gap-3 text-[9px] text-zinc-500 font-bold font-mono pt-1">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views}</span>
                      <span className="flex items-center gap-1 text-rose-500/80"><Heart className="w-3 h-3" /> {item.likes}</span>
                      <span className="flex items-center gap-1 text-amber-500/80"><Bookmark className="w-3 h-3" /> {item.saves}</span>
                    </div>
                  </div>

                  {/* Actions drawer */}
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-xl bg-zinc-950 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteContent(item.id)}
                      className="p-2 rounded-xl bg-rose-950 border border-rose-900/30 text-rose-400 hover:text-rose-350 hover:bg-rose-900 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredContentList.length === 0 && (
                <div className="w-full text-center text-zinc-650 text-xs py-16 border border-white/5 border-dashed rounded-3xl select-none font-bold">
                  No indexed assets match the filter constraints.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. DIAGNOSTICS & TELEMETRY */}
        {mounted && activeTab === "monitor" && monitor && (
          <div className="space-y-6 animate-fade-in">
            <div className="select-none">
              <h1 className="text-lg font-black tracking-tight text-white font-display uppercase">Algorithm Diagnostics</h1>
              <p className="text-xs text-zinc-500 mt-0.5 font-bold uppercase tracking-wider font-mono">Verify accuracy ratings, category densities, and server latencies</p>
            </div>

            {/* Diagnostic parameters grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Convergence accuracy */}
              <div className="glass-panel p-5.5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest block select-none">Reco Convergence Accuracy</span>
                  <div className="flex items-baseline gap-2 mt-3">
                    <h2 className="text-3xl font-black text-primary font-mono tracking-tight">{monitor.accuracy}%</h2>
                    <span className="text-[9px] text-teal-400 font-mono font-bold">+1.2% this week</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                  Represents the percentage of user interaction events matching high-weight recommended categories.
                </p>
              </div>

              {/* Weekly Engagement */}
              <div className="glass-panel p-5.5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest block select-none">Weekly Engagement Rate</span>
                  <h2 className="text-3xl font-black text-primary font-mono tracking-tight mt-3">{monitor.user_engagement_rate}%</h2>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                    <div style={{ width: `${monitor.user_engagement_rate}%` }} className="h-full bg-primary rounded-full" />
                  </div>
                  <span className="text-[8px] text-zinc-500 block text-right font-mono font-bold">Simulating {usersList.length}/{usersList.length} active sessions</span>
                </div>
              </div>

              {/* Latency Telemetry */}
              <div className="glass-panel p-5.5 rounded-2xl flex flex-col justify-between space-y-4">
                <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest block select-none">Server Latencies</span>
                <div className="space-y-2 text-xs font-mono font-bold">
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-zinc-500">Scoring Latency:</span>
                    <span className="text-zinc-200">{monitor.feed_performance_metrics.avg_recommendation_latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-zinc-500">Cache Hit Ratio:</span>
                    <span className="text-zinc-200">{monitor.feed_performance_metrics.cache_hit_rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Scoring Rate:</span>
                    <span className="text-zinc-200">{monitor.feed_performance_metrics.scoring_iterations_per_sec} ops/sec</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Density distributions */}
            <div className="glass-panel p-6 rounded-2xl max-w-xl space-y-4.5">
              <h3 className="text-xs uppercase font-black text-zinc-500 tracking-widest font-display select-none">System Recommendation Densities</h3>
              <div className="space-y-3.5">
                {monitor.most_recommended_categories.map((catShare: any) => (
                  <div key={catShare.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-350">{catShare.category}</span>
                      <span className="text-primary font-mono">{catShare.share}% share</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-950 border border-white/5 rounded-full overflow-hidden">
                      <div style={{ width: `${catShare.share}%` }} className="h-full bg-primary rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALS DIALOGS ─── */}

      {/* A. ADD / EDIT CATALOG ITEM FORM */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-panel-glow w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-950/60 backdrop-blur-md">
              <h3 className="font-black text-sm uppercase tracking-wider text-white font-display">
                {editingContentId ? "Edit Catalog Item" : "Create Catalog Item"}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white cursor-pointer transition-colors"><X className="w-4.5 h-4.5" /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 select-none">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Asset Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Asset Title..."
                  className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-zinc-700 placeholder-zinc-700 text-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe your catalog item..."
                  className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-zinc-700 placeholder-zinc-700 text-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Image Asset URL</label>
                <input
                  type="url"
                  required
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-zinc-700 placeholder-zinc-700 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Feed Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-zinc-750 text-zinc-200"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-zinc-950">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Tags (comma split)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="green, misty"
                    className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-zinc-700 placeholder-zinc-700 text-zinc-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-black font-black font-display py-3 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] mt-2 cursor-pointer shadow-lg shadow-primary/10"
              >
                {editingContentId ? "Update Asset" : "Commit Asset"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* B. INGEST IMAGES FORM */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-panel-glow w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-950/60 backdrop-blur-md">
              <h3 className="font-black text-sm uppercase tracking-wider text-primary font-display flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                Ingest Content from API
              </h3>
              <button onClick={() => setShowIngestModal(false)} className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white cursor-pointer transition-colors"><X className="w-4.5 h-4.5" /></button>
            </div>

            <form onSubmit={handleIngestSubmit} className="p-6 space-y-4 select-none">
              {ingestMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  ingestMessage.includes("Successfully")
                    ? "bg-emerald-950/20 border border-emerald-900/40 text-emerald-400"
                    : "bg-rose-950/20 border border-rose-900/40 text-rose-400"
                }`}>
                  {ingestMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">API Source Provider</label>
                <select
                  value={ingestSource}
                  onChange={(e) => setIngestSource(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-zinc-750 text-zinc-200"
                >
                  <option value="unsplash" className="bg-zinc-950">Unsplash Search API</option>
                  <option value="pexels" className="bg-zinc-950">Pexels Search API</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Keyword Search Query</label>
                <input
                  type="text"
                  required
                  value={ingestQuery}
                  onChange={(e) => setIngestQuery(e.target.value)}
                  placeholder="e.g., Starry night, visual architecture..."
                  className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-zinc-700 placeholder-zinc-700 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Target Feed Category</label>
                  <select
                    value={ingestCategory}
                    onChange={(e) => setIngestCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-zinc-750 text-zinc-200"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-zinc-950">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Import Count</label>
                  <select
                    value={ingestCount}
                    onChange={(e) => setIngestCount(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-zinc-750 text-zinc-200"
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
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-black font-black font-display py-3 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] mt-2 cursor-pointer shadow-lg shadow-primary/10"
              >
                {ingesting ? "Querying Source..." : "Start Ingestion"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* C. GOOGLE DRIVE IMPORT FORM */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-panel-glow w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-950/60 backdrop-blur-md">
              <h3 className="font-black text-sm uppercase tracking-wider text-white font-display flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                Google Drive Ingestion
              </h3>
              <button onClick={() => setShowDriveModal(false)} className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white cursor-pointer transition-colors"><X className="w-4.5 h-4.5" /></button>
            </div>

            <form onSubmit={handleDriveImportSubmit} className="p-6 space-y-4 select-none">
              {driveImportMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  driveImportMessage.includes("Successfully")
                    ? "bg-emerald-950/20 border border-emerald-900/40 text-emerald-400"
                    : "bg-rose-950/20 border border-rose-900/40 text-rose-400"
                }`}>
                  {driveImportMessage}
                </div>
              )}

              {/* Drive Import tabs */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setDriveImportType("folder")}
                  className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    driveImportType === "folder"
                      ? "bg-zinc-900 text-primary"
                      : "text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  Folder Import
                </button>
                <button
                  type="button"
                  onClick={() => setDriveImportType("file")}
                  className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    driveImportType === "file"
                      ? "bg-zinc-900 text-primary"
                      : "text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  Catalog File (CSV/JSON)
                </button>
              </div>

              {driveImportType === "folder" ? (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Google Drive Folder ID</label>
                  <input
                    type="text"
                    required
                    value={driveFolderId}
                    onChange={(e) => setDriveFolderId(e.target.value)}
                    placeholder="e.g., Folder ID..."
                    className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-zinc-700 placeholder-zinc-700 text-zinc-200"
                  />
                  <p className="text-[9px] text-zinc-500 leading-normal">Reads all images contained within the specified Google Drive folder.</p>

                  {/* Parent Ingestion */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is-parent-folder"
                      checked={isParentFolder}
                      onChange={(e) => setIsParentFolder(e.target.checked)}
                      className="w-4 h-4 accent-primary bg-zinc-900 border-white/5 rounded cursor-pointer"
                    />
                    <label htmlFor="is-parent-folder" className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 cursor-pointer">
                      Contains Category Subfolders (Parent Ingestion)
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Google Drive File ID / Name</label>
                  <input
                    type="text"
                    required
                    value={driveFileId}
                    onChange={(e) => setDriveFileId(e.target.value)}
                    placeholder="e.g., catalog_data.csv..."
                    className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-zinc-700 placeholder-zinc-700 text-zinc-200"
                  />
                  <p className="text-[9px] text-zinc-500 leading-normal">Downloads a CSV or JSON catalog and parses row fields.</p>
                </div>
              )}

              {/* Feed Category parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Target Feed Category</label>
                  <select
                    disabled={driveImportType === "folder" && isParentFolder}
                    value={driveCategory}
                    onChange={(e) => setDriveCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-zinc-750 text-zinc-200 disabled:opacity-40"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-zinc-950">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">
                    {driveImportType === "folder" ? "Max Folder Items" : "File Settings"}
                  </label>
                  <select
                    disabled={driveImportType !== "folder"}
                    value={driveCount}
                    onChange={(e) => setDriveCount(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-zinc-750 text-zinc-200 disabled:opacity-40"
                  >
                    <option value="5" className="bg-zinc-950">5 items</option>
                    <option value="10" className="bg-zinc-950">10 items</option>
                    <option value="15" className="bg-zinc-950">15 items</option>
                    <option value="20" className="bg-zinc-950">20 items</option>
                  </select>
                </div>
              </div>

              {/* Google API credentials config */}
              <div className="border-t border-white/5 pt-3.5 mt-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-2">GCP Cloud Credentials (Optional)</span>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-black uppercase text-zinc-500 mb-1">
                      <span>Google API Key</span>
                      <span className="normal-case font-semibold text-zinc-650">For public files/folders</span>
                    </div>
                    <input
                      type="password"
                      value={driveApiKey}
                      onChange={(e) => setDriveApiKey(e.target.value)}
                      placeholder="API Key..."
                      className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-zinc-700 placeholder-zinc-800 text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-black uppercase text-zinc-500 mb-1">
                      <span>OAuth2 Access Token</span>
                      <span className="normal-case font-semibold text-zinc-650">For private content</span>
                    </div>
                    <input
                      type="text"
                      value={driveAccessToken}
                      onChange={(e) => setDriveAccessToken(e.target.value)}
                      placeholder="ya29.a0AfH6SM..."
                      className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-zinc-700 placeholder-zinc-800 text-zinc-200"
                    />
                  </div>
                </div>

                <p className="text-[9px] text-zinc-500 mt-3 font-mono leading-normal bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                  💡 Leave both fields blank to run in mock sandbox mode, simulating high-quality catalog items directly.
                </p>
              </div>

              <button
                type="submit"
                disabled={driveImporting || (driveImportType === "folder" ? !driveFolderId.trim() : !driveFileId.trim())}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-black font-black font-display py-3 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] mt-2 cursor-pointer shadow-lg shadow-primary/10"
              >
                {driveImporting ? "Processing Drive..." : "Start Import"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
