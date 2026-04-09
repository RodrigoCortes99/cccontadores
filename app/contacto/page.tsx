import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactoPage() {
  return (
    <>
      <Navbar />
      <main className="sitePage">
        <section className="heroBanner heroBanner--contact">
          <div className="heroBanner__overlay" />
          <div className="container heroBanner__content heroBanner__content--narrow">
            <h1>Contáctanos</h1>
            <p>Servicios contables y fiscales que impulsan el crecimiento de tu empresa.</p>
          </div>
        </section>

        <section className="sectionBlock lightSection">
          <div className="container">
            <h2 className="sectionMainTitle">Creamos la estrategia ideal para ti.</h2>

            <div className="contactGrid">
              <div className="contactCard">
                <h3>Déjanos un mensaje</h3>
                <p>Estamos listos para escuchar tus necesidades y apoyarte.</p>

                <form className="contactForm">
                  <div className="contactForm__row">
                    <input type="text" placeholder="Nombre completo*" />
                    <input type="text" placeholder="Teléfono*" />
                  </div>

                  <input type="email" placeholder="Correo electrónico*" />
                  <textarea placeholder="Escribe tu mensaje aquí *" rows={5} />
                  <button type="button" className="cc-btn cc-btn--solid">
                    Enviar mensaje
                  </button>
                </form>
              </div>

              <div className="contactCard">
                <h3>Datos de contacto</h3>

                <div className="contactInfoBox">
                  <p>📞 22 88 40 88 00</p>
                  <p>✉ contacto@cc-contadorespublicos.com</p>
                  <p>📍 C Jorullo 95, Aguacatal, 91133 Xalapa-Enríquez, Ver.</p>
                  <p>🟢 22 84 03 52 73</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mapSection mapSection--real">
          <iframe
            title="Ubicación CC Contadores"
            src="https://www.google.com/maps?q=C%20Jorullo%2095,%20Aguacatal,%2091133%20Xalapa-Enríquez,%20Ver.&output=embed"
            width="100%"
            height="620"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      </main>
      <Footer />
    </>
  );
}