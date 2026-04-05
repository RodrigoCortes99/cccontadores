import "./globals.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "CC Contadores Públicos, Auditores y Consultores S.C.",
  description: "Auditoría, consultoría y soluciones fiscales con respaldo profesional.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={poppins.variable}>{children}</body>
    </html>
  );
}