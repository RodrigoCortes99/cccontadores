"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "../../../../components/panel/PageHeader";
import LoadingState from "../../../../components/panel/LoadingState";
import EmptyState from "../../../../components/panel/EmptyState";
import Modal from "../../../../components/panel/Modal";
import ConfirmDialog from "../../../../components/panel/ConfirmDialog";
import SearchAndFilters from "../../../../components/panel/SearchAndFilters";
import { useToast } from "../../../../components/panel/Toast";
import TimeTrackingNav from "../../../../components/TimeTrackingNav";
import RegistroTiempoCampos, {
  Catalogo,
  ClienteOption,
  RegistroFormState,
  registroFormVacio,
  construirPayloadRegistro,
} from "../../../../components/panel/RegistroTiempoCampos";
import { apiFetch, apiJson } from "../../../../lib/api";
import { usePanelUser } from "../../../../lib/PanelUserContext";
import { isPrivileged } from "../../../../lib/roles";

type Registro = {
  id: number;
  employee: number;
  employee_nombre: string;
  client: number;
  cliente_nombre: string;
  activity_type: number | null;
  activity_type_nombre: string | null;
  area: number | null;
  area_nombre: string | null;
  servicio: number | null;
  servicio_nombre: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  manual_hours: string | null;
  horas_calculadas: number;
  description: string;
  observaciones: string;
  tipo_tiempo: string;
  tipo_tiempo_display: string;
  prioridad: string;
  prioridad_display: string;
  modality: string;
  modality_display: string;
  status: string;
  status_display: string;
  facturacion: string;
  facturacion_display: string;
  tarifa_hora?: number;
  estimated_internal_cost?: number;
};

export default function MisRegistrosPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando registros..." />}>
      <MisRegistrosContent />
    </Suspense>
  );
}

