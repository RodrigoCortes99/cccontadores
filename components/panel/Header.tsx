"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { usePanelUser } from "../../lib/PanelUserContext";
import { roleLabel } from "../../lib/roles";

type HeaderProps = {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
  pendingCount?: number;
};

const NOMBRE_FIRMA = "CC Contadores Públicos, Auditores y Consultores S.C.";

export default function Header({ onToggleSidebar, onToggleMobile, pendingCount = 0 }: HeaderProps) {
  const { user, logout } = usePanelUser();
  const [nombreOrganizacion, setNombreOrganizacion] = useState<string>(NOMBRE_FIRMA);

  useEffect(() => {
    if (!user?.organization_id) return;

    let activo = true;

    apiFetch("/api/organizaciones/")
      .then((res) => (res.ok ? res.json() : []))
      .then((orgs: { id: number; name: string }[]) => {
        if (!activo) return;
        const org = orgs.find((o) => o.id === user.organization_id);
        if (org) setNombreOrganizacion(org.name);
      })
      .catch(() => {
        // si falla, se queda el nombre por default
      });

    return () => {
      activo = false;
    };
  }, [user?.organization_id]);

  return (
    <header className="appHeader">
      <div className="appHeader__left">
        <button
          type="button"
          className="appHeader__iconBtn appHeader__iconBtn--desktop"
          onClick={onToggleSidebar}
          aria-label="Colapsar menú"
          title="Colapsar menú"
        >
          ☰
        </button>
        <button
          type="button"
          className="appHeader__iconBtn appHeader__iconBtn--mobile"
          onClick={onToggleMobile}
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <div className="appHeader__org">{nombreOrganizacion}</div>
      </div>

      <div className="appHeader__right">
        <button type="button" className="appHeader__iconBtn" aria-label="Notificaciones" title="Notificaciones">
          🔔
          {pendingCount > 0 && <span className="appHeader__badge">{pendingCount}</span>}
        </button>

        <div className="appHeader__user">
          <span className="appHeader__userName">{user?.username || "..."}</span>
          <span className="appHeader__userRole">{roleLabel(user?.role)}</span>
        </div>

        <button type="button" className="cc-btn cc-btn--outline" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
