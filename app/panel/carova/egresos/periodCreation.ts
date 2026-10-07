import type {Overview} from './types';

// Keep the existing AccountingPeriod domain, including historical periods.
export const PERIOD_YEAR_MIN = 1900;
export const PERIOD_YEAR_MAX = 2200;
export const PERIOD_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export function periodDefaults(now = new Date()) {
  return {year: now.getFullYear(), month: now.getMonth() + 1};
}

export function periodYearOptions(): [string, string][] {
  return Array.from({length: PERIOD_YEAR_MAX - PERIOD_YEAR_MIN + 1}, (_, index) => {
    const year = String(PERIOD_YEAR_MIN + index);
    return [year, year];
  });
}

function integer(value: FormDataEntryValue | null, min: number, max: number, label: string) {
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) {
    throw new Error(`Selecciona ${label} válido.`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Selecciona ${label} válido.`);
  }
  return number;
}

export function serializePeriodCreation(form: FormData, overview: Pick<Overview, 'contexts' | 'users'>) {
  const engagement_id = integer(form.get('engagement_id'), 1, Number.MAX_SAFE_INTEGER, 'un encargo');
  const context = overview.contexts.find(c => c.id === engagement_id);
  if (!context) throw new Error('Selecciona un cliente y encargo disponibles.');
  const supervisor_id = integer(form.get('supervisor_id'), 1, Number.MAX_SAFE_INTEGER, 'un gerente');
  if (!overview.users.some(u => u.id === supervisor_id && ['manager', 'partner'].includes(u.role))) {
    throw new Error('Selecciona un gerente responsable disponible.');
  }
  return {
    action: 'create',
    client_id: context.cliente_id,
    engagement_id,
    year: integer(form.get('year'), PERIOD_YEAR_MIN, PERIOD_YEAR_MAX, 'un año'),
    month: integer(form.get('month'), 1, 12, 'un mes'),
    supervisor_id,
    reason: String(form.get('reason') || '').trim(),
  };
}
