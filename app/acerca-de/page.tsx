import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function AcercaDePage() {
  return (
    <>
      <Navbar />
      <main className="page">
        <section className="pageHero">
          <div className="container">
            <p className="pageKicker">ACERCA DE</p>
            <h1 className="pageTitle">Respaldo profesional para decisiones con mayor certeza</h1>
            <p className="pageLead">
              En CC Contadores Públicos, Auditores y Consultores S.C. trabajamos con un enfoque
              basado en la ética, la calidad técnica y el compromiso con cada cliente, ofreciendo
              soluciones confiables para fortalecer su operación financiera, fiscal y administrativa.
            </p>
          </div>
        </section>

        <section className="pageSection">
          <div className="container twoCols">
            <div className="contentCard">
              <h2>Quiénes somos</h2>
              <p>
                Somos una firma especializada en auditoría, consultoría y cumplimiento, integrada
                por profesionales comprometidos con generar confianza y valor en cada proyecto.
              </p>
              <p>
                Nuestro trabajo está orientado a brindar claridad, orden y respaldo técnico a
                empresas del sector privado, así como a organismos e instituciones del sector público.
              </p>
            </div>

            <div className="contentCard">
              <h2>Nuestra visión</h2>
              <p>
                Aspiramos a ser una firma de referencia por la calidad de nuestros servicios, la
                integridad de nuestros procesos y la capacidad de acompañar a nuestros clientes en
                sus decisiones más importantes.
              </p>
              <p>
                Creemos en relaciones profesionales duraderas, construidas con confianza,
                transparencia y resultados.
              </p>
            </div>

            <div className="contentCard">
              <h2>Nuestra misión</h2>
              <p>
                Brindar soluciones contables, fiscales y de auditoría que permitan a nuestros
                clientes operar con mayor seguridad, cumplimiento normativo y eficiencia.
              </p>
            </div>

            <div className="contentCard">
              <h2>Nuestros valores</h2>
              <p>
                Ética profesional, calidad técnica, responsabilidad, confidencialidad y compromiso
                con la mejora continua.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}