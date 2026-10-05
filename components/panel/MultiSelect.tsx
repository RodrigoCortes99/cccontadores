"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MultiSelectOption = { id: number | string; name: string };

type Props = {
  options: MultiSelectOption[];
  /** IDs seleccionados, como string (mismo formato que el resto de los
   * selects de este formulario, para no tocar el resto de la lógica). */
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  ariaLabel?: string;
  /** Sustantivo (femenino) usado en el resumen "N ___ seleccionada(s)". */
  singularLabel?: string;
  pluralLabel?: string;
  selectionGender?: "feminine" | "masculine";
};

/**
 * Selector múltiple con checkboxes, buscador y chips removibles — reemplazo
 * del <select multiple> nativo (que requería Ctrl/Cmd + clic). Sin
 * dependencias externas: reutiliza checkboxes nativos para que el teclado
 * (Tab, Espacio) y los lectores de pantalla funcionen sin lógica extra.
 */
export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Selecciona una o varias opciones",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados.",
  ariaLabel,
  singularLabel = "opción",
  pluralLabel = "opciones",
  selectionGender = "feminine",
}: Props) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Cierra al hacer clic fuera del componente.
  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Le da foco al buscador al abrir (este componente suele vivir dentro de
  // un <Modal>, que además cierra todo con Escape; por eso el Escape del
  // panel se maneja con onKeyDown + stopPropagation más abajo, en vez de
  // otro listener global en document, para no competir con el del modal).
  // El buscador mismo se limpia al abrir desde el onClick del trigger, no
  // aquí, para no disparar setState desde un efecto.
  useEffect(() => {
    if (open) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  const seleccionados = useMemo(
    () => options.filter((o) => value.includes(String(o.id))),
    [options, value]
  );

  const opcionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, busqueda]);

  function alternar(id: number | string) {
    const idStr = String(id);
    onChange(value.includes(idStr) ? value.filter((v) => v !== idStr) : [...value, idStr]);
  }

  function quitar(id: number | string) {
    const idStr = String(id);
    onChange(value.filter((v) => v !== idStr));
  }

  function onPanelKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      // Evita que el Escape también cierre el <Modal> que envuelve este
      // selector: solo debe cerrarse el panel del selector.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      wrapRef.current?.querySelector<HTMLButtonElement>(".multiSelect__trigger")?.focus();
    }
  }

  return (
    <div className="multiSelect" ref={wrapRef}>
      <button
        type="button"
        className="multiSelect__trigger"
        onClick={() =>
          setOpen((prev) => {
            const next = !prev;
            if (next) setBusqueda("");
            return next;
          })
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="multiSelect__triggerText">
          {seleccionados.length === 0
            ? placeholder
            : `${seleccionados.length} ${seleccionados.length === 1 ? singularLabel : pluralLabel} seleccionad${selectionGender === "masculine" ? "o" : "a"}${
                seleccionados.length === 1 ? "" : "s"
              }`}
        </span>
        <span className="multiSelect__chevron" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {seleccionados.length > 0 && (
        <div className="multiSelect__chips">
          {seleccionados.map((o) => (
            <span key={o.id} className="multiSelect__chip">
              {o.name}
              <button
                type="button"
                className="multiSelect__chipRemove"
                onClick={() => quitar(o.id)}
                aria-label={`Quitar ${o.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="multiSelect__panel" role="listbox" aria-multiselectable="true" onKeyDown={onPanelKeyDown}>
          <input
            ref={searchRef}
            type="text"
            className="multiSelect__search"
            placeholder={searchPlaceholder}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              // No debe enviar el formulario que envuelve a este selector.
              if (e.key === "Enter") e.preventDefault();
            }}
          />

          <div className="multiSelect__options">
            {opcionesFiltradas.length === 0 && <p className="multiSelect__empty">{emptyMessage}</p>}
            {opcionesFiltradas.map((o) => {
              const marcado = value.includes(String(o.id));
              return (
                <label key={o.id} className="multiSelect__option">
                  <input type="checkbox" checked={marcado} onChange={() => alternar(o.id)} />
                  <span>{o.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
