// Helpers compartidos para hablar con el backend desde el panel autenticado.
// No cambia contratos de API: solo centraliza fetch + manejo de token, incluido
// el refresh automático de JWT (una sola vez, sin refreshes simultáneos).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh");
}

export function setAccessToken(token: string) {
  localStorage.setItem("access", token);
}

export function clearSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.assign("/login");
}

// Single-flight: si varias peticiones reciben 401 al mismo tiempo, todas
// esperan el mismo refresh en curso en lugar de disparar uno cada una.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    try {
      const res = await fetch(`${API_URL}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (!data.access) return null;

      setAccessToken(data.access);
      return data.access as string;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function buildHeaders(options: RequestInit, token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * fetch autenticado. Si el access token expiró (401), intenta refrescarlo una
 * sola vez con el refresh token y reintenta la petición original. Si el
 * refresh falla (o no hay refresh token), limpia la sesión y manda a /login.
 * No dispara la petición si nunca hubo token (evita 401 en cascada al cargar
 * páginas antes de que exista sesión).
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();

  if (!token) {
    redirectToLogin();
    // Devolvemos una Response 401 "sintética" para que el llamador la maneje
    // igual que cualquier otro 401, sin lanzar una excepción no controlada.
    return new Response(JSON.stringify({ detail: "No hay sesión activa." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let res = await fetch(`${API_URL}${path}`, { ...options, headers: buildHeaders(options, token) });

  if (res.status === 401) {
    const nuevoToken = await refreshAccessToken();

    if (!nuevoToken) {
      clearSession();
      redirectToLogin();
      return res;
    }

    res = await fetch(`${API_URL}${path}`, { ...options, headers: buildHeaders(options, nuevoToken) });
  }

  return res;
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
