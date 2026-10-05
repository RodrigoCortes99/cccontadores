export type Row = Record<string, unknown>;
export function object(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}; }
export function rows(value: unknown): Row[] { return Array.isArray(value) ? value.map(object) : []; }
const labels:Record<string,string>={
 DRAFT:'Borrador',PENDING_APPROVAL:'Pendiente de aprobación',APPROVED:'Aprobado',VOID:'Descartado',
 OPEN:'Abierta',PARTIALLY_PAID:'Pagada parcialmente',PARTIALLY_PAID_OVERDUE:'Parcial y vencida',PAID:'Pagada',OVERDUE:'Vencida',OVERPAID:'Sobrepagada',NOT_APPLICABLE:'No aplica antes de aprobación',NOT_INTEGRATED:'Sin integración fiscal',
 ACTIVE:'Activo',VOIDED:'Anulado',MANUAL_DECLARATION:'Declaración manual',BANK_MOVEMENT:'Fuente bancaria confirmada',
 COLLECTION_NOT_DEMONSTRABLE:'Sin aplicación de cobro demostrada',BANK_LINKED_COLLECTION_REQUIRES_SOURCE_REVIEW:'Cobro bancario: verificar fuente',MANUAL_DECLARATION_REQUIRES_VERIFICATION:'Declaración manual, requiere verificación',
 CURRENT:'Vigente',NEEDS_REVIEW:'Necesita revisión',STALE:'Archivo obsoleto',SOURCE_NOT_AUTHORIZED:'Fuente no disponible en tu alcance',UNCONFIRMED:'Sin confirmar',NOT_CONFIRMED:'Sin confirmación',COLLECTION_REGISTERED:'Cobro registrado',
 CANDIDATE:'Receptor posible',AMBIGUOUS:'Varios receptores posibles',COUNTERPARTY_NOT_DEMONSTRABLE:'Receptor no demostrado',ALREADY_APPLIED:'Ya tiene un cobro registrado',
 STANDARD:'Aplicación estándar',DECLARED_OVERPAYMENT:'Sobrepago declarado por gerencia',
 CLIENT_NOT_ACTIVE:'El cliente no está activo',CURRENCY_EXPONENT_NOT_DECLARED:'Selecciona una moneda con precisión declarada',PAYMENT_TERMS_NOT_DECLARED:'Declara el plazo de pago',PAYMENT_METHOD_NOT_DECLARED:'Declara el método de pago',PAYMENT_FORM_NOT_DECLARED:'Declara la forma de pago',PAYMENT_FORM_INCONSISTENT:'Revisa la forma de pago; PPD requiere 99',
 ISSUER_FISCAL_IDENTITY_NOT_DEMONSTRABLE:'Falta identidad fiscal vigente del emisor',ISSUER_FISCAL_IDENTITY_AMBIGUOUS:'Hay varias identidades vigentes del emisor',CUSTOMER_FISCAL_IDENTITY_NOT_DEMONSTRABLE:'Falta identidad fiscal vigente del receptor',CUSTOMER_FISCAL_IDENTITY_AMBIGUOUS:'Hay varias identidades vigentes del receptor',FISCAL_DATA_INCOMPLETE:'Completa los datos fiscales declarados',SERIES_NOT_AVAILABLE:'Selecciona una serie vigente',SERIES_AMBIGUOUS:'Hay varias series posibles; elige explícitamente',SEQUENCE_NOT_AVAILABLE:'La serie no tiene consecutivo disponible',SEQUENCE_AMBIGUOUS:'El consecutivo requiere revisión',PRICE_NOT_DEMONSTRABLE:'No hay precio vigente en la fecha declarada',LINE_SOURCE_MISMATCH:'El concepto no corresponde a su fuente de precio',SAT_PRODUCT_KEY_NOT_DECLARED:'Declara la clave de producto del concepto',SAT_UNIT_KEY_NOT_DECLARED:'Declara la clave de unidad del concepto',LINE_CALCULATION_MISMATCH:'La línea requiere revisión del cálculo',
 NO_LINES:'Añade al menos una línea',SOURCE_PRICE_CHANGED:'La tarifa cambió; acepta el precio vigente explícitamente',
 EXACT_BALANCE_AMOUNT:'El importe coincide con el saldo',SAME_CURRENCY:'Misma moneda',DATE_DISTANCE:'Distancia entre fechas',REFERENCE_SERIES_FOLIO_TEXT:'Referencia coincide con serie y folio',COUNTERPARTY_DISPLAY_TEXT:'Texto de contraparte coincide',
 billing_invoice_created:'Borrador creado',billing_invoice_line_added:'Línea agregada',billing_invoice_line_updated:'Línea actualizada',billing_invoice_line_removed:'Línea retirada',billing_invoice_submitted:'Enviado a aprobación',billing_invoice_approved:'Factura aprobada',billing_invoice_returned:'Devuelto a borrador',billing_invoice_voided:'Documento descartado'
};
export function text(value: unknown): string { return value === null || value === undefined || typeof value === 'object' ? '—' : String(value); }
export function label(value: unknown):string {return labels[text(value)]||text(value);}
export function display(key:string,value:unknown):string {return ['status','collection_state','fiscal_state','source','evidence_status','collection_evidence','source_currentness','application_kind','action'].includes(key)?label(value):text(value);}

