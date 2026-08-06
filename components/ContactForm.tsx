"use client";

import { useState } from "react";

type Estado = "idle" | "enviando" | "enviado" | "error";

const DESTINATARIO = "contacto@cc-contadorespublicos.com";

export default function ContactForm() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !telefono.trim() || !correo.trim() || !mensaje.trim()) {
      setError("Completa todos los campos marcados con *.");
      return;
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
    if (!correoValido) {
      setError("Escribe un correo electrónico válido.");
      return;
    }

    setEstado("enviando");

    // Sin backend propio para leads todavía: abrimos el cliente de correo
    // del visitante con el mensaje ya redactado, para que el formulario
    // funcione de inmediato sin depender de un servicio externo. Si más
    // adelante quieren que los mensajes lleguen directo a un buzón o CRM sin
    // pasar por el cliente de correo del visitante, esto se reemplaza por un
    // solo fetch a un endpoint (propio o de un proveedor de formularios).
    const asunto = `Solicitud de asesoría — ${nombre.trim()}`;
    const cuerpo = [
      `Nombre: ${nombre.trim()}`,
      `Teléfono: ${telefono.trim()}`,
      `Correo: ${correo.trim()}`,
      "",
      mensaje.trim(),
    ].join("\n");

    const mailtoUrl = `mailto:${DESTINATARIO}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.location.href = mailtoUrl;

    setEstado("enviado");
  }

  return (
    <form className="contactForm" onSubmit={handleSubmit} noValidate>
      <div className="contactForm__row">
        <div>
          <label htmlFor="contacto-nombre" className="srOnly">
            Nombre completo
          </label>
          <input
            id="contacto-nombre"
            type="text"
            placeholder="Nombre completo*"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label htmlFor="contacto-telefono" className="srOnly">
            Teléfono
          </label>
          <input
            id="contacto-telefono"
            type="tel"
            placeholder="Teléfono*"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            autoComplete="tel"
            required
          />
        </div>
      </div>

      <label htmlFor="contacto-correo" className="srOnly">
        Correo electrónico
      </label>
      <input
        id="contacto-correo"
        type="email"
        placeholder="Correo electrónico*"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        autoComplete="email"
        required
      />

      <label htmlFor="contacto-mensaje" className="srOnly">
        Mensaje
      </label>
      <textarea
        id="contacto-mensaje"
        placeholder="Escribe tu mensaje aquí *"
        rows={5}
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        required
      />

      {error && (
        <p className="contactForm__feedback contactForm__feedback--error" role="alert">
          {error}
        </p>
      )}

      {estado === "enviado" && !error && (
        <p className="contactForm__feedback contactForm__feedback--ok" role="status">
          Se abrió tu app de correo con el mensaje listo para enviar. Si no se abrió, escríbenos
          directo a {DESTINATARIO}.
        </p>
      )}

      <button type="submit" className="cc-btn cc-btn--solid" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Abriendo tu correo..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
