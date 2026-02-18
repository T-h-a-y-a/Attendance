// src/api.js
import axios from "axios";

/**
 * Vercel env you have: VITE_API_URL = https://attendance-4-udnh.onrender.com/api
 *
 * This code supports both:
 *  - VITE_API_URL = https://domain.com/api
 *  - VITE_API_URL = https://domain.com
 * and normalizes to always have ".../api" once.
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

// ✅ logout ONLY on 401/403 (but skip has-super)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";

    // ✅ DO NOT force logout for has-super endpoint
    if ((status === 401 || status === 403) && url.includes("/auth/has-super")) {
      return Promise.reject(err);
    }

    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("adminId");
      localStorage.removeItem("email");
      localStorage.removeItem("scope");

      // replace avoids back-loop
      window.location.replace("/login");
    }

    return Promise.reject(err);
  }
);
