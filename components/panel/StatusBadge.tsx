type StatusBadgeProps = {
  label?: string | null;
  tone?: "gray" | "blue" | "green" | "yellow" | "red" | "purple";
};

export default function StatusBadge({ label, tone = "gray" }: StatusBadgeProps) {
  return <span className={`badge badge--${tone}`}>{label ?? "—"}</span>;
}

/**
 * Mapea valores de estatus comunes del backend a un tono de color razonable.
 * Los componentes pueden ignorar esto y pasar su propio `tone` si lo prefieren.
 *
 * Acepta undefined/null a propósito: si el backend responde con un contrato
 * viejo (por ejemplo, un servidor que no se reinició tras un despliegue) o el
 * campo simplemente no aplica, no debe tronar toda la página por esto.
 */
export function toneForEstatus(valor?: string | null): StatusBadgeProps["tone"] {
  if (!valor) return "gray";
  const v = valor.toLowerCase();

  if (["aprobado", "completa", "facturado", "activo"].includes(v)) return "green";
  if (["pendiente", "capturado", "planeacion"].includes(v)) return "gray";
  if (["en_revision", "recibido", "ejecucion", "pendiente_facturar"].includes(v)) return "blue";
  if (["requiere_correccion", "incompleto", "requiere_accion", "alta"].includes(v)) return "yellow";
  if (["rechazado", "vencido", "urgente"].includes(v)) return "red";
  if (["emitido", "cierre"].includes(v)) return "purple";

  return "gray";
}
