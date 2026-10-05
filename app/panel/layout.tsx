import "./platform.css";
import "./operational.css";
import type { Metadata } from "next";
import { PanelUserProvider } from "../../lib/PanelUserContext";
import { ToastProvider } from "../../components/panel/Toast";
import AppShell from "../../components/panel/AppShell";

// El panel es la aplicación interna autenticada: nunca debe aparecer en
// resultados de búsqueda (no es contenido público del sitio).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelUserProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </PanelUserProvider>
  );
}
