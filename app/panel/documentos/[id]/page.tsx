"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "../../../../components/panel/PageHeader";
import LoadingState from "../../../../components/panel/LoadingState";
import ErrorState from "../../../../components/panel/ErrorState";
import EmptyState from "../../../../components/panel/EmptyState";
import StatusBadge, { toneForEstatus } from "../../../../components/panel/StatusBadge";
import Modal from "../../../../components/panel/Modal";
import FormField from "../../../../components/panel/FormField";
import { useToast } from "../../../../components/panel/Toast";
import { apiFetch, apiJson } from "../../../../lib/api";
import { usePanelUser } from "../../../../lib/PanelUserContext";
import { puedeDarAprobacionFinalPBC, puedeRevisarPBC, roleLabel } from "../../../../lib/roles";

type Documento = {
  id: number;
  solicitud: number;
  solicitud_titulo: string;
  encargo_id: number;
  cliente_nombre: string;
  version: number;
  nombre: string;
  archivo: string;
  estatus_revision: string;
  estatus_revision_display: string;
  revisado_por: string | null;
  revisado_por_nombre: string | null;
  fecha_revision: string | null;
  observaciones: string;
  subido_por: string;
  subido_por_nombre: string;
  subido_en: string;
  actualizado_en: string;
};

type Comentario = {
  id: number;
  documento: number;
  autor: string;
  autor_nombre: string;
  rol_autor: string;
  texto: string;
  creado_en: string;
  resuelto: boolean;
};

type VersionHistorial = {
  id: number;
  version: number;
  nombre: string;
  estatus_revision_display: string;
  estatus_revision: string;
  subido_en: string;
};

const ESTATUS_REVISION = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "requiere_correccion", label: "Requiere corrección" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

