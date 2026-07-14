"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { apiFetch } from "../../../../lib/api";

type Solicitud = {
  id: number;
  titulo: string;
  encargo_id: number;
  cliente_nombre: string;
  estatus: string;
  estatus_display: string;
  estatus_calculado: string;
  estatus_calculado_display: string;
  fecha_compromiso: string | null;
  documentos_count: number;
  documentos_aprobados_count: number;
  documentos_con_observaciones_count: number;
};

type Documento = {
  id: number;
  solicitud: number;
  version: number;
  nombre: string;
  archivo: string;
  estatus: string;
  estatus_display: string;
  estatus_revision: string;
  estatus_revision_display: string;
  observaciones: string;
  subido_por: string;
  subido_por_nombre: string;
  subido_en: string;
  comentarios_count: number;
  comentarios_pendientes_count: number;
};

const ESTATUS_REVISION = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "requiere_correccion", label: "Requiere corrección" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

export default function DocumentosPBCPage() {
  const params = useParams();
  const id = params.id as string;
  const { showSuccess, showError } = useToast();

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [resSolicitudes, resDocs] = await Promise.all([
        apiFetch("/api/pbc/solicitudes/"),
        apiFetch(`/api/pbc/${id}/documentos/`),
      ]);

      if (!resDocs.ok) {
        setError("No fue posible cargar los documentos.");
        return;
      }

      if (resSolicitudes.ok) {
        const todas: Solicitud[] = await resSolicitudes.json();
        setSolicitud(todas.find((s) => String(s.id) === String(id)) || null);
      }

      setDocumentos(await resDocs.json());
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) cargar();
  }, [id, cargar]);

  const documentosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return documentos.filter((d) => {
      if (q && !d.nombre.toLowerCase().includes(q)) return false;
      if (filtroEstatus && d.estatus_revision !== filtroEstatus) return false;
      return true;
    });
  }, [documentos, busqueda, filtroEstatus]);

  function abrirModal() {
    setErrorForm("");
    setArchivo(null);
    setNombre("");
    setObservaciones("");
    setModalAbierto(true);
  }

  async function abrirDocumento(docId: number) {
    try {
      const res = await apiFetch(`/api/documento/${docId}/url/`);
      const data = await res.json();

      if (!res.ok || !data.url) {
        showError("No se pudo abrir el archivo.");
        return;
      }

      window.open(data.url, "_blank");
    } catch {
      showError("Error al abrir el archivo.");
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    if (!archivo) {
      setErrorForm("Selecciona un archivo.");
      return;
    }

    try {
      setSubiendo(true);

      const contentType = archivo.type || "application/octet-stream";

      const resUploadUrl = await apiFetch("/api/generate-upload-url/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: archivo.name,
          content_type: contentType,
          solicitud_id: id,
        }),
      });

      const uploadData = await resUploadUrl.json();

      if (!resUploadUrl.ok) {
        setErrorForm(uploadData.detail || uploadData.error || "No se pudo generar URL de subida.");
        return;
      }

      const { upload_url, file_url } = uploadData;

      const s3Res = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: archivo,
      });

      if (!s3Res.ok) {
        setErrorForm("Error al subir archivo a S3.");
        return;
      }

      const formData = new FormData();
      formData.append("archivo_url", file_url);
      formData.append("nombre", nombre || archivo.name);
      formData.append("observaciones", observaciones);

      const res = await apiFetch(`/api/pbc/${id}/documentos/subir/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(data.detail || data.error || "No fue posible guardar el documento.");
        return;
      }

      showSuccess("Documento subido correctamente.");
      setModalAbierto(false);
      await cargar();
    } catch {
      setErrorForm("Ocurrió un error al subir el archivo.");
    } finally {
      setSubiendo(false);
    }
  }

  const columnas: DataTableColumn<Documento>[] = [
    { key: "nombre", header: "Nombre", render: (d) => d.nombre },
    { key: "version", header: "Versión actual", render: (d) => `v${d.version}` },
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
      render: (d) =>
        d.comentarios_pendientes_count > 0 ? (
          <StatusBadge label={String(d.comentarios_pendientes_count)} tone="yellow" />
        ) : (
          <span className="pageText">0</span>
        ),
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "right",
      render: (d) => (
        <div className="pageActions" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="cc-btn cc-btn--outline" onClick={() => abrirDocumento(d.id)}>
            Ver
          </button>
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
        title={solicitud ? solicitud.titulo : "Evidencia PBC"}
        description={
          solicitud
            ? `${solicitud.cliente_nombre} · Fecha compromiso: ${solicitud.fecha_compromiso || "—"}`
            : "Consulta los documentos cargados para esta solicitud y sube nueva evidencia."
        }
        actions={
          <>
            {solicitud && (
              <Link className="cc-btn cc-btn--outline" href={`/panel/encargos/${solicitud.encargo_id}`}>
                Volver al encargo
              </Link>
            )}
            <button type="button" className="cc-btn cc-btn--solid" onClick={abrirModal}>
              Subir documento
            </button>
          </>
        }
      />

      {solicitud && (
        <div className="statGrid">
          <div className="statCard">
            <p className="statCard__label">Estatus general</p>
            <p className="statCard__value">
              <StatusBadge label={solicitud.estatus_calculado_display} tone={toneForEstatus(solicitud.estatus_calculado)} />
            </p>
          </div>
          <div className="statCard">
            <p className="statCard__label">Documentos</p>
            <p className="statCard__value">{solicitud.documentos_count}</p>
          </div>
          <div className="statCard">
            <p className="statCard__label">Aprobados</p>
            <p className="statCard__value">{solicitud.documentos_aprobados_count}</p>
          </div>
          <div className="statCard">
            <p className="statCard__label">Con observaciones</p>
            <p className="statCard__value">{solicitud.documentos_con_observaciones_count}</p>
          </div>
        </div>
      )}

      <SearchAndFilters
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre de documento..."
        filters={
          <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)}>
            <option value="">Todos los estatus</option>
            {ESTATUS_REVISION.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        }
      />

      {loading && <LoadingState label="Cargando documentos..." />}
      {!loading && error && <ErrorState message={error} onRetry={cargar} />}

      {!loading && !error && documentosFiltrados.length === 0 && (
        <EmptyState
          title="No hay documentos que mostrar"
          description={busqueda || filtroEstatus ? "Ajusta tus filtros." : "Aún no se ha subido evidencia para esta solicitud."}
        />
      )}

      {!loading && !error && documentosFiltrados.length > 0 && (
        <DataTable columns={columnas} rows={documentosFiltrados} getRowKey={(d) => d.id} />
      )}

      <Modal open={modalAbierto} title="Subir documento" onClose={() => setModalAbierto(false)}>
        <form onSubmit={handleUpload} className="uploadForm">
          <FormField label="Archivo" required>
            <input type="file" onChange={(e) => setArchivo(e.target.files?.[0] || null)} required />
          </FormField>

          <FormField label="Nombre del documento">
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </FormField>

          <FormField label="Observaciones">
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={4} />
          </FormField>

          {errorForm && <p className="loginError">{errorForm}</p>}

          <div className="pageActions">
            <button type="submit" className="loginButton" disabled={subiendo}>
              {subiendo ? "Subiendo..." : "Subir documento"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
