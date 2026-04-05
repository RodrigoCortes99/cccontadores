export default function About() {
  return (
    <section className="about" id="nosotros">
      <div className="container">
        <h2 className="sectionTitle">Soluciones integrales para el crecimiento financiero</h2>
        <p className="sectionSubtitle">
          En <strong>CC CONTADORES PÚBLICOS, AUDITORES Y CONSULTORES S.C.</strong>, nuestra misión
          es apoyar el desarrollo económico y humano de nuestros clientes, guiándonos por
          principios de ética, calidad y compromiso.
        </p>

        <div className="about__image" aria-hidden="true" />

        <div className="about__cards">
          <div className="miniCard">
            <div className="miniCard__icon">✓</div>
            <div>
              <h3>Confianza profesional</h3>
              <p>Equipo con gran experiencia técnica y criterio profesional.</p>
            </div>
          </div>

          <div className="miniCard">
            <div className="miniCard__icon">↔</div>
            <div>
              <h3>Ambos sectores</h3>
              <p>Auditoría y consultoría en el sector privado y gubernamental.</p>
            </div>
          </div>

          <div className="miniCard">
            <div className="miniCard__icon">◎</div>
            <div>
              <h3>Ética y calidad</h3>
              <p>Compromiso con principios de ética, calidad y desempeño.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}