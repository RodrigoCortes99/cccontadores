import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function PortafolioPage() {
  return (
    <>
      <Navbar />
      <main className="page">
        <section className="pageHero">
          <div className="container">
            <p className="pageKicker">PORTAFOLIO</p>
            <h1 className="pageTitle">Experiencia aplicada a distintos entornos organizacionales</h1>
            <p className="pageLead">
              Nuestra experiencia se enfoca en ofrecer acompañamiento técnico y estratégico en
              organizaciones que requieren orden, cumplimiento y respaldo profesional.
            </p>
          </div>
        </section>

        <section className="pageSection">
          <div className="container cardGrid">
            <article className="contentCard">
              <h2>Sector privado</h2>
              <p>
                Apoyo a empresas que requieren control financiero, cumplimiento fiscal, revisión de
                procesos, soporte documental y fortalecimiento en la toma de decisiones.
              </p>
            </article>

            <article className="contentCard">
              <h2>Sector público</h2>
              <p>
                Acompañamiento en procesos de auditoría, control interno, integración de evidencia,
                seguimiento documental y cumplimiento de disposiciones aplicables.
              </p>
            </article>

            <article className="contentCard">
              <h2>Consultoría especializada</h2>
              <p>
                Soluciones diseñadas para atender necesidades específicas de cada cliente, con un
                enfoque práctico, técnico y orientado a resultados sostenibles.
              </p>
            </article>

            <article className="contentCard">
              <h2>Control documental</h2>
              <p>
                Implementación y orden de información crítica para procesos de revisión, auditoría,
                seguimiento de evidencias y cumplimiento.
              </p>
            </article>

            <article className="contentCard">
              <h2>Prevención de riesgos</h2>
              <p>
                Identificación de áreas de oportunidad y riesgos administrativos, fiscales y
                financieros para fortalecer la operación institucional.
              </p>
            </article>

            <article className="contentCard">
              <h2>Seguimiento profesional</h2>
              <p>
                Nuestro acompañamiento no termina con un informe: buscamos que cada recomendación
                tenga continuidad y aplicación real.
              </p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}