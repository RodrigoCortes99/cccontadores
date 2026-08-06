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
