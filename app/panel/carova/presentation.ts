/** Presentation only: never changes the server's decision, evidence or authorization. */
export const stateLabels: Record<string, string> = {
  AUTO_CLEAR: 'Comprobaciones del arquetipo verificadas',
  NEEDS_HUMAN: 'Requiere revisión humana',
  ENGINE_ABSTAINED: 'Evidencia insuficiente para decidir',
  DOCUMENT_EXCEPTION: 'Excepción técnica en documentos del lote',
  pending: 'Pendiente de procesar', queued: 'Pendiente de procesar', processing: 'Procesando',
  running: 'Procesando', completed: 'Listo', done: 'Listo', proposed: 'Necesita revisión',
  needs_review: 'Necesita revisión', approved: 'Correcto', corrected: 'Corregido',
  rejected: 'Rechazado', failed: 'Error', MODEL_UNAVAILABLE: 'Error',
};
export const names: Record<string, string> = {
  poliza: 'Póliza', cfdi: 'CFDI', comprobante: 'Comprobante de pago', plantilla: 'Papel de trabajo',
  estado_cuenta: 'Estado de cuenta', auxiliar: 'Auxiliar contable', nomina: 'Nómina',
  total: 'Total', subtotal: 'Subtotal', iva: 'IVA', retenciones: 'Retenciones', fecha: 'Fecha',
  rfc_emisor: 'RFC del emisor', rfc_receptor: 'RFC del receptor', uuid: 'Folio fiscal (UUID)',
  moneda: 'Moneda', referencia: 'Referencia', concepto: 'Concepto',
  egresos: 'Revisión de egresos', conciliacion: 'Conciliación', fiscal: 'Revisión fiscal', auditor: 'Revisión de auditoría',
};
export const readable = (value: string) => names[value] ?? value.replaceAll('_', ' ');
export const stateLabel = (value: string) => stateLabels[value] ?? 'Estado por confirmar';
export function locationLabel(value: string): string {
  return value.replace(/page:/gi, 'Página ').replace(/line:/gi, 'Línea ')
    .replace(/sheet:/gi, 'Hoja ').replace(/cell:/gi, 'Celda ')
    .replace(/row:/gi, 'Fila ').replace(/column:/gi, 'Columna ')
    .replaceAll('/', ' · ').replaceAll('@', ' → ');
}
export function findingText(f: { category: string; description: string }): string {
  const missing = f.description.match(/Falta documento: ([\w]+)\./);
  if (missing) return `No se encontró ${readable(missing[1]).toLowerCase()} relacionado con este caso.`;
  const field = f.description.match(/Falta campo (\w+) en (\w+)\./);
  if (field) return `No se pudo obtener ${readable(field[1]).toLowerCase()} en ${readable(field[2]).toLowerCase()}. Revisa el documento.`;
  const texts: Record<string, string> = {
    missing_document: 'No se encontró evidencia asociada suficiente para el documento requerido. Puede deberse a lectura o asociación incompleta; no demuestra que el cliente no lo entregó.',
    required_field: 'No se pudo verificar un dato requerido. Compruébalo en la fuente original.',
    identical_file: 'Se recibió el mismo contenido más de una vez. Esto no demuestra una operación contabilizada dos veces.',
    amount_difference: 'Los importes encontrados en los documentos no coinciden.',
    date_difference: 'Las fechas de los documentos no coinciden.',
    sum_difference: 'El subtotal más impuestos, menos retenciones, no coincide con el total.',
    invalid_amount: 'No se pudo interpretar el importe. Compruébalo en el documento original.',
    matched: 'La referencia, el importe y la fecha coinciden según la revisión registrada. Falta tu confirmación.',
    uuid_format: 'El folio fiscal tiene un formato que necesita revisión.',
    date_format: 'No se pudo interpretar la fecha del documento.',
  };
  if (f.category === 'possible_duplicate') return f.description.includes('UUID')
    ? 'El folio fiscal aparece en más de un documento del encargo. Comprueba si está duplicado.'
    : 'Hay varios documentos del mismo tipo. Revisa cuáles corresponden a este caso.';
  return texts[f.category] ?? f.description.replace(/rfc_receptor/g, 'RFC del receptor').replace(/rfc_emisor/g, 'RFC del emisor');
}
export const findingTitle: Record<string, string> = {
  amount_difference: 'Diferencia de importe', missing_document: 'Documento pendiente',
  date_difference: 'Fechas distintas', field_difference: 'Datos distintos', required_field: 'Dato pendiente',
  possible_duplicate: 'Posible duplicado', sum_difference: 'Total por comprobar', matched: 'Coincidencia por confirmar',
  rfc_format: 'RFC por revisar', uuid_format: 'Folio fiscal por revisar', date_format: 'Fecha por revisar', invalid_amount: 'Importe por revisar',
};
// Exact decimal arithmetic; do not silently round evidence or assume a currency.
export function amountDifference(values: string[]): string | null {
  if (values.length < 2 || values.some(v => !/^-?\d{1,20}(\.\d{1,8})?$/.test(v))) return null;
  const scale = Math.max(2, ...values.map(v => v.split('.')[1]?.length ?? 0));
  const numbers = values.map(v => {
    const [integer, fraction = ''] = v.replace('-', '').split('.');
    return BigInt(integer + fraction.padEnd(scale, '0')) * (v.startsWith('-') ? BigInt(-1) : BigInt(1));
  });
  const min = numbers.reduce((a, b) => a < b ? a : b), max = numbers.reduce((a, b) => a > b ? a : b);
  const digits = (max - min).toString().padStart(scale + 1, '0');
  return `${digits.slice(0, -scale).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${digits.slice(-scale)}`;
}
export function errorText(error: string): string {
  if (error.includes('MODEL_UNAVAILABLE')) return 'El modelo local de Carova no está disponible. El resto del sistema continúa funcionando. Contacta al administrador o vuelve a intentarlo después.';
  if (error.includes('REVISION_CONFLICT')) return 'Este caso cambió desde que lo abriste. Vuelve a abrirlo para consultar la revisión actual; tus cambios sin guardar se conservan en esta sesión.';
  if (/403|denied|permission|permiso|FORBIDDEN/i.test(error)) return 'Tu cuenta no tiene permiso para esta acción. Consulta con la persona responsable del encargo.';
  if (/429|throttl/i.test(error)) return 'Hay varias consultas en curso. Espera un momento y vuelve a intentarlo.';
  if (/fetch|network/i.test(error)) return 'No pudimos conectar con Carova. Comprueba la conexión y vuelve a intentarlo.';
  return 'No se pudo completar la solicitud. Revisa los datos y el cliente y encargo seleccionados; vuelve a intentarlo. Si continúa, contacta al administrador.';
}
export const activityLabels: Record<string, string> = {
  contexts: 'Consulta de encargos', list_documents: 'Consulta de documentos', list_jobs: 'Consulta de procesamientos', list_proposals: 'Consulta de casos', parse: 'Lectura del documento', classify: 'Clasificación del documento', complete: 'Procesamiento terminado', context_block: 'Acceso no autorizado',
  center: 'Consulta del avance', read_proposals: 'Consulta de casos', read_proposal: 'Consulta de un caso',
  read_source: 'Consulta de una fuente', read_file: 'Descarga del documento original', read_documents: 'Consulta de documentos',
  upload: 'Documento recibido', ingest: 'Documento recibido', review: 'Revisión registrada', chat: 'Consulta a Carova',
  read_audit: 'Consulta del historial', read_policies: 'Consulta de configuración', process: 'Procesamiento de documentos',
  enqueue: 'Procesamiento solicitado', supervise: 'Consulta de supervisión', failed: 'Procesamiento con error',
  approve: 'Marcado como correcto', correct: 'Corrección guardada', reject: 'Caso rechazado',
};
export const supervisionReasons: Record<string, string> = {
  possible_duplicate: 'Este registro podría estar duplicado.',
  hours_out_of_range: 'La duración registrada supera el umbral configurado. Comprueba las horas.',
  vague_description: 'Descripción muy breve. Puede ser útil agregar más detalle.',
  billable_without_rate: 'Actividad facturable sin tarifa configurada.', pending: 'Este registro está pendiente de revisión.',
};
