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

type Solicitud = {
  id: number;
  organizacion: string;
  encargo: string;
  encargo_id: number;
  cliente_nombre: string;
  titulo: string;
  estatus: string;
  estatus_display: string;
  estatus_calculado: string;
  estatus_calculado_display: string;
  fecha_compromiso: string | null;
  fecha_recibido: string | null;
  documentos_count: number;
  documentos_aprobados_count: number;
  documentos_con_observaciones_count: number;
  ultima_actividad: string;
  creado_en: string;
};

const ESTATUS_SOLICITUD = [
  { value: "pendiente", label: "Pendiente" },
  { value: "recibido", label: "Recibido" },
  { value: "aprobado", label: "Aprobado" },
  { value: "incompleto", label: "Incompleto" },
];

export default function SolicitudesPBCPage() {
  const { user } = usePanelUser();
  const isClientUser = isClientRole(user);

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");

  async function cargar() {
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/pbc/solicitudes/");
      if (!res.ok) {
        setError("No fue posible cargar las solicitudes PBC.");
        return;
      }
      setSolicitudes(await res.json());
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const resumenPorEstatus = useMemo(() => {
    const conteo: Record<string, number> = {};
    ESTATUS_SOLICITUD.forEach((s) => (conteo[s.value] = 0));
    solicitudes.forEach((s) => {
      conteo[s.estatus] = (conteo[s.estatus] || 0) + 1;
    });
    return conteo;
  }, [solicitudes]);

  const clientesDisponibles = useMemo(
    () => Array.from(new Set(solicitudes.map((s) => s.cliente_nombre))).sort(),
    [solicitudes]
  );

  const solicitudesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return solicitudes.filter((s) => {
      if (q && !s.titulo.toLowerCase().includes(q) && !s.cliente_nombre.toLowerCase().includes(q)) return false;
      if (filtroEstatus && s.estatus !== filtroEstatus) return false;
      if (filtroCliente && s.cliente_nombre !== filtroCliente) return false;
      return true;
    });
  }, [solicitudes, busqueda, filtroEstatus, filtroCliente]);

  const columnas: DataTableColumn<Solicitud>[] = [
    { key: "titulo", header: "Título", render: (s) => s.titulo },
    { key: "cliente", header: "Cliente", render: (s) => s.cliente_nombre },
    { key: "encargo", header: "Encargo", render: (s) => s.encargo },
    { key: "fecha_compromiso", header: "Fecha compromiso", render: (s) => s.fecha_compromiso || "—" },
    {
      key: "estatus",
      header: "Estatus",
      render: (s) => <StatusBadge label={s.estatus_calculado_display} tone={toneForEstatus(s.estatus_calculado)} />,
    },
    { key: "documentos", header: "Documentos", render: (s) => s.documentos_count },
    { key: "aprobados", header: "Aprobados", render: (s) => s.documentos_aprobados_count },
    { key: "observaciones", header: "Con observaciones", render: (s) => s.documentos_con_observaciones_count },
    { key: "ultima_actividad", header: "Última actividad", render: (s) => new Date(s.ultima_actividad).toLocaleDateString() },
    {
      key: "acciones",
      header: "Acciones",
      align: "right",
      render: (s) => (
        <div className="pageActions" style={{ justifyContent: "flex-end" }}>
          <Link className="cc-btn cc-btn--outline" href={`/panel/encargos/${s.encargo_id}`}>
            Ver encargo
          </Link>
          <Link className="cc-btn cc-btn--solid" href={`/panel/pbc/${s.id}`}>
            Documentos
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Solicitudes PBC"
        description={
          isClientUser
            ? "Todas tus solicitudes de información, en todos tus encargos."
            : "Todas las solicitudes de información al cliente, en todos los encargos."
        }
      />

      <div className="statGrid">
        {ESTATUS_SOLICITUD.map((s) => (
          <div key={s.value} className="statCard">
            <p className="statCard__label">{s.label}</p>
            <p className="statCard__value">{resumenPorEstatus[s.value] || 0}</p>
          </div>
        ))}
      </div>

      <SearchAndFilters
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por título o cliente..."
        filters={
          <>
            <select aria-label="Filtrar por estado" value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)}>
              <option value="">Todos los estatus</option>
              {ESTATUS_SOLICITUD.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select aria-label="Filtrar por cliente" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}>
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

      {loading && <LoadingState label="Cargando solicitudes..." />}
      {!loading && error && <ErrorState message={error} onRetry={cargar} />}

      {!loading && !error && solicitudesFiltradas.length === 0 && (
        <EmptyState
          title="No hay solicitudes PBC que mostrar"
          description={busqueda || filtroEstatus || filtroCliente ? "Ajusta tus filtros." : "Aún no hay solicitudes registradas."}
        />
      )}

      {!loading && !error && solicitudesFiltradas.length > 0 && (
        <DataTable columns={columnas} rows={solicitudesFiltradas} getRowKey={(s) => s.id} />
      )}
    </>
  );
}
