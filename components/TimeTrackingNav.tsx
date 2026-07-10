"use client";

import Link from "next/link";

type TimeTrackingNavProps = {
  activo: "resumen" | "registros" | "catalogos" | "productividad" | "reportes";
  esPrivilegiado: boolean;
};

export default function TimeTrackingNav({ activo, esPrivilegiado }: TimeTrackingNavProps) {
  const items: { key: TimeTrackingNavProps["activo"]; label: string; href: string; soloPrivilegiado?: boolean }[] = [
    { key: "resumen", label: "Resumen", href: "/panel/time-tracking" },
    { key: "registros", label: "Nuevo registro", href: "/panel/time-tracking/registros?nuevo=1" },
    { key: "registros", label: "Mis registros", href: "/panel/time-tracking/registros" },
    { key: "reportes", label: "Reportes", href: "/panel/time-tracking/reportes" },
    { key: "productividad", label: "Productividad", href: "/panel/time-tracking/productividad", soloPrivilegiado: true },
    { key: "catalogos", label: "Catálogos", href: "/panel/time-tracking/catalogos", soloPrivilegiado: true },
  ];

  return (
    <div className="pageActions" style={{ marginBottom: "24px", flexWrap: "wrap" }}>
      {items
        .filter((item) => !item.soloPrivilegiado || esPrivilegiado)
        .map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`cc-btn ${activo === item.key ? "cc-btn--solid" : "cc-btn--outline"}`}
          >
            {item.label}
          </Link>
        ))}
    </div>
  );
}
