import type { MetadataRoute } from "next";

const SITE_URL = "https://www.cc-contadorespublicos.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const paginas = ["", "/acerca-de", "/experiencia", "/servicios", "/contacto"];

  return paginas.map((ruta) => ({
    url: `${SITE_URL}${ruta}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: ruta === "" ? 1 : 0.7,
  }));
}
