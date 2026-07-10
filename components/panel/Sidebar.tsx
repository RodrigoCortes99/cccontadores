"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  hideForClient?: boolean;
};

const NAV_ITEMS: (NavItem & { clientLabel?: string })[] = [
  { label: "Dashboard", href: "/panel" },
  { label: "Clientes", href: "/panel/clientes", hideForClient: true },
  { label: "Encargos", href: "/panel/encargos", clientLabel: "Mis encargos" },
  { label: "Solicitudes PBC", href: "/panel/pbc" },
  { label: "Documentos", href: "/panel/documentos" },
  { label: "Control de horas", href: "/panel/time-tracking", hideForClient: true },
  { label: "Reportes", href: "/panel/time-tracking/reportes", hideForClient: true },
  // Configuración incluye administración de usuarios/organizaciones/catálogos:
  // no aplica para el rol client (sin control de costos ni administración).
  { label: "Configuración", href: "/panel/configuracion", hideForClient: true },
];

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  esCliente: boolean;
  onCloseMobile: () => void;
};

export default function Sidebar({ collapsed, mobileOpen, esCliente, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => !esCliente || !item.hideForClient);

  function esActivo(href: string) {
    if (href === "/panel") return pathname === "/panel";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <aside
        className={`appSidebar ${collapsed ? "appSidebar--collapsed" : ""} ${
          mobileOpen ? "appSidebar--mobileOpen" : ""
        }`}
      >
        <div className="appSidebar__brand">
          <div className="cc-brand__fallback">CC</div>
          {!collapsed && <span>CC Contadores</span>}
        </div>

        <nav className="appSidebar__nav" aria-label="Navegación del panel">
          {items.map((item) => {
            const etiqueta = esCliente && item.clientLabel ? item.clientLabel : item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`appSidebar__link ${esActivo(item.href) ? "appSidebar__link--active" : ""}`}
                onClick={onCloseMobile}
                title={collapsed ? etiqueta : undefined}
              >
                <span className="appSidebar__linkDot" aria-hidden="true" />
                {!collapsed && <span>{etiqueta}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen && <div className="appSidebar__scrim" onClick={onCloseMobile} />}
    </>
  );
}
