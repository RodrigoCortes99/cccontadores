import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./home.module.css";

const services = [
  { title: "Consultoría fiscal", text: "Claridad para tus obligaciones fiscales y estrategias alineadas a tu negocio.", image: "/home-service-fiscal.jpg" },
  { title: "Auditoría financiera", text: "Información confiable para fortalecer la transparencia y tomar mejores decisiones.", image: "/home-service-auditoria.jpg" },
  { title: "Cumplimiento corporativo", text: "Acompañamiento para mantener tus operaciones en línea con la normativa vigente.", image: "/home-service-corporativo.jpg" },
];
const steps = [
  { title: "Entendemos tu negocio", text: "Analizamos tu situación financiera y fiscal para identificar necesidades y oportunidades." },
  { title: "Trazamos una estrategia", text: "Diseñamos soluciones a la medida de tus objetivos, tu operación y tu contexto." },
  { title: "Te acompañamos", text: "Damos seguimiento continuo con rigor técnico, comunicación clara y compromiso." },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="contenido" className={styles.home}>
        <section className={styles.hero}>
          <Image src="/home-hero.jpg" alt="" fill priority sizes="100vw" className={styles.heroImage} />
          <div className={`container ${styles.heroContent}`}>
            <p className={styles.eyebrow}>CC Contadores · Auditores · Consultores</p>
            <h1>Decisiones claras.<br /><span>Un futuro sólido.</span></h1>
            <p className={styles.heroLead}>Auditoría y consultoría con respaldo profesional. Te ayudamos a cuidar tu negocio y avanzar con confianza.</p>
            <div className={styles.actions}>
              <Link href="/contacto" className={styles.primary}>Solicitar asesoría <span aria-hidden="true">↗</span></Link>
              <Link href="/servicios" className={styles.secondary}>Explorar servicios <span aria-hidden="true">→</span></Link>
            </div>
            <div className={styles.heroNote}><span /> Ética, calidad y compromiso en cada decisión.</div>
          </div>
        </section>

        <div className={styles.trustBand}>
          <div className={`container ${styles.trustGrid}`}>
            <div><strong>20+</strong><span>Años de experiencia</span></div>
            <div><strong>Visión integral</strong><span>Sector público y privado</span></div>
            <div><strong>Atención cercana</strong><span>Estrategias a tu medida</span></div>
          </div>
        </div>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div><p className={styles.eyebrow}>Nuestra especialidad</p><h2>El respaldo que tu<br />negocio necesita.</h2></div>
              <p>Soluciones integrales para reducir riesgos, fortalecer tu operación y acompañar tu crecimiento financiero.</p>
            </div>
            <div className={styles.services}>
              {services.map((service, index) => (
                <Link href="/servicios" key={service.title} className={styles.service}>
                  <div className={styles.serviceImage}><Image src={service.image} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" /><span>0{index + 1}</span></div>
                  <div className={styles.serviceBody}><h3>{service.title}</h3><p>{service.text}</p><span className={styles.serviceLink}>Conocer servicio <span aria-hidden="true">↗</span></span></div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.about}`}>
          <div className={`container ${styles.aboutGrid}`}>
            <div className={styles.aboutImage}><Image src="/home-about.jpg" alt="Equipo de trabajo en una reunión profesional" fill sizes="(max-width: 760px) 100vw, 50vw" /></div>
            <div><p className={styles.eyebrow}>Más que números, confianza</p><h2>Un equipo que se involucra en tu crecimiento.</h2><p className={styles.bodyText}>En CC Contadores Públicos, Auditores y Consultores S.C. apoyamos el desarrollo económico y humano de nuestros clientes con experiencia técnica y atención personalizada.</p>
              <ul className={styles.values}><li>Ética y confidencialidad en cada proyecto</li><li>Experiencia en el sector público y gubernamental</li><li>Soluciones para empresas del sector privado</li></ul>
              <Link href="/acerca-de" className={styles.textLink}>Conoce nuestro despacho <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Así trabajamos contigo</p><h2>Un camino claro,<br />de principio a fin.</h2></div><p>Cercanía y método para convertir los retos de hoy en decisiones bien fundamentadas.</p></div>
            <div className={styles.steps}>{steps.map((step, index) => <article key={step.title}><span className={styles.stepNumber}>0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
          </div>
        </section>

        <section className={styles.contact}>
          <div className={`container ${styles.contactInner}`}><div><p className={styles.eyebrow}>Hablemos de tu negocio</p><h2>Tu siguiente paso,<br />con el respaldo correcto.</h2><p>Cuéntanos qué necesitas. Estamos para acompañarte.</p></div><Link href="/contacto" className={styles.primary}>Agendar una asesoría <span aria-hidden="true">↗</span></Link></div>
        </section>
        <section className={styles.portal}><div className={`container ${styles.portalInner}`}><div><span className={styles.eyebrow}>Portal de clientes</span><h2>Tu documentación, en un solo lugar.</h2><p>Consulta encargos, revisa solicitudes y comparte evidencia documental.</p></div><Link href="/login" className={styles.textLink}>Acceder al portal <span aria-hidden="true">→</span></Link></div></section>
      </main>
      <Footer />
    </>
  );
}
