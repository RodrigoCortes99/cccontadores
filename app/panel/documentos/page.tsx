"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "../../../components/panel/PageHeader";
import LoadingState from "../../../components/panel/LoadingState";
import ErrorState from "../../../components/panel/ErrorState";
import EmptyState from "../../../components/panel/EmptyState";
import SearchAndFilters from "../../../components/panel/SearchAndFilters";
import DataTable, { DataTableColumn } from "../../../components/panel/DataTable";
import StatusBadge, { toneForEstatus } from "../../../components/panel/StatusBadge";
import { apiFetch } from "../../../lib/api";
import { usePanelUser } from "../../../lib/PanelUserContext";
import { isClientRole } from "../../../lib/roles";

type Documento = {
  id: number;
  solicitud: number;
  solicitud_titulo: string;
  encargo_id: number;
  cliente_nombre: string;
  version: number;
  nombre: string;
  estatus_revision: string;
  estatus_revision_display: string;
  subido_por_nombre: string;
  subido_por: string;
  subido_en: string;
  comentarios_pendientes_count: number;
};

const ESTATUS_REVISION = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "requiere_correccion", label: "Requiere corrección" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

export default function DocumentosPage() {
  const { user } = usePanelUser();
  const isClientUser = isClientRole(user);

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");

  async function cargar() {
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/pbc/documentos/");
      if (!res.ok) {
        setError("No fue posible cargar los documentos.");
        return;
      }
      setDocumentos(await res.json());
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const clientesDisponibles = useMemo(
    () => Array.from(new Set(documentos.map((d) => d.cliente_nombre))).sort(),
    [documentos]
  );

  const documentosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return documentos.filter((d) => {
      if (q && !d.nombre.toLowerCase().includes(q) && !d.solicitud_titulo.toLowerCase().includes(q)) return false;
      if (filtroEstatus && d.estatus_revision !== filtroEstatus) return false;
      if (filtroCliente && d.cliente_nombre !== filtroCliente) return false;
      return true;
    });
  }, [documentos, busqueda, filtroEstatus, filtroCliente]);

  const columnas: DataTableColumn<Documento>[] = [
    { key: "nombre", header: "Nombre", render: (d) => d.nombre },
    { key: "solicitud", header: "Solicitud", render: (d) => d.solicitud_titulo },
    { key: "cliente", header: "Cliente", render: (d) => d.cliente_nombre },
    { key: "version", header: "Versión", render: (d) => `v${d.version}` },
    {
      key: "estatus",
      header: "Estatus",
      render: (d) => <StatusBadge label={d.estatus_revision_display} tone={toneForEstatus(d.estatus_revision)} />,
    },
    { key: "subido_por", header: "Subido por", render: (d) => d.subido_por_nombre || d.subido_por },
    { key: "fecha", header: "Fecha", render: (d) => new Date(d.subido_en).toLocaleDateString() },
    {
      key: "comentarios",
      header: "Comentarios pendientes",
      render: (d) => (d.comentarios_pendientes_count > 0 ? <StatusBadge label={String(d.comentarios_pendientes_count)} tone="yellow" /> : "0"),
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "right",
      render: (d) => (
        <div className="pageActions" style={{ justifyContent: "flex-end" }}>
          <Link className="cc-btn cc-btn--solid" href={`/panel/documentos/${d.id}`}>
            Revisar
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Documentos"
        description={
          isClientUser
            ? "Todos los documentos que has subido, en todas tus solicitudes."
            : "Vista global de documentos y versiones de todas las solicitudes PBC."
        }
      />

      <SearchAndFilters
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre o solicitud..."
        filters={
          <>
            <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)}>
              <option value="">Todos los estatus</option>
              {ESTATUS_REVISION.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}>
              <option value="">Todos los clientes</option>
              {clientesDisponibles.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        }
      />

      {loading && <LoadingState label="Cargando documentos..." />}
      {!loading && error && <ErrorState message={error} onRetry={cargar} />}

      {!loading && !error && documentosFiltrados.length === 0 && (
        <EmptyState
          title="No hay documentos que mostrar"
          description={busqueda || filtroEstatus || filtroCliente ? "Ajusta tus filtros." : "Aún no se ha subido evidencia."}
        />
      )}

      {!loading && !error && documentosFiltrados.length > 0 && (
        <DataTable columns={columnas} rows={documentosFiltrados} getRowKey={(d) => d.id} />
      )}
    </>
  );
}
