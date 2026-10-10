"use client";

import {formErrorMessage} from '@/lib/formErrors';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "../../../../components/panel/PageHeader";
import TimeTrackingNav from "../../../../components/TimeTrackingNav";

type CurrentUser = {
  id: number;
  role: string | null;
  is_superuser: boolean;
};

type PerfilProductividad = {
  id: number;
  internal_hourly_cost: number;
  monthly_hours_goal: number;
  monthly_activities_goal: number;
  is_active: boolean;
};

type Empleado = {
  id: number;
  username: string;
  nombre_completo: string;
  role: string;
  perfil_productividad: PerfilProductividad | null;
};

type FormPerfil = {
  internal_hourly_cost: string;
  monthly_hours_goal: string;
  monthly_activities_goal: string;
};

export default function ProductividadPage() {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<CurrentUser | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [formularios, setFormularios] = useState<Record<number, FormPerfil>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardandoId, setGuardandoId] = useState<number | null>(null);

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

  async function fetchEmpleados() {
    const data = await apiGet("/api/time-tracking/empleados/");
    if (data) {
      setEmpleados(data);
      const iniciales: Record<number, FormPerfil> = {};
      data.forEach((emp: Empleado) => {
        iniciales[emp.id] = {
          internal_hourly_cost: emp.perfil_productividad
            ? String(emp.perfil_productividad.internal_hourly_cost)
            : "0",
          monthly_hours_goal: emp.perfil_productividad
            ? String(emp.perfil_productividad.monthly_hours_goal)
            : "160",
          monthly_activities_goal: emp.perfil_productividad
            ? String(emp.perfil_productividad.monthly_activities_goal)
            : "0",
        };
      });
      setFormularios(iniciales);
    }
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
        await fetchEmpleados();
      } catch {
        setError("No fue posible cargar los perfiles de productividad.");
      } finally {
        setLoading(false);
      }
    }

    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function guardarPerfil(empleado: Empleado) {
    setError("");
    setMensaje("");

    const token = tokenOrRedirect();
    if (!token) return;

    const form = formularios[empleado.id];
    const payload = {
      user: empleado.id,
      internal_hourly_cost: form.internal_hourly_cost || "0",
      monthly_hours_goal: form.monthly_hours_goal || "0",
      monthly_activities_goal: form.monthly_activities_goal || "0",
      is_active: true,
    };

    try {
      setGuardandoId(empleado.id);

      const url = empleado.perfil_productividad
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/time-tracking/perfiles/${empleado.perfil_productividad.id}/`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/time-tracking/perfiles/`;

      const res = await fetch(url, {
        method: empleado.perfil_productividad ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(formErrorMessage(data, "No fue posible guardar el perfil."));
        return;
      }

      setMensaje(`Perfil de ${empleado.nombre_completo} actualizado.`);
      await fetchEmpleados();
    } catch {
      setError("Ocurrió un error al guardar el perfil.");
    } finally {
      setGuardandoId(null);
    }
  }

  if (!loading && !esPrivilegiado) {
    return (
      <>
        <PageHeader title="Perfiles de productividad" />
        <p className="loginError">{error || "No tienes permiso para ver esta sección."}</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Perfiles de productividad"
        description="Define la tarifa hora interna y las metas mensuales de cada contador. Esta información nunca la ve el propio empleado, solo se usa para calcular costo e importes en los reportes."
      />

      <TimeTrackingNav activo="productividad" esPrivilegiado={!!esPrivilegiado} />

            {loading && <p className="pageText">Cargando empleados...</p>}

            {error && <p className="loginError">{error}</p>}
            {mensaje && <p className="uploadSuccess">{mensaje}</p>}

            {!loading && empleados.length === 0 && (
              <p className="pageText">No hay contadores registrados en tu organización.</p>
            )}

            {!loading && empleados.length > 0 && (
              <div className="cardGrid">
                {empleados.map((emp) => {
                  const form = formularios[emp.id] || {
                    internal_hourly_cost: "0",
                    monthly_hours_goal: "160",
                    monthly_activities_goal: "0",
                  };

                  return (
                    <div key={emp.id} className="uploadCard">
                      <h2 className="uploadTitle">{emp.nombre_completo}</h2>
                      <p className="pageText">Rol: {emp.role}</p>

                      <div className="loginField">
                        <label>Tarifa hora (costo interno)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.internal_hourly_cost}
                          onChange={(e) =>
                            setFormularios((prev) => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], internal_hourly_cost: e.target.value },
                            }))
                          }
                        />
                      </div>

                      <div className="loginField">
                        <label>Meta de horas mensuales</label>
                        <input
                          type="number"
                          min="0"
                          value={form.monthly_hours_goal}
                          onChange={(e) =>
                            setFormularios((prev) => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], monthly_hours_goal: e.target.value },
                            }))
                          }
                        />
                      </div>

                      <div className="loginField">
                        <label>Meta de actividades mensuales</label>
                        <input
                          type="number"
                          min="0"
                          value={form.monthly_activities_goal}
                          onChange={(e) =>
                            setFormularios((prev) => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], monthly_activities_goal: e.target.value },
                            }))
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="loginButton"
                        onClick={() => guardarPerfil(emp)}
                        disabled={guardandoId === emp.id}
                      >
                        {guardandoId === emp.id ? "Guardando..." : "Guardar perfil"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
    </>
  );
}
