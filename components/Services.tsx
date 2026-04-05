const cards = [
  {
    title: "Consultoría Fiscal",
    text: "Asesoría personalizada para optimizar tu carga tributaria.",
    img: "/service-1.jpg",
  },
  {
    title: "Auditoría Financiera",
    text: "Examina y fortalece la transparencia de tus operaciones.",
    img: "/service-2.jpg",
  },
  {
    title: "Cumplimiento Corporativo",
    text: "Garantizamos que tu empresa cumpla con las normativas vigentes.",
    img: "/service-3.jpg",
  },
];

export default function Services() {
  return (
    <section className="services" id="areas">
      <div className="servicesBand">
        <div className="container">
          <h2 className="bandTitle">Impulsando el éxito de nuestros clientes</h2>
          <p className="bandSubtitle">
            Los resultados y la confianza reflejan el compromiso que generamos en empresas como la tuya.
          </p>
        </div>
      </div>

      <div className="container">
        <h2 className="sectionTitle">Expertos que impulsan tu éxito financiero</h2>
        <p className="sectionSubtitle">Descubre cómo transformamos retos en oportunidades</p>

        <div className="servicesGrid">
          {cards.map((c) => (
            <article key={c.title} className="serviceCard">
              <div className="serviceHead">
                <div className="serviceCheck">✓</div>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </div>
              </div>
              <div className="serviceImage" style={{ backgroundImage: `url(${c.img})` }} />
            </article>
          ))}
        </div>

        <ul className="serviceBullets">
          <li>Más de 20 años de experiencia en el sector público y privado</li>
          <li>Análisis preciso y estrategias a medida</li>
          <li>Enfoque ético y cumplimiento normativo</li>
        </ul>
      </div>
    </section>
  );
}