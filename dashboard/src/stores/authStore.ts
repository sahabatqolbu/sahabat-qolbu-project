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
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setAuth: (user: User) => void;
  setHasHydrated: (hydrated: boolean) => void;
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
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user) => {
        log("💾 Setting auth state");

        set({
          user,
          isAuthenticated: true,
        });

        log("✅ Auth state updated");
      },

      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated });
      },

      logout: () => {
        log("👋 Logging out...");

        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
        }

        set({
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
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      merge: (persistedState, currentState) => {
        const mergedState = {
          ...currentState,
          ...(persistedState as Partial<AuthState>),
        };

        return {
          ...mergedState,
          isAuthenticated: Boolean(mergedState.user),
          hasHydrated: true,
        };
      },
    }
  )
);
