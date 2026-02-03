// dashboard/src/stores/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: "ADMIN" | "FINANCE" | "AGEN" | "JAMAAH";
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        console.log("💾 Setting auth:", {
          token: token.substring(0, 20) + "...",
          user,
        });

        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }

        set({
          token,
          user,
          isAuthenticated: true,
        });

        console.log("✅ Auth state updated");
      },

      logout: () => {
        console.log("👋 Logging out...");

        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }

        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });

        window.location.href = "/login";
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
    }
  )
);
