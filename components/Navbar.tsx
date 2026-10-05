"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionState, logoutAndNotify } from "../lib/useSessionState";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Nosotros", href: "/acerca-de" },
  { label: "Experiencia", href: "/experiencia" },
  { label: "Áreas de Especialización", href: "/servicios" },
  { label: "Contacto", href: "/contacto" },
];

type NavbarProps = {
  /** Nav transparente superpuesto al hero (logo/texto blancos), que se
   * vuelve sólido al hacer scroll. Solo usar en páginas cuya primera
   * sección sea un .heroBanner con overlay oscuro. */
  overlay?: boolean;
};

export default function Navbar({ overlay = false }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasSession = useSessionState();
  const [logoError, setLogoError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Evita que quede scroll de fondo mientras el panel móvil está abierto.
  // El cierre al navegar se maneja directamente en el onClick de cada link
  // (ver closeMobile), no aquí, para no disparar setState desde un efecto.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Alterna el nav transparente-sobre-hero a un fondo sólido, pero solo
  // hasta que el propio hero haya salido por completo de la pantalla (no
  // con un umbral fijo de scroll): como el nav es `position: fixed` y no
  // reserva espacio, si se vuelve sólido demasiado pronto tapa el título
  // del hero que todavía está detrás. Con IntersectionObserver, el nav
  // sigue transparente mientras el hero (o la parte visible detrás del
  // nav) siga en pantalla, y recién se vuelve sólido cuando ya no hay
  // hero debajo de él.
  useEffect(() => {
    if (!overlay) return;

    const hero = document.querySelector<HTMLElement>(".heroBanner");
    if (!hero) return;

    const navHeight = 96;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: `-${navHeight}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [overlay]);

  function handleLogout() {
    logoutAndNotify();
    router.push("/login");
  }

  const showWhiteLogo = overlay && !scrolled;
  const headerClassName = [
    "cc-nav",
    overlay ? "cc-nav--overlay" : "",
    overlay && scrolled ? "cc-nav--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClassName}>
      <div className="container cc-nav__inner">
        <Link href="/" className="cc-brand" aria-label="Ir a inicio">
          {showWhiteLogo ? (
            <Image
              src="/logo-cc-transparente.png"
              alt="CC Contadores Públicos, Auditores y Consultores S.C."
              className="cc-brand__logoWide"
              width={827}
              height={260}
              priority
            />
          ) : !logoError ? (
            <Image
              src="/logo-cc-transparente.png"
              alt="CC Contadores Públicos, Auditores y Consultores S.C."
              className="cc-brand__logoWide"
              width={827}
              height={260}
              onError={() => setLogoError(true)}
              priority
            />
          ) : (
            <div className="cc-brand__fallback">CC</div>
          )}
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
          {!hasSession ? (
            <button
              type="button"
              className="cc-btn cc-btn--solid cc-btn--navPortal"
              onClick={() => router.push("/login")}
            >
              Acceso al panel
            </button>
          ) : (
            <>
              <button
                type="button"
                className="cc-btn cc-btn--solid cc-btn--navPortal"
                onClick={() => router.push("/panel")}
              >
                Ir al panel
              </button>

              <button
                type="button"
                className="cc-btn cc-btn--outline"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </>
          )}

          <button
            type="button"
            className={`cc-navToggle ${mobileOpen ? "cc-navToggle--open" : ""}`}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            aria-controls="cc-mobileMenu"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        id="cc-mobileMenu"
        className={`cc-mobileMenu ${mobileOpen ? "cc-mobileMenu--open" : ""}`}
      >
        <nav className="cc-mobileMenu__links" aria-label="Navegación principal (móvil)">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`cc-mobileMenu__link ${isActive ? "cc-mobileMenu__link--active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="cc-mobileMenu__actions">
          {!hasSession ? (
            <button
              type="button"
              className="cc-btn cc-btn--solid cc-btn--navPortal"
              onClick={() => {
                setMobileOpen(false);
                router.push("/login");
              }}
            >
              Acceso al panel
            </button>
          ) : (
            <>
              <button
                type="button"
                className="cc-btn cc-btn--solid cc-btn--navPortal"
                onClick={() => {
                  setMobileOpen(false);
                  router.push("/panel");
                }}
              >
                Ir al panel
              </button>

              <button
                type="button"
                className="cc-btn cc-btn--outline"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div
          className="cc-mobileMenu__backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
