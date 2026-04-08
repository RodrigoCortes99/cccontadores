"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";
import PanelBack from "../../../../components/PanelBack";

type Documento = {
  id: number;
  solicitud: number;
  version: number;
  nombre: string;
  archivo: string;
  estatus: string;
  estatus_display: string;
  observaciones: string;
  subido_por: string;
  subido_en: string;
};

export default function DocumentosPBCPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function fetchDocumentos() {
    try {
      const token = localStorage.getItem("access");

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pbc/${id}/documentos/`, {
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
        setError("No fue posible cargar los documentos.");
        return;
      }

      const data = await res.json();
      setDocumentos(data);
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
      fetchDocumentos();
    }
  }, [id, router]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!archivo) {
      setError("Selecciona un archivo.");
      return;
    }

    try {
      const token = localStorage.getItem("access");

      if (!token) {
        router.push("/login");
        return;
      }

      setSubiendo(true);

      const formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("nombre", nombre || archivo.name);
      formData.append("observaciones", observaciones);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pbc/${id}/documentos/subir/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setError(data.detail || "No fue posible subir el documento.");
        return;
      }

      setMensaje("Documento subido correctamente.");
      setArchivo(null);
      setNombre("");
      setObservaciones("");

      const fileInput = document.getElementById("archivo") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      await fetchDocumentos();
    } catch {
      setError("Ocurrió un error al subir el archivo.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="pageHero">
          <div className="container">
            <p className="pageKicker">DOCUMENTOS</p>
            <h1 className="pageTitle">Evidencia PBC</h1>
            <p className="pageLead">
              Consulta los documentos cargados para esta solicitud y sube nueva evidencia.
            </p>
          </div>
        </section>

        <section className="pageSection">
          <div className="container">
            <PanelBack backLabel="Volver a solicitudes" panelHref="/panel" />

            <div className="uploadCard">
              <h2 className="uploadTitle">Subir documento</h2>

              <form onSubmit={handleUpload} className="uploadForm">
                <div className="loginField">
                  <label htmlFor="archivo">Archivo</label>
                  <input
                    id="archivo"
                    type="file"
                    onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <div className="loginField">
                  <label htmlFor="nombre">Nombre del documento</label>
                  <input
                    id="nombre"
                    type="text"
                    placeholder="Ej. Balanza enero 2025"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div className="loginField">
                  <label htmlFor="observaciones">Observaciones</label>
                  <textarea
                    id="observaciones"
                    placeholder="Notas o comentarios del archivo"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={4}
                    className="uploadTextarea"
                  />
                </div>

                {error && <p className="loginError">{error}</p>}
                {mensaje && <p className="uploadSuccess">{mensaje}</p>}

                <button type="submit" className="loginButton" disabled={subiendo}>
                  {subiendo ? "Subiendo..." : "Subir documento"}
                </button>
              </form>
            </div>

            <div style={{ height: "28px" }} />

            {loading && <p className="pageText">Cargando documentos...</p>}

            {!loading && !error && documentos.length === 0 && (
              <p className="pageText">No hay documentos cargados.</p>
            )}

            {!loading && documentos.length > 0 && (
              <div className="cardGrid">
                {documentos.map((doc) => (
                  <article key={doc.id} className="contentCard">
                    <h2>{doc.nombre}</h2>
                    <p><strong>Versión:</strong> {doc.version}</p>
                    <p><strong>Estatus:</strong> {doc.estatus_display}</p>
                    <p><strong>Subido por:</strong> {doc.subido_por}</p>
                    <p><strong>Fecha:</strong> {doc.subido_en}</p>

                    {doc.observaciones && (
                      <p><strong>Observaciones:</strong> {doc.observaciones}</p>
                    )}

                    <div className="pageActions">
                      <a
                        className="cc-btn cc-btn--solid"
                        href={doc.archivo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver archivo
                      </a>
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