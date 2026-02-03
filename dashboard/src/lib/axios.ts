// dashboard/src/lib/axios.ts

import axios from "axios";

const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
console.log("🔧 AXIOS BASE URL CONFIG:", envApiUrl || "FALLBACK: http://localhost:5000/api");

const api = axios.create({
  baseURL: envApiUrl || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ✅ REQUEST INTERCEPTOR (UPDATED)
api.interceptors.request.use(
  (config) => {
    console.log("🚀 API REQUEST:", config.method?.toUpperCase(), config.url);

    // ✅ DETECT FORMDATA → REMOVE Content-Type (BIAR AUTO SET)
    if (config.data instanceof FormData) {
      console.log("📦 DETECTED FORMDATA - Auto setting Content-Type");
      delete config.headers["Content-Type"]; // ✅ HAPUS BIAR BROWSER AUTO SET multipart/form-data
    }

    // ✅ ATTACH TOKEN
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔑 TOKEN ATTACHED:", token.substring(0, 20) + "...");
      } else {
        console.warn("⚠️ NO TOKEN FOUND IN LOCALSTORAGE!");
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR (SAMA)
api.interceptors.response.use(
  (response) => {
    console.log("✅ SUCCESS:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ ERROR:", error.response?.status, error.config?.url);
    console.error("📦 ERROR DATA:", error.response?.data);

    if (error.response?.status === 401) {
      console.error("🚫 UNAUTHORIZED! Redirecting to login...");
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
