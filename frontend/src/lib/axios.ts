import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosProgressEvent,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

const PRODUCTION_API_BASE_URL = "https://api.sahabatqolbu.com/api";
const DEVELOPMENT_API_BASE_URL = "http://localhost:5000/api";

// Base URL dari backend. Public production must always use the API subdomain.
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? PRODUCTION_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_URL || DEVELOPMENT_API_BASE_URL;
// Create Axios Instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000, // 30 seconds
});

// Request Interceptor - Attach Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log request di development
    if (process.env.NODE_ENV === "development") {
      console.log("🚀 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle Errors
api.interceptors.response.use(
  (response) => {
    // Log response di development
    if (process.env.NODE_ENV === "development") {
      console.log("✅ API Response:", {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle different error scenarios
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as ApiErrorPayload | undefined;

      // Log error
      console.error("❌ API Error:", {
        status,
        message: data?.message,
        errors: data?.errors,
      });

      // Handle 401 Unauthorized - Token expired
      if (status === 401) {
        localStorage.removeItem("user_data");

        // Redirect to login (if not already on login page)
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.error("🚫 Access Forbidden:", data?.message);
      }

      // Handle 404 Not Found
      if (status === 404) {
        console.error("🔍 Not Found:", data?.message);
      }

      // Handle 500 Server Error
      if (status >= 500) {
        console.error("💥 Server Error:", data?.message);
      }
    } else if (error.request) {
      // Request was made but no response
      console.error("📡 No Response:", error.message);
    } else {
      // Something else happened
      console.error("⚠️ Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Export API instance
export default api;

// Type-safe API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

interface ApiErrorPayload {
  message?: string;
  errors?: unknown;
}

// API Helper Functions
export const apiClient = {
  // GET request
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    api.get<ApiResponse<T>>(url, config),

  // POST request
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post<ApiResponse<T>>(url, data, config),

  // PUT request
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.put<ApiResponse<T>>(url, data, config),

  // PATCH request
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.patch<ApiResponse<T>>(url, data, config),

  // DELETE request
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    api.delete<ApiResponse<T>>(url, config),

  // Upload file
  upload: <T = unknown>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post<ApiResponse<T>>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
  },
};


