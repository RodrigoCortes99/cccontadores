export default function CTA() {
  return (
    <section className="cta" id="contacto">
      <div className="container">
        <h2 className="ctaTitle">Dedicación y confianza en cada solución brindada</h2>
        <p className="ctaText">
          Descubre cómo nuestros servicios pueden transformar tu negocio y contáctanos hoy.
        </p>

        <div className="ctaActions">
          <a className="cc-btn cc-btn--solid" href="tel:+522884088800">
            Llamar: 22 88 40 88 00
          </a>
          <a
            className="cc-btn cc-btn--ghost"
            href="https://wa.me/522284035273"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp: 22 84 03 52 73
          </a>
        </div>
      </div>
    </section>
  );
}