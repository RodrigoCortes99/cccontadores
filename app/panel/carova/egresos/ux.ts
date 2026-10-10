export function humanMessage(value:unknown,depth=0):string|undefined {
 if(depth>6)return;
 if(typeof value==='string'){
  const text=value.trim();
  if(text.length>0&&text.length<=600&&!/[{}<>\[\]\n\r]|Traceback|\bat\s+\S+\s*\(|\w+_\w+|Exception:|Error:/i.test(text)&&/[a-záéíóúñ]/i.test(text))return text;
  return;
 }
 if(Array.isArray(value)){for(const item of value){const found=humanMessage(item,depth+1);if(found)return found;}}
 else if(value&&typeof value==='object'){
  const obj=value as Record<string,unknown>;
  for(const key of ['detail','non_field_errors',...Object.keys(obj).filter(k=>!['detail','non_field_errors','code','status','traceback','stack'].includes(k))]){const found=humanMessage(obj[key],depth+1);if(found)return found;}
 }
}
export function apiErrorMessage(value:unknown,status:number){return humanMessage(value)??(status===403?'Tu rol no permite esta acción en este contexto.':status===409?'Otra persona actualizó este registro. Pulsa Actualizar y revisa el cambio antes de continuar.':status===404?'Este registro no está disponible en tu contexto actual.':'No pudimos guardar la información. Revisa los campos e intenta nuevamente.');}
export const workspacePath='/panel/carova/egresos';
const tabs=['Mi trabajo','Pendientes','Paquetes','Periodos','Supervisión','Historial'];
export function navigation(search:string){
 const p=new URLSearchParams(search);const id=(key:string)=>/^[1-9]\d{0,14}$/.test(p.get(key)||'')?p.get(key)!:'';
 return {accountingPeriod:id('accounting_period'),tab:tabs.includes(p.get('tab')||'')?p.get('tab')!:'Mi trabajo',filters:{client:id('client'),responsible:id('responsible'),period:/^\d{4}-(0[1-9]|1[0-2])$/.test(p.get('period')||'')?p.get('period')!:'',quick:['internal','waiting','response','reclassify','verify'].includes(p.get('quick')||'')?p.get('quick')!:'',kind:(p.get('kind')||'').slice(0,100),status:['ABIERTO','EN_REVISION_INTERNA','LISTO_PARA_ENVIAR','ESPERANDO_CLIENTE','RESPUESTA_RECIBIDA','RESUELTO','CANCELADO'].includes(p.get('status')||'')?p.get('status')!:'',age:['3','7','15'].includes(p.get('age')||'')?p.get('age')!:''}};
}
export function navigationQuery(value:Omit<ReturnType<typeof navigation>,'accountingPeriod'>&{accountingPeriod?:string}){const p=new URLSearchParams();Object.entries({tab:value.tab,accounting_period:value.accountingPeriod,...value.filters}).forEach(([key,val])=>{if(val)p.set(key,val);});return p.toString();}
// Return targets are constructed locally; no user-provided URL is accepted.
export function returnPath(search:string){return workspacePath+'?'+navigationQuery(navigation(search));}

// Automation engine vocabulary. Kept here (not inside the component) so the exact
// wording of every match type, draft state and field is unit-tested: a person must
// never read "coincidencia" where the server said conflict, ambiguity or missing data.
export const matchLabels:Record<string,string>={AMOUNT_DATE:'Importe y fecha coincidentes · requiere confirmación',EXACT_MATCH:'Coincidencia exacta',STRONG_MATCH:'Coincidencia fuerte · confirmar proveedor',AMBIGUOUS:'Ambigua · elegir candidato',NO_MATCH:'Sin CFDI',INSUFFICIENT_EVIDENCE:'Evidencia insuficiente',CONFLICT:'Conflicto'};
export const draftLabels:Record<string,string>={READY_FOR_REVIEW:'Lista para revisión',NEEDS_INFORMATION:'Falta información',AMBIGUOUS_DOCUMENT_MATCH:'Documento ambiguo',AMOUNT_DIFFERENCE:'Diferencia de importe',MISSING_SUPPORT:'Falta soporte',MISSING_CFDI:'Falta CFDI',PERIOD_REVIEW_REQUIRED:'Confirmar periodo',ACCOUNT_REVIEW_REQUIRED:'Cuenta por revisar'};
export const proposalStatusLabels:Record<string,string>={PROPOSED:'Propuesta',ACCEPTED:'Aceptada por una persona',REJECTED:'Rechazada',CORRECTED:'Corregida por una persona',SUPERSEDED:'Superada por otro lote'};
export const fieldLabels:Record<string,string>={amount:'importe',amount_sum:'suma exacta',currency:'moneda',supplier:'proveedor',rfc:'RFC',reference:'referencia',period:'periodo',adjacent_period:'mes adyacente',date:'fecha',tipo_comprobante:'tipo',duplicate_uuid:'UUID duplicado',already_associated:'ya asociado',shared_candidate:'CFDI reclamado por varios pagos',human_confirmation:'confirmación humana',total:'importe legible'};
export const reasonKindLabels:Record<string,string>={supporting:'coincide',conflicting:'conflicto',missing:'falta',ambiguous:'ambiguo'};
// Un CFDI que el motor no eligió no es, sin más, un CFDI sin pago: cada código dice
// por qué no lo eligió, porque de eso depende qué debe hacer la persona.
export const pendingLabels:Record<string,string>={MISSING_CFDI:'Falta CFDI',MISSING_SUPPORT:'Falta soporte numerado',MISSING_COMPLEMENT:'Falta complemento de pago (REP)',AMBIGUOUS_MATCH:'Varios candidatos posibles',AMOUNT_DIFFERENCE:'Diferencia de importe',PERIOD_REVIEW_REQUIRED:'Confirmar periodo',CURRENCY_REVIEW:'Revisar moneda extranjera',DUPLICATE_DOCUMENT:'Dos archivos con el mismo UUID',UNPARSED_DOCUMENT:'Archivo ilegible',ALREADY_ASSOCIATED:'Documento ya asociado a otro pago',PAYMENT_STRUCTURE_REVIEW:'Posible pago parcial o agrupado',ACCOUNT_REVIEW_REQUIRED:'Cuenta por revisar',SUPPLIER_CONFLICT:'Proveedor distinto al emisor',INSUFFICIENT_EVIDENCE:'Evidencia insuficiente',SHARED_CANDIDATE:'Un CFDI reclamado por varios pagos',DOCUMENT_WITHOUT_MOVEMENT:'CFDI sin movimiento que lo reclame',NOT_SELECTED_NO_MATCH:'CFDI considerado pero sin importe coincidente',AMBIGUOUS_NOT_SELECTED:'CFDI en competencia con otra explicación',CONFLICT_NOT_SELECTED:'CFDI descartado por un conflicto',DUPLICATE_NOT_SELECTED:'CFDI no elegido por UUID duplicado',ADJACENT_PERIOD_CANDIDATE:'CFDI de un mes adyacente'};
// Agregar nunca se interpreta como sustituir: la operación se dice en voz alta.
export const operationLabels:Record<string,string>={ADD:'Agregar a lo ya relacionado',REPLACE:'Sustituir lo ya relacionado',RELEASE:'Liberar lo seleccionado'};
export const evidenceTypeLabels:Record<string,string>={HUMAN_NOTE:'Constancia escrita de una persona',PHYSICAL_EVIDENCE_REFERENCE:'Localizador de evidencia física',DIGITAL_DOCUMENT:'Documento digital del encargo',RECEIPT:'Soporte registrado del periodo',AUTHORIZED_DECISION:'Decisión autorizada (gerencia o socio)'};
// Lo que el servidor acepta por rol: RELEASE/REPLACE y la decisión autorizada son de gerencia o socio.
export function allowedOperations(manage:boolean){return manage?['ADD','REPLACE','RELEASE']:['ADD'];}
export function allowedEvidenceTypes(manage:boolean){return Object.keys(evidenceTypeLabels).filter(k=>manage||k!=='AUTHORIZED_DECISION');}
export const evidenceFields:Record<string,string>={HUMAN_NOTE:'note',PHYSICAL_EVIDENCE_REFERENCE:'physical_locator',DIGITAL_DOCUMENT:'document_id',RECEIPT:'receipt_id',AUTHORIZED_DECISION:'authorized_decision'};
// Una cobertura parcial se enuncia; nunca se escribe «todos» cuando hubo un límite.
export function coverageNote(value:{truncated?:boolean;count?:number;limit?:number;coverage?:string}){
 if(value.coverage)return value.coverage;
 if(value.truncated)return `Se alcanzó el límite de ${value.limit??'resultados'}; hay más de los que se muestran.`;
 return typeof value.count==='number'?`${value.count} resultados; ninguno quedó fuera por límite.`:'';
}
// An unknown code is shown verbatim, never as an empty string or an invented meaning.
export function label(table:Record<string,string>,code:string){return table[code]??code.replaceAll('_',' ');}
export function fieldList(list:string[]){return list.map(f=>label(fieldLabels,f)).join(', ')||'\u2014';}

export const runLabels:Record<string,string>={COMPLETED:'Cálculo terminado',COMPLETE:'Cálculo terminado',SUCCESS:'Cálculo terminado',DONE:'Cálculo terminado',PARTIAL:'Cálculo con pendientes por revisar',PENDING:'Pendiente de cálculo',RUNNING:'Calculando',FAILED:'No se pudo completar el cálculo',SOURCE_WITHDRAWN:'Fuente retirada · recalcular',STALE:'Fuentes cambiaron · recalcular'};
export function runLabel(code:string){return runLabels[code]||'Estado de cálculo por revisar';}
