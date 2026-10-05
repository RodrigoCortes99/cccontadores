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
import Modal from "../../../components/panel/Modal";
import FormField, { FormGrid } from "../../../components/panel/FormField";
import { useToast } from "../../../components/panel/Toast";
import { apiFetch, apiJson } from "../../../lib/api";
import { usePanelUser } from "../../../lib/PanelUserContext";
import { isClientRole, isPrivileged } from "../../../lib/roles";

type Encargo = {
  id: number;
  organizacion: string;
  cliente: string;
  tipo: string;
  tipo_display: string;
  estatus: string;
  estatus_display: string;
  periodo_inicio: string;
  periodo_fin: string;
  nombre: string;
  notas: string;
  creado_en: string;
};

type Cliente = { id: number; name: string; organization: number };
type Organizacion = { id: number; name: string };

const TIPOS = [
  { value: "seguro_social", label: "Auditoría para efectos del Seguro Social" },
  { value: "impuestos_estatales", label: "Auditoría de Impuestos Estatales" },
  { value: "gubernamental", label: "Auditoría Gubernamental" },
  { value: "contabilidad_financiera", label: "Contabilidad Financiera" },
  { value: "precios_transferencia", label: "Precios de Transferencia" },
  { value: "asesoria", label: "Asesoría" },
  { value: "compliance", label: "Compliance" },
];

const ESTATUS = [
  { value: "planeacion", label: "Planeación" },
  { value: "ejecucion", label: "Ejecución" },
  { value: "cierre", label: "Cierre" },
  { value: "emitido", label: "Emitido" },
];

const FORM_VACIO = {
  nombre: "",
  organizacion: "",
  cliente: "",
  tipo: "asesoria",
  estatus: "planeacion",
  periodoInicio: "",
  periodoFin: "",
  notas: "",
};

