"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "../../../../components/panel/PageHeader";
import TimeTrackingNav from "../../../../components/TimeTrackingNav";

type CurrentUser = {
  id: number;
  role: string | null;
  is_superuser: boolean;
};

type HorasPorCliente = {
  cliente_id: number;
  cliente: string;
  horas: number;
  actividades: number;
  costo_estimado?: number;
};

type HorasPorEmpleado = {
  empleado_id: number;
  empleado: string;
  horas: number;
  actividades: number;
  costo_estimado: number;
};

type ActividadPeriodo = {
  periodo: string;
  horas: number;
  actividades: number;
};

type RankingItem = {
  posicion: number;
  empleado_id: number;
  empleado: string;
  horas: number;
  actividades: number;
};

type RegistroDetalle = {
  id: number;
  date: string;
  cliente_nombre: string;
  servicio_nombre: string | null;
  area_nombre: string | null;
  description: string;
  horas_calculadas: number;
};

// Mientras se cargan los registros de un trabajador ("cargando"), o ya
// resueltos (arreglo, posiblemente vacío). `undefined` = todavía no se pidió.
type DetalleEstado = RegistroDetalle[] | "cargando" | "error";

export default function ReportesTimeTrackingPage() {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [agrupar, setAgrupar] = useState<"dia" | "semana" | "mes">("mes");

  const [horasPorCliente, setHorasPorCliente] = useState<HorasPorCliente[]>([]);
  const [horasPorEmpleado, setHorasPorEmpleado] = useState<HorasPorEmpleado[]>([]);
  const [actividadesPorPeriodo, setActividadesPorPeriodo] = useState<ActividadPeriodo[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  // Detalle expandible de "Horas por contador": qué actividades concretas
  // hizo cada trabajador, no solo el total agregado. Se pide bajo demanda
  // (al expandir) y se cachea por empleado para no repetir la petición.
  const [empleadoAbierto, setEmpleadoAbierto] = useState<number | null>(null);
  const [detallesPorEmpleado, setDetallesPorEmpleado] = useState<Record<number, DetalleEstado>>({});

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

  function construirQuery(extra: Record<string, string> = {}) {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    Object.entries(extra).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return params.toString();
  }

  async function fetchMe() {
    const data = await apiGet("/api/me/");
    if (data) setUserInfo(data);
    return data;
  }

  async function cargarReportes(esPriv: boolean) {
    const query = construirQuery();

    const tareas: Promise<void>[] = [
      apiGet(`/api/time-tracking/reportes/horas-por-cliente/?${query}`).then((d) => {
        if (d) setHorasPorCliente(d);
      }),
      apiGet(`/api/time-tracking/reportes/actividades-por-periodo/?${construirQuery({ agrupar })}`).then(
        (d) => {
          if (d) setActividadesPorPeriodo(d);
        }
      ),
      apiGet(`/api/time-tracking/reportes/ranking-productividad/?${query}`).then((d) => {
        if (d) setRanking(d);
      }),
    ];

    if (esPriv) {
      tareas.push(
        apiGet(`/api/time-tracking/reportes/horas-por-empleado/?${query}`).then((d) => {
          if (d) setHorasPorEmpleado(d);
        })
      );
    }

    await Promise.all(tareas);
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
        if (me && me.role === "client" && !me.is_superuser) {
          setError("No tienes permiso para ver esta sección.");
          setLoading(false);
          return;
        }
        const esPriv = !!(me?.is_superuser || me?.role === "manager" || me?.role === "partner");
        await cargarReportes(esPriv);
      } catch {
        setError("No fue posible cargar los reportes.");
      } finally {
        setLoading(false);
      }
    }

    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function aplicarFiltros() {
    setLoading(true);
    // El detalle por trabajador ya cargado quedó calculado con el rango de
    // fechas anterior: se descarta para no mostrar actividades que no
    // corresponden al nuevo filtro.
    setDetallesPorEmpleado({});
    setEmpleadoAbierto(null);
    await cargarReportes(!!esPrivilegiado);
    setLoading(false);
  }

  async function alternarDetalleEmpleado(empleadoId: number) {
    if (empleadoAbierto === empleadoId) {
      setEmpleadoAbierto(null);
      return;
    }

    setEmpleadoAbierto(empleadoId);

    if (detallesPorEmpleado[empleadoId] !== undefined) return;

    setDetallesPorEmpleado((prev) => ({ ...prev, [empleadoId]: "cargando" }));
    const query = construirQuery({ empleado: String(empleadoId) });
    const data = await apiGet(`/api/time-tracking/registros/?${query}`);

    setDetallesPorEmpleado((prev) => ({
      ...prev,
      [empleadoId]: Array.isArray(data) ? data : "error",
    }));
  }

  async function descargarArchivo(path: string, nombreArchivo: string) {
    setError("");
    const token = tokenOrRedirect();
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError("No fue posible generar el archivo.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Ocurrió un error al descargar el archivo.");
    }
  }

  if (!loading && error === "No tienes permiso para ver esta sección.") {
    return (
      <>
        <PageHeader title="Reportes" />
        <p className="loginError">{error}</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Horas por cliente, por contador, actividades por periodo y ranking de productividad."
      />

      <TimeTrackingNav activo="reportes" esPrivilegiado={!!esPrivilegiado} />

            <div className="uploadCard" style={{ marginBottom: "28px" }}>
              <h2 className="uploadTitle">Filtros</h2>
              <div className="twoCols">
                <div className="loginField">
                  <label>Desde</label>
                  <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                </div>
                <div className="loginField">
                  <label>Hasta</label>
                  <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                </div>
              </div>
              <div className="loginField">
                <label>Agrupar actividades por</label>
                <select value={agrupar} onChange={(e) => setAgrupar(e.target.value as "dia" | "semana" | "mes")}>
                  <option value="dia">Día</option>
                  <option value="semana">Semana</option>
                  <option value="mes">Mes</option>
                </select>
              </div>
              <div className="pageActions">
                <button type="button" className="cc-btn cc-btn--solid" onClick={aplicarFiltros}>
                  Aplicar filtros
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--outline"
                  onClick={() =>
                    descargarArchivo(
                      `/api/time-tracking/registros/exportar/xlsx/?${construirQuery()}`,
                      "registro_de_horas.xlsx"
                    )
                  }
                >
                  Exportar Excel
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--outline"
                  onClick={() =>
                    descargarArchivo(
                      `/api/time-tracking/registros/exportar/pdf/?${construirQuery()}`,
                      "registro_de_horas.pdf"
                    )
                  }
                >
                  Exportar PDF
                </button>
              </div>
            </div>

            {error && <p className="loginError">{error}</p>}
            {loading && <p className="pageText">Cargando reportes...</p>}

            {!loading && (
              <>
                <div className="uploadCard" style={{ marginBottom: "28px" }}>
                  <h2 className="uploadTitle">Horas por cliente</h2>
                  {horasPorCliente.length === 0 && <p className="pageText">Sin datos en este rango.</p>}
                  {horasPorCliente.map((row) => (
                    <p key={row.cliente_id} className="pageText">
                      <strong>{row.cliente}:</strong> {row.horas} h · {row.actividades} actividades
                      {row.costo_estimado !== undefined && <> · ${row.costo_estimado} estimado</>}
                    </p>
                  ))}
                </div>

                {esPrivilegiado && (
                  <div className="uploadCard" style={{ marginBottom: "28px" }}>
                    <h2 className="uploadTitle">Horas por contador</h2>
                    <p className="pageText" style={{ marginTop: -4, marginBottom: 14 }}>
                      Haz clic en un nombre para ver qué actividades registró.
                    </p>
                    {horasPorEmpleado.length === 0 && <p className="pageText">Sin datos en este rango.</p>}
                    {horasPorEmpleado.map((row) => {
                      const abierto = empleadoAbierto === row.empleado_id;
                      const detalle = detallesPorEmpleado[row.empleado_id];

                      return (
                        <div key={row.empleado_id} className="reporteEmpleado">
                          <button
                            type="button"
                            className="reporteEmpleado__toggle"
                            onClick={() => alternarDetalleEmpleado(row.empleado_id)}
                            aria-expanded={abierto}
                          >
                            <span>
                              <strong>{row.empleado}:</strong> {row.horas} h · {row.actividades} actividades · $
                              {row.costo_estimado} estimado
                            </span>
                            <span className="reporteEmpleado__chevron" aria-hidden="true">
                              {abierto ? "▴" : "▾"}
                            </span>
                          </button>

                          {abierto && (
                            <div className="reporteEmpleado__detalle">
                              {detalle === "cargando" && (
                                <p className="pageText">Cargando actividades...</p>
                              )}
                              {detalle === "error" && (
                                <p className="loginError">No fue posible cargar sus actividades.</p>
                              )}
                              {Array.isArray(detalle) && detalle.length === 0 && (
                                <p className="pageText">Sin actividades registradas en este rango.</p>
                              )}
                              {Array.isArray(detalle) &&
                                detalle.map((r) => (
                                  <div key={r.id} className="reporteEmpleado__item">
                                    <div className="reporteEmpleado__itemHead">
                                      <span className="reporteEmpleado__itemFecha">{r.date}</span>
                                      <span className="reporteEmpleado__itemCliente">{r.cliente_nombre}</span>
                                      <span className="reporteEmpleado__itemHoras">{r.horas_calculadas} h</span>
                                    </div>
                                    {(r.servicio_nombre || r.area_nombre) && (
                                      <p className="reporteEmpleado__itemMeta">
                                        {[r.servicio_nombre, r.area_nombre].filter(Boolean).join(" · ")}
                                      </p>
                                    )}
                                    <p className="reporteEmpleado__itemDesc">{r.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="uploadCard" style={{ marginBottom: "28px" }}>
                  <h2 className="uploadTitle">Actividades por {agrupar}</h2>
                  {actividadesPorPeriodo.length === 0 && <p className="pageText">Sin datos en este rango.</p>}
                  {actividadesPorPeriodo.map((row) => (
                    <p key={row.periodo} className="pageText">
                      <strong>{row.periodo}:</strong> {row.horas} h · {row.actividades} actividades
                    </p>
                  ))}
                </div>

                <div className="uploadCard">
                  <h2 className="uploadTitle">Ranking de productividad</h2>
                  {ranking.length === 0 && <p className="pageText">Sin datos en este rango.</p>}
                  {ranking.map((row) => (
                    <p key={row.empleado_id} className="pageText">
                      <strong>
                        {row.posicion}. {row.empleado}
                      </strong>{" "}
                      — {row.horas} h · {row.actividades} actividades
                    </p>
                  ))}
                </div>
              </>
            )}
    </>
  );
}
