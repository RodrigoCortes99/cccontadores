// Vocabulario de Bancos / Conciliación. Un estado nunca promete más de lo que la evidencia sostiene.
export const bankStatusLabels:Record<string,string>={RECONCILED:'Conciliado con evidencia confirmada',PARTIAL:'Propuesta de Egresos sin confirmar',AMBIGUOUS:'Ambiguo · elegir candidato',DIFFERENCE:'Diferencia de importe',UNIDENTIFIED:'Sin identificar',MISSING_COUNTERPART:'Sin comprobante',INSUFFICIENT_EVIDENCE:'Evidencia insuficiente',CONFLICT:'Evidencia contradictoria'};
// BA-P1-01 — un resultado cuyas fuentes cambiaron después del cálculo no es un estado de
// conciliación: es un histórico que exige volver a calcular.
export const stateLabels:Record<string,string>={CURRENT:'Vigente',STALE:'Obsoleto · volver a calcular'};
// BR-P1-01 — el archivo físico de una fuente puede sustituirse sin que cambie ningún metadato:
// eso no es «recalcular», es reingestar el documento por el flujo normal.
export const stateReasonLabels:Record<string,string>={EVIDENCE_CHANGED:'Archivo de la evidencia alterado · reingesta requerida',SOURCES_CHANGED:'Fuentes modificadas · volver a calcular'};
export const directionLabels:Record<string,string>={DEBIT:'Cargo',CREDIT:'Abono',UNKNOWN:'Dirección desconocida'};
export const importStatusLabels:Record<string,string>={IMPORTED:'Importado',PARTIAL:'Importado con renglones sin leer',UNSUPPORTED:'Formato no soportado',UNPARSED:'Archivo ilegible'};
export const balanceLabels:Record<string,string>={BALANCED:'Saldo cuadrado',BALANCE_DIFFERENCE:'Diferencia de saldo',UNKNOWN:'Saldo no verificable'};
export const bankPendingLabels:Record<string,string>={MISSING_DOCUMENT:'Falta comprobante',UNIDENTIFIED_MOVEMENT:'Movimiento sin identificar',AMOUNT_DIFFERENCE:'Diferencia de importe',DATE_REVIEW:'Comprobante de otro mes',ACCOUNTING_COUNTERPART_MISSING:'Falta póliza',MISSING_BANK_MOVEMENT:'Póliza sin movimiento bancario',BALANCE_DIFFERENCE:'Saldo del estado de cuenta',AMBIGUOUS_MATCH:'Elegir candidato',POSSIBLE_DUPLICATE_MOVEMENT:'Posible renglón repetido',CONFLICTING_EVIDENCE:'Evidencia contradictoria',INSUFFICIENT_EVIDENCE:'Dato desconocido'};
export const documentOnlyLabels:Record<string,string>={TRUE_ORPHAN:'CFDI sin pago aparente',NO_MATCH:'Sin pago con ese importe',AMBIGUOUS_NOT_SELECTED:'Candidato no elegido (ambiguo)',CONFLICT_NOT_SELECTED:'Candidato con conflicto',DUPLICATE_NOT_SELECTED:'Duplicado por UUID',ADJACENT_PERIOD_CANDIDATE:'Candidato de periodo adyacente'};
export const differenceLabels:Record<string,string>={bank_vs_document:'Banco vs comprobante',bank_vs_accounting:'Banco vs póliza',document_vs_accounting:'Comprobante vs póliza'};
export function bankLabel(map:Record<string,string>,code:string|null|undefined){if(!code)return 'Desconocido';return map[code]??code.replaceAll('_',' ');}
// UNKNOWN nunca se muestra como cero.
export function amountText(value:string|null|undefined){return value==null||value===''?'Desconocido':value;}
export function isPositiveEvidence(status:string){return status==='RECONCILED';}
// El estado que se muestra: un resultado obsoleto nunca se presenta con su estado histórico.
export function resultStateText(status:string,state:string|undefined,reason?:string|null){
 if(state!=='STALE')return bankLabel(bankStatusLabels,status);
 return reason?bankLabel(stateReasonLabels,reason):stateLabels.STALE;
}
// BA-P2-01 — con alcance ASSIGNED_ONLY sólo se muestra lo de la propia asignación; los
// conteos completos del estado de cuenta (importados, rechazados, duplicados, fuera de
// periodo) son del lote y los consulta la gerencia.
export function importCountsText(counts:Record<string,number>,scope:string|undefined){
 if(scope==='ASSIGNED_ONLY')return `${counts.imported_in_scope??0} movimientos en tu alcance`;
 return `${counts.imported??0} importados · ${counts.out_of_period??0} fuera de periodo · ${counts.rejected??0} sin leer · ${counts.exact_import_duplicates??0} duplicados exactos · ${counts.possible_duplicates??0} posibles duplicados`;
}