export default function EncargosPage() {
  const { user } = usePanelUser();
  const { showSuccess, showError } = useToast();
  const isClientUser = isClientRole(user);
  // Crear encargos es exclusivo de manager/partner/superusuario (ver
  // matriz de roles); staff/senior trabajan con encargos ya creados.
  const puedeCrearEncargo = isPrivileged(user);

  const [encargos, setEncargos] = useState<Encargo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const clientesFiltradosForm = useMemo(() => {
    if (!form.organizacion) return [];
    return clientes.filter((c) => c.organization === Number(form.organizacion));
  }, [clientes, form.organizacion]);

  async function fetchEncargos() {
    try {
      const res = await apiFetch("/api/encargos/");
      if (!res.ok) {
        setError("No fue posible cargar los encargos.");
        return;
      }
      setEncargos(await res.json());
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function cargarTodo() {
    setLoading(true);
    setError("");
    await Promise.all([
      fetchEncargos(),
      apiFetch("/api/clientes/").then((r) => (r.ok ? r.json() : [])).then(setClientes),
      apiFetch("/api/organizaciones/").then((r) => (r.ok ? r.json() : [])).then(setOrganizaciones),
    ]);
  }

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirModal() {
    setErrorForm("");
    setForm({
      ...FORM_VACIO,
      organizacion: user?.organization_id ? String(user.organization_id) : "",
    });
    setModalAbierto(true);
  }

  async function handleCreateEncargo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    if (!form.organizacion) {
      setErrorForm("Selecciona una organización.");
      return;
    }
    if (!form.cliente) {
      setErrorForm("Selecciona un cliente.");
      return;
    }

    try {
      setGuardando(true);

      const res = await apiJson("/api/encargos/", "POST", {
        organizacion: Number(form.organizacion),
        cliente: Number(form.cliente),
        tipo: form.tipo,
        estatus: form.estatus,
        periodo_inicio: form.periodoInicio,
        periodo_fin: form.periodoFin,
        nombre: form.nombre,
        notas: form.notas,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(typeof data === "object" ? JSON.stringify(data) : "No fue posible crear el encargo.");
        return;
      }

      showSuccess("Encargo creado correctamente.");
      setModalAbierto(false);
      await fetchEncargos();
    } catch {
      setErrorForm("Ocurrió un error al guardar el encargo.");
      showError("Ocurrió un error al guardar el encargo.");
    } finally {
      setGuardando(false);
    }
  }

  const encargosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return encargos.filter((e) => {
      if (q && !e.nombre.toLowerCase().includes(q) && !e.cliente.toLowerCase().includes(q)) return false;
      if (filtroCliente && e.cliente !== filtroCliente) return false;
      if (filtroTipo && e.tipo !== filtroTipo) return false;
      if (filtroEstatus && e.estatus !== filtroEstatus) return false;
      return true;
    });
  }, [encargos, busqueda, filtroCliente, filtroTipo, filtroEstatus]);

  const nombresClientes = useMemo(() => Array.from(new Set(encargos.map((e) => e.cliente))).sort(), [encargos]);

  const columnas: DataTableColumn<Encargo>[] = [
    { key: "nombre", header: "Nombre", render: (e) => e.nombre || e.tipo_display },
    { key: "cliente", header: "Cliente", render: (e) => e.cliente },
    { key: "tipo", header: "Tipo", render: (e) => e.tipo_display },
    {
      key: "estatus",
      header: "Estatus",
      render: (e) => <StatusBadge label={e.estatus_display} tone={toneForEstatus(e.estatus)} />,
    },
    { key: "periodo", header: "Periodo", render: (e) => `${e.periodo_inicio} — ${e.periodo_fin}` },
    {
      key: "acciones",
      header: "Acciones",
      align: "right",
      render: (e) => (
        <Link className="cc-btn cc-btn--outline" href={`/panel/encargos/${e.id}`}>
          {isClientUser ? "Ver requerimientos" : "Ver detalle"}
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={isClientUser ? "Mis encargos" : "Auditoría"}
        description={
          isClientUser
            ? "Consulta tus encargos y da seguimiento a sus solicitudes PBC."
            : "Consulta los encargos registrados y da seguimiento a sus solicitudes PBC."
        }
        actions={
          puedeCrearEncargo && (
            <button type="button" className="cc-btn cc-btn--solid" onClick={abrirModal}>
              + Nuevo encargo
            </button>
          )
        }
      />

      <SearchAndFilters
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre o cliente..."
        filters={
          <>
            <select aria-label="Filtrar por cliente" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}>
              <option value="">Todos los clientes</option>
              {nombresClientes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select aria-label="Filtrar por tipo de encargo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select aria-label="Filtrar por estado" value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)}>
              <option value="">Todos los estatus</option>
              {ESTATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      {loading && <LoadingState label="Cargando encargos..." />}
      {!loading && error && <ErrorState message={error} onRetry={cargarTodo} />}

      {!loading && !error && encargosFiltrados.length === 0 && (
        <EmptyState
          title={isClientUser ? "No tienes encargos asignados" : "No hay encargos que mostrar"}
          description={busqueda || filtroCliente || filtroTipo || filtroEstatus ? "Ajusta tus filtros." : undefined}
        />
      )}

      {!loading && !error && encargosFiltrados.length > 0 && (
        <DataTable columns={columnas} rows={encargosFiltrados} getRowKey={(e) => e.id} />
      )}

      <Modal open={modalAbierto} title="Nuevo encargo" onClose={() => setModalAbierto(false)} maxWidth={720}>
        <form onSubmit={handleCreateEncargo} className="uploadForm">
          <FormField label="Nombre del encargo" required>
            <input
              type="text"
              placeholder="Ej. Auditoría Gubernamental 2026"
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              required
            />
          </FormField>

          <FormGrid>
            <FormField label="Organización" required>
              <select
                value={form.organizacion}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, organizacion: e.target.value, cliente: "" }))
                }
                required
              >
                <option value="">Selecciona una organización</option>
                {organizaciones.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Cliente" required>
              <select
                value={form.cliente}
                onChange={(e) => setForm((prev) => ({ ...prev, cliente: e.target.value }))}
                required
                disabled={!form.organizacion}
              >
                <option value="">
                  {form.organizacion ? "Selecciona un cliente" : "Primero selecciona una organización"}
                </option>
                {clientesFiltradosForm.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
          </FormGrid>

          <FormGrid>
            <FormField label="Tipo">
              <select value={form.tipo} onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Estatus">
              <select
                value={form.estatus}
                onChange={(e) => setForm((prev) => ({ ...prev, estatus: e.target.value }))}
              >
                {ESTATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </FormField>
          </FormGrid>

          <FormGrid>
            <FormField label="Periodo inicio" required>
              <input
                type="date"
                value={form.periodoInicio}
                onChange={(e) => setForm((prev) => ({ ...prev, periodoInicio: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="Periodo fin" required>
              <input
                type="date"
                value={form.periodoFin}
                onChange={(e) => setForm((prev) => ({ ...prev, periodoFin: e.target.value }))}
                required
              />
            </FormField>
          </FormGrid>

          <FormField label="Notas">
            <textarea
              rows={3}
              className="uploadTextarea"
              placeholder="Observaciones del encargo"
              value={form.notas}
              onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
            />
          </FormField>

          {errorForm && <p className="loginError">{errorForm}</p>}

          <div className="pageActions">
            <button type="submit" className="loginButton" disabled={guardando}>
              {guardando ? "Guardando..." : "Crear encargo"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
