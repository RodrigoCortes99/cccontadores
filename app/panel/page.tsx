"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

type Encargo = {
  id: number;
  organizacion: string;
  cliente: string;
  tipo: string;
  tipo_display: string;
  estatus: string;
  estatus_display: string;
  periodo_inicio: string;
  periodo_fin: string;
  nombre: string;
  notas: string;
  creado_en: string;
};

type Cliente = {
  id: number;
  name: string;
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

export default function PanelPage() {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<CurrentUser | null>(null);
  const [encargos, setEncargos] = useState<Encargo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [cliente, setCliente] = useState("");
  const [tipo, setTipo] = useState("asesoria");
  const [estatus, setEstatus] = useState("planeacion");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

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

  async function fetchEncargos() {
    try {
      const token = localStorage.getItem("access");

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/encargos/`, {
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
        setError("No fue posible cargar los encargos.");
        return;
      }

      const data = await res.json();
      setEncargos(data);
    } catch {
      setError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchClientes() {
    try {
      const token = localStorage.getItem("access");

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/`, {
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

      if (!res.ok) return;

      const data = await res.json();
      setClientes(data);
    } catch {
      // silencio por ahora
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
        await fetchEncargos();
        await fetchClientes();
      } catch {
        setError("No fue posible cargar la información del panel.");
        setLoading(false);
      }
    }

    loadAll();
  }, [router]);

  async function handleCreateEncargo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensaje("");
    setError("");

    const token = localStorage.getItem("access");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!cliente) {
      setError("Selecciona un cliente.");
      return;
    }

    try {
      setGuardando(true);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/encargos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizacion: 1,
          cliente: Number(cliente),
          tipo,
          estatus,
          periodo_inicio: periodoInicio,
          periodo_fin: periodoFin,
          nombre,
          notas,
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
            : "No fue posible crear el encargo."
        );
        return;
      }

      setMensaje("Encargo creado correctamente.");
      setNombre("");
      setCliente("");
      setTipo("asesoria");
      setEstatus("planeacion");
      setPeriodoInicio("");
      setPeriodoFin("");
      setNotas("");

      await fetchEncargos();
    } catch {
      setError("Ocurrió un error al guardar el encargo.");
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
            <p className="pageKicker">PANEL</p>
            <h1 className="pageTitle">
              {isClientUser ? "Mis requerimientos" : "Encargos de auditoría"}
            </h1>
            <p className="pageLead">
              {isClientUser
                ? "Consulta tus encargos, revisa las solicitudes PBC y carga evidencia documental."
                : "Consulta los encargos registrados y da seguimiento a sus solicitudes PBC."}
            </p>
          </div>
        </section>

        <section className="pageSection">
          <div className="container">
            {!isClientUser && (
              <div className="uploadCard" style={{ marginBottom: "28px" }}>
                <h2 className="uploadTitle">Nuevo encargo</h2>

                <form onSubmit={handleCreateEncargo} className="uploadForm">
                  <div className="loginField">
                    <label htmlFor="nombre">Nombre del encargo</label>
                    <input
                      id="nombre"
                      type="text"
                      placeholder="Ej. Auditoría Gubernamental 2026"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                  </div>

                  <div className="loginField">
                    <label htmlFor="cliente">Cliente</label>
                    <select
                      id="cliente"
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      required
                    >
                      <option value="">Selecciona un cliente</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="loginField">
                    <label htmlFor="tipo">Tipo</label>
                    <select
                      id="tipo"
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                    >
                      <option value="seguro_social">
                        Auditoría para efectos del Seguro Social
                      </option>
                      <option value="impuestos_estatales">
                        Auditoría de Impuestos Estatales
                      </option>
                      <option value="gubernamental">
                        Auditoría Gubernamental
                      </option>
                      <option value="contabilidad_financiera">
                        Contabilidad Financiera
                      </option>
                      <option value="precios_transferencia">
                        Precios de Transferencia
                      </option>
                      <option value="asesoria">Asesoría</option>
                      <option value="compliance">Compliance</option>
                    </select>
                  </div>

                  <div className="loginField">
                    <label htmlFor="estatus">Estatus</label>
                    <select
                      id="estatus"
                      value={estatus}
                      onChange={(e) => setEstatus(e.target.value)}
                    >
                      <option value="planeacion">Planeación</option>
                      <option value="ejecucion">Ejecución</option>
                      <option value="cierre">Cierre</option>
                      <option value="emitido">Emitido</option>
                    </select>
                  </div>

                  <div className="loginField">
                    <label htmlFor="periodoInicio">Periodo inicio</label>
                    <input
                      id="periodoInicio"
                      type="date"
                      value={periodoInicio}
                      onChange={(e) => setPeriodoInicio(e.target.value)}
                      required
                    />
                  </div>

                  <div className="loginField">
                    <label htmlFor="periodoFin">Periodo fin</label>
                    <input
                      id="periodoFin"
                      type="date"
                      value={periodoFin}
                      onChange={(e) => setPeriodoFin(e.target.value)}
                      required
                    />
                  </div>

                  <div className="loginField">
                    <label htmlFor="notas">Notas</label>
                    <textarea
                      id="notas"
                      rows={4}
                      className="uploadTextarea"
                      placeholder="Observaciones del encargo"
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                    />
                  </div>

                  {error && <p className="loginError">{error}</p>}
                  {mensaje && <p className="uploadSuccess">{mensaje}</p>}

                  <button type="submit" className="loginButton" disabled={guardando}>
                    {guardando ? "Guardando..." : "Crear encargo"}
                  </button>
                </form>
              </div>
            )}

            {loading && <p className="pageText">Cargando encargos...</p>}
            {!loading && error && <p className="loginError">{error}</p>}

            {!loading && !error && encargos.length === 0 && (
              <p className="pageText">
                {isClientUser
                  ? "No tienes encargos asignados."
                  : "No hay encargos registrados."}
              </p>
            )}

            {!loading && encargos.length > 0 && (
              <div className="cardGrid">
                {encargos.map((encargo) => (
                  <article key={encargo.id} className="contentCard">
                    <h2>{encargo.nombre}</h2>
                    <p><strong>Cliente:</strong> {encargo.cliente}</p>
                    <p><strong>Organización:</strong> {encargo.organizacion}</p>
                    <p><strong>Tipo:</strong> {encargo.tipo_display}</p>
                    <p><strong>Estatus:</strong> {encargo.estatus_display}</p>
                    <p>
                      <strong>Periodo:</strong> {encargo.periodo_inicio} al {encargo.periodo_fin}
                    </p>

                    {encargo.notas && (
                      <p><strong>Notas:</strong> {encargo.notas}</p>
                    )}

                    <div className="pageActions">
                      <Link
                        className="cc-btn cc-btn--solid"
                        href={`/panel/encargos/${encargo.id}`}
                      >
                        {isClientUser ? "Ver requerimientos" : "Ver detalle"}
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