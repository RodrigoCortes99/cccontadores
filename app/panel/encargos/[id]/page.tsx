"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "../../../../components/panel/PageHeader";
import LoadingState from "../../../../components/panel/LoadingState";
import ErrorState from "../../../../components/panel/ErrorState";
import EmptyState from "../../../../components/panel/EmptyState";
import SearchAndFilters from "../../../../components/panel/SearchAndFilters";
import DataTable, { DataTableColumn } from "../../../../components/panel/DataTable";
import StatusBadge, { toneForEstatus } from "../../../../components/panel/StatusBadge";
import Modal from "../../../../components/panel/Modal";
import FormField from "../../../../components/panel/FormField";
import { useToast } from "../../../../components/panel/Toast";
import { apiFetch, apiJson } from "../../../../lib/api";
import { usePanelUser } from "../../../../lib/PanelUserContext";
import { isClientRole, puedeCrearOperacion, puedeDarAprobacionFinalPBC, puedeRevisarPBC } from "../../../../lib/roles";

type SolicitudPBC = {
  id: number;
  organizacion: string;
  encargo: string;
  titulo: string;
  descripcion: string;
  estatus: string;
  estatus_display: string;
  estatus_calculado: string;
  estatus_calculado_display: string;
  fecha_compromiso: string | null;
  fecha_recibido: string | null;
  observaciones_revision: string;
  documentos_count: number;
  documentos_aprobados_count: number;
  documentos_con_observaciones_count: number;
  ultima_actividad: string;
  creado_en: string;
};

type Encargo = {
  audit_url?: string | null;
  id: number;
  nombre: string;
  cliente: string;
  organizacion: string;
  tipo_display: string;
  estatus_display: string;
  periodo_inicio: string;
  periodo_fin: string;
};

const ESTATUS_SOLICITUD = [
  { value: "pendiente", label: "Pendiente" },
  { value: "recibido", label: "Recibido" },
  { value: "aprobado", label: "Aprobado" },
  { value: "incompleto", label: "Incompleto" },
];

