import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ServiciosPage() {
  return (
    <>
      <Navbar />
      <main className="page">
        <section className="pageHero">
          <div className="container">
            <p className="pageKicker">SERVICIOS</p>
            <h1 className="pageTitle">Servicios diseñados para fortalecer tu operación</h1>
            <p className="pageLead">
              Brindamos soluciones profesionales orientadas a la transparencia, el cumplimiento
              normativo y el crecimiento sostenible de cada organización.
            </p>
          </div>
        </section>

        <section className="pageSection">
          <div className="container cardGrid">
            <article className="serviceBox">
              <h2>Auditoría financiera</h2>
              <p>
                Revisión profesional de información financiera, controles y evidencia documental
                para fortalecer la transparencia y confiabilidad de la operación.
              </p>
            </article>

            <article className="serviceBox">
              <h2>Consultoría fiscal</h2>
              <p>
                Asesoría para el cumplimiento de obligaciones tributarias, prevención de riesgos y
                mejora de procesos en materia fiscal.
              </p>
            </article>

            <article className="serviceBox">
              <h2>Cumplimiento corporativo</h2>
              <p>
                Acompañamiento en el fortalecimiento del cumplimiento normativo, control interno y
                documentación de soporte.
              </p>
            </article>

            <article className="serviceBox">
              <h2>Control documental</h2>
              <p>
                Organización, seguimiento y validación de evidencia para procesos de auditoría,
                revisión y atención de requerimientos.
              </p>
            </article>

            <article className="serviceBox">
              <h2>Asesoría administrativa</h2>
              <p>
                Apoyo en la mejora de procesos administrativos, reducción de riesgos y desarrollo
                de prácticas de mayor control.
              </p>
            </article>

            <article className="serviceBox">
              <h2>Atención especializada</h2>
              <p>
                Cada servicio se adapta a la realidad de la organización, con enfoque técnico,
                práctico y orientado a resultados.
              </p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}