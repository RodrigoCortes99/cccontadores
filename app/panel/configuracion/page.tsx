"use client";

import Link from "next/link";
import PageHeader from "../../../components/panel/PageHeader";
import { usePanelUser } from "../../../lib/PanelUserContext";
import { canManageUsers, isPrivileged, roleLabel } from "../../../lib/roles";

export default function ConfiguracionPage() {
  const { user } = usePanelUser();
  const puedeAdministrar = canManageUsers(user);
  const puedeVerCatalogos = isPrivileged(user);
  const clientes = user?.clientes_asignados?.map((c) => c.name)
    ?? (user?.client_name ? [user.client_name] : []);

  return (
    <>
      <PageHeader title="Configuración" description="Datos de tu cuenta y administración de tu organización." />

      <div className="panelCard" style={{ maxWidth: 560 }}>
        <h2>Tu cuenta</h2>
        <div className="panelCard__item">
          <strong>Usuario:</strong> {user?.username}
        </div>
        <div className="panelCard__item">
          <strong>Correo:</strong> {user?.email || "—"}
        </div>
        <div className="panelCard__item">
          <strong>Rol:</strong> {roleLabel(user?.role)}
        </div>
        {clientes.length > 0 && (
          <div className="panelCard__item">
            <strong>{clientes.length === 1 ? "Cliente:" : "Clientes:"}</strong> {clientes.join(", ")}
          </div>
        )}
      </div>

      {user && user.role !== "client" && (
        <div className="panelCard">
          <h2>Conectividad</h2>
          <Link href="/panel/configuracion/conectividad" className="cc-btn cc-btn--outline">
            Métodos de entrada, salida e integración
          </Link>
        </div>
      )}

      {puedeAdministrar && (
        <div className="panelCard">
          <h2>Administración</h2>
          <div className="quickActionsGrid">
            <Link href="/panel/configuracion/usuarios" className="cc-btn cc-btn--solid">
              Usuarios
            </Link>
            <Link href="/panel/configuracion/organizaciones" className="cc-btn cc-btn--outline">
              Organizaciones
            </Link>
            <Link href="/panel/clientes/administrar" className="cc-btn cc-btn--outline">
              Clientes
            </Link>
            {puedeVerCatalogos && (
              <Link href="/panel/time-tracking/catalogos" className="cc-btn cc-btn--outline">
                Catálogos de control de horas
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
