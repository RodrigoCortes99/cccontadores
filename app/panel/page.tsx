"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "../../components/panel/PageHeader";
import LoadingState from "../../components/panel/LoadingState";
import ErrorState from "../../components/panel/ErrorState";
import StatusBadge, { toneForEstatus } from "../../components/panel/StatusBadge";
import { apiFetch } from "../../lib/api";
import { usePanelUser } from "../../lib/PanelUserContext";
import { isClientRole } from "../../lib/roles";

type Encargo = {
  id: number;
  organizacion: string;
  cliente: string;
  nombre: string;
  estatus: string;
  estatus_display: string;
  creado_en: string;
};

type Solicitud = {
  id: number;
  encargo: string;
  encargo_id: number;
  cliente_nombre: string;
  titulo: string;
  estatus: string;
  estatus_display: string;
  estatus_calculado: string;
  estatus_calculado_display: string;
  fecha_compromiso: string | null;
  fecha_recibido: string | null;
  documentos_count: number;
  creado_en: string;
};

type Registro = {
  horas_calculadas: number;
};

const ESTATUS_ENCARGO_ACTIVOS = ["planeacion", "ejecucion"];
const DIAS_PROXIMO_VENCIMIENTO = 14;
const DIAS_ACTIVIDAD_RECIENTE = 14;

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function primerDiaDelMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function diasEntre(fechaISO: string): number {
  const hoy = new Date(hoyISO());
  const fecha = new Date(fechaISO);
  return Math.round((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { user } = usePanelUser();
  const esCliente = isClientRole(user);

  const [encargos, setEncargos] = useState<Encargo[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [horasDelMes, setHorasDelMes] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    setLoading(true);
    setError("");

    try {
      const [resEncargos, resSolicitudes] = await Promise.all([
        apiFetch("/api/encargos/"),
        apiFetch("/api/pbc/solicitudes/"),
      ]);

      if (!resEncargos.ok) {
        setError("No fue posible cargar la información del dashboard.");
        setLoading(false);
        return;
      }
      setEncargos(await resEncargos.json());
      setSolicitudes(resSolicitudes.ok ? await resSolicitudes.json() : []);

      if (!esCliente) {
        const resHoras = await apiFetch(
          `/api/time-tracking/registros/?desde=${primerDiaDelMes()}&hasta=${hoyISO()}`
        );
        if (resHoras.ok) {
          const dataHoras: Registro[] = await resHoras.json();
          const total = dataHoras.reduce((acc, r) => acc + (r.horas_calculadas || 0), 0);
          setHorasDelMes(Math.round(total * 100) / 100);
        }
      }
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esCliente]);

  const encargosActivos = useMemo(
    () => encargos.filter((e) => ESTATUS_ENCARGO_ACTIVOS.includes(e.estatus)),
    [encargos]
  );

  const solicitudesPendientes = useMemo(
    () => solicitudes.filter((s) => s.estatus === "pendiente" || s.estatus === "incompleto"),
    [solicitudes]
  );

  const solicitudesVencidas = useMemo(
    () =>
      solicitudes.filter(
        (s) => s.fecha_compromiso && diasEntre(s.fecha_compromiso) < 0 && s.estatus !== "aprobado"
      ),
    [solicitudes]
  );

  const documentosRecientes = useMemo(
    () =>
      solicitudes.filter(
        (s) => s.fecha_recibido && diasEntre(s.fecha_recibido) >= -DIAS_ACTIVIDAD_RECIENTE
      ),
    [solicitudes]
  );

  const proximosVencimientos = useMemo(
    () =>
      solicitudes
        .filter(
          (s) =>
            s.fecha_compromiso &&
            diasEntre(s.fecha_compromiso) >= 0 &&
            diasEntre(s.fecha_compromiso) <= DIAS_PROXIMO_VENCIMIENTO &&
            s.estatus !== "aprobado"
        )
        .sort((a, b) => (a.fecha_compromiso || "").localeCompare(b.fecha_compromiso || ""))
        .slice(0, 6),
    [solicitudes]
  );

  const requierenAtencion = useMemo(
    () =>
      solicitudes
        .filter(
          (s) =>
            s.estatus === "incompleto" ||
            s.estatus_calculado === "requiere_accion" ||
            (s.fecha_compromiso && diasEntre(s.fecha_compromiso) < 0)
        )
        .slice(0, 6),
    [solicitudes]
  );

  const actividadReciente = useMemo(() => {
    const itemsEncargos = encargos
      .filter((e) => diasEntre(e.creado_en.slice(0, 10)) >= -DIAS_ACTIVIDAD_RECIENTE)
      .map((e) => ({
        fecha: e.creado_en,
        texto: `Nuevo encargo: ${e.nombre} (${e.cliente})`,
      }));

    const itemsSolicitudes = solicitudes
      .filter((s) => diasEntre(s.creado_en.slice(0, 10)) >= -DIAS_ACTIVIDAD_RECIENTE)
      .map((s) => ({
        fecha: s.creado_en,
        texto: `Nueva solicitud PBC: ${s.titulo} (${s.cliente_nombre})`,
      }));

    return [...itemsEncargos, ...itemsSolicitudes]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 8);
  }, [encargos, solicitudes]);

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <LoadingState label="Cargando información..." />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorState message={error} onRetry={cargarDatos} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Hola, ${user?.username || ""}`}
        description="Esto es lo que necesita tu atención hoy."
      />

      <div className="statGrid">
        <div className="statCard">
          <p className="statCard__label">Encargos activos</p>
          <p className="statCard__value">{encargosActivos.length}</p>
          <p className="statCard__hint">{encargos.length} en total</p>
        </div>

        <div className="statCard">
          <p className="statCard__label">Solicitudes PBC pendientes</p>
          <p className="statCard__value">{solicitudesPendientes.length}</p>
        </div>

        <div className="statCard">
          <p className="statCard__label">Solicitudes vencidas</p>
          <p className="statCard__value">{solicitudesVencidas.length}</p>
        </div>

        <div className="statCard">
          <p className="statCard__label">Documentos recibidos recientemente</p>
          <p className="statCard__value">{documentosRecientes.length}</p>
          <p className="statCard__hint">Últimos {DIAS_ACTIVIDAD_RECIENTE} días</p>
        </div>

        {!esCliente && (
          <div className="statCard">
            <p className="statCard__label">Horas registradas en el mes</p>
            <p className="statCard__value">{horasDelMes ?? "—"}</p>
          </div>
        )}
      </div>

      <div className="dashboardGrid">
        <div>
          <div className="panelCard">
            <h2>Solicitudes que requieren atención</h2>
            {requierenAtencion.length === 0 && <p className="pageText">Nada pendiente por ahora.</p>}
            {requierenAtencion.map((s) => (
              <div key={s.id} className="panelCard__item">
                <strong>{s.titulo}</strong> · {s.cliente_nombre}{" "}
                <StatusBadge label={s.estatus_calculado_display} tone={toneForEstatus(s.estatus_calculado)} />
              </div>
            ))}
          </div>

          <div className="panelCard">
            <h2>Próximos vencimientos</h2>
            {proximosVencimientos.length === 0 && (
              <p className="pageText">No hay compromisos en los próximos {DIAS_PROXIMO_VENCIMIENTO} días.</p>
            )}
            {proximosVencimientos.map((s) => (
              <div key={s.id} className="panelCard__item">
                <strong>{s.fecha_compromiso}</strong> — {s.titulo} · {s.cliente_nombre}
              </div>
            ))}
          </div>

          <div className="panelCard">
            <h2>Actividad reciente</h2>
            {actividadReciente.length === 0 && <p className="pageText">Sin actividad reciente.</p>}
            {actividadReciente.map((item, idx) => (
              <div key={idx} className="panelCard__item">
                {item.texto}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="panelCard">
            <h2>Accesos rápidos</h2>
            <div className="quickActionsGrid">
              {!esCliente && (
                <Link href="/panel/encargos" className="cc-btn cc-btn--solid">
                  + Nuevo encargo
                </Link>
              )}
              <Link href="/panel/encargos" className="cc-btn cc-btn--outline">
                + Nueva solicitud PBC
              </Link>
              {!esCliente && (
                <Link href="/panel/time-tracking/registros?nuevo=1" className="cc-btn cc-btn--outline">
                  + Registrar horas
                </Link>
              )}
              {!esCliente && (
                <Link href="/panel/clientes" className="cc-btn cc-btn--outline">
                  + Nuevo cliente
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
