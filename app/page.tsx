import Link from "next/link";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Approach from "@/components/Approach";
import Services from "@/components/Services";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />

        <section className="pageSection">
          <div className="container">
            <div className="uploadCard" style={{ textAlign: "center" }}>
              <p className="pageKicker">ACCESO</p>
              <h2 className="uploadTitle" style={{ marginBottom: "10px" }}>
                Accede al sistema
              </h2>
              <p className="pageText" style={{ marginBottom: "20px" }}>
                Ingresa al portal para consultar encargos, revisar solicitudes PBC y cargar evidencia documental.
              </p>

              <div className="pageActions" style={{ justifyContent: "center" }}>
                <Link className="cc-btn cc-btn--solid" href="/login">
                  Iniciar sesión
                </Link>
                <Link className="cc-btn cc-btn--ghost" href="/panel">
                  Ir al panel
                </Link>
              </div>
            </div>
          </div>
        </section>

        <About />
        <Approach />
        <Services />
        <CTA />
      </main>
      <Footer />
    </>
  );
}