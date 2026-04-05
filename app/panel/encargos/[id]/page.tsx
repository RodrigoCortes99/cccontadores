"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";
import PanelBack from "../../../../components/PanelBack";

type SolicitudPBC = {
  id: number;
  organizacion: string;
  encargo: string;
  titulo: string;
  descripcion: string;
  estatus: string;
  estatus_display: string;
  fecha_compromiso: string | null;
  fecha_recibido: string | null;
  creado_en: string;
};

export default function EncargoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [solicitudes, setSolicitudes] = useState<SolicitudPBC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaCompromiso, setFechaCompromiso] = useState("");
  const [estatus, setEstatus] = useState("solicitado");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function fetchSolicitudes() {
    try {
      const token = localStorage.getItem("access");

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/encargos/${id}/pbc/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setError("No fue posible cargar las solicitudes PBC.");
        return;
      }

      const data = await res.json();
      setSolicitudes(data);
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      router.push("/login");
      return;
    }

    if (id) {
      fetchSolicitudes();
    }
  }, [id, router]);

  async function handleCreateSolicitud(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensaje("");
    setError("");

    const token = localStorage.getItem("access");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setGuardando(true);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/encargos/${id}/pbc/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizacion: 1,
          titulo,
          descripcion,
          estatus,
          fecha_compromiso: fechaCompromiso || null,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setError(
          typeof data === "object"
            ? JSON.stringify(data)
            : "No fue posible crear la solicitud."
        );
        return;
      }

      setMensaje("Solicitud PBC creada correctamente.");
      setTitulo("");
      setDescripcion("");
      setFechaCompromiso("");
      setEstatus("solicitado");

      await fetchSolicitudes();
    } catch {
      setError("Ocurrió un error al guardar la solicitud.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="pageHero">
          <div className="container">
            <p className="pageKicker">ENCARGO</p>
            <h1 className="pageTitle">Solicitudes PBC</h1>
            <p className="pageLead">
              Revisa las solicitudes de información asociadas a este encargo.
            </p>
          </div>
        </section>

        <section className="pageSection">
          <div className="container">
            <PanelBack backLabel="Volver a encargos" panelHref="/panel" />

            <div className="uploadCard" style={{ marginBottom: "28px" }}>
              <h2 className="uploadTitle">Nueva solicitud PBC</h2>

              <form onSubmit={handleCreateSolicitud} className="uploadForm">
                <div className="loginField">
                  <label htmlFor="titulo">Título</label>
                  <input
                    id="titulo"
                    type="text"
                    placeholder="Ej. Balanza de comprobación"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                </div>

                <div className="loginField">
                  <label htmlFor="descripcion">Descripción</label>
                  <textarea
                    id="descripcion"
                    rows={4}
                    className="uploadTextarea"
                    placeholder="Describe el documento o evidencia requerida"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>

                <div className="loginField">
                  <label htmlFor="fechaCompromiso">Fecha compromiso</label>
                  <input
                    id="fechaCompromiso"
                    type="date"
                    value={fechaCompromiso}
                    onChange={(e) => setFechaCompromiso(e.target.value)}
                  />
                </div>

                <div className="loginField">
                  <label htmlFor="estatus">Estatus</label>
                  <select
                    id="estatus"
                    value={estatus}
                    onChange={(e) => setEstatus(e.target.value)}
                  >
                    <option value="solicitado">Solicitado</option>
                    <option value="recibido">Recibido</option>
                    <option value="incompleto">Incompleto</option>
                    <option value="aprobado">Aprobado</option>
                  </select>
                </div>

                {error && <p className="loginError">{error}</p>}
                {mensaje && <p className="uploadSuccess">{mensaje}</p>}

                <button type="submit" className="loginButton" disabled={guardando}>
                  {guardando ? "Guardando..." : "Crear solicitud"}
                </button>
              </form>
            </div>

            {loading && <p className="pageText">Cargando solicitudes...</p>}

            {!loading && !error && solicitudes.length === 0 && (
              <p className="pageText">No hay solicitudes PBC registradas.</p>
            )}

            {!loading && !error && solicitudes.length > 0 && (
              <div className="cardGrid">
                {solicitudes.map((solicitud) => (
                  <article key={solicitud.id} className="contentCard">
                    <h2>{solicitud.titulo}</h2>

                    <p>
                      <strong>Estatus:</strong> {solicitud.estatus_display}
                    </p>

                    {solicitud.descripcion && (
                      <p>
                        <strong>Descripción:</strong> {solicitud.descripcion}
                      </p>
                    )}

                    {solicitud.fecha_compromiso && (
                      <p>
                        <strong>Fecha compromiso:</strong> {solicitud.fecha_compromiso}
                      </p>
                    )}

                    {solicitud.fecha_recibido && (
                      <p>
                        <strong>Fecha recibido:</strong> {solicitud.fecha_recibido}
                      </p>
                    )}

                    <div className="pageActions">
                      <Link
                        className="cc-btn cc-btn--solid"
                        href={`/panel/pbc/${solicitud.id}`}
                      >
                        Ver documentos
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}