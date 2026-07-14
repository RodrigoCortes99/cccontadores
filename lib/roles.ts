// Helpers de rol para la UI. Son solo para mostrar/ocultar controles:
// el backend es quien realmente aplica los permisos en cada endpoint.

export type OrganizacionAsignada = { id: number; name: string };

export type CurrentUser = {
  id: number;
  username: string;
  email?: string;
  role: string | null;
  organization_id: number | null;
  organization_nombre?: string | null;
  // Solo tiene más de un elemento para staff/senior que colaboran con varias
  // organizaciones; el resto de roles solo ve la suya (o una lista vacía).
  organizaciones_asignadas?: OrganizacionAsignada[];
  client_id: number | null;
  client_name: string | null;
  is_superuser: boolean;
};

/**
 * Un empleado ve el selector de organización activa solo si tiene más de una
 * organización asignada (si solo tiene una, cambiar "activa" no tendría
 * ningún efecto útil).
 */
export function puedeCambiarOrganizacionActiva(user: CurrentUser | null): boolean {
  return !!user && (user.organizaciones_asignadas?.length ?? 0) > 1;
}

export function isClientRole(user: CurrentUser | null): boolean {
  return !!user && user.role === "client" && !user.is_superuser;
}

export function isPrivileged(user: CurrentUser | null): boolean {
  // manager, partner o superusuario: ven costos, revisan el trabajo de otros,
  // administran catálogos y perfiles de productividad.
  return !!user && (user.is_superuser || user.role === "manager" || user.role === "partner");
}

/**
 * Quién puede administrar usuarios, organizaciones y clientes desde el panel.
 * Es exactamente la misma regla que `isPrivileged` (superusuario, manager o
 * partner) — se reexpone con este nombre solo para que las pantallas de
 * administración sean más legibles. El backend vuelve a validar esto mismo
 * en cada endpoint; esto es solo para mostrar/ocultar la UI.
 */
export const canManageUsers = isPrivileged;

/**
 * Solo un partner o superusuario puede asignar (u otorgarse) el rol de
 * "partner" a un usuario. Un manager administra usuarios pero no puede
 * volver a nadie (ni a sí mismo) socio. El backend vuelve a validar esto en
 * UsuariosListView.create()/UsuarioDetailView.patch(); esto solo oculta la
 * opción en la UI.
 */
export function puedeAsignarPartner(user: CurrentUser | null): boolean {
  return !!user && (user.is_superuser || user.role === "partner");
}

/**
 * Quién puede ver/filtrar el registro de horas de otra persona en control de
 * horas: privilegiados (manager/partner/superusuario) más `senior`, que solo
 * revisa a `staff` (el backend acota el alcance exacto). No implica ver
 * costos: eso sigue siendo exclusivo de `isPrivileged`.
 */
export function esRevisorDeHoras(user: CurrentUser | null): boolean {
  return isPrivileged(user) || (!!user && user.role === "senior");
}

/**
 * Quién puede tocar el flujo de revisión de PBC en absoluto (cambiar el
 * estatus de un documento o de una solicitud, resolver comentarios): mismo
 * alcance que `esRevisorDeHoras` — manager/partner/superusuario revisan
 * completo (incluida la aprobación final); senior revisa pero no da la
 * palabra final (ver `puedeDarAprobacionFinal`). Staff y client, nunca.
 */
export const puedeRevisarPBC = esRevisorDeHoras;

/**
 * De quienes pueden revisar PBC, quién puede además cerrar el caso con un
 * estado final (aprobado/rechazado de un documento, o aprobado de una
 * solicitud): solo manager/partner/superusuario.
 */
export const puedeDarAprobacionFinalPBC = isPrivileged;

/**
 * Quién puede crear encargos, clientes o solicitudes PBC: exclusivo de
 * manager/partner/superusuario. Alias de `isPrivileged` con un nombre más
 * legible para las pantallas de creación.
 */
export const puedeCrearOperacion = isPrivileged;

export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case "staff":
      return "Staff";
    case "senior":
      return "Senior";
    case "manager":
      return "Manager";
    case "partner":
      return "Socio";
    case "client":
      return "Cliente";
    default:
      return role || "Sin rol";
  }
}
