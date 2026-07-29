const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const TOKEN_KEY = "edustack_access_token";

export function getApiBaseUrl() {
  return API_BASE;
}

export function resolveApiUrl(path = "") {
  if (!API_BASE) {
    return "";
  }
  return `${API_BASE}${path}`;
}

function getStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function setStoredToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
}

let memoryToken = getStoredToken();

export function setAccessToken(token) {
  memoryToken = token || "";
  setStoredToken(memoryToken);
}

export function getAccessToken() {
  return memoryToken || getStoredToken();
}

export function clearAccessToken() {
  memoryToken = "";
  setStoredToken("");
}

async function parseJsonResponse(response) {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    if (!response.ok) {
      throw new Error(trimmed.slice(0, 240) || "Request failed");
    }
    throw new Error("Invalid JSON from server");
  }
}

async function request(path, options = {}) {
  if (!API_BASE) {
    throw new Error("Frontend API is not configured. Set VITE_API_BASE_URL to your live backend URL.");
  }

  const { skipAuth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (
    fetchOptions.body &&
    typeof fetchOptions.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  async createSession(initData) {
    const data = await request("/auth/session", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ initData })
    });
    if (data.token) {
      setAccessToken(data.token);
    }
    const { token: _t, ...rest } = data;
    return rest;
  },

  getMe() {
    return request("/user/me");
  },

  getReferrals() {
    return request("/referrals/me");
  },

  getLeaderboard(period = "all-time") {
    return request(`/leaderboard?period=${encodeURIComponent(period)}`, { skipAuth: true });
  },

  getProducts() {
    return request("/products", { skipAuth: true });
  },

  createProductDownloadLink(productId) {
    return request(`/products/${encodeURIComponent(productId)}/download-link`, {
      method: "POST"
    });
  },

  sendProductToChat(productId) {
    return request(`/products/${encodeURIComponent(productId)}/send-to-chat`, {
      method: "POST"
    });
  },

  uploadPayment(formData) {
    return request("/payment/request", {
      method: "POST",
      body: formData
    });
  },

  requestWithdrawal(payload) {
    return request("/withdraw/request", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  getNotifications() {
    return request("/notifications");
  },

  markNotificationRead(id) {
    return request(`/notifications/${id}/read`, {
      method: "POST"
    });
  }
};
