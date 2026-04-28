// dashboard/src/stores/authStore.ts
import { create } from "zustand";
import { authService } from "@/services/authService";

const isProduction = process.env.NODE_ENV === "production";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: "ADMIN" | "FINANCE" | "STAFF" | "AGEN" | "JAMAAH";
  phone: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  isLoading: boolean;
  hasInitialized: boolean;
  setAuth: (user: User | null) => void;
  hydrateFromServer: (user: User | null) => void;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const log = isProduction ? () => {} : console.log;

const clearLegacyAuthStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("auth-storage");
  localStorage.removeItem("user_data");
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  hasHydrated: false,
  isLoading: false,
  hasInitialized: false,

  setAuth: (user) => {
    set({
      user,
      isAuthenticated: Boolean(user),
      hasHydrated: true,
      hasInitialized: true,
      isLoading: false,
    });
  },

  hydrateFromServer: (user) => {
    log("Hydrating auth state from server session");
    set({
      user,
      isAuthenticated: Boolean(user),
      hasHydrated: true,
      hasInitialized: true,
      isLoading: false,
    });
  },

  refreshUser: async () => {
    if (get().isLoading) {
      return get().user;
    }

    set({ isLoading: true });

    try {
      const response = await authService.getCurrentUser();
      const nextUser = response?.data ?? null;

      set({
        user: nextUser,
        isAuthenticated: Boolean(nextUser),
        hasHydrated: true,
        hasInitialized: true,
        isLoading: false,
      });

      return nextUser;
    } catch {
      clearLegacyAuthStorage();
      set({
        user: null,
        isAuthenticated: false,
        hasHydrated: true,
        hasInitialized: true,
        isLoading: false,
      });
      return null;
    }
  },

  logout: async () => {
    log("Logging out");

    try {
      await authService.logout();
    } catch {
      // Best-effort logout only.
    }

    clearLegacyAuthStorage();

    set({
      user: null,
      isAuthenticated: false,
      hasHydrated: true,
      hasInitialized: true,
      isLoading: false,
    });

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  updateUser: (updatedUser) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedUser } : null,
    }));
  },
}));
