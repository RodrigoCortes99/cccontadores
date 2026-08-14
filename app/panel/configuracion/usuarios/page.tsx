"use client";

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
import FormField, { FormGrid } from "../../../../components/panel/FormField";
import MultiSelect from "../../../../components/panel/MultiSelect";
import { useToast } from "../../../../components/panel/Toast";
import { apiFetch, apiJson } from "../../../../lib/api";
import { usePanelUser } from "../../../../lib/PanelUserContext";
import { canManageUsers, puedeAsignarPartner } from "../../../../lib/roles";

type Organizacion = { id: number; name: string };
type Cliente = { id: number; name: string; organization: number };

type Usuario = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_display: string;
  organization: number | null;
  organization_nombre?: string;
  // Solo viene con contenido real para staff/senior (ver
  // UsuarioSerializer.get_organizaciones_asignadas en el backend).
  organizaciones_asignadas?: Organizacion[];
  client_id: number | null;
  client_nombre: string | null;
  is_active: boolean;
  is_superuser: boolean;
  date_joined: string;
};

// Roles para los que tiene sentido colaborar con (o administrar) varias
// organizaciones a la vez: staff/senior colaboran con varias firmas, y
// manager/partner pueden ser responsables de varias organizaciones (ver
// ROLES_MULTI_ORGANIZACION en el backend, api/views.py — misma lista).
const ROLES_MULTI_ORGANIZACION = ["staff", "senior", "manager", "partner"];

const ROLES = [
  { value: "staff", label: "Staff" },
  { value: "senior", label: "Senior" },
  { value: "manager", label: "Manager" },
  { value: "partner", label: "Socio" },
  { value: "client", label: "Cliente" },
];

type FormState = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: string;
  organization: string;
  // Solo la usa un superusuario asignando varias organizaciones a un
  // staff/senior (ver ROLES_MULTI_ORGANIZACION). Ids como string, igual que
  // el resto de los selects de este formulario.
  organizaciones: string[];
  cliente: string;
  is_active: boolean;
};

function formVacio(organizacionPredeterminada: string): FormState {
  return {
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "staff",
    organization: organizacionPredeterminada,
    organizaciones: organizacionPredeterminada ? [organizacionPredeterminada] : [],
    cliente: "",
    is_active: true,
  };
}

