// dashboard/src/lib/axios.ts

import axios, { AxiosError, AxiosRequestConfig } from "axios";

const isProduction = process.env.NODE_ENV === "production";
const enableDebugLogs = process.env.NEXT_PUBLIC_DEBUG_LOGS === "true" || !isProduction;

const envApiUrl = process.env.NEXT_PUBLIC_API_URL;

// Logger utility
const logger = {
  debug: (...args: unknown[]) => {
    if (enableDebugLogs) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, but sanitize in production
    if (isProduction) {
      // In production, only log non-sensitive info
      console.error("[API Error]", args[0]);
    } else {
      console.error(...args);
    }
  },
};

// Create axios instance
const api = axios.create({
  baseURL: envApiUrl || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    logger.debug("🚀 API REQUEST:", config.method?.toUpperCase(), config.url);

    // Handle FormData
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      logger.debug("📦 FormData detected - auto Content-Type");
    }

    // Attach token
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        logger.debug("🔑 Token attached");
      }
    }

    return config;
  },
  (error: AxiosError) => {
    logger.error("❌ Request error:", error.message);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    logger.debug("✅ SUCCESS:", response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const data = error.response?.data as { message?: string };

    logger.error("❌ ERROR:", status, url);
    logger.error("📦 Message:", data?.message || error.message);

    // Handle 401 Unauthorized
    if (status === 401) {
      logger.error("🚫 UNAUTHORIZED! Redirecting to login...");
      
      if (typeof window !== "undefined") {
        // Clear auth data
        localStorage.removeItem("token");
        localStorage.removeItem("auth-storage");
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/login")) {
          const currentPath = encodeURIComponent(window.location.pathname);
          window.location.href = `/login?redirect=${currentPath}`;
        }
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      logger.error("🚫 FORBIDDEN - Insufficient permissions");
    }

    // Handle 429 Rate Limit
    if (status === 429) {
      logger.error("⏰ RATE LIMITED - Too many requests");
      const retryAfter = error.response?.headers["retry-after"];
      if (retryAfter) {
        logger.debug(`Retry after: ${retryAfter} seconds`);
      }
    }

    // Handle network errors
    if (!status && error.message === "Network Error") {
      logger.error("📡 Network error - check connection");
    }

    // Handle timeout
    if (error.code === "ECONNABORTED") {
      logger.error("⏱️ Request timeout");
    }

    return Promise.reject(error);
  }
);

export default api;
