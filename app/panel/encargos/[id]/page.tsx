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

  async function handleCambiarEstatus(solicitudId: number, nuevoEstatus: string) {
    setError("");
    setMensaje("");
    setUpdatingId(solicitudId);

    try {
      const token = localStorage.getItem("access");

      if (!token) {
        router.push("/login");
        return;
      }

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
        setError(data.detail || "No fue posible actualizar el estatus.");
        return;
      }

      setMensaje("Estatus actualizado correctamente.");
      await fetchSolicitudes();
    } catch {
      setError("Ocurrió un error al actualizar el estatus.");
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
                : "Revisa las solicitudes de información asociadas a este encargo y actualiza su seguimiento."}
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

                    {!isClientUser && (
                      <div style={{ marginTop: "14px" }}>
                        <label
                          htmlFor={`estatus-${solicitud.id}`}
                          style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}
                        >
                          Cambiar estatus
                        </label>

                        <select
                          id={`estatus-${solicitud.id}`}
                          defaultValue={solicitud.estatus}
                          onChange={(e) =>
                            handleCambiarEstatus(solicitud.id, e.target.value)
                          }
                          disabled={updatingId === solicitud.id}
                          style={{
                            width: "100%",
                            padding: "12px 14px",
                            borderRadius: "10px",
                            border: "1px solid #d1d5db",
                            background: "#fff",
                            marginBottom: "12px",
                          }}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="recibido">Recibido</option>
                          <option value="aprobado">Aprobado</option>
                          <option value="incompleto">Incompleto</option>
                        </select>

                        {updatingId === solicitud.id && (
                          <p className="pageText">Actualizando estatus...</p>
                        )}
                      </div>
                    )}

                    <div className="pageActions">
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