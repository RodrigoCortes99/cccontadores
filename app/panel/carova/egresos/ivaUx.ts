// Texto de la revisión estructural de IVA. Ningún rótulo afirma acreditabilidad,
// deducibilidad, impuesto a pagar ni declaración correcta.

export const vatStatusLabels: Record<string,string> = {
  STRUCTURED: 'Desglose leído completo y consistente consigo mismo',
  PARTIAL: 'Desglose leído en parte · falta una fuente declarada',
  INCONSISTENT: 'El comprobante no cuadra contra sí mismo',
  INSUFFICIENT_EVIDENCE: 'Evidencia insuficiente para describir la operación',
  UNSUPPORTED_STRUCTURE: 'Estructura no cubierta en esta versión · se declara, no se interpreta',
  EXTERNAL_VALIDATION_REQUIRED: 'Requiere validación fuera del sistema',
  BLOCKED_BY_BUSINESS_RULE: 'Requiere una regla de negocio que nadie ha confirmado',
};

export function vatLabel(map: Record<string,string>, key: string): string {
  return map[key] ?? key;
}

// Vigencia del resultado. Un snapshot cuyas fuentes cambiaron nunca se presenta con su
// estado histórico como si siguiera vigente.
export const vatStateLabels: Record<string,string> = {
  CURRENT: 'Vigente',
  STALE: 'No vigente · vuelve a calcular',
};

export const vatStateReasonLabels: Record<string,string> = {
  SOURCES_CHANGED: 'Cambió una fuente material del resultado',
  EVIDENCE_CHANGED: 'Archivo de la evidencia alterado · reingesta requerida',
};

export function vatResultText(status: string, state?: string|null, reason?: string|null): string {
  const base = vatLabel(vatStatusLabels, status);
  if (state !== 'STALE') return base;
  const why = reason ? vatLabel(vatStateReasonLabels, reason) : vatLabel(vatStateLabels, 'STALE');
  return `${vatLabel(vatStateLabels, 'STALE')} · ${why}`;
}

// Pendientes del motor. Ninguno afirma que el IVA sea correcto o incorrecto.
export const vatPendingLabels: Record<string,string> = {
  VAT_BREAKDOWN_MISSING: 'Sin desglose de impuestos',
  VAT_AMOUNT_UNREADABLE: 'Importe del desglose ilegible',
  VAT_DOCUMENT_UNREADABLE: 'Comprobante no legible en esta versión',
  VAT_INTERNAL_DIFFERENCE: 'Diferencia observada entre dos registros',
  VAT_STRUCTURE_NOT_COVERED: 'Estructura no cubierta por esta versión',
  VAT_RULE_NOT_CONFIRMED: 'Regla de negocio no confirmada',
  VAT_PAYMENT_METHOD_MISSING: 'Método de pago no declarado',
  VAT_REP_WITHOUT_REFERENCE: 'Complemento de pago sin documento relacionado',
  VAT_EXTERNAL_VALIDATION: 'Requiere validación fuera del sistema',
  VAT_PERIOD_SCOPE_REVIEW: 'Alcance del periodo por confirmar',
  VAT_PAYMENT_LINK_MISSING: 'Sin relación de pago confirmada',
  VAT_ACCOUNTING_COUNTERPART_MISSING: 'Sin póliza asociada',
  VAT_BANK_RESULT_MISSING: 'Sin resultado bancario del movimiento',
  VAT_BANK_RESULT_NOT_RECONCILED: 'Resultado bancario sin conciliar',
  VAT_ACCOUNTING_UNAVAILABLE: 'No hay IVA contable capturado',
};