export default function EncargoDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = usePanelUser();
  const { showSuccess, showError } = useToast();
  const isClientUser = isClientRole(user);
  // Crear solicitudes PBC es exclusivo de manager/partner/superusuario.
  const puedeCrear = puedeCrearOperacion(user);
  // Revisar (cambiar estatus) es de senior en adelante; staff/client no.
  const puedeRevisar = puedeRevisarPBC(user);
  // Solo manager/partner/superusuario pueden dejar la solicitud "Aprobado"
  // (estado final); senior puede mover a los demás estados.
  const puedeAprobarFinal = puedeDarAprobacionFinalPBC(user);
  const opcionesEstatus = puedeAprobarFinal
    ? ESTATUS_SOLICITUD
    : ESTATUS_SOLICITUD.filter((s) => s.value !== "aprobado");

  const [encargo, setEncargo] = useState<Encargo | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudPBC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaCompromiso, setFechaCompromiso] = useState("");
  const [creando, setCreando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const [revisionAbierta, setRevisionAbierta] = useState<number | null>(null);
  const [estatusEdit, setEstatusEdit] = useState<Record<number, string>>({});
  const [observacionesEdit, setObservacionesEdit] = useState<Record<number, string>>({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function fetchEncargo() {
    const res = await apiFetch("/api/encargos/");
    if (!res.ok) return;
    const data: Encargo[] = await res.json();
    const encontrado = data.find((e) => String(e.id) === id);
    if (encontrado) setEncargo(encontrado);
  }

  async function fetchSolicitudes() {
    try {
      const res = await apiFetch(`/api/encargos/${id}/pbc/`);

      if (!res.ok) {
        setError("No fue posible cargar las solicitudes PBC.");
        return;
      }

      const data: SolicitudPBC[] = await res.json();
      setSolicitudes(data);

      const nuevosEstatus: Record<number, string> = {};
      const nuevasObservaciones: Record<number, string> = {};
      data.forEach((s) => {
        nuevosEstatus[s.id] = s.estatus;
        nuevasObservaciones[s.id] = s.observaciones_revision || "";
      });
      setEstatusEdit(nuevosEstatus);
      setObservacionesEdit(nuevasObservaciones);
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function cargarTodo() {
    setLoading(true);
    setError("");
    await Promise.all([fetchEncargo(), fetchSolicitudes()]);
  }

  useEffect(() => {
    if (id) cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCrearSolicitud(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    if (!titulo.trim()) {
      setErrorForm("Escribe un título para la solicitud.");
      return;
    }

    try {
      setCreando(true);

      const res = await apiJson(`/api/encargos/${id}/pbc/`, "POST", {
        encargo: Number(id),
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || "",
        estatus: "pendiente",
        fecha_compromiso: fechaCompromiso || null,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(typeof data === "object" ? JSON.stringify(data) : "No fue posible crear la solicitud PBC.");
        return;
      }

      showSuccess("Solicitud PBC creada correctamente.");
      setTitulo("");
      setDescripcion("");
      setFechaCompromiso("");
      setModalAbierto(false);

      await fetchSolicitudes();
    } catch {
      setErrorForm("Ocurrió un error al crear la solicitud PBC.");
      showError("Ocurrió un error al crear la solicitud PBC.");
    } finally {
      setCreando(false);
    }
  }

  async function handleGuardarRevision(solicitudId: number) {
    setUpdatingId(solicitudId);

    try {
      const nuevoEstatus = estatusEdit[solicitudId];
      const nuevaObservacion = observacionesEdit[solicitudId] || "";

      const res = await apiJson(`/api/pbc/${solicitudId}/estatus/`, "PATCH", {
        estatus: nuevoEstatus,
        observaciones_revision: nuevaObservacion,
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "No fue posible actualizar la revisión.");
        return;
      }

      showSuccess("Revisión actualizada correctamente.");
      setRevisionAbierta(null);
      await fetchSolicitudes();
    } catch {
      showError("Ocurrió un error al actualizar la revisión.");
    } finally {
      setUpdatingId(null);
    }
  }

  const resumenPorEstatus = useMemo(() => {
    const conteo: Record<string, number> = {};
    ESTATUS_SOLICITUD.forEach((s) => (conteo[s.value] = 0));
    solicitudes.forEach((s) => {
      conteo[s.estatus] = (conteo[s.estatus] || 0) + 1;
    });
    return conteo;
  }, [solicitudes]);

  const solicitudesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return solicitudes.filter((s) => {
      if (q && !s.titulo.toLowerCase().includes(q)) return false;
      if (filtroEstatus && s.estatus !== filtroEstatus) return false;
      return true;
    });
  }, [solicitudes, busqueda, filtroEstatus]);

  const columnas: DataTableColumn<SolicitudPBC>[] = [
    { key: "titulo", header: "Título", render: (s) => s.titulo },
    { key: "fecha_compromiso", header: "Fecha compromiso", render: (s) => s.fecha_compromiso || "—" },
    {
      key: "estatus",
      header: "Estatus",
      render: (s) => <StatusBadge label={s.estatus_calculado_display} tone={toneForEstatus(s.estatus_calculado)} />,
    },
    { key: "documentos", header: "Documentos", render: (s) => s.documentos_count },
    { key: "aprobados", header: "Aprobados", render: (s) => s.documentos_aprobados_count },
    { key: "observaciones", header: "Con observaciones", render: (s) => s.documentos_con_observaciones_count },
    {
      key: "actividad",
      header: "Última actividad",
      render: (s) => (s.ultima_actividad ? new Date(s.ultima_actividad).toLocaleDateString() : "—"),
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "right",
      render: (s) => (
        <div className="pageActions" style={{ justifyContent: "flex-end" }}>
          {puedeRevisar && (
            <button
              type="button"
              className="cc-btn cc-btn--outline"
              onClick={() => setRevisionAbierta(s.id)}
            >
              Revisar
            </button>
          )}
          <Link className="cc-btn cc-btn--solid" href={`/panel/pbc/${s.id}`}>
            {isClientUser ? "Ver documentos" : "Documentos"}
          </Link>
        </div>
      ),
    },
  ];

  const solicitudEnRevision = solicitudes.find((s) => s.id === revisionAbierta) || null;

  return (
    <>
      {process.env.NEXT_PUBLIC_CAROVA_AI_ENABLED === "true" && <Link href={`/panel/carova?encargo=${id}`} className="btn btn-secondary">Preguntar a Carova sobre este encargo</Link>}
      {encargo?.audit_url && <Link className="cc-btn cc-btn--solid" href={encargo.audit_url}>Auditoría / Papeles de trabajo</Link>}
      <PageHeader
        title={encargo?.nombre || (isClientUser ? "Mis requerimientos" : "Solicitudes PBC")}
        description={
          encargo
            ? `${encargo.cliente} · ${encargo.tipo_display} · ${encargo.periodo_inicio} — ${encargo.periodo_fin}`
            : undefined
        }
        actions={
          puedeCrear && (
            <button type="button" className="cc-btn cc-btn--solid" onClick={() => setModalAbierto(true)}>
              + Nueva solicitud
            </button>
          )
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
        searchPlaceholder="Buscar solicitud..."
        filters={
          <select aria-label="Filtrar por estado" value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)}>
            <option value="">Todos los estatus</option>
            {ESTATUS_SOLICITUD.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        }
      />

      {loading && <LoadingState label="Cargando solicitudes..." />}
      {!loading && error && <ErrorState message={error} onRetry={cargarTodo} />}

      {!loading && !error && solicitudesFiltradas.length === 0 && (
        <EmptyState title="No hay solicitudes PBC que mostrar" description={busqueda || filtroEstatus ? "Ajusta tus filtros." : "Aún no se han creado solicitudes para este encargo."} />
      )}

      {!loading && !error && solicitudesFiltradas.length > 0 && (
        <DataTable columns={columnas} rows={solicitudesFiltradas} getRowKey={(s) => s.id} />
      )}

      <Modal open={modalAbierto} title="Nueva solicitud PBC" onClose={() => setModalAbierto(false)}>
        <form onSubmit={handleCrearSolicitud} className="uploadForm">
          <FormField label="Título" required>
            <input
              type="text"
              placeholder="Ej. Balanza de comprobación enero 2026"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Descripción">
            <textarea
              rows={4}
              className="uploadTextarea"
              placeholder="Describe con detalle la información o evidencia requerida."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </FormField>

          <FormField label="Fecha compromiso">
            <input type="date" value={fechaCompromiso} onChange={(e) => setFechaCompromiso(e.target.value)} />
          </FormField>

          {errorForm && <p className="loginError">{errorForm}</p>}

          <div className="pageActions">
            <button type="submit" className="loginButton" disabled={creando}>
              {creando ? "Creando..." : "Crear solicitud PBC"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!solicitudEnRevision}
        title={`Revisar: ${solicitudEnRevision?.titulo || ""}`}
        onClose={() => setRevisionAbierta(null)}
      >
        {solicitudEnRevision && (
          <>
            {solicitudEnRevision.descripcion && (
              <p className="pageText">
                <strong>Descripción:</strong> {solicitudEnRevision.descripcion}
              </p>
            )}

            <p className="pageText">
              <strong>Estatus calculado según documentos:</strong>{" "}
              <StatusBadge
                label={solicitudEnRevision.estatus_calculado_display}
                tone={toneForEstatus(solicitudEnRevision.estatus_calculado)}
              />
            </p>

            <FormField label="Estatus">
              <select
                value={estatusEdit[solicitudEnRevision.id] || solicitudEnRevision.estatus}
                onChange={(e) =>
                  setEstatusEdit((prev) => ({ ...prev, [solicitudEnRevision.id]: e.target.value }))
                }
              >
                {opcionesEstatus.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Observaciones de revisión">
              <textarea
                rows={4}
                className="uploadTextarea"
                placeholder="Ej. Falta XML, el PDF no corresponde al periodo o falta firma."
                value={observacionesEdit[solicitudEnRevision.id] || ""}
                onChange={(e) =>
                  setObservacionesEdit((prev) => ({ ...prev, [solicitudEnRevision.id]: e.target.value }))
                }
              />
            </FormField>

            <div className="pageActions">
              <button
                type="button"
                className="loginButton"
                onClick={() => handleGuardarRevision(solicitudEnRevision.id)}
                disabled={updatingId === solicitudEnRevision.id}
              >
                {updatingId === solicitudEnRevision.id ? "Guardando..." : "Guardar revisión"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
