// dashboard/src/stores/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const isProduction = process.env.NODE_ENV === "production";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: "ADMIN" | "FINANCE" | "STAFF" | "AGEN" | "JAMAAH";
  phone: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// Logger for development only
const log = isProduction 
  ? () => {} 
  : console.log;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (_token, user) => {
        log("💾 Setting auth state");

        set({
          token: _token,
          user,
          isAuthenticated: true,
        });

        log("✅ Auth state updated");
      },

      logout: () => {
        log("👋 Logging out...");

        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
        }

        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });

        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },

      updateUser: (updatedUser) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persistedState, currentState) => {
        const mergedState = {
          ...currentState,
          ...(persistedState as Partial<AuthState>),
        };

        return {
          ...mergedState,
          token: mergedState.token ?? null,
          isAuthenticated: Boolean(mergedState.user && mergedState.token),
        };
      },
    }
  )
);
