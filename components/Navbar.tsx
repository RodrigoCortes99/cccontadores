"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Acerca de", href: "/acerca-de" },
  { label: "Portafolio", href: "/portafolio" },
  { label: "Servicios", href: "/servicios" },
  { label: "Contacto", href: "/contacto" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [hasSession, setHasSession] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access");
    setHasSession(!!token);
    setReady(true);
  }, [pathname]);

  function handlePortalClick() {
    if (hasSession) {
      router.push("/panel");
    } else {
      router.push("/login");
    }
  }

  function handleLogout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setHasSession(false);
    router.push("/login");
  }

  return (
    <header className="cc-nav">
      <div className="cc-nav__inner">
        <Link href="/" className="cc-brand" aria-label="Ir a inicio">
          <div className="cc-brand__mark" aria-hidden="true">
            cc
          </div>
          <div className="cc-brand__text">
            <div className="cc-brand__title">CC Contadores</div>
            <div className="cc-brand__subtitle">Públicos, Auditores y Consultores S.C.</div>
          </div>
        </Link>

        <nav className="cc-links" aria-label="Navegación principal">
          {navItems.map((item) => (
            <Link key={item.href} className="cc-link" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="cc-actions">
          <Link className="cc-btn cc-btn--ghost" href="/contacto">
            Solicitar asesoría
          </Link>

          {ready && (
            <>
              <button
                type="button"
                className="cc-btn cc-btn--solid"
                onClick={handlePortalClick}
              >
                {hasSession ? "Ir al panel" : "Iniciar sesión"}
              </button>

              {hasSession && (
                <button
                  type="button"
                  className="cc-btn cc-btn--ghost"
                  onClick={handleLogout}
                >
                  Salir
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}