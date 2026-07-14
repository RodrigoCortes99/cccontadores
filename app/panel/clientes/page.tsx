"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/panel/PageHeader";
import LoadingState from "../../../components/panel/LoadingState";
import ErrorState from "../../../components/panel/ErrorState";
import EmptyState from "../../../components/panel/EmptyState";
import SearchAndFilters from "../../../components/panel/SearchAndFilters";
import DataTable, { DataTableColumn } from "../../../components/panel/DataTable";
import StatusBadge from "../../../components/panel/StatusBadge";
import Modal from "../../../components/panel/Modal";
import FormField, { FormGrid } from "../../../components/panel/FormField";
import { useToast } from "../../../components/panel/Toast";
import { apiFetch, apiJson } from "../../../lib/api";
import { usePanelUser } from "../../../lib/PanelUserContext";
import { isClientRole, isPrivileged } from "../../../lib/roles";

type Cliente = {
  id: number;
  name: string;
  organization: number;
  organization_nombre?: string;
  rfc: string;
  industry: string;
  is_active: boolean;
  usuario_username?: string | null;
};

type Organizacion = {
  id: number;
  name: string;
};

const FORM_VACIO = { name: "", rfc: "", industry: "", organization: "", is_active: true };

export default function ClientesPage() {
  const { user } = usePanelUser();
  const { showSuccess, showError } = useToast();
  const esCliente = isClientRole(user);
  // Staff y senior ven el directorio (lo necesitan para elegir cliente al
  // crear encargos/registros), pero solo manager/partner/superusuario pueden
  // crear o editar clientes — misma regla que usuarios y organizaciones.
  const puedeEditarClientes = isPrivileged(user);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  async function cargar() {
    // Un usuario cliente no necesita el listado global de organizaciones:
    // ni lo ve en el formulario (no puede crear/editar clientes) ni el
    // backend le devolvería nada útil para ese propósito.
    if (esCliente) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [resClientes, resOrgs] = await Promise.all([
        apiFetch("/api/clientes/"),
        apiFetch("/api/organizaciones/"),
      ]);

      if (!resClientes.ok) {
        setError("No fue posible cargar los clientes.");
        return;
      }

      setClientes(await resClientes.json());
      setOrganizaciones(resOrgs.ok ? await resOrgs.json() : []);
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esCliente]);

  const nombreOrganizacion = useMemo(() => {
    const mapa = new Map(organizaciones.map((o) => [o.id, o.name]));
    return (id: number) => mapa.get(id) || "—";
  }, [organizaciones]);

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.rfc || "").toLowerCase().includes(q)
    );
  }, [clientes, busqueda]);

  function abrirModalNuevo() {
    setEditando(null);
    setErrorForm("");
    setForm({
      ...FORM_VACIO,
      organization: user?.organization_id && !user.is_superuser ? String(user.organization_id) : "",
    });
    setModalAbierto(true);
  }

  function abrirModalEditar(c: Cliente) {
    setEditando(c);
    setErrorForm("");
    setForm({
      name: c.name,
      rfc: c.rfc || "",
      industry: c.industry || "",
      organization: String(c.organization),
      is_active: c.is_active,
    });
    setModalAbierto(true);
  }

  async function handleGuardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    if (!form.name.trim()) {
      setErrorForm("Escribe el nombre del cliente.");
      return;
    }

    if (!editando && !form.organization) {
      setErrorForm("Selecciona una organización.");
      return;
    }

    try {
      setGuardando(true);

      const res = editando
        ? await apiJson(`/api/clientes/${editando.id}/`, "PATCH", {
            name: form.name.trim(),
            rfc: form.rfc.trim(),
            industry: form.industry.trim(),
            is_active: form.is_active,
          })
        : await apiJson("/api/clientes/", "POST", {
            name: form.name.trim(),
            rfc: form.rfc.trim(),
            industry: form.industry.trim(),
            organization: Number(form.organization),
            is_active: true,
          });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(typeof data === "object" ? JSON.stringify(data) : "No fue posible guardar el cliente.");
        return;
      }

      showSuccess(editando ? "Cliente actualizado correctamente." : "Cliente creado correctamente.");
      setModalAbierto(false);
      await cargar();
    } catch {
      setErrorForm("Ocurrió un error al guardar el cliente.");
      showError("Ocurrió un error al guardar el cliente.");
    } finally {
      setGuardando(false);
    }
  }

  const columnas: DataTableColumn<Cliente>[] = [
    { key: "name", header: "Nombre", render: (c) => c.name },
    { key: "rfc", header: "RFC", render: (c) => c.rfc || "—" },
    { key: "industry", header: "Industria", render: (c) => c.industry || "—" },
    { key: "org", header: "Organización", render: (c) => c.organization_nombre || nombreOrganizacion(c.organization) },
    { key: "usuario", header: "Usuario asociado", render: (c) => c.usuario_username || "—" },
    {
      key: "estatus",
      header: "Estatus",
      render: (c) => <StatusBadge label={c.is_active ? "Activo" : "Inactivo"} tone={c.is_active ? "green" : "gray"} />,
    },
    // Staff/senior solo ven el directorio: sin columna de acciones, porque
    // no pueden editar clientes (solo manager/partner/superusuario).
    ...(puedeEditarClientes
      ? [
          {
            key: "acciones",
            header: "Acciones",
            align: "right" as const,
            render: (c: Cliente) => (
              <div className="pageActions" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="cc-btn cc-btn--outline" onClick={() => abrirModalEditar(c)}>
                  Editar
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (esCliente) {
    return (
      <>
        <PageHeader title="Clientes" description="Esta sección no aplica para tu tipo de cuenta." />
        <EmptyState title="No disponible" description="Los usuarios cliente no administran el directorio de clientes." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description={
          puedeEditarClientes
            ? "Directorio de clientes de tu organización."
            : "Directorio de clientes de tu organización (solo lectura)."
        }
        actions={
          puedeEditarClientes && (
            <button type="button" className="cc-btn cc-btn--solid" onClick={abrirModalNuevo}>
              + Nuevo cliente
            </button>
          )
        }
      />

      <SearchAndFilters
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre o RFC..."
      />

      {loading && <LoadingState label="Cargando clientes..." />}
      {!loading && error && <ErrorState message={error} onRetry={cargar} />}

      {!loading && !error && clientesFiltrados.length === 0 && (
        <EmptyState
          title="No hay clientes que mostrar"
          description={busqueda ? "Ajusta tu búsqueda." : "Todavía no hay clientes registrados."}
        />
      )}

      {!loading && !error && clientesFiltrados.length > 0 && (
        <DataTable columns={columnas} rows={clientesFiltrados} getRowKey={(c) => c.id} />
      )}

      <Modal open={modalAbierto} title={editando ? `Editar: ${editando.name}` : "Nuevo cliente"} onClose={() => setModalAbierto(false)}>
        <form onSubmit={handleGuardar} className="uploadForm">
          <FormField label="Nombre" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </FormField>

          <FormGrid>
            <FormField label="RFC">
              <input
                type="text"
                value={form.rfc}
                onChange={(e) => setForm((prev) => ({ ...prev, rfc: e.target.value }))}
              />
            </FormField>

            <FormField label="Industria">
              <input
                type="text"
                value={form.industry}
                onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
              />
            </FormField>
          </FormGrid>

          {!editando && (user?.is_superuser || organizaciones.length > 1) && (
            <FormField label="Organización" required>
              <select
                value={form.organization}
                onChange={(e) => setForm((prev) => ({ ...prev, organization: e.target.value }))}
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
          )}

          {editando && (
            <FormField label="Estatus">
              <select
                value={form.is_active ? "activo" : "inactivo"}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === "activo" }))}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </FormField>
          )}

          {errorForm && <p className="loginError">{errorForm}</p>}

          <div className="pageActions">
            <button type="submit" className="loginButton" disabled={guardando}>
              {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
