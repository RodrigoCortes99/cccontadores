// Helpers de rol para la UI. Son solo para mostrar/ocultar controles:
// el backend es quien realmente aplica los permisos en cada endpoint.

export type CurrentUser = {
  id: number;
  username: string;
  email?: string;
  role: string | null;
  organization_id: number | null;
  client_id: number | null;
  client_name: string | null;
  is_superuser: boolean;
};

export function isClientRole(user: CurrentUser | null): boolean {
  return !!user && user.role === "client" && !user.is_superuser;
}

export function isPrivileged(user: CurrentUser | null): boolean {
  // manager, partner o superusuario: ven costos, revisan el trabajo de otros,
  // administran catálogos y perfiles de productividad.
  return !!user && (user.is_superuser || user.role === "manager" || user.role === "partner");
}

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