export default function DocumentoDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = usePanelUser();
  const { showSuccess, showError } = useToast();
  const puedeRevisar = puedeRevisarPBC(user);
  const puedeAprobarFinal = puedeDarAprobacionFinalPBC(user);
  const opcionesEstatusRevision = puedeAprobarFinal
    ? ESTATUS_REVISION
    : ESTATUS_REVISION.filter((s) => s.value !== "aprobado" && s.value !== "rechazado");

  const [documento, setDocumento] = useState<Documento | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [historial, setHistorial] = useState<VersionHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const [nuevoEstatus, setNuevoEstatus] = useState("");
  const [guardandoEstatus, setGuardandoEstatus] = useState(false);

  const [modalSubirAbierto, setModalSubirAbierto] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [observacionesArchivo, setObservacionesArchivo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const resDoc = await apiFetch(`/api/documentos/${id}/`);

      if (!resDoc.ok) {
        setError("No fue posible cargar el documento.");
        return;
      }

      const doc: Documento = await resDoc.json();
      setDocumento(doc);
      setNuevoEstatus(doc.estatus_revision);

      const [resComentarios, resHistorial] = await Promise.all([
        apiFetch(`/api/documentos/${id}/comentarios/`),
        apiFetch(`/api/pbc/${doc.solicitud}/documentos/`),
      ]);

      setComentarios(resComentarios.ok ? await resComentarios.json() : []);
      setHistorial(resHistorial.ok ? await resHistorial.json() : []);
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) cargar();
  }, [id, cargar]);

  async function abrirArchivo() {
    try {
      const res = await apiFetch(`/api/documento/${id}/url/`);
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

  async function handleEnviarComentario(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nuevoComentario.trim()) return;

    try {
      setEnviandoComentario(true);

      const res = await apiJson(`/api/documentos/${id}/comentarios/`, "POST", {
        texto: nuevoComentario,
      });

      if (!res.ok) {
        showError("No fue posible enviar el comentario.");
        return;
      }

      setNuevoComentario("");
      const nuevo = await res.json();
      setComentarios((prev) => [...prev, nuevo]);
    } catch {
      showError("Ocurrió un error al enviar el comentario.");
    } finally {
      setEnviandoComentario(false);
    }
  }

  async function handleResolverComentario(comentarioId: number, resuelto: boolean) {
    try {
      const res = await apiJson(`/api/comentarios/${comentarioId}/resolver/`, "PATCH", { resuelto });

      if (!res.ok) {
        showError("No fue posible actualizar el comentario.");
        return;
      }

      const actualizado = await res.json();
      setComentarios((prev) => prev.map((c) => (c.id === comentarioId ? actualizado : c)));
    } catch {
      showError("Ocurrió un error al actualizar el comentario.");
    }
  }

  async function handleGuardarEstatus(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setGuardandoEstatus(true);

      const res = await apiJson(`/api/documentos/${id}/estatus/`, "PATCH", {
        estatus_revision: nuevoEstatus,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(data.detail || "No fue posible actualizar el estatus.");
        return;
      }

      const actualizado = await res.json();
      setDocumento(actualizado);
      showSuccess("Estatus de revisión actualizado.");
    } catch {
      showError("Ocurrió un error al actualizar el estatus.");
    } finally {
      setGuardandoEstatus(false);
    }
  }

  function abrirModalSubir() {
    setErrorSubida("");
    setArchivo(null);
    setNombreArchivo("");
    setObservacionesArchivo("");
    setModalSubirAbierto(true);
  }

  async function handleSubirVersion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorSubida("");

    if (!archivo || !documento) {
      setErrorSubida("Selecciona un archivo.");
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
          solicitud_id: documento.solicitud,
        }),
      });

      const uploadData = await resUploadUrl.json();

      if (!resUploadUrl.ok) {
        setErrorSubida(uploadData.detail || uploadData.error || "No se pudo generar URL de subida.");
        return;
      }

      const { upload_url, file_url } = uploadData;

      const s3Res = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: archivo,
      });

      if (!s3Res.ok) {
        setErrorSubida("Error al subir archivo a S3.");
        return;
      }

      const formData = new FormData();
      formData.append("archivo_url", file_url);
      formData.append("nombre", nombreArchivo || archivo.name);
      formData.append("observaciones", observacionesArchivo);

      const res = await apiFetch(`/api/pbc/${documento.solicitud}/documentos/subir/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorSubida(data.detail || data.error || "No fue posible guardar el documento.");
        return;
      }

      showSuccess("Nueva versión subida correctamente.");
      setModalSubirAbierto(false);
      await cargar();
    } catch {
      setErrorSubida("Ocurrió un error al subir el archivo.");
    } finally {
      setSubiendo(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Documento" />
        <LoadingState label="Cargando documento..." />
      </>
    );
  }

  if (error || !documento) {
    return (
      <>
        <PageHeader title="Documento" />
        <ErrorState message={error || "Documento no encontrado."} onRetry={cargar} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={documento.nombre}
        description={`${documento.solicitud_titulo} · ${documento.cliente_nombre} · v${documento.version}`}
        actions={
          <>
            <Link className="cc-btn cc-btn--outline" href={`/panel/pbc/${documento.solicitud}`}>
              Volver a la solicitud
            </Link>
            <button type="button" className="cc-btn cc-btn--outline" onClick={abrirArchivo}>
              Ver archivo
            </button>
            <button type="button" className="cc-btn cc-btn--solid" onClick={abrirModalSubir}>
              Subir nueva versión
            </button>
          </>
        }
      />

      <div className="statGrid">
        <div className="statCard">
          <p className="statCard__label">Estatus de revisión</p>
          <p className="statCard__value">
            <StatusBadge label={documento.estatus_revision_display} tone={toneForEstatus(documento.estatus_revision)} />
          </p>
        </div>
        <div className="statCard">
          <p className="statCard__label">Subido por</p>
          <p className="statCard__value">{documento.subido_por_nombre || documento.subido_por}</p>
        </div>
        <div className="statCard">
          <p className="statCard__label">Revisado por</p>
          <p className="statCard__value">{documento.revisado_por_nombre || documento.revisado_por || "—"}</p>
        </div>
        <div className="statCard">
          <p className="statCard__label">Última actualización</p>
          <p className="statCard__value">{new Date(documento.actualizado_en).toLocaleString()}</p>
        </div>
      </div>

      <div className="dashboardGrid">
        <div>
          <div className="panelCard">
            <h2>Comentarios</h2>

            {comentarios.length === 0 && <p className="pageText">Sin comentarios todavía.</p>}

            {comentarios.map((c) => (
              <div key={c.id} className="panelCard__item">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong>
                    {c.autor_nombre || c.autor} <span className="pageText">({roleLabel(c.rol_autor)})</span>
                  </strong>
                  <span className="pageText">{new Date(c.creado_en).toLocaleString()}</span>
                </div>
                <p>{c.texto}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusBadge label={c.resuelto ? "Resuelto" : "Pendiente"} tone={c.resuelto ? "green" : "yellow"} />
                  {puedeRevisar && (
                    <button
                      type="button"
                      className="cc-btn cc-btn--outline"
                      onClick={() => handleResolverComentario(c.id, !c.resuelto)}
                    >
                      {c.resuelto ? "Marcar pendiente" : "Marcar resuelto"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <form onSubmit={handleEnviarComentario} className="uploadForm" style={{ marginTop: 16 }}>
              <FormField label="Agregar comentario">
                <textarea
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  rows={3}
                  placeholder="Escribe un comentario..."
                />
              </FormField>
              <div className="pageActions">
                <button type="submit" className="loginButton" disabled={enviandoComentario || !nuevoComentario.trim()}>
                  {enviandoComentario ? "Enviando..." : "Comentar"}
                </button>
              </div>
            </form>
          </div>

          {puedeRevisar && (
            <div className="panelCard">
              <h2>Cambiar estatus de revisión</h2>
              <form onSubmit={handleGuardarEstatus} className="uploadForm">
                <FormField label="Estatus">
                  <select value={nuevoEstatus} onChange={(e) => setNuevoEstatus(e.target.value)}>
                    {opcionesEstatusRevision.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="pageActions">
                  <button type="submit" className="loginButton" disabled={guardandoEstatus}>
                    {guardandoEstatus ? "Guardando..." : "Guardar estatus"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div>
          <div className="panelCard">
            <h2>Historial de versiones</h2>
            {historial.length === 0 && <EmptyState title="Sin historial" />}
            {historial.map((v) => (
              <div key={v.id} className="panelCard__item">
                <Link href={`/panel/documentos/${v.id}`}>
                  <strong>v{v.version}</strong> — {v.nombre}
                </Link>{" "}
                {v.id === documento.id && <span className="pageText">(actual)</span>}{" "}
                <StatusBadge label={v.estatus_revision_display} tone={toneForEstatus(v.estatus_revision)} />
                <p className="pageText">{new Date(v.subido_en).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={modalSubirAbierto} title="Subir nueva versión" onClose={() => setModalSubirAbierto(false)}>
        <form onSubmit={handleSubirVersion} className="uploadForm">
          <FormField label="Archivo" required>
            <input type="file" onChange={(e) => setArchivo(e.target.files?.[0] || null)} required />
          </FormField>

          <FormField label="Nombre del documento">
            <input type="text" value={nombreArchivo} onChange={(e) => setNombreArchivo(e.target.value)} />
          </FormField>

          <FormField label="Observaciones">
            <textarea value={observacionesArchivo} onChange={(e) => setObservacionesArchivo(e.target.value)} rows={4} />
          </FormField>

          {errorSubida && <p className="loginError">{errorSubida}</p>}

          <div className="pageActions">
            <button type="submit" className="loginButton" disabled={subiendo}>
              {subiendo ? "Subiendo..." : "Subir versión"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
