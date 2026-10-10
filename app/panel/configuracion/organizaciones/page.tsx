"use client";

import {formErrorMessage} from '@/lib/formErrors';
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "../../../../components/panel/PageHeader";
import LoadingState from "../../../../components/panel/LoadingState";
import ErrorState from "../../../../components/panel/ErrorState";
import EmptyState from "../../../../components/panel/EmptyState";
import SearchAndFilters from "../../../../components/panel/SearchAndFilters";
import DataTable, { DataTableColumn } from "../../../../components/panel/DataTable";
import StatusBadge from "../../../../components/panel/StatusBadge";
import Modal from "../../../../components/panel/Modal";
import FormField from "../../../../components/panel/FormField";
import { useToast } from "../../../../components/panel/Toast";
import { apiFetch, apiJson } from "../../../../lib/api";
import { usePanelUser } from "../../../../lib/PanelUserContext";
import { canManageUsers } from "../../../../lib/roles";

type Organizacion = {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
};

export default function OrganizacionesPage() {
  const { user } = usePanelUser();
  const { showSuccess, showError } = useToast();
  const puedeAdministrar = canManageUsers(user);

  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Organizacion | null>(null);
  const [nombre, setNombre] = useState("");
  const [activa, setActiva] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  async function cargar() {
    if (!puedeAdministrar) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/organizaciones/");
      if (!res.ok) {
        setError("No fue posible cargar las organizaciones.");
        return;
      }
      setOrganizaciones(await res.json());
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeAdministrar]);

  const organizacionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return organizaciones;
    return organizaciones.filter((o) => o.name.toLowerCase().includes(q));
  }, [organizaciones, busqueda]);

  function abrirModalNueva() {
    setEditando(null);
    setErrorForm("");
    setNombre("");
    setActiva(true);
    setModalAbierto(true);
  }

  function abrirModalEditar(org: Organizacion) {
    setEditando(org);
    setErrorForm("");
    setNombre(org.name);
    setActiva(org.is_active);
    setModalAbierto(true);
  }

  async function handleGuardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    if (!nombre.trim()) {
      setErrorForm("Escribe el nombre de la organización.");
      return;
    }

    try {
      setGuardando(true);

      const res = editando
        ? await apiJson(`/api/organizaciones/${editando.id}/`, "PATCH", { name: nombre.trim(), is_active: activa })
        : await apiJson("/api/organizaciones/", "POST", { name: nombre.trim(), is_active: activa });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(formErrorMessage(data, "No fue posible guardar la organización."));
        return;
      }

      showSuccess(editando ? "Organización actualizada." : "Organización creada.");
      setModalAbierto(false);
      await cargar();
    } catch {
      setErrorForm("Ocurrió un error al guardar la organización.");
      showError("Ocurrió un error al guardar la organización.");
    } finally {
      setGuardando(false);
    }
  }

  const columnas: DataTableColumn<Organizacion>[] = [
    { key: "nombre", header: "Nombre", render: (o) => o.name },
    {
      key: "estatus",
      header: "Estatus",
      render: (o) => <StatusBadge label={o.is_active ? "Activa" : "Inactiva"} tone={o.is_active ? "green" : "gray"} />,
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "right",
      render: (o) => (
        <div className="pageActions" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="cc-btn cc-btn--outline" onClick={() => abrirModalEditar(o)}>
            Editar
          </button>
        </div>
      ),
    },
  ];

  if (!puedeAdministrar) {
    return (
      <>
        <PageHeader title="Organizaciones" />
        <EmptyState
          title="No tienes permiso para ver esta sección"
          description="Solo un socio, manager o superusuario puede administrar organizaciones."
          action={
            <Link href="/panel/configuracion" className="cc-btn cc-btn--outline">
              Volver a Configuración
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Organizaciones"
        description={
          user?.is_superuser
            ? "Administra todas las organizaciones (firmas) del sistema."
            : "Datos de tu organización."
        }
        actions={
          user?.is_superuser && (
            <button type="button" className="cc-btn cc-btn--solid" onClick={abrirModalNueva}>
              + Nueva organización
            </button>
          )
        }
      />

      {user?.is_superuser && (
        <SearchAndFilters search={busqueda} onSearchChange={setBusqueda} searchPlaceholder="Buscar organización..." />
      )}

      {loading && <LoadingState label="Cargando organizaciones..." />}
      {!loading && error && <ErrorState message={error} onRetry={cargar} />}

      {!loading && !error && organizacionesFiltradas.length === 0 && (
        <EmptyState title="No hay organizaciones que mostrar" />
      )}

      {!loading && !error && organizacionesFiltradas.length > 0 && (
        <DataTable columns={columnas} rows={organizacionesFiltradas} getRowKey={(o) => o.id} />
      )}

      <Modal
        open={modalAbierto}
        title={editando ? `Editar: ${editando.name}` : "Nueva organización"}
        onClose={() => setModalAbierto(false)}
      >
        <form onSubmit={handleGuardar} className="uploadForm">
          <FormField label="Nombre" required>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </FormField>

          <FormField label="Estatus">
            <select value={activa ? "activa" : "inactiva"} onChange={(e) => setActiva(e.target.value === "activa")}>
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </FormField>

          {errorForm && <p className="loginError">{errorForm}</p>}

          <div className="pageActions">
            <button type="submit" className="loginButton" disabled={guardando}>
              {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear organización"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