export const opaque = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function reference(value: unknown): string { if (typeof value !== 'string' || !opaque.test(value)) throw new Error('Referencia no disponible.'); return value; }
export const fiscalNotice = 'Documento aún no integrado con emisión fiscal';
export const bankConfirmedNotice = 'Cobro registrado. Falta aplicarlo a factura.';
export const sourceReviewNotice = 'Cambió la evidencia bancaria de origen; revisa antes de continuar.';
export const moneyCards = [['invoiced','Facturado'],['applied','Cobrado / aplicado'],['receivable_balance','Pendiente por cobrar'],['overdue_balance','Vencido'],['overpaid_amount','Sobrepagado']] as const;
export const routes = [['','Inicio'],['facturas','Facturas'],['cobros','Cobros'],['cuentas-por-cobrar','Cuentas por cobrar'],['banco','Banco'],['configuracion','Configuración']] as const;
const messages: Record<string,string> = {
 SOURCE_PRICE_CHANGED:'La tarifa cambió. Acepta expresamente el precio vigente antes de enviar.',
 REVISION_CONFLICT:'Otra persona cambió la factura. Actualiza antes de continuar.',
 INVOICE_NOT_APPROVED:'Primero debe aprobarse la factura.',
 CURRENCY_NOT_COMPARABLE:'Los importes deben tener la misma moneda.',
 COLLECTION_OVERAPPLIED:'El importe excede el remanente del cobro.',
 INVOICE_OVERAPPLIED:'El importe excede el saldo. No se declara sobrepago automáticamente.',
 OVERPAYMENT_PRIVILEGED_ONLY:'El sobrepago declarado requiere gerencia o socio.',
 COLLECTION_HAS_ACTIVE_APPLICATIONS:'Reversa las aplicaciones vigentes antes de anular o corregir.',
 BANK_MOVEMENT_NOT_CURRENT:'La evidencia bancaria cambió. Revisa la fuente antes de confirmar.',
 SOURCE_NOT_AUTHORIZED:'La fuente ya no está disponible en tu alcance.',
 COUNTERPARTY_AMBIGUOUS:'Hay varios receptores posibles. Debes elegir y justificar tu decisión.',
 ARTIFACT_STALE:'El archivo ya no representa el estado vigente. Genera otro explícitamente.',
 BANK_COLLECTION_EXPLICIT_SOURCE_DECISION_REQUIRED:'Anula este cobro y vuelve a confirmar la fuente bancaria.',
 FORBIDDEN:'Esta acción requiere gerencia o socio.', NOT_FOUND:'El recurso no está disponible en tu alcance.',
};
export function errorMessage(status:number, value: unknown):string {
 const data=object(value); const code=text(data.code);
 if(['NON_DECIMAL_AMOUNT','NON_FINITE_DECIMAL','AMOUNT_OUT_OF_RANGE','COLLECTION_AMOUNT_INVALID'].includes(code))return 'Ingresa un importe válido.';
 return messages[code] || (status===403?'No tienes permiso para esta acción.':status===404?'El recurso no está disponible en tu alcance.':status===409?'El estado cambió. Actualiza y revisa antes de continuar.':typeof data.detail==='string'?data.detail:'No fue posible completar la operación. Revisa los campos y vuelve a intentar.');
}
export class BillingRequestError extends Error {
 readonly code:string; readonly fieldErrors:Record<string,string>;
 constructor(status:number,value:unknown){super(errorMessage(status,value));const data=object(value);this.code=text(data.code);const field=typeof data.field==='string'?data.field:(['NON_DECIMAL_AMOUNT','NON_FINITE_DECIMAL','AMOUNT_OUT_OF_RANGE','COLLECTION_AMOUNT_INVALID'].includes(this.code)?'amount':undefined);this.fieldErrors=field?{[field]:this.message}:{};}
}
export function fieldErrorAttributes(message:string|undefined,id:string){return message?{'aria-invalid':true as const,'aria-describedby':id}:{};}
export function downloadPath(artifact: Row): string {
 const ref=reference(artifact.ref); const expected=`/api/carova/workspace/billing/artifacts/${ref}/download/`;
 if(artifact.state!=='CURRENT'||artifact.download_url!==expected)throw new Error('El archivo no está vigente.');
 return expected;
}

/** Exact decimal display: grouping only, with all server digits preserved. */
export function decimalDisplay(value:unknown):string {
 const exact=text(value);if(!/^-?\d+(\.\d+)?$/.test(exact))return exact;
 const [whole,fraction]=exact.split('.');
 return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction===undefined?'':'.'+fraction);
}
