// Presentation contract for the sealed Block 2 read-only API.
export type HoursRow = {records:number;logged_hours:string;employee_ref?:string;employee_display?:string;client_ref?:string;client_display?:string;date?:string};
export type Hours = {period:{start:string;end:string};logged_hours:string;excluded_records:number;hours_by_employee:HoursRow[];hours_by_client:HoursRow[];hours_by_date:HoursRow[]};
export type Attention = {ref:string;client_ref:string;client_display:string;module:string;title:string;responsible:{ref:string;display:string}|null;due_date:string|null;status:string;priority:string;review_required:boolean;material_currentness:string;action_ref:string;action_url:string|null;module_route:string|null};
export type OperationalHome = {today:string;summary:{pending_total:number;overdue_total:number;review_required_total:number;pending_by_client:{client_ref:string;client_display:string;count:number}[]};count:number;offset:number;limit:number;results:Attention[];productivity:Hours;hours_today:string;hours_week:string;hours_month:string;scope:string;contract:string};
export const modules:Record<string,string>={CFDI:'Documentos',EGRESOS:'Egresos',BANK:'Bancos',IVA:'IVA',ACCOUNTING:'Contabilidad',AUDIT:'Auditoría',BILLING:'Facturación',PAYROLL:'Nómina'};
export const priorities:Record<string,string>={OVERDUE:'Vencido',DUE_TODAY:'Vence hoy',REVIEW_REQUIRED:'Por revisar',BLOCKED:'Bloqueado',NORMAL:'Pendiente'};
export const currentness:Record<string,string>={CURRENT:'Actual',STALE:'Necesita actualización',SOURCE_CHANGED:'Fuente modificada',NEEDS_REVIEW:'Revisión pendiente',NOT_DEMONSTRABLE:'Vigencia no comprobada',NOT_CALCULATED:'Sin cálculo',HISTORICAL:'Histórico',MISSING:'Fuente faltante',WITHDRAWN:'Fuente retirada'};
const uuid='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const exact = new RegExp(`^/panel/(?:auditoria/${uuid}|facturacion/(?:facturas|cobros)/${uuid}|nomina/(?:corridas|seguridad-social|importaciones)/${uuid})$`,'i');
const landings=new Set(['/panel/documentos','/panel/carova/egresos','/panel/facturacion','/panel/nomina']);
export function attentionHref(row:Pick<Attention,'action_url'|'module_route'>):string|null {
  // Never repair an unsafe supplied action into a guessed route or numeric PK.
  if(row.action_url!==null)return typeof row.action_url==='string'&&exact.test(row.action_url)?row.action_url:null;
  return landings.has(row.module_route||'')?row.module_route:null;
}
export function dateLabel(value:string|null):string {
  if(!value)return 'Sin fecha';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
}
export function reportFailure(status:number):string {
  if(status===403)return 'Tu acceso actual no permite consultar esta información.';
  if(status===404)return 'El cliente o recurso ya no está disponible en tu alcance.';
  if(status===409)return 'La información cambió. Vuelve a consultar antes de continuar.';
  if(status===400)return 'Revisa el rango o los filtros de la consulta.';
  return 'No pudimos consultar la información. Intenta nuevamente cuando haya conexión.';
}
export function homeQuery(range:string,offset:number,clientRef:string,from:string,to:string):string {
  const q=new URLSearchParams({range:['today','week','month','custom'].includes(range)?range:'month',limit:'30',offset:String(Math.max(0,Math.trunc(offset)))});
  if(/^[a-f0-9]{64}$/.test(clientRef))q.set('client_ref',clientRef);
  if(range==='custom'){q.set('date_from',from);q.set('date_to',to);}
  return q.toString();
}
