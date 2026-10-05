"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageHeader from "../../../../components/panel/PageHeader";
import { apiFetch } from "../../../../lib/api";
import { usePanelUser } from "../../../../lib/PanelUserContext";

type Capability = {
  code: string; label: string; status: string; method: string;
  limitation: string; module_route: string | null;
};
const labels: Record<string, string> = {
  AVAILABLE: "Disponible", FILE_ONLY: "Por archivo", OPTIONAL: "Opcional, sin implementar",
  DEFERRED: "Diferido", UNSUPPORTED: "Sin contrato configurado", CONFIGURATION_REQUIRED: "Requiere configuración",
};
const methods: Record<string, string> = {
  UPLOAD: "Carga de archivos", UPLOAD_AND_HUMAN_REVIEW: "Archivos y revisión humana",
  CSV_XLSX_CAROVA_BANK_TABLE_V1: "CSV/XLSX con columnas definidas",
  CANONICAL_SOURCE_READ: "Fuentes documentales y bancarias",
  PROPOSAL_AND_EXPORT: "Preparación y exportación", SAME_ENGAGEMENT_EVIDENCE: "Evidencia del encargo",
  NATIVE_OPERATIONAL_DOCUMENT: "Documentos operativos",
  AUTHORIZED_BRIDGE_AND_HUMAN_APPLY: "Movimientos autorizados y aplicación humana",
  CAROVA_JSON_AND_PREPARATION_EXPORT: "Archivo JSON y preparación técnica",
  OPTIONAL_MANUAL_DOWNLOAD_AND_UPLOAD: "Descarga manual y carga de archivo",
  NO_BANK_API_CONFIGURED: "API bancaria sin configurar", NOT_INTEGRATED: "Sin integración fiscal",
  PREPARATION_ONLY: "Sólo preparación", BUSINESS_RULES_REQUIRED: "Requiere definir reglas contables",
  NOT_APPLICABLE_TO_CURRENT_ACCOUNTING_SCOPE: "No aplica a libros del cliente",
};

export default function ConnectivityPage() {
  const { user } = usePanelUser();
  const actorKey = user ? `${user.id}:${user.organization_id}:${user.role}` : "";
  const [result, setResult] = useState<{ actor: string; rows: Capability[]; error: string } | null>(null);
  useEffect(() => {
    if (!actorKey || user?.role === "client") return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await apiFetch("/api/carova/connectivity/capabilities/", { signal: controller.signal });
        if (!response.ok) throw new Error("No se pudo consultar la conectividad con tu acceso actual.");
        const data = await response.json();
        if (!controller.signal.aborted) setResult({ actor: actorKey, rows: data.capabilities, error: "" });
      } catch {
        if (!controller.signal.aborted) setResult({ actor: actorKey, rows: [], error: "Consulta no disponible. Actualiza la sesión o inténtalo de nuevo." });
      }
    }
    void load();
    return () => controller.abort();
  }, [actorKey, user?.role]);
  const visible = result?.actor === actorKey ? result : null;
  return <>
    <PageHeader title="Conectividad" description="Métodos disponibles y límites de integración." />
    <div className="panelCard">
      <p>La operación base usa archivos y revisión humana. Importar un archivo no significa tener una conexión externa activa.</p>
      <p>Consulta la última importación, su fuente y su historial en el módulo correspondiente. Esta vista no muestra datos de clientes ni credenciales.</p>
      {user?.role === "client" ? <p role="alert">Esta vista es para el equipo interno.</p> :
        visible?.error ? <p role="alert">{visible.error}</p> : !visible ? <p role="status">Consultando capacidades…</p> :
        <div style={{ overflowX: "auto" }}><table>
          <caption>Capacidades y métodos disponibles</caption>
          <thead><tr><th scope="col">Capacidad</th><th scope="col">Estado</th><th scope="col">Método</th><th scope="col">Alcance y fuente</th></tr></thead>
          <tbody>{visible.rows.map(row => <tr key={row.code}>
            <th scope="row">{row.label}</th><td><span className="uxBadge">{labels[row.status] || "Consulta el detalle"}</span></td><td>{methods[row.method] || "Consulta el método en el módulo"}</td>
            <td>{row.limitation}{row.module_route && <> <Link href={row.module_route}>Abrir módulo e historial</Link></>}</td>
          </tr>)}</tbody>
        </table></div>}
      <p>No requiere conectores de paga. Facturación no timbra CFDI; Nómina prepara material técnico y no presenta ni valida oficialmente ante IMSS.</p>
    </div>
  </>;
}
