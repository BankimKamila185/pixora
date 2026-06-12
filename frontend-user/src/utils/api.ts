const API_BASE_URL = "http://127.0.0.1:8000";

// Client-side authentication token storage helper
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("pixora_token");
  }
  return null;
};

export const setAuthToken = (token: string) => {
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
async function apiFetch(endpoint: string, options: RequestInit = {}) {
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
  async register(data: any) {
    return apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async login(credentials: any) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
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

  async getContent(category?: string, skip = 0, limit = 20) {
    const query = new URLSearchParams();
    if (category) query.append("category", category);
    query.append("skip", skip.toString());
    query.append("limit", limit.toString());
    return apiFetch(`/api/content?${query.toString()}`);
  },

  async getTrending(skip = 0, limit = 20) {
    const query = new URLSearchParams();
    query.append("skip", skip.toString());
    query.append("limit", limit.toString());
    return apiFetch(`/api/content/trending?${query.toString()}`);
  },

  async search(q?: string, category?: string) {
    const query = new URLSearchParams();
    if (q) query.append("q", q);
    if (category) query.append("category", category);
    return apiFetch(`/api/content/search?${query.toString()}`);
  },

  async getContentDetails(id: string) {
    return apiFetch(`/api/content/${id}`);
  },

  // Interactions
  async toggleLike(id: string) {
    return apiFetch(`/api/content/${id}/like`, { method: "POST" });
  },

  async toggleSave(id: string) {
    return apiFetch(`/api/content/${id}/save`, { method: "POST" });
  },

  async trackShare(id: string) {
    return apiFetch(`/api/content/${id}/share`, { method: "POST" });
  },

  async postComment(id: string, text: string) {
    return apiFetch(`/api/content/${id}/comment`, {
      method: "POST",
      body: JSON.stringify({ comment_text: text }),
    });
  },

  async trackWatch(id: string, seconds: number) {
    return apiFetch(`/api/content/${id}/watch`, {
      method: "POST",
      body: JSON.stringify({ dwell_time: seconds }),
    });
  },

  // Onboarding
  async submitOnboarding(categories: string[]) {
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
  async importFromDrive(data: any) {
    return apiFetch("/api/admin/drive/import", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async ingestContent(data: any) {
    return apiFetch("/api/admin/ingest", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
