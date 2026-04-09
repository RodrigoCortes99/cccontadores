import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AcercaDePage() {
  return (
    <>
      <Navbar />
      <main className="sitePage">
        <section className="heroBanner heroBanner--about">
          <div className="heroBanner__overlay" />
          <div className="container heroBanner__content heroBanner__content--narrow">
            <h1>
              Nuestro compromiso es acompañarte con asesoría
              contable, fiscal y financiera confiable.
            </h1>
          </div>
        </section>

        <section className="sectionBlock lightSection">
          <div className="container">
            <div className="aboutSplitCard aboutSplitCard--fixed">
              <div className="aboutSplitCard__content">
                <p className="smallKicker">Acerca de</p>
                <h2>¿Quiénes somos?</h2>

                <p>
                  En <strong>CC Contadores Públicos, Auditores y Consultores S.C.</strong>,
                  somos un despacho especializado en servicios contables, fiscales y financieros.
                  Nuestro objetivo es brindar asesoría profesional que permita a empresas y
                  emprendedores tomar decisiones informadas, cumplir con sus obligaciones fiscales
                  y fortalecer su crecimiento en un entorno empresarial cada vez más dinámico.
                </p>

                <h3>
                  Brindamos servicios profesionales de la más alta calidad en material contable
                  fiscal y consultoría de negocio
                </h3>

                <ul className="checkList">
                  <li>Honestidad</li>
                  <li>Integridad</li>
                  <li>Ética profesional</li>
                  <li>Innovación</li>
                </ul>

                <Link href="/contacto" className="cc-btn cc-btn--solid">
                  Contáctanos
                </Link>
              </div>

              <div className="aboutSplitCard__image" />
            </div>

            <div className="visionMissionGrid">
              <article>
                <h3>Visión</h3>
                <span className="titleLine" />
                <p>
                  Posicionarnos como un despacho contable de referencia a nivel regional,
                  reconocido por la confianza, la precisión y el compromiso con nuestros clientes.
                  Buscamos ser aliados estratégicos en el crecimiento de cada empresa, adaptándonos
                  a los cambios del entorno y aportando soluciones financieras que generen estabilidad
                  y proyección a largo plazo.
                </p>
              </article>

              <article>
                <h3>Misión</h3>
                <span className="titleLine" />
                <p>
                  Brindar servicios contables, fiscales y financieros con un enfoque profesional,
                  ético y personalizado, acompañando a nuestros clientes en la toma de decisiones clave.
                  Nos enfocamos en ofrecer claridad, cumplimiento normativo y estrategias que optimicen
                  la gestión de sus recursos.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="bottomBlueCta">
          <div className="container">
            <h2>Impulsa tu empresa con respaldo financiero profesional</h2>
            <p>
              Te acompañamos con soluciones contables y fiscales diseñadas para crecer contigo.
            </p>
            <Link href="/contacto" className="cc-btn cc-btn--ghost homeWhiteBtn">
              Contáctanos
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}