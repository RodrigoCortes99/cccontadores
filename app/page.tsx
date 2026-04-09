import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="sitePage">
        <section className="heroBanner heroBanner--home">
          <div className="heroBanner__overlay" />
          <div className="container heroBanner__content">
            <h1>Auditoría y consultoría con respaldo profesional</h1>
            <p>Comprometidos con la ética, calidad y el éxito de tu negocio.</p>
            <div className="heroBanner__actions">
              <Link href="/contacto" className="cc-btn cc-btn--solid">
                Solicitar asesoría
              </Link>
              <Link href="/servicios" className="cc-btn cc-btn--ghost homeWhiteBtn">
                Ver servicios
              </Link>
            </div>
          </div>
        </section>

        <section className="sectionBlock lightSection">
          <div className="container">
            <h2 className="sectionMainTitle">
              Soluciones integrales para el crecimiento financiero
            </h2>
            <p className="sectionMainText">
              En <strong>CC CONTADORES PÚBLICOS, AUDITORES Y CONSULTORES S.C.</strong>,
              nuestra misión es apoyar el desarrollo económico y humano de nuestros clientes,
              guiándonos por principios de ética, calidad y compromiso.
            </p>

            <div className="featureImage featureImage--home" />

            <div className="miniInfoGrid">
              <article className="miniInfoCard">
                <div className="miniInfoIcon">✓</div>
                <div>
                  <h3>Confianza profesional</h3>
                  <p>Equipo con gran experiencia técnica y creativa</p>
                </div>
              </article>

              <article className="miniInfoCard">
                <div className="miniInfoIcon">▣</div>
                <div>
                  <h3>Ambos sectores</h3>
                  <p>Auditoría y consultoría en el sector privado y gubernamental</p>
                </div>
              </article>

              <article className="miniInfoCard">
                <div className="miniInfoIcon">◎</div>
                <div>
                  <h3>Ética y calidad</h3>
                  <p>Compromiso con principios de ética, calidad y desempeño</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="sectionBlock lightSection ptSmall">
          <div className="container">
            <h2 className="sectionMainTitle">Nuestro enfoque de trabajo</h2>
            <p className="sectionMainText narrowText">
              Asesoría especializada orientada al cumplimiento normativo, la reducción
              de riesgos y la toma de decisiones estratégicas.
            </p>

            <div className="approachPanel">
              <div className="approachPanel__grid">
                <article className="approachItem">
                  <div className="approachItem__icon">☑</div>
                  <h3>Diagnóstico preciso</h3>
                  <p>Evaluación detallada de la situación financiera y fiscal.</p>
                </article>

                <article className="approachItem approachItem--middle">
                  <div className="approachItem__icon">✦</div>
                  <h3>Estrategia a la medida</h3>
                  <p>Soluciones alineadas a los objetivos y contexto del cliente.</p>
                </article>

                <article className="approachItem">
                  <div className="approachItem__icon">🤝</div>
                  <h3>Acompañamiento profesional</h3>
                  <p>Seguimiento continuo con rigor técnico y ético.</p>
                </article>
              </div>

              <div className="approachPanel__actions">
                <Link href="/acerca-de" className="cc-btn cc-btn--solid">
                  Conocer más
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="blueBand">
          <div className="container">
            <h2>Impulsando el éxito de nuestros clientes</h2>
            <p>
              Los resultados y testimonios reflejan la confianza que generamos en
              empresas como la tuya
            </p>
          </div>
        </section>

        <section className="sectionBlock lightSection">
          <div className="container">
            <h2 className="sectionMainTitle">Expertos que impulsan tu éxito financiero</h2>
            <p className="sectionMainText">Descubre cómo transformamos retos en oportunidades</p>

            <div className="serviceCardsGrid">
              <article className="serviceShowCard">
                <div className="serviceShowCard__top">
                  <div className="serviceShowCard__check">✓</div>
                  <div>
                    <h3>Consultoría Fiscal</h3>
                    <p>Asesoría personalizada para optimizar tu carga tributaria.</p>
                  </div>
                </div>
                <div
                  className="serviceShowCard__image"
                  style={{ backgroundImage: "url('/home-service-fiscal.jpg')" }}
                />
              </article>

              <article className="serviceShowCard">
                <div className="serviceShowCard__top">
                  <div className="serviceShowCard__check">✓</div>
                  <div>
                    <h3>Auditoría</h3>
                    <p>Examina y fortalece la transparencia de tus operaciones.</p>
                  </div>
                </div>
                <div
                  className="serviceShowCard__image"
                  style={{ backgroundImage: "url('/home-service-auditoria.jpg')" }}
                />
              </article>

              <article className="serviceShowCard">
                <div className="serviceShowCard__top">
                  <div className="serviceShowCard__check">✓</div>
                  <div>
                    <h3>Cumplimiento Corporativo</h3>
                    <p>Garantizamos que tu empresa cumpla con las normativas vigentes.</p>
                  </div>
                </div>
                <div
                  className="serviceShowCard__image"
                  style={{ backgroundImage: "url('/home-service-corporativo.jpg')" }}
                />
              </article>
            </div>

            <ul className="brandBullets">
              <li>Más de 20 años de experiencia en el sector público y privado</li>
              <li>Análisis preciso y estrategias a medida</li>
              <li>Enfoque ético y cumplimiento normativo</li>
            </ul>
          </div>
        </section>

        <section className="sectionBlock portalSection portalSection--higher">
          <div className="container">
            <div className="portalCard">
              <div>
                <p className="portalCard__kicker">Portal privado</p>
                <h2>Acceso al panel documental</h2>
                <p>
                  Ingresa al sistema para consultar encargos, revisar solicitudes PBC
                  y cargar evidencia documental.
                </p>
              </div>

              <div className="portalCard__actions">
                <Link href="/login" className="cc-btn cc-btn--solid">
                  Iniciar sesión
                </Link>
                <Link href="/panel" className="cc-btn cc-btn--ghost">
                  Ir al panel
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="sectionBlock lightSection ctaCenterBlock">
          <div className="container">
            <h2 className="sectionMainTitle">Dedicación y confianza en cada solución brindada</h2>
            <p className="sectionMainText narrowText">
              Descubre cómo nuestros servicios pueden transformar tu negocio y contáctanos hoy.
            </p>
            <div className="centerActions">
              <Link href="/contacto" className="cc-btn cc-btn--solid">
                Más información
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}