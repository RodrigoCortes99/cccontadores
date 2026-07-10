import FormField, { FormGrid } from "./FormField";

export type Catalogo = { id: number; name: string; is_active: boolean };
export type ClienteOption = { id: number; name: string; organization: number };

export type RegistroFormState = {
  client: string;
  activity_type: string;
  area: string;
  servicio: string;
  date: string;
  start_time: string;
  end_time: string;
  manual_hours: string;
  description: string;
  observaciones: string;
  tipo_tiempo: string;
  prioridad: string;
  modality: string;
};

export function registroFormVacio(): RegistroFormState {
  return {
    client: "",
    activity_type: "",
    area: "",
    servicio: "",
    date: new Date().toISOString().slice(0, 10),
    start_time: "",
    end_time: "",
    manual_hours: "",
    description: "",
    observaciones: "",
    tipo_tiempo: "facturable",
    prioridad: "normal",
    modality: "remoto",
  };
}

export function construirPayloadRegistro(valores: RegistroFormState) {
  return {
    client: valores.client ? Number(valores.client) : null,
    activity_type: valores.activity_type ? Number(valores.activity_type) : null,
    area: valores.area ? Number(valores.area) : null,
    servicio: valores.servicio ? Number(valores.servicio) : null,
    date: valores.date,
    start_time: valores.start_time || null,
    end_time: valores.end_time || null,
    manual_hours: valores.manual_hours || null,
    description: valores.description,
    observaciones: valores.observaciones,
    tipo_tiempo: valores.tipo_tiempo,
    prioridad: valores.prioridad,
    modality: valores.modality,
  };
}

type Props = {
  valores: RegistroFormState;
  onChange: (campo: keyof RegistroFormState, valor: string) => void;
  clientes: ClienteOption[];
  tiposActividad: Catalogo[];
  areas: Catalogo[];
  servicios: Catalogo[];
};

/**
 * Campos del formulario de "Registrar tiempo", divididos en las 3 secciones
 * pedidas: Datos principales, Tiempo y Detalle. Se usa tanto para crear como
 * para editar un registro (Resumen -> modal, y Mis registros -> edición inline).
 */
export default function RegistroTiempoCampos({
  valores,
  onChange,
  clientes,
  tiposActividad,
  areas,
  servicios,
}: Props) {
  return (
    <>
      <h3 className="formSection__title">Datos principales</h3>

      <FormGrid>
        <FormField label="Cliente" required>
          <select value={valores.client} onChange={(e) => onChange("client", e.target.value)} required>
            <option value="">Selecciona un cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Área">
          <select value={valores.area} onChange={(e) => onChange("area", e.target.value)}>
            <option value="">Sin especificar</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </FormField>
      </FormGrid>

      <FormGrid>
        <FormField label="Proyecto / Servicio">
          <select value={valores.servicio} onChange={(e) => onChange("servicio", e.target.value)}>
            <option value="">Sin especificar</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Tipo de actividad">
          <select value={valores.activity_type} onChange={(e) => onChange("activity_type", e.target.value)}>
            <option value="">Sin especificar</option>
            {tiposActividad.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </FormField>
      </FormGrid>

      <FormField label="Fecha" required>
        <input type="date" value={valores.date} onChange={(e) => onChange("date", e.target.value)} required />
      </FormField>

      <h3 className="formSection__title">Tiempo</h3>

      <FormGrid>
        <FormField label="Inicio">
          <input type="time" value={valores.start_time} onChange={(e) => onChange("start_time", e.target.value)} />
        </FormField>
        <FormField label="Término">
          <input type="time" value={valores.end_time} onChange={(e) => onChange("end_time", e.target.value)} />
        </FormField>
      </FormGrid>

      <FormField label="Horas manuales" hint="Úsalo cuando no capturas hora de inicio/término.">
        <input
          type="number"
          step="0.25"
          min="0"
          placeholder="Ej. 2.5"
          value={valores.manual_hours}
          onChange={(e) => onChange("manual_hours", e.target.value)}
        />
      </FormField>

      <h3 className="formSection__title">Detalle</h3>

      <FormField label="Descripción / evidencia" required>
        <textarea rows={3} value={valores.description} onChange={(e) => onChange("description", e.target.value)} required />
      </FormField>

      <FormField label="Observaciones">
        <textarea rows={2} value={valores.observaciones} onChange={(e) => onChange("observaciones", e.target.value)} />
      </FormField>

      <FormGrid>
        <FormField label="Tipo de tiempo">
          <select value={valores.tipo_tiempo} onChange={(e) => onChange("tipo_tiempo", e.target.value)}>
            <option value="facturable">Facturable</option>
            <option value="no_facturable">No facturable</option>
            <option value="cortesia">Cortesía</option>
          </select>
        </FormField>

        <FormField label="Prioridad">
          <select value={valores.prioridad} onChange={(e) => onChange("prioridad", e.target.value)}>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </FormField>
      </FormGrid>

      <FormField label="Modalidad">
        <select value={valores.modality} onChange={(e) => onChange("modality", e.target.value)}>
          <option value="remoto">Remoto</option>
          <option value="presencial">Presencial</option>
          <option value="mixto">Mixto</option>
        </select>
      </FormField>
    </>
  );
}
