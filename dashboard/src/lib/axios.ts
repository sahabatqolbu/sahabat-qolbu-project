// dashboard/src/lib/axios.ts

import axios, { AxiosError, AxiosRequestConfig } from "axios";

const isProduction = process.env.NODE_ENV === "production";
const enableDebugLogs = process.env.NEXT_PUBLIC_DEBUG_LOGS === "true" || !isProduction;

const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
const fallbackDevApiUrl = "http://localhost:5000/api";

const resolvedApiUrl = (() => {
  if (!envApiUrl) return fallbackDevApiUrl;
  if (isProduction) return envApiUrl;

  try {
    const parsed = new URL(envApiUrl);
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    return isLocal ? envApiUrl : fallbackDevApiUrl;
  } catch {
    return fallbackDevApiUrl;
  }
})();

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

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      state?: { token?: string | null };
    };

    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

// Create axios instance
const api = axios.create({
  baseURL: resolvedApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

logger.debug("🌐 API baseURL:", resolvedApiUrl);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    logger.debug("🚀 API REQUEST:", config.method?.toUpperCase(), config.url);

    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle FormData
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      logger.debug("📦 FormData detected - auto Content-Type");
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
      const isAuthFlowRequest =
        url?.includes("/auth/login") ||
        url?.includes("/auth/verify-otp") ||
        url?.includes("/auth/request-otp");

      if (isAuthFlowRequest) {
        return Promise.reject(error);
      }

      logger.error("🚫 UNAUTHORIZED! Redirecting to login...");
      
      if (typeof window !== "undefined") {
        const hasSession = Boolean(getStoredToken());
        if (!hasSession) {
          return Promise.reject(error);
        }

        // Clear auth data
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
