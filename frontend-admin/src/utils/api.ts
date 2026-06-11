const API_BASE_URL = "http://127.0.0.1:8000";

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Admin API request failed" }));
    throw new Error(errorData.detail || "Something went wrong");
  }

  return response.json();
}

export const adminApi = {
  // Stats & Charts
  async getKPIs() {
    return apiFetch("/api/admin/stats");
  },

  async getTrends() {
    return apiFetch("/api/admin/trends");
  },

  // Users Analytics
  async getUsers() {
    return apiFetch("/api/admin/users");
  },

  // Recommendation Monitoring
  async getMonitorMetrics() {
    return apiFetch("/api/admin/recommendations/monitor");
  },

  async inspectUserRecommendations(userId: string) {
    return apiFetch(`/api/admin/recommendations/inspect/${userId}`);
  },

  // Content CRUD
  async getCategories() {
    return apiFetch("/api/categories");
  },

  async getAllContent() {
    // We can fetch from regular search endpoint with empty query to list items
    return apiFetch("/api/content/search");
  },

  async ingestContent(data: any) {
    return apiFetch("/api/admin/ingest", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async importFromDrive(data: any) {
    return apiFetch("/api/admin/drive/import", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async createContent(data: any) {
    return apiFetch("/api/admin/content", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateContent(id: string, data: any) {
    return apiFetch(`/api/admin/content/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteContent(id: string) {
    return apiFetch(`/api/admin/content/${id}`, {
      method: "DELETE",
    });
  },
};
