// Iconos SVG mínimos, sin dependencias externas, para reemplazar emoji en
// puntos de contacto (renderizan igual en cualquier sistema operativo, a
// diferencia de 📞 ✉ 📍 🟢 que cambian de estilo entre Apple/Android/Windows).

type IconProps = { className?: string };

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.2c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.8c.3-.7.7-.7 1-.7h.5c.2 0 .4 0 .6.5l.6 1.5c.1.2 0 .4-.1.6l-.5.6c-.1.2-.1.3 0 .5.4.7 1.5 1.8 2.2 2.2.2.1.3.1.5 0l.6-.5c.2-.1.4-.2.6-.1l1.5.6c.4.2.5.4.5.6v.5c0 .3 0 .7-.7 1-.7.4-1.6.4-2.7 0-1.9-.6-3.6-2.3-4.3-3.1-.7-.9-1.5-2.2-1.5-3.6 0-.9.4-1.5.7-1.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

// The same stroke-based local icon family, extended for the authenticated menu.
export function NavigationIcon({name}:{name:string}) {
 const paths:Record<string,string>={
 Inicio:'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',
 Clientes:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M18 8a4 4 0 0 1 0 8M20 21v-2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 Bancos:'m3 8 9-5 9 5H3M5 8v10m5-10v10m4-10v10m5-10v10M3 21h18M3 18h18',
 IVA:'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5',
 Contabilidad:'M3 4h18v16H3zM7 8v8m5-8v8m5-8v8',
 Pendientes:'M9 11l2 2 4-4M4 4h16v16H4z',
 Horas:'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
 Configuración:'M9 3h6l1 4 4 1v8l-4 1-1 4H9l-1-4-4-1V8l4-1 1-4M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 Conectividad:'M8 12h8M9 7H7a5 5 0 0 0 0 10h2m6-10h2a5 5 0 0 1 0 10h-2',
 Facturación:'M3 5h18v14H3zM3 9h18M7 14h3',
 Nómina:'M3 6h18v14H3zM8 3v6m8-6v6M7 13h10M7 16h6',
 Egresos:'M3 5h18v14H3zM9 12h6m-3-3 3 3-3 3',
 };
 return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]||'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6'}/></svg>;
}
