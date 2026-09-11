// dashboard/src/lib/axios.ts

import axios, { AxiosError } from "axios";

const isProduction = process.env.NODE_ENV === "production";
const enableDebugLogs = process.env.NEXT_PUBLIC_DEBUG_LOGS === "true" || !isProduction;

const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
const productionApiUrl = "https://api.sahabatqolbu.com/api";
const fallbackDevApiUrl = "http://localhost:5000/api";

const resolvedApiUrl = (() => {
  if (isProduction) {
    if (!envApiUrl) return productionApiUrl;

    try {
      const parsed = new URL(envApiUrl);
      const isDashboardOrigin = parsed.hostname === "dashboard.sahabatqolbu.com";
      return isDashboardOrigin ? productionApiUrl : envApiUrl;
    } catch {
      return productionApiUrl;
    }
  }
  if (!envApiUrl) return fallbackDevApiUrl;

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
  warn: (...args: unknown[]) => {
    if (enableDebugLogs) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, but sanitize in production
    if (isProduction) {
      // In production, only log non-sensitive info
      console.error("[API Error]", args[0]);
    } else {
      // NOTE: In Next.js dev, console.error triggers the red error overlay.
      // For handled API errors, prefer logger.warn in the interceptor.
      console.error(...args);
    }
  },
};

const getReadableErrorMessage = (error: AxiosError): string => {
  const data = error.response?.data;
  const backendMessage =
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string" &&
    data.message.trim()
      ? data.message.trim()
      : "";

  const loweredBackendMessage = backendMessage.toLowerCase();
  if (loweredBackendMessage.includes("data and hash arguments required")) {
    return "Akun tidak bisa login sementara. Silakan hubungi admin untuk reset password.";
  }
  if (loweredBackendMessage.includes("bcrypt")) {
    return "Terjadi masalah validasi akun. Silakan coba lagi atau hubungi admin.";
  }

  if (backendMessage) return backendMessage;

  const status = error.response?.status;
  if (status === 400) return "Permintaan tidak valid. Periksa input Anda.";
  if (status === 401) return "Sesi login tidak valid atau sudah berakhir. Silakan login lagi.";
  if (status === 403) return "Akses ditolak. Anda tidak punya izin.";
  if (status === 404) return "Endpoint tidak ditemukan.";
  if (status === 409) return "Terjadi konflik data (mis. email sudah terdaftar).";
  if (status === 429) return "Terlalu banyak percobaan. Silakan tunggu sebentar lalu coba lagi.";
  if (status && status >= 500) return "Server sedang bermasalah. Silakan coba lagi nanti.";

  if (error.code === "ECONNABORTED") return "Request timeout. Silakan coba lagi.";
  if (error.message === "Network Error") return "Gagal terhubung ke server. Cek koneksi Anda.";
  return "Terjadi kesalahan. Silakan coba lagi.";
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

// Map to track in-flight mutating requests and prevent duplicate submissions from rapid clicks
const inFlightMutations = new Map<string, Promise<any>>();

const getMutationSignature = (config: any): string => {
  const method = (config.method || "get").toUpperCase();
  const url = config.url || "";
  let payloadStr = "";
  if (config.data instanceof FormData) {
    try {
      const entries: string[] = [];
      config.data.forEach((val: any, key: string) => {
        if (val instanceof File) {
          entries.push(`${key}:${val.name}_${val.size}_${val.lastModified}`);
        } else {
          entries.push(`${key}:${String(val)}`);
        }
      });
      payloadStr = entries.sort().join(";");
    } catch {
      payloadStr = "formdata";
    }
  } else if (config.data && typeof config.data === "object") {
    try {
      payloadStr = JSON.stringify(config.data);
    } catch {
      payloadStr = "";
    }
  } else if (config.data) {
    payloadStr = String(config.data);
  }
  return `${method}:${url}:${payloadStr}`;
};

const originalRequest = api.request.bind(api);

api.request = (function (config: any): any {
  const method = (config.method || "get").toUpperCase();
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (isMutating) {
    const signature = getMutationSignature(config);
    if (inFlightMutations.has(signature)) {
      logger.warn(
        "🛑 Anti-duplikat: Request identik sedang berjalan. Menggunakan in-flight promise:",
        method,
        config.url,
      );
      return inFlightMutations.get(signature)!;
    }

    const promise = originalRequest(config).finally(() => {
      inFlightMutations.delete(signature);
    });

    inFlightMutations.set(signature, promise);
    return promise;
  }

  return originalRequest(config);
} as any);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    logger.debug("🚀 API REQUEST:", config.method?.toUpperCase(), config.url);

    // Attach request ID for tracing
    if (!config.headers["X-Request-ID"]) {
      config.headers["X-Request-ID"] = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
    const readableMessage = getReadableErrorMessage(error);

    // Use warn for HTTP errors to avoid Next dev overlay noise.
    // The UI layer (toast/forms) should present the error to the user.
    if (status) {
      logger.warn("❌ API ERROR:", status, url);
      logger.warn("📦 Message:", readableMessage);
    } else {
      // Network / unexpected errors
      logger.error("❌ API ERROR:", status, url);
      logger.error("📦 Message:", readableMessage);
    }

    // Handle 401 Unauthorized
    if (status === 401) {
      const isAuthFlowRequest =
        url?.includes("/auth/login") ||
        url?.includes("/auth/verify-otp") ||
        url?.includes("/auth/request-otp");

      if (isAuthFlowRequest) {
        return Promise.reject(error);
      }

      logger.warn("🚫 UNAUTHORIZED! Redirecting to login...");
      
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage");
        localStorage.removeItem("user_data");

        if (!window.location.pathname.includes("/login")) {
          const currentPath = encodeURIComponent(window.location.pathname);
          window.location.href = `/login?redirect=${currentPath}`;
        }
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      logger.warn("🚫 FORBIDDEN - Insufficient permissions");
    }

    // Handle 429 Rate Limit
    if (status === 429) {
      logger.warn("⏰ RATE LIMITED - Too many requests");
      const retryAfter = error.response?.headers["retry-after"];
      if (retryAfter) {
        logger.debug(`Retry after: ${retryAfter} seconds`);
      }
    }

    // Handle network errors
    if (!status && error.message === "Network Error") {
      logger.warn("📡 Network error - check connection");
    }

    // Handle timeout
    if (error.code === "ECONNABORTED") {
      logger.warn("⏱️ Request timeout");
    }

    return Promise.reject(error);
  }
);

export default api;
