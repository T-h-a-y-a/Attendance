// src/api.js
import axios from "axios";

/**
 * Vercel env: VITE_API_URL = https://attendance-4-udnh.onrender.com/api
 * Supports:
 *  - https://domain.com/api
 *  - https://domain.com
 * Normalizes to end with /api exactly once.
 */
const raw = import.meta.env.VITE_API_URL || "";
const cleaned = raw.replace(/\/$/, ""); // remove trailing "/"

const BASE = cleaned
  ? cleaned.endsWith("/api")
    ? cleaned
    : `${cleaned}/api`
  : "http://localhost:4000/api"; // local fallback

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ✅ attach token for every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// --- helpers ---
const isAuthEndpoint = (url = "") =>
  url.includes("/auth/login") ||
  url.includes("/auth/setup-super") ||
  url.includes("/auth/has-super");

const isAlreadyOnLoginPage = () => {
  try {
    return window.location.pathname === "/login";
  } catch {
    return false;
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("adminId");
  localStorage.removeItem("email");
  localStorage.removeItem("scope");
};

// ✅ logout ONLY on 401/403 for protected endpoints
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";

    // If it is an auth-related endpoint, NEVER force logout/redirect.
    // (login can return 401 legitimately)
    if ((status === 401 || status === 403) && isAuthEndpoint(url)) {
      return Promise.reject(err);
    }

    // For other endpoints: handle unauthorized
    if (status === 401 || status === 403) {
      clearAuthStorage();

      // Avoid redirect loop if already on login page
      if (!isAlreadyOnLoginPage()) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(err);
  }
);
