"use client";

import { useEffect } from "react";
import { useAuthStore, type User } from "@/stores/authStore";

interface AuthStoreHydratorProps {
  user: User | null;
}

export function AuthStoreHydrator({ user }: AuthStoreHydratorProps) {
  const hydrateFromServer = useAuthStore((state) => state.hydrateFromServer);

  useEffect(() => {
    hydrateFromServer(user);
  }, [hydrateFromServer, user]);

  return null;
}
