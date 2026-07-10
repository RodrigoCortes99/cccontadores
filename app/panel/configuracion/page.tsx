"use client";

import PageHeader from "../../../components/panel/PageHeader";
import { usePanelUser } from "../../../lib/PanelUserContext";
import { roleLabel } from "../../../lib/roles";

export default function ConfiguracionPage() {
  const { user } = usePanelUser();

  return (
    <>
      <PageHeader title="Configuración" description="Datos de tu cuenta y tu organización." />

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
        {user?.client_name && (
          <div className="panelCard__item">
            <strong>Cliente:</strong> {user.client_name}
          </div>
        )}
      </div>
    </>
  );
}
