import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contáctanos: C Jorullo 95, Aguacatal, Xalapa-Enríquez, Ver. Teléfono 22 88 40 88 00 o WhatsApp 22 84 03 52 73.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return (
    <>
      <Navbar overlay />
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

                <ContactForm />
              </div>

              <div className="contactCard">
                <h3>Datos de contacto</h3>

                <div className="contactInfoBox">
                  <a className="contactInfoBox__row" href="tel:+522288408800">
                    <PhoneIcon className="contactInfoBox__icon" />
                    22 88 40 88 00
                  </a>
                  <a className="contactInfoBox__row" href="mailto:contacto@cc-contadorespublicos.com">
                    <MailIcon className="contactInfoBox__icon" />
                    contacto@cc-contadorespublicos.com
                  </a>
                  <a
                    className="contactInfoBox__row"
                    href="https://www.google.com/maps?q=C%20Jorullo%2095,%20Aguacatal,%2091133%20Xalapa-Enríquez,%20Ver."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PinIcon className="contactInfoBox__icon" />
                    C Jorullo 95, Aguacatal, 91133 Xalapa-Enríquez, Ver.
                  </a>
                  <a
                    className="contactInfoBox__row"
                    href="https://wa.me/522284035273"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon className="contactInfoBox__icon" />
                    22 84 03 52 73 (WhatsApp)
                  </a>
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