export default function UsuariosPage() {
  const { user } = usePanelUser();
  const { showSuccess, showError } = useToast();
  const puedeAdministrar = canManageUsers(user);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(formVacio(""));
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  // Un manager (no partner/superusuario) no puede volver a nadie "Socio":
  // se le oculta esa opción al crear o editar. Si el usuario que está
  // editando YA era socio, se conserva la opción visible (para no bloquear
  // la edición de otros campos), pero no se ofrece para nadie más.
  const rolesAsignables = useMemo(() => {
    if (puedeAsignarPartner(user) || editando?.role === "partner") return ROLES;
    return ROLES.filter((r) => r.value !== "partner");
  }, [user, editando]);

  const organizacionPropia = user?.organization_id ? String(user.organization_id) : "";

  async function cargar() {
    if (!puedeAdministrar) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [resUsuarios, resOrgs, resClientes] = await Promise.all([
        apiFetch("/api/usuarios/"),
        apiFetch("/api/organizaciones/"),
        apiFetch("/api/clientes/"),
      ]);

      if (!resUsuarios.ok) {
        setError("No fue posible cargar los usuarios.");
        return;
      }

      setUsuarios(await resUsuarios.json());
      setOrganizaciones(resOrgs.ok ? await resOrgs.json() : []);
      setClientes(resClientes.ok ? await resClientes.json() : []);
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

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (q) {
        const texto = `${u.username} ${u.email} ${u.full_name}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      if (filtroRol && u.role !== filtroRol) return false;
      if (filtroEstatus === "activo" && !u.is_active) return false;
      if (filtroEstatus === "inactivo" && u.is_active) return false;
      return true;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstatus]);

  const clientesDeLaOrganizacion = useMemo(() => {
    const orgId = form.organization ? Number(form.organization) : null;
    if (!orgId) return clientes;
    return clientes.filter((c) => c.organization === orgId);
  }, [clientes, form.organization]);

  // Un superusuario puede asignar varias organizaciones, pero solo tiene
  // sentido para staff/senior/manager/partner (ver ROLES_MULTI_ORGANIZACION).
  const puedeAsignarVariasOrganizaciones =
    !!user?.is_superuser && ROLES_MULTI_ORGANIZACION.includes(form.role);

  // La organización ACTIVA solo puede ser una de las "asignadas" cuando ese
  // concepto aplica (rol multi-organización + ya hay al menos una asignada).
  // En cualquier otro caso se ofrecen todas, igual que antes.
  const organizacionActivaOpciones = useMemo(() => {
    if (!puedeAsignarVariasOrganizaciones || form.organizaciones.length === 0) return organizaciones;
    return organizaciones.filter((org) => form.organizaciones.includes(String(org.id)));
  }, [organizaciones, puedeAsignarVariasOrganizaciones, form.organizaciones]);

  // Igual que el backend (ver _sincronizar_organizaciones_asignadas en
  // api/views.py): si la organización activa deja de estar entre las
  // asignadas, se reemplaza por la primera de la nueva lista (o se limpia si
  // la lista quedó vacía), para que nunca quede una activa "huérfana".
  function handleOrganizacionesChange(next: string[]) {
    setForm((prev) => {
      const activaSigueAsignada = next.includes(prev.organization);
      return {
        ...prev,
        organizaciones: next,
        organization: activaSigueAsignada ? prev.organization : next[0] || "",
      };
    });
  }

  function abrirModalNuevo() {
    setEditando(null);
    setErrorForm("");
    setForm(formVacio(organizacionPropia));
    setModalAbierto(true);
  }

  function abrirModalEditar(u: Usuario) {
    setEditando(u);
    setErrorForm("");
    setForm({
      username: u.username,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      password: "",
      role: u.role,
      organization: u.organization ? String(u.organization) : "",
      organizaciones: (u.organizaciones_asignadas || []).map((org) => String(org.id)),
      cliente: u.client_id ? String(u.client_id) : "",
      is_active: u.is_active,
    });
    setModalAbierto(true);
  }

  async function handleGuardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    if (!editando && !form.username.trim()) {
      setErrorForm("Escribe el nombre de usuario.");
      return;
    }
    if (!editando && form.password.trim().length < 8) {
      setErrorForm("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (form.role === "client" && !form.cliente) {
      setErrorForm("Selecciona el cliente asociado a este usuario.");
      return;
    }

    try {
      setGuardando(true);

      const payloadBase: Record<string, unknown> = {
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role,
        is_active: form.is_active,
        cliente: form.role === "client" ? Number(form.cliente) : null,
      };

      if (user?.is_superuser && form.organization) {
        payloadBase.organization = Number(form.organization);
      }

      if (puedeAsignarVariasOrganizaciones && form.organizaciones.length > 0) {
        payloadBase.organizaciones = form.organizaciones.map(Number);
      }

      if (form.password.trim()) {
        payloadBase.password = form.password.trim();
      }

      let res;
      if (editando) {
        res = await apiJson(`/api/usuarios/${editando.id}/`, "PATCH", payloadBase);
      } else {
        res = await apiJson("/api/usuarios/", "POST", {
          ...payloadBase,
          username: form.username.trim(),
          password: form.password.trim(),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(typeof data === "object" ? JSON.stringify(data) : "No fue posible guardar el usuario.");
        return;
      }

      showSuccess(editando ? "Usuario actualizado correctamente." : "Usuario creado correctamente.");
      setModalAbierto(false);
      await cargar();
    } catch {
      setErrorForm("Ocurrió un error al guardar el usuario.");
      showError("Ocurrió un error al guardar el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActivo(u: Usuario) {
    try {
      const res = await apiJson(`/api/usuarios/${u.id}/`, "PATCH", { is_active: !u.is_active });
      if (!res.ok) {
        showError("No fue posible cambiar el estatus del usuario.");
        return;
      }
      showSuccess(u.is_active ? "Usuario desactivado." : "Usuario activado.");
      await cargar();
    } catch {
      showError("Ocurrió un error al cambiar el estatus del usuario.");
    }
  }

  const columnas: DataTableColumn<Usuario>[] = [
    { key: "nombre", header: "Nombre", render: (u) => u.full_name || u.username },
    { key: "usuario", header: "Usuario", render: (u) => u.username },
    { key: "correo", header: "Correo", render: (u) => u.email || "—" },
    { key: "rol", header: "Rol", render: (u) => u.role_display },
    {
      key: "organizacion",
      header: "Organización",
      render: (u) => {
        const extra = (u.organizaciones_asignadas?.length || 0) - 1;
        return (
          <>
            {u.organization_nombre || "—"}
            {extra > 0 && <span className="pageText"> (+{extra} más)</span>}
          </>
        );
      },
    },
    { key: "cliente", header: "Cliente", render: (u) => u.client_nombre || "—" },
    {
      key: "estatus",
      header: "Estatus",
      render: (u) => <StatusBadge label={u.is_active ? "Activo" : "Inactivo"} tone={u.is_active ? "green" : "gray"} />,
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "right",
      render: (u) => (
        <div className="pageActions" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="cc-btn cc-btn--outline" onClick={() => abrirModalEditar(u)}>
            Editar
          </button>
          <button type="button" className="cc-btn cc-btn--outline" onClick={() => alternarActivo(u)}>
            {u.is_active ? "Desactivar" : "Activar"}
          </button>
        </div>
      ),
    },
  ];

  if (!puedeAdministrar) {
    return (
      <>
        <PageHeader title="Usuarios" description="Administración de usuarios del panel." />
        <EmptyState
          title="No tienes permiso para ver esta sección"
          description="Solo un socio, manager o superusuario puede administrar usuarios."
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
        title="Usuarios"
        description="Administra los usuarios de tu organización, sus roles y su acceso."
        actions={
          <button type="button" className="cc-btn cc-btn--solid" onClick={abrirModalNuevo}>
            + Nuevo usuario
          </button>
        }
      />

      <SearchAndFilters
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre, correo o usuario..."
        filters={
          <>
            <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
              <option value="">Todos los roles</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)}>
              <option value="">Todos los estatus</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </>
        }
      />

      {loading && <LoadingState label="Cargando usuarios..." />}
      {!loading && error && <ErrorState message={error} onRetry={cargar} />}

      {!loading && !error && usuariosFiltrados.length === 0 && (
        <EmptyState
          title="No hay usuarios que mostrar"
          description={busqueda || filtroRol || filtroEstatus ? "Ajusta tus filtros." : "Todavía no hay usuarios registrados."}
        />
      )}

      {!loading && !error && usuariosFiltrados.length > 0 && (
        <DataTable columns={columnas} rows={usuariosFiltrados} getRowKey={(u) => u.id} />
      )}

      <Modal
        open={modalAbierto}
        title={editando ? `Editar: ${editando.username}` : "Nuevo usuario"}
        onClose={() => setModalAbierto(false)}
        maxWidth={720}
      >
        <form onSubmit={handleGuardar} className="uploadForm">
          {!editando && (
            <FormField label="Nombre de usuario" required>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
            </FormField>
          )}

          <FormGrid>
            <FormField label="Nombre">
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
              />
            </FormField>
            <FormField label="Apellido">
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
              />
            </FormField>
          </FormGrid>

          <FormField label="Correo">
            <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          </FormField>

          <FormField
            label={editando ? "Nueva contraseña" : "Contraseña"}
            hint={editando ? "Déjalo en blanco para no cambiarla." : "Mínimo 8 caracteres."}
            required={!editando}
          >
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required={!editando}
            />
          </FormField>

          <FormGrid>
            <FormField label="Rol" required>
              <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} required>
                {rolesAsignables.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </FormField>

            {user?.is_superuser && (
              <FormField
                label="Organización activa"
                required
                hint={
                  puedeAsignarVariasOrganizaciones && form.organizaciones.length > 0
                    ? "Solo puede ser una de las organizaciones asignadas de abajo."
                    : undefined
                }
              >
                <select
                  value={form.organization}
                  onChange={(e) => setForm((prev) => ({ ...prev, organization: e.target.value, cliente: "" }))}
                  required
                >
                  <option value="">Selecciona una organización</option>
                  {organizacionActivaOpciones.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </FormGrid>

          {puedeAsignarVariasOrganizaciones && (
            <FormField
              label="Organizaciones asignadas"
              hint="Este empleado podrá cambiar su organización activa entre las que elijas aquí."
            >
              <MultiSelect
                options={organizaciones}
                value={form.organizaciones}
                onChange={handleOrganizacionesChange}
                placeholder="Selecciona una o varias organizaciones"
                searchPlaceholder="Buscar organización..."
                emptyMessage="No hay organizaciones que coincidan."
                ariaLabel="Organizaciones asignadas"
                singularLabel="organización"
                pluralLabel="organizaciones"
              />
            </FormField>
          )}

          {form.role === "client" && (
            <FormField label="Cliente asociado" required hint="El usuario podrá ver únicamente los encargos de este cliente.">
              <select value={form.cliente} onChange={(e) => setForm((prev) => ({ ...prev, cliente: e.target.value }))} required>
                <option value="">Selecciona un cliente</option>
                {clientesDeLaOrganizacion.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Estatus">
            <select
              value={form.is_active ? "activo" : "inactivo"}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === "activo" }))}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </FormField>

          {errorForm && <p className="loginError">{errorForm}</p>}

          <div className="pageActions">
            <button type="submit" className="loginButton" disabled={guardando}>
              {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
