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
import { isClientRole } from "../../../lib/roles";

type Cliente = {
  id: number;
  name: string;
  organization: number;
  rfc: string;
  industry: string;
  is_active: boolean;
};

type Organizacion = {
  id: number;
  name: string;
};

const FORM_VACIO = { name: "", rfc: "", industry: "", organization: "" };

export default function ClientesPage() {
  const { user } = usePanelUser();
  const { showSuccess, showError } = useToast();
  const esCliente = isClientRole(user);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  async function cargar() {
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
  }, []);

  useEffect(() => {
    if (user?.organization_id && !user.is_superuser) {
      setForm((prev) => ({ ...prev, organization: String(user.organization_id) }));
    }
  }, [user]);

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

  function abrirModal() {
    setErrorForm("");
    setForm({
      ...FORM_VACIO,
      organization: user?.organization_id && !user.is_superuser ? String(user.organization_id) : "",
    });
    setModalAbierto(true);
  }

  async function handleCrearCliente(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    if (!form.name.trim()) {
      setErrorForm("Escribe el nombre del cliente.");
      return;
    }

    if (!form.organization) {
      setErrorForm("Selecciona una organización.");
      return;
    }

    try {
      setGuardando(true);

      const res = await apiJson("/api/clientes/", "POST", {
        name: form.name.trim(),
        rfc: form.rfc.trim(),
        industry: form.industry.trim(),
        organization: Number(form.organization),
        is_active: true,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(typeof data === "object" ? JSON.stringify(data) : "No fue posible crear el cliente.");
        return;
      }

      showSuccess("Cliente creado correctamente.");
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
    { key: "org", header: "Organización", render: (c) => nombreOrganizacion(c.organization) },
    {
      key: "estatus",
      header: "Estatus",
      render: (c) => <StatusBadge label={c.is_active ? "Activo" : "Inactivo"} tone={c.is_active ? "green" : "gray"} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Directorio de clientes de tu organización."
        actions={
          !esCliente && (
            <button type="button" className="cc-btn cc-btn--solid" onClick={abrirModal}>
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

      <Modal open={modalAbierto} title="Nuevo cliente" onClose={() => setModalAbierto(false)}>
        <form onSubmit={handleCrearCliente} className="uploadForm">
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

          {(user?.is_superuser || organizaciones.length > 1) && (
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

          {errorForm && <p className="loginError">{errorForm}</p>}

          <div className="pageActions">
            <button type="submit" className="loginButton" disabled={guardando}>
              {guardando ? "Guardando..." : "Crear cliente"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
