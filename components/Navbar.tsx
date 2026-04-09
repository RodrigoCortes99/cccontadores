"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Nosotros", href: "/acerca-de" },
  { label: "Experiencia", href: "/experiencia" },
  { label: "Áreas de Especialización", href: "/servicios" },
  { label: "Contacto", href: "/contacto" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access");
    setHasSession(!!token);
  }, [pathname]);

  return (
    <header className="cc-nav">
      <div className="container cc-nav__inner">
        <Link href="/" className="cc-brand" aria-label="Ir a inicio">
          {!logoError ? (
            <img
              src="/logo-cc.png"
              alt="CC Contadores Públicos"
              className="cc-brand__logo"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="cc-brand__fallback">CC</div>
          )}

          <div className="cc-brand__text">
            <span className="cc-brand__titleLong">
              CC CONTADORES PÚBLICOS, AUDITORES Y CONSULTORES S.C.
            </span>
          </div>
        </Link>

        <nav className="cc-links" aria-label="Navegación principal">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`cc-link ${isActive ? "cc-link--active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="cc-nav__actions">
          <button
            type="button"
            className="cc-btn cc-btn--solid cc-btn--navPortal"
            onClick={() => router.push(hasSession ? "/panel" : "/login")}
          >
            {hasSession ? "Ir al panel" : "Acceso al panel"}
          </button>
        </div>
      </div>
    </header>
  );
}