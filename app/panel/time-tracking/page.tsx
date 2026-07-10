"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "../../../components/panel/PageHeader";
import LoadingState from "../../../components/panel/LoadingState";
import ErrorState from "../../../components/panel/ErrorState";
import Modal from "../../../components/panel/Modal";
import { useToast } from "../../../components/panel/Toast";
import TimeTrackingNav from "../../../components/TimeTrackingNav";
import RegistroTiempoCampos, {
  Catalogo,
  ClienteOption,
  RegistroFormState,
  registroFormVacio,
  construirPayloadRegistro,
} from "../../../components/panel/RegistroTiempoCampos";
import { apiFetch, apiJson } from "../../../lib/api";
import { usePanelUser } from "../../../lib/PanelUserContext";
import { isPrivileged } from "../../../lib/roles";

type Registro = {
  id: number;
  employee_nombre: string;
  cliente_nombre: string;
  activity_type_nombre: string | null;
  date: string;
  horas_calculadas: number;
  description: string;
  status_display: string;
};

type Meta = {
  monthly_hours_goal: number;
  monthly_activities_goal: number;
};

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function primerDiaDelMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function primerDiaDeLaSemana() {
  const d = new Date();
  const dia = d.getDay(); // 0 = domingo
  const diff = dia === 0 ? 6 : dia - 1; // lunes como inicio de semana
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - diff);
  return lunes.toISOString().slice(0, 10);
}

export default function ResumenControlHorasPage() {
  const { user } = usePanelUser();
  const { showSuccess, showError } = useToast();
  const esPrivilegiado = isPrivileged(user);

  const [registrosMes, setRegistrosMes] = useState<Registro[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [tiposActividad, setTiposActividad] = useState<Catalogo[]>([]);
  const [areas, setAreas] = useState<Catalogo[]>([]);
  const [servicios, setServicios] = useState<Catalogo[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<RegistroFormState>(registroFormVacio());
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  async function cargar() {
    setLoading(true);
    setError("");

    try {
      const [resRegistros, resMeta, resTipos, resAreas, resServicios, resClientes] = await Promise.all([
        apiFetch(`/api/time-tracking/registros/?desde=${primerDiaDelMes()}&hasta=${hoyISO()}`),
        apiFetch("/api/time-tracking/mi-meta/"),
        apiFetch("/api/time-tracking/catalogos/tipos-actividad/"),
        apiFetch("/api/time-tracking/catalogos/areas/"),
        apiFetch("/api/time-tracking/catalogos/servicios/"),
        apiFetch("/api/clientes/"),
      ]);

      if (!resRegistros.ok) {
        setError("No fue posible cargar la información de control de horas.");
        return;
      }

      setRegistrosMes(await resRegistros.json());
      setMeta(resMeta.ok ? await resMeta.json() : null);
      setTiposActividad(resTipos.ok ? await resTipos.json() : []);
      setAreas(resAreas.ok ? await resAreas.json() : []);
      setServicios(resServicios.ok ? await resServicios.json() : []);
      setClientes(resClientes.ok ? await resClientes.json() : []);
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const horasHoy = useMemo(
    () => registrosMes.filter((r) => r.date === hoyISO()).reduce((acc, r) => acc + (r.horas_calculadas || 0), 0),
    [registrosMes]
  );

  const horasSemana = useMemo(() => {
    const inicio = primerDiaDeLaSemana();
    return registrosMes
      .filter((r) => r.date >= inicio)
      .reduce((acc, r) => acc + (r.horas_calculadas || 0), 0);
  }, [registrosMes]);

  const horasMes = useMemo(
    () => registrosMes.reduce((acc, r) => acc + (r.horas_calculadas || 0), 0),
    [registrosMes]
  );

  const actividadesRecientes = useMemo(
    () => [...registrosMes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [registrosMes]
  );

  const clientesOrdenados = useMemo(
    () => [...clientes].sort((a, b) => a.name.localeCompare(b.name)),
    [clientes]
  );

  function abrirModal() {
    setErrorForm("");
    setForm(registroFormVacio());
    setModalAbierto(true);
  }

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    try {
      setGuardando(true);

      const res = await apiJson("/api/time-tracking/registros/", "POST", construirPayloadRegistro(form));
      const data = await res.json();

      if (!res.ok) {
        setErrorForm(typeof data === "object" ? JSON.stringify(data) : "No fue posible guardar el registro.");
        return;
      }

      showSuccess("Registro guardado correctamente.");
      setModalAbierto(false);
      await cargar();
    } catch {
      setErrorForm("Ocurrió un error al guardar el registro.");
      showError("Ocurrió un error al guardar el registro.");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Control de horas" />
        <TimeTrackingNav activo="resumen" esPrivilegiado={esPrivilegiado} />
        <LoadingState label="Cargando resumen..." />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Control de horas" />
        <TimeTrackingNav activo="resumen" esPrivilegiado={esPrivilegiado} />
        <ErrorState message={error} onRetry={cargar} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Control de horas"
        description="Registra el tiempo aplicado a cada cliente. Tarifas e importes se calculan solos y solo los ve un manager, socio o administrador."
        actions={
          <button type="button" className="cc-btn cc-btn--solid" onClick={abrirModal}>
            Registrar tiempo
          </button>
        }
      />

      <TimeTrackingNav activo="resumen" esPrivilegiado={esPrivilegiado} />

      <div className="statGrid">
        <div className="statCard">
          <p className="statCard__label">Horas hoy</p>
          <p className="statCard__value">{Math.round(horasHoy * 100) / 100}</p>
        </div>
        <div className="statCard">
          <p className="statCard__label">Horas esta semana</p>
          <p className="statCard__value">{Math.round(horasSemana * 100) / 100}</p>
        </div>
        <div className="statCard">
          <p className="statCard__label">Horas este mes</p>
          <p className="statCard__value">{Math.round(horasMes * 100) / 100}</p>
          {meta && <p className="statCard__hint">Meta: {meta.monthly_hours_goal} h/mes</p>}
        </div>
        <div className="statCard">
          <p className="statCard__label">Actividades este mes</p>
          <p className="statCard__value">{registrosMes.length}</p>
          {meta && meta.monthly_activities_goal > 0 && (
            <p className="statCard__hint">Meta: {meta.monthly_activities_goal}</p>
          )}
        </div>
      </div>

      <div className="panelCard">
        <h2>Actividades recientes</h2>
        {actividadesRecientes.length === 0 && <p className="pageText">Aún no registras horas este mes.</p>}
        {actividadesRecientes.map((r) => (
          <div key={r.id} className="panelCard__item">
            <strong>{r.cliente_nombre}</strong> · {r.date} · {r.horas_calculadas}h
            {r.activity_type_nombre && ` · ${r.activity_type_nombre}`}
            <p className="pageText">{r.description}</p>
          </div>
        ))}
        <div className="pageActions">
          <Link href="/panel/time-tracking/registros" className="cc-btn cc-btn--outline">
            Ver mis registros
          </Link>
        </div>
      </div>

      <Modal open={modalAbierto} title="Registrar tiempo" onClose={() => setModalAbierto(false)} maxWidth={720}>
        <form onSubmit={handleCrear} className="uploadForm">
          <RegistroTiempoCampos
            valores={form}
            onChange={(campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }))}
            clientes={clientesOrdenados}
            tiposActividad={tiposActividad}
            areas={areas}
            servicios={servicios}
          />

          {errorForm && <p className="loginError">{errorForm}</p>}

          <div className="pageActions">
            <button type="submit" className="loginButton" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar registro"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
