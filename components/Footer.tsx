import Link from "next/link";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "./icons";

// Estructura de footer de 3 columnas + barra inferior, inspirada en el
// diseño de Figma (encabezados en mayúsculas con acento turquesa sobre
// fondo azul marino), pero con el contenido real del despacho — el archivo
// de Figma es una plantilla reutilizada que aún trae datos de contacto,
// servicios y enlaces de otra empresa (no de CC Contadores) en el footer.
export default function Footer() {
  return (
    <footer className="siteFooter">
      <div className="container siteFooter__grid">
        <div className="siteFooter__col">
          <p className="siteFooter__heading">Contáctanos</p>
          <a className="siteFooter__row" href="tel:+522288408800">
            <PhoneIcon className="siteFooter__icon" />
            22 88 40 88 00
          </a>
          <a
            className="siteFooter__row"
            href="https://wa.me/522284035273"
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="siteFooter__icon" />
            22 84 03 52 73
          </a>
          <a className="siteFooter__row" href="mailto:contacto@cc-contadorespublicos.com">
            <MailIcon className="siteFooter__icon" />
            contacto@cc-contadorespublicos.com
          </a>
          <a
            className="siteFooter__row"
            href="https://www.google.com/maps?q=C%20Jorullo%2095,%20Aguacatal,%2091133%20Xalapa-Enríquez,%20Ver."
            target="_blank"
            rel="noopener noreferrer"
          >
            <PinIcon className="siteFooter__icon" />
            C Jorullo 95, Aguacatal, Xalapa-Enríquez, Ver.
          </a>
        </div>

        <div className="siteFooter__col">
          <p className="siteFooter__heading">Servicios</p>
          <Link className="siteFooter__row" href="/servicios">
            Contabilidad y finanzas
          </Link>
          <Link className="siteFooter__row" href="/servicios">
            Asesoría fiscal
          </Link>
          <Link className="siteFooter__row" href="/servicios">
            Auditoría y control
          </Link>
        </div>

        <div className="siteFooter__col">
          <p className="siteFooter__heading">Navegación</p>
          <Link className="siteFooter__row" href="/acerca-de">
            Nosotros
          </Link>
          <Link className="siteFooter__row" href="/experiencia">
            Experiencia
          </Link>
          <Link className="siteFooter__row" href="/contacto">
            Contacto
          </Link>
          <Link className="siteFooter__row" href="/login">
            Acceso al panel
          </Link>
        </div>
      </div>

      <div className="container siteFooter__bottom">
        <span>© {new Date().getFullYear()} CC Contadores Públicos, Auditores y Consultores S.C.</span>
      </div>
    </footer>
  );
}
