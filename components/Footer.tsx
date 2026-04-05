export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footerGrid">
        <div>
          <h4>CONTÁCTANOS</h4>
          <p>(+52) 22 88 40 88 00 Tel Oficina</p>
          <p>(+52) 22 84 03 52 73 WhatsApp</p>
          <p>mercadeo@db-system.com</p>
          <p>Calle 97A No. 53 - 01</p>
          <div className="footerLinks">
            <a href="#">POLÍTICAS</a>
            <a href="#">Políticas de privacidad</a>
          </div>
        </div>

        <div>
          <h4>SERVICIOS</h4>
          <a href="#areas">Soluciones profesionales</a>
          <a href="#areas">Ciencia de datos</a>
          <a href="#areas">Infraestructura de TI</a>
          <a href="#areas">Monitoreo</a>
          <a href="#areas">Innovación</a>
          <a href="#areas">Seguridad</a>
        </div>

        <div>
          <h4>NOSOTROS</h4>
          <a href="#nosotros">Mesa de servicio</a>
          <a href="#nosotros">Mind Center</a>
          <a href="#nosotros">Canal de denuncias</a>
          <a href="#inicio">Mapa del sitio</a>
        </div>

        <div>
          <h4>SÍGUENOS</h4>
          <a href="#">LinkedIn</a>
          <a href="#">Facebook</a>
          <a href="#">Instagram</a>
          <a href="#">YouTube</a>
        </div>
      </div>

      <div className="container footerBottom">
        <span>© {new Date().getFullYear()} CC Contadores Públicos, Auditores y Consultores S.C.</span>
      </div>
    </footer>
  );
}