"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, apiJson, clearSession, getAccessToken } from "./api";
import type { CurrentUser } from "./roles";

type PanelUserContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  logout: () => void;
  // Cambia la organización activa (solo tiene efecto para staff/senior con
  // más de una organización asignada; el backend vuelve a validar esto).
  // Devuelve true si el cambio se aplicó.
  cambiarOrganizacionActiva: (organizationId: number) => Promise<boolean>;
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

      // apiFetch ya intentó refrescar el token y, si no pudo, ya limpió la
      // sesión y redirigió a /login. Aquí solo falta manejar el resto de errores.
      if (res.status === 401) {
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

  const cambiarOrganizacionActiva = useCallback(
    async (organizationId: number) => {
      try {
        const res = await apiJson("/api/me/organizacion-activa/", "PATCH", { organization: organizationId });
        if (!res.ok) return false;
        await reload();
        return true;
      } catch {
        return false;
      }
    },
    [reload]
  );

  return (
    <PanelUserContext.Provider value={{ user, loading, error, reload, logout, cambiarOrganizacionActiva }}>
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
