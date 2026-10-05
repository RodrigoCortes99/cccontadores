"use client";

import Link from "next/link";

type TimeTrackingNavProps = {
  activo: "resumen" | "registros" | "catalogos" | "productividad" | "reportes";
  esPrivilegiado: boolean;
};

export default function TimeTrackingNav({ activo, esPrivilegiado }: TimeTrackingNavProps) {
  const items: { key: TimeTrackingNavProps["activo"]; label: string; href: string; soloPrivilegiado?: boolean }[] = [
    { key: "resumen", label: "Resumen", href: "/panel/time-tracking" },
        { key: "registros", label: "Mis registros", href: "/panel/time-tracking/registros" },
    { key: "reportes", label: "Reportes", href: "/panel/time-tracking/reportes" },
    { key: "productividad", label: "Productividad", href: "/panel/time-tracking/productividad", soloPrivilegiado: true },
    { key: "catalogos", label: "Catálogos", href: "/panel/time-tracking/catalogos", soloPrivilegiado: true },
  ];

  return (
    <nav className="ccTabs" aria-label="Horas">
      {items
        .filter((item) => !item.soloPrivilegiado || esPrivilegiado)
        .map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={activo === item.key ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
    </nav>
  );
}
