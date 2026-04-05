"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Hero() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access");
    setHasSession(!!token);
  }, []);

  return (
    <section className="hero" id="inicio">
      <div className="hero__overlay" />

      <div className="hero__content">
        <h1 className="hero__title">
          Auditoría y consultoría con <br />
          respaldo profesional
        </h1>

        <p className="hero__subtitle">
          Comprometidos con la ética, calidad y el éxito de tu negocio.
        </p>

        <div className="hero__actions">
          <Link className="btn btn--primary" href="/contacto">
            Solicitar asesoría
          </Link>

          <Link className="btn btn--secondary" href="/servicios">
            Ver servicios
          </Link>

          <Link className="btn btn--ghostBlue" href={hasSession ? "/panel" : "/login"}>
            {hasSession ? "Ir al panel" : "Entrar al sistema"}
          </Link>
        </div>
      </div>

      <div className="hero__bottomBorder" />
    </section>
  );
}