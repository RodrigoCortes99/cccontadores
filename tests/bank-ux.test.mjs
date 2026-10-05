import test from 'node:test';
import assert from 'node:assert/strict';
import {differenceLabels,bankStatusLabels,directionLabels,importStatusLabels,balanceLabels,bankPendingLabels,documentOnlyLabels,bankLabel,amountText,isPositiveEvidence,stateLabels,stateReasonLabels,resultStateText,importCountsText} from '../app/panel/carova/egresos/bankUx.ts';

test('cada estado de conciliación tiene etiqueta y sólo RECONCILED afirma evidencia positiva',()=>{
 for(const code of ['RECONCILED','PARTIAL','AMBIGUOUS','DIFFERENCE','UNIDENTIFIED','MISSING_COUNTERPART','INSUFFICIENT_EVIDENCE','CONFLICT'])assert.ok(bankStatusLabels[code],code);
 for(const code of Object.keys(bankStatusLabels).filter(c=>c!=='RECONCILED')){assert.doesNotMatch(bankStatusLabels[code],/^Conciliado/,code);assert.equal(isPositiveEvidence(code),false);}
 assert.match(bankStatusLabels.PARTIAL,/sin confirmar/);
 assert.equal(isPositiveEvidence('RECONCILED'),true);
});

test('dirección, importación, saldo y pendientes tienen vocabulario explícito',()=>{
 assert.deepEqual(Object.keys(directionLabels).sort(),['CREDIT','DEBIT','UNKNOWN']);
 for(const code of ['IMPORTED','PARTIAL','UNSUPPORTED','UNPARSED'])assert.ok(importStatusLabels[code]);
 for(const code of ['BALANCED','BALANCE_DIFFERENCE','UNKNOWN'])assert.ok(balanceLabels[code]);
 for(const code of ['MISSING_DOCUMENT','UNIDENTIFIED_MOVEMENT','AMOUNT_DIFFERENCE','DATE_REVIEW','ACCOUNTING_COUNTERPART_MISSING','MISSING_BANK_MOVEMENT','BALANCE_DIFFERENCE','AMBIGUOUS_MATCH','POSSIBLE_DUPLICATE_MOVEMENT','CONFLICTING_EVIDENCE','INSUFFICIENT_EVIDENCE'])assert.ok(bankPendingLabels[code],code);
 for(const code of ['TRUE_ORPHAN','NO_MATCH','AMBIGUOUS_NOT_SELECTED','CONFLICT_NOT_SELECTED','DUPLICATE_NOT_SELECTED','ADJACENT_PERIOD_CANDIDATE'])assert.ok(documentOnlyLabels[code],code);
});

test('un importe desconocido nunca se muestra como cero y un código nuevo se muestra literal',()=>{
 assert.equal(amountText(null),'Desconocido');assert.equal(amountText(''),'Desconocido');assert.equal(amountText('0.00'),'0.00');
 assert.equal(bankLabel(bankStatusLabels,'FUTURO_ESTADO'),'FUTURO ESTADO');
});

test('las diferencias se nombran por par comparado, nunca con la clave interna',()=>{
 for(const code of ['bank_vs_document','bank_vs_accounting','document_vs_accounting']){assert.ok(differenceLabels[code],code);assert.doesNotMatch(differenceLabels[code],/_/);}
});

test('un resultado obsoleto no se muestra con su estado histórico y el histórico se nombra aparte',()=>{
 assert.equal(resultStateText('RECONCILED','STALE'),stateLabels.STALE);
 assert.doesNotMatch(resultStateText('RECONCILED','STALE'),/^Conciliado/);
 assert.equal(resultStateText('RECONCILED','CURRENT'),bankStatusLabels.RECONCILED);
 assert.equal(resultStateText('DIFFERENCE',undefined),bankStatusLabels.DIFFERENCE);
 assert.match(stateLabels.STALE,/volver a calcular/);
});

test('con alcance asignado los conteos de importación no revelan el volumen del lote',()=>{
 const counts={imported:187,rejected:4,out_of_period:2,exact_import_duplicates:1,possible_duplicates:3,imported_in_scope:164};
 const scoped=importCountsText(counts,'ASSIGNED_ONLY');
 assert.match(scoped,/164/);
 for(const hidden of ['187','4','2','1','3'])assert.doesNotMatch(scoped.replace('164',''),new RegExp(hidden));
 assert.match(importCountsText(counts,'FULL'),/187 importados/);
 assert.equal(importCountsText({imported_in_scope:0},'ASSIGNED_ONLY'),'0 movimientos en tu alcance');
});

test('un archivo alterado se nombra como reingesta, no como recálculo, y nunca como conciliado',()=>{
 assert.equal(resultStateText('RECONCILED','STALE','EVIDENCE_CHANGED'),stateReasonLabels.EVIDENCE_CHANGED);
 assert.match(stateReasonLabels.EVIDENCE_CHANGED,/reingesta/);
 assert.doesNotMatch(resultStateText('RECONCILED','STALE','EVIDENCE_CHANGED'),/^Conciliado/);
 assert.equal(resultStateText('RECONCILED','STALE','SOURCES_CHANGED'),stateReasonLabels.SOURCES_CHANGED);
 assert.equal(resultStateText('RECONCILED','STALE',null),stateLabels.STALE);
 assert.equal(resultStateText('RECONCILED','CURRENT',null),bankStatusLabels.RECONCILED);
});
