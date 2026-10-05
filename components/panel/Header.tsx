"use client";

import { useState } from "react";
import { usePanelUser } from "../../lib/PanelUserContext";
import { puedeCambiarOrganizacionActiva, roleLabel } from "../../lib/roles";
import { publicEnvironmentLabel } from "../../lib/branding";

type HeaderProps = {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
  pendingCount?: number;
  mobileOpen?: boolean;
  collapsed?: boolean;
};

const NOMBRE_FIRMA = "CC Contadores Públicos, Auditores y Consultores S.C.";

export default function Header({ onToggleSidebar, onToggleMobile, mobileOpen, collapsed }: HeaderProps) {
  const { user, logout, cambiarOrganizacionActiva } = usePanelUser();
  const [cambiando, setCambiando] = useState(false);
  const nombreOrganizacion = user?.organization_nombre || NOMBRE_FIRMA;
  const puedeCambiar = puedeCambiarOrganizacionActiva(user);

  async function handleCambiarOrganizacion(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevaId = Number(e.target.value);
    if (!nuevaId || nuevaId === user?.organization_id) return;
    setCambiando(true);
    await cambiarOrganizacionActiva(nuevaId);
    setCambiando(false);
  }

  return (
    <header className="appHeader">
      <div className="appHeader__left">
        <button
          type="button"
          className="appHeader__iconBtn appHeader__iconBtn--desktop"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          aria-controls="panel-navigation"
          aria-expanded={!collapsed}
        >
          ☰
        </button>
        <button
          type="button"
          className="appHeader__iconBtn appHeader__iconBtn--mobile"
          onClick={onToggleMobile}
          aria-label="Abrir menú"
          aria-controls="panel-navigation"
          aria-expanded={mobileOpen}
        >
          ☰
        </button>
        <div className="appHeader__identity" title={`Organización activa: ${nombreOrganizacion}`}>
          CC Contadores
          {publicEnvironmentLabel && <span className="appHeader__environment">{publicEnvironmentLabel}</span>}
        </div>
        {puedeCambiar && (
          <select
            className="appHeader__org appHeader__orgSelect"
            value={user?.organization_id ?? ""}
            onChange={handleCambiarOrganizacion}
            disabled={cambiando}
            aria-label="Cambiar organización activa"
            title="Cambiar organización activa"
          >
            {user?.organizaciones_asignadas?.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="appHeader__right">
        <div className="appHeader__user">
          <span className="appHeader__userName">{user?.username || "..."}</span>
          <span className="appHeader__userRole">{roleLabel(user?.role, user?.is_superuser)}</span>
        </div>

        <button type="button" className="cc-btn cc-btn--outline" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
