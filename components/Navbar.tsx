"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Nosotros", href: "/acerca-de" },
  { label: "Experiencia", href: "/experiencia" },
  { label: "Áreas de Especialización", href: "/servicios" },
  { label: "Contacto", href: "/contacto" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="cc-nav">
      <div className="container cc-nav__inner">
        <Link href="/" className="cc-brand" aria-label="Ir a inicio">
          <div className="cc-brand__mark cc-brand__mark--logo" aria-hidden="true">
            CC
          </div>

          <div className="cc-brand__text">
            <div className="cc-brand__titleLong">
              CC CONTADORES PÚBLICOS, AUDITORES Y CONSULTORES S.C.
            </div>
          </div>
        </Link>

        <nav className="cc-links" aria-label="Navegación principal">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                className={`cc-link ${isActive ? "cc-link--active" : ""}`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}