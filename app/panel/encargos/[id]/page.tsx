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
  observaciones_revision: string;
  creado_en: string;
};

type CurrentUser = {
  id: number;
  username: string;
  role: string | null;
  organization_id: number | null;
  client_id: number | null;
  client_name: string | null;
  is_superuser: boolean;
};

export default function EncargoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [userInfo, setUserInfo] = useState<CurrentUser | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudPBC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [estatusEdit, setEstatusEdit] = useState<Record<number, string>>({});
  const [observacionesEdit, setObservacionesEdit] = useState<Record<number, string>>({});

  const isClientUser = userInfo?.role === "client";

  async function fetchMe() {
    const token = localStorage.getItem("access");

    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me/`, {
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
      throw new Error("No fue posible cargar la sesión.");
    }

    const data = await res.json();
    setUserInfo(data);
  }

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

      const nuevosEstatus: Record<number, string> = {};
      const nuevasObservaciones: Record<number, string> = {};

      data.forEach((solicitud: SolicitudPBC) => {
        nuevosEstatus[solicitud.id] = solicitud.estatus;
        nuevasObservaciones[solicitud.id] = solicitud.observaciones_revision || "";
      });

      setEstatusEdit(nuevosEstatus);
      setObservacionesEdit(nuevasObservaciones);
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

    async function loadAll() {
      try {
        await fetchMe();
        await fetchSolicitudes();
      } catch {
        setError("No fue posible cargar la información del encargo.");
        setLoading(false);
      }
    }

    if (id) {
      loadAll();
    }
  }, [id, router]);

  async function handleGuardarRevision(solicitudId: number) {
    setError("");
    setMensaje("");
    setUpdatingId(solicitudId);

    try {
      const token = localStorage.getItem("access");

      if (!token) {
        router.push("/login");
        return;
      }

      const nuevoEstatus = estatusEdit[solicitudId];
      const nuevaObservacion = observacionesEdit[solicitudId] || "";

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pbc/${solicitudId}/estatus/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            estatus: nuevoEstatus,
            observaciones_revision: nuevaObservacion,
          }),
        }
      );

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setError(data.detail || "No fue posible actualizar la revisión.");
        return;
      }

      setMensaje("Revisión actualizada correctamente.");
      await fetchSolicitudes();
    } catch {
      setError("Ocurrió un error al actualizar la revisión.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="pageHero">
          <div className="container">
            <p className="pageKicker">ENCARGO</p>
            <h1 className="pageTitle">
              {isClientUser ? "Mis requerimientos" : "Solicitudes PBC"}
            </h1>
            <p className="pageLead">
              {isClientUser
                ? "Revisa las solicitudes de información de este encargo y consulta sus documentos."
                : "Revisa las solicitudes, cambia el estatus y agrega observaciones para el cliente."}
            </p>
          </div>
        </section>

        <section className="pageSection">
          <div className="container">
            <PanelBack backLabel="Volver a encargos" panelHref="/panel" />

            {error && <p className="loginError">{error}</p>}
            {mensaje && <p className="uploadSuccess">{mensaje}</p>}

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
                      <strong>Estatus actual:</strong> {solicitud.estatus_display}
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

                    {solicitud.observaciones_revision && (
                      <p>
                        <strong>Observaciones del auditor:</strong>{" "}
                        {solicitud.observaciones_revision}
                      </p>
                    )}

                    {!isClientUser && (
                      <div style={{ marginTop: "14px" }}>
                        <div className="loginField">
                          <label htmlFor={`estatus-${solicitud.id}`}>Cambiar estatus</label>
                          <select
                            id={`estatus-${solicitud.id}`}
                            value={estatusEdit[solicitud.id] || solicitud.estatus}
                            onChange={(e) =>
                              setEstatusEdit((prev) => ({
                                ...prev,
                                [solicitud.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="recibido">Recibido</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="incompleto">Incompleto</option>
                          </select>
                        </div>

                        <div className="loginField">
                          <label htmlFor={`observaciones-${solicitud.id}`}>
                            Observaciones de revisión
                          </label>
                          <textarea
                            id={`observaciones-${solicitud.id}`}
                            rows={4}
                            className="uploadTextarea"
                            placeholder="Ej. Falta XML, el PDF no corresponde al periodo o falta firma."
                            value={observacionesEdit[solicitud.id] || ""}
                            onChange={(e) =>
                              setObservacionesEdit((prev) => ({
                                ...prev,
                                [solicitud.id]: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <button
                          type="button"
                          className="loginButton"
                          onClick={() => handleGuardarRevision(solicitud.id)}
                          disabled={updatingId === solicitud.id}
                        >
                          {updatingId === solicitud.id ? "Guardando..." : "Guardar revisión"}
                        </button>
                      </div>
                    )}

                    <div className="pageActions" style={{ marginTop: "14px" }}>
                      <Link
                        className="cc-btn cc-btn--solid"
                        href={`/panel/pbc/${solicitud.id}`}
                      >
                        {isClientUser ? "Ver documentos" : "Gestionar documentos"}
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