import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ServiciosPage() {
  return (
    <>
      <Navbar />
      <main className="sitePage">
        <section className="heroBanner heroBanner--specialties">
          <div className="heroBanner__overlay" />
          <div className="container heroBanner__content heroBanner__content--narrow">
            <h1>Áreas de especialización</h1>
          </div>
        </section>

        <section className="sectionBlock lightSection">
          <div className="container">
            <div className="specialtiesIntro specialtiesIntro--fixed">
              <div className="specialtiesIntro__text">
                <h2>Soluciones expertas para cada necesidad</h2>
                <p>
                  Acompañamos a empresas y profesionales con servicios especializados
                  que generan claridad, cumplimiento y mejores decisiones financieras.
                </p>
              </div>

              <div className="specialtiesIntro__image" />
            </div>
          </div>
        </section>

        <section className="specialtiesPanelWrap">
          <div className="container">
            <div className="specialtiesCards">
              <article className="specialtyCard">
                <div className="specialtyCard__header">
                  <div className="specialtyCard__icon">◫</div>
                  <div>
                    <div className="specialtyCard__number">01</div>
                    <h3>Contabilidad y finanzas</h3>
                  </div>
                </div>
                <span className="specialtyCard__line" />
                <p>
                  Organizamos tu información financiera para una gestión clara,
                  eficiente y orientada a resultados.
                </p>
              </article>

              <article className="specialtyCard">
                <div className="specialtyCard__header">
                  <div className="specialtyCard__icon">◫</div>
                  <div>
                    <div className="specialtyCard__number">02</div>
                    <h3>Asesoría Fiscal</h3>
                  </div>
                </div>
                <span className="specialtyCard__line" />
                <p>
                  Cumple correctamente con tus obligaciones fiscales y optimiza
                  tu carga tributaria con estrategias seguras.
                </p>
              </article>

              <article className="specialtyCard">
                <div className="specialtyCard__header">
                  <div className="specialtyCard__icon">◫</div>
                  <div>
                    <div className="specialtyCard__number">03</div>
                    <h3>Auditoría y Control</h3>
                  </div>
                </div>
                <span className="specialtyCard__line" />
                <p>
                  Evaluamos tus procesos con objetividad para fortalecer la transparencia
                  y reducir riesgos.
                </p>
              </article>
            </div>

            <div className="specialtiesBottomBar">
              <div className="specialtiesBottomBar__item">Respuesta rápida y oportuna.</div>
              <div className="specialtiesBottomBar__item">Confidencialidad 100% garantizada</div>
              <div className="specialtiesBottomBar__item">Atención personalizada</div>
              <div className="specialtiesBottomBar__item">Estamos listos para impulsar tu crecimiento.</div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}