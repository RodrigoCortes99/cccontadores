import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ContactoPage() {
  return (
    <>
      <Navbar />
      <main className="page">
        <section className="pageHero">
          <div className="container">
            <p className="pageKicker">CONTACTO</p>
            <h1 className="pageTitle">Estamos listos para atenderte</h1>
            <p className="pageLead">
              Si deseas una asesoría profesional en temas contables, fiscales o de auditoría,
              nuestro equipo está disponible para brindarte atención personalizada.
            </p>
          </div>
        </section>

        <section className="pageSection">
          <div className="container twoCols">
            <div className="contentCard">
              <h2>Medios de contacto</h2>
              <p><strong>Teléfono de oficina:</strong> 22 88 40 88 00</p>
              <p><strong>WhatsApp:</strong> 22 84 03 52 73</p>
              <p><strong>Correo electrónico:</strong> mercadeo@db-system.com</p>
              <p><strong>Horario de atención:</strong> Lunes a viernes de 9:00 a.m. a 6:00 p.m.</p>
            </div>

            <div className="contentCard">
              <h2>Atención profesional</h2>
              <p>
                Atendemos consultas relacionadas con auditoría financiera, consultoría fiscal,
                cumplimiento corporativo y fortalecimiento de procesos administrativos y documentales.
              </p>
              <p>
                Nuestro objetivo es ofrecer respuestas claras, útiles y alineadas a las necesidades
                reales de cada organización.
              </p>

              <div className="pageActions">
                <a className="cc-btn cc-btn--solid" href="tel:+522288408800">
                  Llamar ahora
                </a>
                <a
                  className="cc-btn cc-btn--ghost"
                  href="https://wa.me/522284035273"
                  target="_blank"
                  rel="noreferrer"
                >
                  Enviar WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}