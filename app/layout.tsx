import "./globals.css";
import localFont from "next/font/local";
import type { Metadata } from "next";

const poppins = localFont({
  src: [
    { path: "./fonts/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/poppins-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

// TODO: si el dominio real de producción es distinto, ajústalo aquí — de
// este único valor dependen las URLs canónicas y las imágenes de Open Graph.
const SITE_URL = "https://www.cc-contadorespublicos.com";
const SITE_NAME = "CC Contadores Públicos, Auditores y Consultores S.C.";
const SITE_DESCRIPTION =
  "Despacho de auditoría, consultoría y asesoría fiscal en Xalapa, Veracruz. Más de 20 años de experiencia en el sector público y privado.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "contadores públicos Xalapa",
    "auditoría Veracruz",
    "consultoría fiscal",
    "despacho contable Xalapa",
    "asesoría financiera",
  ],
  authors: [{ name: SITE_NAME }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: "/home-hero.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/home-hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AccountingService",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  telephone: "+52-228-840-8800",
  email: "contacto@cc-contadorespublicos.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "C Jorullo 95, Aguacatal",
    addressLocality: "Xalapa-Enríquez",
    addressRegion: "Veracruz",
    postalCode: "91133",
    addressCountry: "MX",
  },
  areaServed: "MX",
  sameAs: [],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={poppins.variable}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}