"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

// Types
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: "ADMIN" | "FINANCE" | "STAFF" | "AGEN" | "JAMAAH";
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from backend cookie session
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("user_data");

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("user_data");
        }
      }

      try {
        const response = await api.get("/auth/me");
        const data = response.data;

        if (data.success && data.data) {
          setUser(data.data);
          localStorage.setItem("user_data", JSON.stringify(data.data));
        } else {
          setUser(null);
          localStorage.removeItem("user_data");
        }
      } catch {
        setUser(null);
        localStorage.removeItem("user_data");
      }

      setIsLoading(false);
    };

    void initAuth();
  }, []);

  // Login - Step 1: Send OTP
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data;

      if (data.success) {
        return Promise.resolve();
      } else {
        throw new Error(data.message);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message || "Login gagal");
      }
      throw new Error("Login gagal");
    }
  };

  // Verify OTP - Step 2: Get Token
  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await api.post("/auth/verify-otp", { email, otp });
      const data = response.data;

      if (data.success && data.data) {
        const { user: userData } = data.data;

        setUser(userData);

        // Save to localStorage
        localStorage.setItem("user_data", JSON.stringify(userData));

        // Redirect based on role
        redirectToDashboard(userData.role);
      } else {
        throw new Error(data.message);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message || "Verifikasi OTP gagal");
      }
      throw new Error("Verifikasi OTP gagal");
    }
  };

  // Logout
  const logout = () => {
    void api.post("/auth/logout").catch(() => {});
    setUser(null);
    localStorage.removeItem("user_data");
    router.push("/login");
  };

  // Refresh User Data
  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/me");
      const data = response.data;

      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem("user_data", JSON.stringify(data.data));
      }
    } catch (error) {
      throw error;
    }
  };

  // Redirect based on role
  const redirectToDashboard = (role: User["role"]) => {
    const dashboardBaseUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001";
    const dashboardRoutes = {
      ADMIN: `${dashboardBaseUrl}/admin`,
      FINANCE: `${dashboardBaseUrl}/finance`,
      STAFF: `${dashboardBaseUrl}/staff`,
      AGEN: `${dashboardBaseUrl}/agen`,
      JAMAAH: `${dashboardBaseUrl}/jamaah`,
    };

    const destination = dashboardRoutes[role] || dashboardBaseUrl;
    if (destination.startsWith("http://") || destination.startsWith("https://")) {
      window.location.href = destination;
      return;
    }

    router.push(destination);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    verifyOTP,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