function MisRegistrosContent() {
  const searchParams = useSearchParams();
  const { user } = usePanelUser();
  const { showSuccess, showError } = useToast();
  const esPrivilegiado = isPrivileged(user);

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [tiposActividad, setTiposActividad] = useState<Catalogo[]>([]);
  const [areas, setAreas] = useState<Catalogo[]>([]);
  const [servicios, setServicios] = useState<Catalogo[]>([]);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<RegistroFormState>(registroFormVacio());
  const [errorForm, setErrorForm] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<RegistroFormState>(registroFormVacio());

  const [revisionEdits, setRevisionEdits] = useState<
    Record<number, { status: string; facturacion: string; observaciones: string }>
  >({});
  const [revisandoId, setRevisandoId] = useState<number | null>(null);
  const [aEliminar, setAEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");

  async function fetchCatalogos() {
    const [resTipos, resAreas, resServicios, resClientes] = await Promise.all([
      apiFetch("/api/time-tracking/catalogos/tipos-actividad/"),
      apiFetch("/api/time-tracking/catalogos/areas/"),
      apiFetch("/api/time-tracking/catalogos/servicios/"),
      apiFetch("/api/clientes/"),
    ]);
    if (resTipos.ok) setTiposActividad(await resTipos.json());
    if (resAreas.ok) setAreas(await resAreas.json());
    if (resServicios.ok) setServicios(await resServicios.json());
    if (resClientes.ok) setClientes(await resClientes.json());
  }

  async function fetchRegistros() {
    const params = new URLSearchParams();
    if (filtroDesde) params.set("desde", filtroDesde);
    if (filtroHasta) params.set("hasta", filtroHasta);
    if (filtroCliente) params.set("cliente", filtroCliente);

    const res = await apiFetch(`/api/time-tracking/registros/?${params.toString()}`);
    if (!res.ok) return;

    const data: Registro[] = await res.json();
    setRegistros(data);

    const revisiones: Record<number, { status: string; facturacion: string; observaciones: string }> = {};
    data.forEach((r) => {
      revisiones[r.id] = { status: r.status, facturacion: r.facturacion, observaciones: r.observaciones || "" };
    });
    setRevisionEdits(revisiones);
  }

  async function cargarTodo() {
    setLoading(true);
    try {
      await Promise.all([fetchCatalogos(), fetchRegistros()]);
    } catch {
      showError("No fue posible cargar la información de control de horas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setErrorForm("");
      setForm(registroFormVacio());
      setModalAbierto(true);
    }
  }, [searchParams]);

  const clientesOrdenados = useMemo(
    () => [...clientes].sort((a, b) => a.name.localeCompare(b.name)),
    [clientes]
  );

  function abrirModalNuevo() {
    setErrorForm("");
    setForm(registroFormVacio());
    setModalAbierto(true);
  }

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    try {
      setGuardando(true);
      const res = await apiJson("/api/time-tracking/registros/", "POST", construirPayloadRegistro(form));
      const data = await res.json();

      if (!res.ok) {
        setErrorForm(typeof data === "object" ? JSON.stringify(data) : "No fue posible guardar el registro.");
        return;
      }

      showSuccess("Registro guardado correctamente.");
      setModalAbierto(false);
      await fetchRegistros();
    } catch {
      setErrorForm("Ocurrió un error al guardar el registro.");
    } finally {
      setGuardando(false);
    }
  }

  function iniciarEdicion(registro: Registro) {
    setEditandoId(registro.id);
    setEditForm({
      client: String(registro.client),
      activity_type: registro.activity_type ? String(registro.activity_type) : "",
      area: registro.area ? String(registro.area) : "",
      servicio: registro.servicio ? String(registro.servicio) : "",
      date: registro.date,
      start_time: registro.start_time || "",
      end_time: registro.end_time || "",
      manual_hours: registro.manual_hours || "",
      description: registro.description,
      observaciones: registro.observaciones || "",
      tipo_tiempo: registro.tipo_tiempo,
      prioridad: registro.prioridad,
      modality: registro.modality,
    });
  }

  async function guardarEdicion(id: number) {
    try {
      const res = await apiJson(`/api/time-tracking/registros/${id}/`, "PATCH", construirPayloadRegistro(editForm));
      const data = await res.json();

      if (!res.ok) {
        showError(typeof data === "object" ? JSON.stringify(data) : "No fue posible actualizar el registro.");
        return;
      }

      showSuccess("Registro actualizado correctamente.");
      setEditandoId(null);
      await fetchRegistros();
    } catch {
      showError("Ocurrió un error al actualizar el registro.");
    }
  }

  async function confirmarEliminar() {
    if (aEliminar === null) return;

    try {
      setEliminando(true);
      const res = await apiFetch(`/api/time-tracking/registros/${aEliminar}/`, { method: "DELETE" });

      if (!res.ok && res.status !== 204) {
        showError("No fue posible eliminar el registro.");
        return;
      }

      showSuccess("Registro eliminado.");
      setAEliminar(null);
      await fetchRegistros();
    } catch {
      showError("Ocurrió un error al eliminar el registro.");
    } finally {
      setEliminando(false);
    }
  }

  async function guardarRevision(id: number) {
    setRevisandoId(id);
    const edit = revisionEdits[id];

    try {
      const res = await apiJson(`/api/time-tracking/registros/${id}/`, "PATCH", edit);
      const data = await res.json();

      if (!res.ok) {
        showError(typeof data === "object" ? JSON.stringify(data) : "No fue posible guardar la revisión.");
        return;
      }

      showSuccess("Revisión guardada.");
      await fetchRegistros();
    } catch {
      showError("Ocurrió un error al guardar la revisión.");
    } finally {
      setRevisandoId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Mis registros"
        description="Historial de horas capturadas. Edita o elimina mientras estén en estatus Capturado."
        actions={
          <button type="button" className="cc-btn cc-btn--solid" onClick={abrirModalNuevo}>
            + Nuevo registro
          </button>
        }
      />

      <TimeTrackingNav activo="registros" esPrivilegiado={esPrivilegiado} />

      <SearchAndFilters
        search=""
        onSearchChange={() => {}}
        searchPlaceholder=""
        filters={
          <>
            <label>Desde<input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} /></label>
            <label>Hasta<input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} /></label>
            <select aria-label="Cliente" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}>
              <option value="">Todos los clientes</option>
              {clientesOrdenados.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </>
        }
        actions={
          <button type="button" className="cc-btn cc-btn--outline" onClick={fetchRegistros}>
            Aplicar filtros
          </button>
        }
      />

      {loading && <LoadingState label="Cargando registros..." />}

      {!loading && registros.length === 0 && (
        <EmptyState title="No hay registros de horas todavía" description="Usa '+ Nuevo registro' para capturar tu primer registro." />
      )}

      {!loading && registros.length > 0 && (
        <div className="dataTableWrap"><table className="dataTable"><thead><tr><th>Fecha</th><th>Cliente / persona</th><th>Actividad</th><th style={{textAlign:"right"}}>Horas</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
          {registros.map((registro) => {
            const esDueno = registro.employee === user?.id;
            const enEdicion = editandoId === registro.id;

            return (
              <tr key={registro.id}><td>{registro.date}</td><td><strong>{registro.cliente_nombre}</strong><small>{registro.employee_nombre}</small></td><td>{registro.activity_type_nombre || "Sin actividad declarada"}</td><td data-align="right" style={{textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{registro.horas_calculadas}</td><td><span className="badge">{registro.status_display}</span><small>{registro.facturacion_display}</small></td><td><details open={enEdicion || undefined}><summary>Consultar / revisar</summary>
                <p>
                  <strong>Contador:</strong> {registro.employee_nombre}
                </p>
                <p>
                  <strong>Fecha:</strong> {registro.date}
                </p>
                <p>
                  <strong>Horas:</strong> {registro.horas_calculadas}
                </p>
                {registro.activity_type_nombre && (
                  <p>
                    <strong>Actividad:</strong> {registro.activity_type_nombre}
                  </p>
                )}
                {registro.area_nombre && (
                  <p>
                    <strong>Área:</strong> {registro.area_nombre}
                  </p>
                )}
                {registro.servicio_nombre && (
                  <p>
                    <strong>Servicio:</strong> {registro.servicio_nombre}
                  </p>
                )}
                <p>
                  <strong>Descripción:</strong> {registro.description}
                </p>
                <p>
                  <strong>Tipo de tiempo:</strong> {registro.tipo_tiempo_display} · <strong>Prioridad:</strong>{" "}
                  {registro.prioridad_display} · <strong>Modalidad:</strong> {registro.modality_display}
                </p>
                <p>
                  <strong>Estatus:</strong> {registro.status_display} · <strong>Facturación:</strong>{" "}
                  {registro.facturacion_display}
                </p>

                {esPrivilegiado && registro.estimated_internal_cost !== undefined && (
                  <p>
                    <strong>Tarifa hora:</strong> ${registro.tarifa_hora} · <strong>Importe estimado:</strong> $
                    {registro.estimated_internal_cost}
                  </p>
                )}

                {esDueno && registro.status === "capturado" && !enEdicion && (
                  <div className="pageActions">
                    <button type="button" className="cc-btn cc-btn--outline" onClick={() => iniciarEdicion(registro)}>
                      Editar
                    </button>
                    <button type="button" className="cc-btn cc-btn--outline" onClick={() => setAEliminar(registro.id)}>
                      Eliminar
                    </button>
                  </div>
                )}

                {esDueno && enEdicion && (
                  <div style={{ marginTop: 14 }}>
                    <RegistroTiempoCampos
                      valores={editForm}
                      onChange={(campo, valor) => setEditForm((prev) => ({ ...prev, [campo]: valor }))}
                      clientes={clientesOrdenados}
                      tiposActividad={tiposActividad}
                      areas={areas}
                      servicios={servicios}
                    />
                    <div className="pageActions">
                      <button type="button" className="cc-btn cc-btn--solid" onClick={() => guardarEdicion(registro.id)}>
                        Guardar cambios
                      </button>
                      <button type="button" className="cc-btn cc-btn--outline" onClick={() => setEditandoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {esPrivilegiado && !esDueno && (
                  <div style={{ marginTop: 14 }}>
                    <div className="loginField">
                      <label htmlFor={`review-status-${registro.id}`}>Estatus</label>
                      <select id={`review-status-${registro.id}`}
                        value={revisionEdits[registro.id]?.status || registro.status}
                        onChange={(e) =>
                          setRevisionEdits((prev) => ({
                            ...prev,
                            [registro.id]: { ...prev[registro.id], status: e.target.value },
                          }))
                        }
                      >
                        <option value="capturado">Capturado</option>
                        <option value="en_revision">En revisión</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </div>

                    <div className="loginField">
                      <label htmlFor={`review-billing-${registro.id}`}>Facturación</label>
                      <select id={`review-billing-${registro.id}`}
                        value={revisionEdits[registro.id]?.facturacion || registro.facturacion}
                        onChange={(e) =>
                          setRevisionEdits((prev) => ({
                            ...prev,
                            [registro.id]: { ...prev[registro.id], facturacion: e.target.value },
                          }))
                        }
                      >
                        <option value="pendiente_facturar">Pendiente de facturar</option>
                        <option value="facturado">Facturado</option>
                        <option value="no_aplica">No aplica</option>
                      </select>
                    </div>

                    <div className="loginField">
                      <label htmlFor={`review-notes-${registro.id}`}>Observaciones</label>
                      <textarea id={`review-notes-${registro.id}`}
                        rows={2}
                        value={revisionEdits[registro.id]?.observaciones ?? registro.observaciones}
                        onChange={(e) =>
                          setRevisionEdits((prev) => ({
                            ...prev,
                            [registro.id]: { ...prev[registro.id], observaciones: e.target.value },
                          }))
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="loginButton"
                      onClick={() => guardarRevision(registro.id)}
                      disabled={revisandoId === registro.id}
                    >
                      {revisandoId === registro.id ? "Guardando..." : "Guardar revisión"}
                    </button>
                  </div>
                )}
              </details></td></tr>
            );
          })}
        </tbody></table></div>
      )}

      <Modal open={modalAbierto} title="Nuevo registro" onClose={() => setModalAbierto(false)} maxWidth={720}>
        <form onSubmit={handleCrear} className="uploadForm">
          <RegistroTiempoCampos
            valores={form}
            onChange={(campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }))}
            clientes={clientesOrdenados}
            tiposActividad={tiposActividad}
            areas={areas}
            servicios={servicios}
          />

          {errorForm && <p role="alert" className="loginError">{errorForm}</p>}

          <div className="pageActions">
            <button type="submit" className="loginButton" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar registro"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={aEliminar !== null}
        title="Eliminar registro"
        message="¿Eliminar este registro de horas? Esta acción no se puede deshacer."
        destructive
        loading={eliminando}
        onConfirm={confirmarEliminar}
        onCancel={() => setAEliminar(null)}
      />
    </>
  );
}
