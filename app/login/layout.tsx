import type { Metadata } from "next";

// El login es una pantalla de acceso, no contenido que deba aparecer en
// resultados de búsqueda: se excluye del índice sin afectar el resto del sitio.
export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
