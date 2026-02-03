"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// Types
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: "ADMIN" | "FINANCE" | "AGEN" | "JAMAAH";
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("user_data");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login - Step 1: Send OTP
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        return Promise.resolve();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      throw new Error(error.message || "Login gagal");
    }
  };

  // Verify OTP - Step 2: Get Token
  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (data.success && data.data) {
        const { token: newToken, user: userData } = data.data;

        // Save to state
        setToken(newToken);
        setUser(userData);

        // Save to localStorage
        localStorage.setItem("auth_token", newToken);
        localStorage.setItem("user_data", JSON.stringify(userData));

        // Redirect based on role
        redirectToDashboard(userData.role);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      throw new Error(error.message || "Verifikasi OTP gagal");
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    router.push("/login");
  };

  // Refresh User Data
  const refreshUser = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

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
    const dashboardRoutes = {
      ADMIN: "/dashboard/admin",
      FINANCE: "/dashboard/finance",
      AGEN: "/dashboard/agen",
      JAMAAH: "/dashboard/jamaah",
    };

    router.push(dashboardRoutes[role]);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
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
