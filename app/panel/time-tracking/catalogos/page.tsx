"use client";

import {formErrorMessage} from '@/lib/formErrors';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "../../../../components/panel/PageHeader";
import TimeTrackingNav from "../../../../components/TimeTrackingNav";

type Catalogo = { id: number; name: string; is_active: boolean };

type CurrentUser = {
  id: number;
  role: string | null;
  is_superuser: boolean;
};

type NombreCatalogo = "tipos-actividad" | "areas" | "servicios";

const CATALOGOS: { key: NombreCatalogo; titulo: string }[] = [
  { key: "tipos-actividad", titulo: "Tipos de actividad" },
  { key: "areas", titulo: "Áreas" },
  { key: "servicios", titulo: "Proyectos / Servicios" },
];

export default function CatalogosTimeTrackingPage() {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<CurrentUser | null>(null);
  const [datos, setDatos] = useState<Record<NombreCatalogo, Catalogo[]>>({
    "tipos-actividad": [],
    areas: [],
    servicios: [],
  });
  const [nuevoNombre, setNuevoNombre] = useState<Record<NombreCatalogo, string>>({
    "tipos-actividad": "",
    areas: "",
    servicios: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState<NombreCatalogo | null>(null);

  const esPrivilegiado = userInfo?.is_superuser || userInfo?.role === "manager" || userInfo?.role === "partner";

  function tokenOrRedirect(): string | null {
    const token = localStorage.getItem("access");
    if (!token) {
      router.push("/login");
      return null;
    }
    return token;
  }

  async function apiGet(path: string) {
    const token = tokenOrRedirect();
    if (!token) return null;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      router.push("/login");
      return null;
    }

    if (!res.ok) return null;
    return res.json();
  }

  async function fetchMe() {
    const data = await apiGet("/api/me/");
    if (data) setUserInfo(data);
    return data;
  }

  async function fetchCatalogos() {
    const [ta, ar, sv] = await Promise.all([
      apiGet("/api/time-tracking/catalogos/tipos-actividad/"),
      apiGet("/api/time-tracking/catalogos/areas/"),
      apiGet("/api/time-tracking/catalogos/servicios/"),
    ]);

    setDatos({
      "tipos-actividad": ta || [],
      areas: ar || [],
      servicios: sv || [],
    });
  }

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      router.push("/login");
      return;
    }

    async function cargarTodo() {
      try {
        const me = await fetchMe();
        if (me && me.role !== "manager" && me.role !== "partner" && !me.is_superuser) {
          setError("No tienes permiso para ver esta sección.");
          setLoading(false);
          return;
        }
        await fetchCatalogos();
      } catch {
        setError("No fue posible cargar los catálogos.");
      } finally {
        setLoading(false);
      }
    }

    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function crearItem(catalogo: NombreCatalogo) {
    setError("");
    setMensaje("");

    const nombre = nuevoNombre[catalogo].trim();
    if (!nombre) {
      setError("Escribe un nombre.");
      return;
    }

    const token = tokenOrRedirect();
    if (!token) return;

    try {
      setGuardando(catalogo);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-tracking/catalogos/${catalogo}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: nombre, is_active: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(formErrorMessage(data, "No fue posible crear el elemento."));
        return;
      }

      setMensaje("Elemento agregado.");
      setNuevoNombre((prev) => ({ ...prev, [catalogo]: "" }));
      await fetchCatalogos();
    } catch {
      setError("Ocurrió un error al crear el elemento.");
    } finally {
      setGuardando(null);
    }
  }

  if (!loading && !esPrivilegiado) {
    return (
      <>
        <PageHeader title="Catálogos" />
        <p className="loginError">{error || "No tienes permiso para ver esta sección."}</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Catálogos"
        description="Administra los tipos de actividad, áreas y proyectos/servicios disponibles para capturar horas."
      />

      <TimeTrackingNav activo="catalogos" esPrivilegiado={!!esPrivilegiado} />

      {loading && <p className="pageText">Cargando catálogos...</p>}

            {!loading && (
              <div className="cardGrid">
                {CATALOGOS.map(({ key, titulo }) => (
                  <div key={key} className="uploadCard">
                    <h2 className="uploadTitle">{titulo}</h2>

                    <div className="loginField" style={{ marginBottom: "12px" }}>
                      <label>Nuevo</label>
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={nuevoNombre[key]}
                        onChange={(e) => setNuevoNombre((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>

                    <button
                      type="button"
                      className="loginButton"
                      onClick={() => crearItem(key)}
                      disabled={guardando === key}
                      style={{ marginBottom: "18px" }}
                    >
                      {guardando === key ? "Guardando..." : "Agregar"}
                    </button>

                    <ul className="checkList">
                      {datos[key].map((item) => (
                        <li key={item.id}>{item.name}</li>
                      ))}
                      {datos[key].length === 0 && <li>Sin elementos todavía.</li>}
                    </ul>
                  </div>
                ))}
              </div>
            )}

      {error && <p className="loginError" style={{ marginTop: "16px" }}>{error}</p>}
      {mensaje && <p className="uploadSuccess" style={{ marginTop: "16px" }}>{mensaje}</p>}
    </>
  );
}
