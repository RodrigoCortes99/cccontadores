import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ExperienciaPage() {
  return (
    <>
      <Navbar />
      <main className="sitePage">
        <section className="heroBanner heroBanner--experience">
          <div className="heroBanner__overlay" />
          <div className="container heroBanner__content heroBanner__content--narrow">
            <h1>Experiencia que respalda cada decisión</h1>
            <p>
              Más de 20 años acompañando a empresas y profesionales en su crecimiento financiero.
            </p>
            <div className="heroBanner__actions">
              <Link href="/contacto" className="cc-btn cc-btn--solid">
                Contáctanos
              </Link>
            </div>
          </div>
        </section>

        <section className="sectionBlock lightSection">
          <div className="container">
            <h2 className="sectionMainTitle">Confianza construida con el tiempo</h2>

            <div className="experienceTextBlock">
              <p>
                En CC Contadores Públicos, Auditores y Consultores S.C., contamos con una sólida
                trayectoria brindando servicios contables, fiscales y financieros tanto en el
                sector público como privado.
              </p>
              <p>
                Nuestra experiencia nos permite entender las necesidades de cada cliente y ofrecer
                soluciones precisas, adaptadas a un entorno empresarial en constante cambio.
              </p>
            </div>

            <div className="experienceStats">
              <div className="experienceStats__item">
                <strong>+20</strong>
                <span>Años de experiencia</span>
              </div>
              <div className="experienceStats__item">
                <strong>+150</strong>
                <span>clientes atendidos</span>
              </div>
              <div className="experienceStats__item">
                <strong>100%</strong>
                <span>cumplimiento normativo</span>
              </div>
              <div className="experienceStats__item experienceStats__item--text">
                <strong>Atención</strong>
                <strong>Personalizada</strong>
              </div>
            </div>

            <div className="experienceImage" />
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