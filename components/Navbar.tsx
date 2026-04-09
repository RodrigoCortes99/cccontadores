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

  useEffect(() => {
    const token = localStorage.getItem("access");
    setHasSession(!!token);
  }, [pathname]);

  return (
    <header className="cc-nav cc-nav--website">
      <div className="container cc-nav__inner cc-nav__inner--website">
        <div className="cc-nav__left">
          <Link href="/" className="cc-brand cc-brand--website" aria-label="Ir a inicio">
            <img
              src="/logo-cc.png"
              alt="CC Contadores Públicos"
              className="cc-brand__logo"
            />
            <span className="cc-brand__titleLong">
              CC CONTADORES PÚBLICOS, AUDITORES Y CONSULTORES S.C.
            </span>
          </Link>
        </div>

        <nav className="cc-nav__center cc-links cc-links--website" aria-label="Navegación principal">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                className={`cc-link cc-link--website ${isActive ? "cc-link--active" : ""}`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="cc-nav__right cc-actions cc-actions--website">
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