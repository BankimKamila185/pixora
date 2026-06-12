"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { api, getAuthToken } from "@/utils/api";

const CATEGORY_METADATA: Record<string, { desc: string; gradient: string; emoji: string }> = {
  "Nature": { desc: "Landscapes, forests, and oceans", gradient: "from-emerald-500 to-teal-600", emoji: "🌲" },
  "Technology": { desc: "Coding, gadgets, and setups", gradient: "from-blue-500 to-indigo-600", emoji: "💻" },
  "Recipes": { desc: "Baking, dinners, and desserts", gradient: "from-amber-500 to-orange-600", emoji: "🍕" },
  "Travel": { desc: "Hotels, destinations, and beaches", gradient: "from-sky-400 to-blue-500", emoji: "✈️" },
  "Design": { desc: "Interiors, posters, and architectures", gradient: "from-fuchsia-500 to-pink-600", emoji: "🎨" },
  "Artificial Intelligence": { desc: "Neural networks and algorithms", gradient: "from-purple-600 to-indigo-700", emoji: "🤖" },
  "Education": { desc: "Libraries, notebooks, and studying", gradient: "from-violet-500 to-purple-600", emoji: "📚" },
  "Photography": { desc: "SLR gear, neon lights, and bokeh", gradient: "from-rose-500 to-rose-600", emoji: "📷" },
  "Fitness": { desc: "Gym weightlifting, running, and yoga", gradient: "from-red-500 to-orange-500", emoji: "🏋️" }
};

export default function OnboardingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }

    // Initialize theme
    const savedTheme = localStorage.getItem("pixora_theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    async function loadCategories() {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    loadCategories();
  }, [router]);

  const toggleSelect = (cat: string) => {
    if (selected.includes(cat)) {
      setSelected(selected.filter((item) => item !== cat));
    } else {
      setSelected([...selected, cat]);
    }
  };

  const handleComplete = async () => {
    if (selected.length === 0) {
      setError("Please select at least one interest to build your feed.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.submitOnboarding(selected);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to submit interests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between py-12 px-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/5 dark:bg-rose-950/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-1%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 dark:bg-indigo-950/20 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center relative z-10 select-none">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center justify-center p-2.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">What interests you?</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-2.5 max-w-md mx-auto font-medium">
            Choose 1 or more categories to bootstrap your personalized Pixora feed.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400 text-xs font-bold text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5 mb-10">
          {categories.map((cat) => {
            const meta = CATEGORY_METADATA[cat] || { desc: "Discover topic feeds", gradient: "from-zinc-700 to-zinc-800", emoji: "✨" };
            const isSelected = selected.includes(cat);
            return (
              <motion.div
                key={cat}
                onClick={() => toggleSelect(cat)}
                className={`cursor-pointer rounded-2xl p-5.5 relative overflow-hidden border transition-all ${
                  isSelected
                    ? "bg-card border-primary shadow-lg ring-2 ring-primary/20"
                    : "bg-secondary hover:bg-secondary/75 border-border/40 hover:border-border/80"
                }`}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Visual Circle Backdrop */}
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-gradient-to-tr ${meta.gradient} opacity-10`} />

                <div className="flex items-start justify-between">
                  <div className="text-3xl mb-3">{meta.emoji}</div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary border-primary text-white"
                        : "border-border bg-transparent text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                <h3 className="font-extrabold text-base mt-2.5 text-foreground">{cat}</h3>
                <p className="text-muted-foreground text-xs mt-1 leading-snug font-medium">{meta.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="max-w-4xl w-full mx-auto pt-6 border-t border-border flex justify-between items-center relative z-10">
        <div className="text-xs sm:text-sm text-muted-foreground font-black">
          {selected.length} {selected.length === 1 ? "category" : "categories"} selected
        </div>
        <button
          onClick={handleComplete}
          disabled={loading || selected.length === 0}
          className="bg-primary hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black py-3.5 px-7 rounded-full transition-all flex items-center gap-1.5 shadow-md text-xs cursor-pointer"
        >
          {loading ? "Saving interests..." : "Start Exploring"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
