"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearSession, getAccessToken } from "./api";
import type { CurrentUser } from "./roles";

type PanelUserContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  logout: () => void;
};

const PanelUserContext = createContext<PanelUserContextValue | null>(null);

export function PanelUserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push("/login");
  }, [router]);

  const reload = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await apiFetch("/api/me/");

      if (res.status === 401) {
        clearSession();
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setError("No fue posible cargar tu sesión.");
        return;
      }

      const data = await res.json();
      setUser(data);
      setError("");
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    }
  }, [router]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      setLoading(false);
      return;
    }

    reload().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PanelUserContext.Provider value={{ user, loading, error, reload, logout }}>
      {children}
    </PanelUserContext.Provider>
  );
}

export function usePanelUser(): PanelUserContextValue {
  const ctx = useContext(PanelUserContext);
  if (!ctx) {
    throw new Error("usePanelUser debe usarse dentro de PanelUserProvider (app/panel/layout.tsx)");
  }
  return ctx;
}
