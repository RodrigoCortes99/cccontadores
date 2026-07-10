"use client";

// Hook reutilizable para el sitio público (Navbar, Hero, etc.): indica si
// existe una sesión iniciada (token de acceso en localStorage) sin usar
// setState dentro de un useEffect y sin romper SSR/hidratación.
//
// Usa useSyncExternalStore, que es exactamente para esto: leer un estado
// externo (localStorage) de forma segura para el render, con un snapshot
// distinto en servidor ("sin sesión") y suscripción a cambios en cliente.
//
// El evento nativo "storage" del navegador solo se dispara en OTRAS
// pestañas, nunca en la que hizo el cambio. Por eso el login/logout deben
// pasar por notifySessionChange() (o por logoutAndNotify(), que ya la llama)
// para que un Navbar ya montado en la misma pestaña se actualice también.

import { useSyncExternalStore } from "react";
import { getAccessToken, clearSession } from "./api";

const SESSION_EVENT = "cc-session-changed";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(SESSION_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}

function getSnapshot(): boolean {
  return !!getAccessToken();
}

function getServerSnapshot(): boolean {
  // En el servidor no hay localStorage: se asume "sin sesión" hasta que el
  // cliente hidrate y lea el valor real. No hay parpadeo distinto al que ya
  // tenía la versión con useEffect (que también arrancaba en `false`).
  return false;
}

/** Notifica a cualquier useSessionState() activo en esta misma pestaña que
 * la sesión cambió (login o logout hechos en el mismo tab). */
export function notifySessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** Cierra sesión (limpia los tokens) y notifica a los componentes que
 * muestran estado de sesión en esta misma pestaña. */
export function logoutAndNotify() {
  clearSession();
  notifySessionChange();
}

export function useSessionState(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
