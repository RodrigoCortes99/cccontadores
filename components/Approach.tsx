export default function Approach() {
  return (
    <section className="approach" id="experiencia">
      <div className="container">
        <h2 className="sectionTitle">Nuestro enfoque de trabajo</h2>
        <p className="sectionSubtitle">
          Asesoría especializada orientada al cumplimiento normativo, la reducción de riesgos y la
          toma de decisiones estratégicas.
        </p>

        <div className="approachCard">
          <div className="approachGrid">
            <div className="approachItem">
              <div className="approachIcon">✓</div>
              <h3>Diagnóstico preciso</h3>
              <p>Evaluación detallada de la situación financiera y fiscal.</p>
            </div>

            <div className="approachItem">
              <div className="approachIcon">★</div>
              <h3>Estrategia a la medida</h3>
              <p>Soluciones alineadas a objetivos y contexto del cliente.</p>
            </div>

            <div className="approachItem">
              <div className="approachIcon">🤝</div>
              <h3>Acompañamiento profesional</h3>
              <p>Seguimiento continuo con rigor técnico y ético.</p>
            </div>
          </div>

          <div className="approachBtnWrap">
            <a className="cc-btn cc-btn--solid" href="#areas">
              Conocer más
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}