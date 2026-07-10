// Helpers compartidos para hablar con el backend desde el panel autenticado.
// No cambia contratos de API: solo centraliza fetch + manejo de token.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access");
}

export function clearSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

/**
 * fetch autenticado. No redirige por sí mismo: el llamador decide qué hacer
 * con un 401 (normalmente limpiar sesión y mandar a /login).
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${path}`, { ...options, headers });
}

export async function apiJson(
  path: string,
  method: string,
  body?: unknown
): Promise<Response> {
  return apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiForm(path: string, method: string, formData: FormData): Promise<Response> {
  return apiFetch(path, { method, body: formData });
}

/**
 * Descarga un archivo (Excel/PDF) protegido por JWT y dispara la descarga en el navegador.
 */
export async function downloadFile(path: string, filename: string): Promise<string | null> {
  const res = await apiFetch(path);
  if (!res.ok) return "No fue posible generar el archivo.";

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  return null;
}
