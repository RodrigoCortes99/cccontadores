import test from 'node:test';
import assert from 'node:assert/strict';
import {matchLabels,draftLabels,proposalStatusLabels,fieldLabels,reasonKindLabels,pendingLabels,operationLabels,evidenceTypeLabels,evidenceFields,coverageNote,allowedOperations,allowedEvidenceTypes,label,fieldList} from '../app/panel/carova/egresos/ux.ts';

test('cada tipo de resultado del motor tiene una etiqueta que no promete coincidencia',()=>{
 for(const code of ['EXACT_MATCH','STRONG_MATCH','AMBIGUOUS','NO_MATCH','INSUFFICIENT_EVIDENCE','CONFLICT'])assert.ok(matchLabels[code],code);
 for(const code of ['AMBIGUOUS','NO_MATCH','INSUFFICIENT_EVIDENCE','CONFLICT'])assert.doesNotMatch(matchLabels[code],/^Coincidencia/);
 assert.equal(matchLabels.STRONG_MATCH,'Coincidencia fuerte · confirmar proveedor');
});

test('estados de borrador y de propuesta distinguen la decisión humana',()=>{
 for(const code of ['READY_FOR_REVIEW','NEEDS_INFORMATION','AMBIGUOUS_DOCUMENT_MATCH','AMOUNT_DIFFERENCE','MISSING_SUPPORT','MISSING_CFDI','PERIOD_REVIEW_REQUIRED','ACCOUNT_REVIEW_REQUIRED'])assert.ok(draftLabels[code],code);
 assert.match(proposalStatusLabels.ACCEPTED,/por una persona/);
 assert.match(proposalStatusLabels.CORRECTED,/por una persona/);
 assert.equal(proposalStatusLabels.PROPOSED,'Propuesta');
});

test('un código desconocido se muestra literal, nunca vacío ni inventado',()=>{
 assert.equal(label(matchLabels,'FUTURO_CODIGO'),'FUTURO CODIGO');
 assert.equal(label(fieldLabels,'amount'),'importe');
 assert.equal(label(reasonKindLabels,'conflicting'),'conflicto');
});

test('listas de campos vacías se muestran como guion largo, no como coincidencia',()=>{
 assert.equal(fieldList([]),'—');
 assert.equal(fieldList(['amount','supplier','adjacent_period']),'importe, proveedor, mes adyacente');
 assert.equal(fieldList(['shared_candidate']),'CFDI reclamado por varios pagos');
});

test('cada motivo por el que un CFDI no fue elegido tiene su propia etiqueta',()=>{
 for(const code of ['DOCUMENT_WITHOUT_MOVEMENT','NOT_SELECTED_NO_MATCH','AMBIGUOUS_NOT_SELECTED','CONFLICT_NOT_SELECTED','DUPLICATE_NOT_SELECTED','ADJACENT_PERIOD_CANDIDATE'])assert.ok(pendingLabels[code],code);
 const distinct=new Set(['DOCUMENT_WITHOUT_MOVEMENT','NOT_SELECTED_NO_MATCH','AMBIGUOUS_NOT_SELECTED','CONFLICT_NOT_SELECTED','DUPLICATE_NOT_SELECTED','ADJACENT_PERIOD_CANDIDATE'].map(c=>pendingLabels[c]));
 assert.equal(distinct.size,6);
 assert.doesNotMatch(pendingLabels.AMBIGUOUS_NOT_SELECTED,/sin (pago|movimiento)/);
 assert.doesNotMatch(pendingLabels.ADJACENT_PERIOD_CANDIDATE,/sin (pago|movimiento)/);
});

test('agregar, sustituir y liberar se nombran distinto y ninguno se llama solo "asociar"',()=>{
 assert.equal(Object.keys(operationLabels).length,3);
 assert.match(operationLabels.ADD,/Agregar/);
 assert.match(operationLabels.REPLACE,/Sustituir/);
 assert.match(operationLabels.RELEASE,/Liberar/);
});

test('cada tipo de evidencia de resolución tiene etiqueta y campo',()=>{
 for(const code of ['HUMAN_NOTE','PHYSICAL_EVIDENCE_REFERENCE','DIGITAL_DOCUMENT','RECEIPT','AUTHORIZED_DECISION']){
  assert.ok(evidenceTypeLabels[code],code);assert.ok(evidenceFields[code],code);
 }
 assert.equal(evidenceFields.DIGITAL_DOCUMENT,'document_id');
});

test('una cobertura truncada nunca se anuncia como completa',()=>{
 assert.equal(coverageNote({coverage:'Los primeros 100 de 240 documentos.'}),'Los primeros 100 de 240 documentos.');
 assert.match(coverageNote({truncated:true,limit:100}),/límite/);
 assert.match(coverageNote({count:12}),/ninguno quedó fuera/);
 assert.doesNotMatch(coverageNote({truncated:true,limit:100}),/todos/i);
});

test('sólo gerencia ve sustituir, liberar y la decisión autorizada',()=>{
 assert.deepEqual(allowedOperations(false),['ADD']);
 assert.deepEqual(allowedOperations(true),['ADD','REPLACE','RELEASE']);
 assert.ok(!allowedEvidenceTypes(false).includes('AUTHORIZED_DECISION'));
 assert.ok(allowedEvidenceTypes(true).includes('AUTHORIZED_DECISION'));
});
