const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Fallback images from Unsplash per category for when images fail to load
const CATEGORY_FALLBACKS = {
  "Nature": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
  "Technology": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
  "Recipes": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80",
  "Travel": "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&auto=format&fit=crop&q=80",
  "Design": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80",
  "Artificial Intelligence": "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop&q=80",
  "Education": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop&q=80",
  "Photography": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80",
  "Fitness": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80",
};

export const getCategoryFallback = (category) => {
  return CATEGORY_FALLBACKS[category] || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80";
};

// A random seed generated once per page-load session.
// This makes each refresh show different content while keeping pagination stable.
const FEED_SESSION_SEED = Math.floor(Math.random() * 100000);

// Helper to get the best quality image URL
export const getOptimizedImageUrl = (thumbnailUrl, imageUrl) => {
  // 1. Prefer direct Unsplash/CDN imageUrl — these always work
  if (imageUrl && (imageUrl.includes("unsplash.com") || imageUrl.includes("images."))) {
    return imageUrl;
  }
  
  // 2. Prefer direct Unsplash/CDN thumbnailUrl
  if (thumbnailUrl && (thumbnailUrl.includes("unsplash.com") || thumbnailUrl.includes("images."))) {
    return thumbnailUrl;
  }

  // 3. For Google Drive content: ALWAYS use the backend image-proxy (most reliable)
  //    The lh3.googleusercontent.com/d/{id} and drive-storage URLs often return 403 for private files
  if (imageUrl && imageUrl.includes("image-proxy")) {
    // Use backend proxy directly — it handles auth
    return imageUrl;
  }

  // 4. If thumbnail is a drive-storage URL (returns 403), skip it and use imageUrl
  if (thumbnailUrl && thumbnailUrl.includes("drive-storage")) {
    return imageUrl || "";
  }

  // 5. lh3 CDN URL without drive-storage — try it directly
  if (thumbnailUrl && thumbnailUrl.startsWith("https://lh") && !thumbnailUrl.includes("drive-storage")) {
    return thumbnailUrl;
  }
  
  // 6. For Google Drive/Photos CDN that has size params, optimize the size
  if (thumbnailUrl && (thumbnailUrl.includes("googleusercontent.com") || thumbnailUrl.includes("google.com/drive"))) {
    const sizeMatch = thumbnailUrl.match(/=s\d+(-c)?$/);
    if (sizeMatch) return thumbnailUrl.replace(/=s\d+(-c)?$/, "=s800");
    const widthHeightMatch = thumbnailUrl.match(/=[wh]\d+(-[ch])?$/);
    if (widthHeightMatch) return thumbnailUrl.replace(/=[wh]\d+(-[ch])?$/, "=s800");
    if (!thumbnailUrl.includes("=")) return `${thumbnailUrl}=s800`;
  }
  
  // 7. Fallback chain
  if (imageUrl) return imageUrl;
  return thumbnailUrl || "";
};


// Client-side authentication token storage helper
export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("pixora_token");
  }
  return null;
};

export const setAuthToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("pixora_token", token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("pixora_token");
  }
};

// Helper for fetch requests
async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "API request failed" }));
    throw new Error(errorData.detail || "Something went wrong");
  }

  return response.json();
}

export const api = {
  // Auth
  async register(data) {
    return apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async login(credentials) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  async loginWithGoogle(idToken, email, name) {
    const data = await apiFetch("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken, email, name }),
    });
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  async getMe() {
    return apiFetch("/api/auth/me");
  },

  // Content
  async getCategories() {
    return apiFetch("/api/categories");
  },

  async getContent(category, skip = 0, limit = 20) {
    const query = new URLSearchParams();
    if (category) query.append("category", category);
    query.append("skip", skip.toString());
    query.append("limit", limit.toString());
    // Pass per-session seed so each reload shows different ordered content
    query.append("seed", FEED_SESSION_SEED.toString());
    return apiFetch(`/api/content?${query.toString()}`);
  },

  async getTrending(skip = 0, limit = 20) {
    const query = new URLSearchParams();
    query.append("skip", skip.toString());
    query.append("limit", limit.toString());
    query.append("seed", FEED_SESSION_SEED.toString());
    return apiFetch(`/api/content/trending?${query.toString()}`);
  },

  async search(q, category) {
    const query = new URLSearchParams();
    if (q) query.append("q", q);
    if (category) query.append("category", category);
    return apiFetch(`/api/content/search?${query.toString()}`);
  },

  async getContentDetails(id) {
    return apiFetch(`/api/content/${id}`);
  },

  // Interactions
  async toggleLike(id) {
    return apiFetch(`/api/content/${id}/like`, { method: "POST" });
  },

  async toggleSave(id) {
    return apiFetch(`/api/content/${id}/save`, { method: "POST" });
  },

  async trackShare(id) {
    return apiFetch(`/api/content/${id}/share`, { method: "POST" });
  },

  async postComment(id, text) {
    return apiFetch(`/api/content/${id}/comment`, {
      method: "POST",
      body: JSON.stringify({ comment_text: text }),
    });
  },

  async trackWatch(id, seconds) {
    return apiFetch(`/api/content/${id}/watch`, {
      method: "POST",
      body: JSON.stringify({ dwell_time: seconds }),
    });
  },

  // Onboarding
  async submitOnboarding(categories) {
    return apiFetch("/api/users/onboarding", {
      method: "POST",
      body: JSON.stringify({ categories }),
    });
  },

  // Profile
  async getProfile() {
    return apiFetch("/api/users/profile");
  },

  // Google Ingestion & Drive Integration (Admin proxy allowed for mockup demo)
  async importFromDrive(data) {
    return apiFetch("/api/admin/drive/import", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async ingestContent(data) {
    return apiFetch("/api/admin/ingest", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Messaging
  async getContacts() {
    return apiFetch("/api/messages/contacts");
  },

  async getMessages(recipientId) {
    return apiFetch(`/api/messages/${recipientId}`);
  },

  async sendMessage(recipientId, text) {
    return apiFetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ recipient_id: recipientId, message_text: text }),
    });
  },
};
