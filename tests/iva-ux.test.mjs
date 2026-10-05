import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vatStatusLabels,vatPendingLabels,vatStateLabels,vatStateReasonLabels,vatLabel,vatResultText} from '../app/panel/carova/egresos/ivaUx.ts';

const STATES=['STRUCTURED','PARTIAL','INCONSISTENT','INSUFFICIENT_EVIDENCE','UNSUPPORTED_STRUCTURE','EXTERNAL_VALIDATION_REQUIRED','BLOCKED_BY_BUSINESS_RULE'];

test('cada estado estructural de IVA tiene etiqueta y un código nuevo se muestra literal',()=>{
 for(const code of STATES)assert.ok(vatStatusLabels[code],code);
 assert.equal(vatLabel(vatStatusLabels,'ESTADO_NUEVO'),'ESTADO_NUEVO');
});

test('ninguna etiqueta afirma acreditabilidad, deducibilidad, impuesto a pagar ni declaración',()=>{
 for(const code of STATES){
  const text=vatStatusLabels[code].toLowerCase();
  for(const word of ['acredit','deducib','impuesto a pagar','declaración','correcto'])assert.ok(!text.includes(word),`${code}: ${text}`);
 }
});

test('el panel de IVA declara lo que no es y no ofrece escribir los controles humanos',()=>{
 const panel=readFileSync(new URL('../app/panel/carova/egresos/IvaPanel.tsx',import.meta.url),'utf8');
 assert.match(panel,/No es una declaración/);
 assert.match(panel,/no significa que el IVA sea correcto/);
 assert.match(panel,/este motor no las escribe/);
 for(const forbidden of ['vat_execute','provisional_ready','difference_resolve'])assert.ok(!panel.includes(forbidden),forbidden);
});

test('el grupo IVA es aditivo: los grupos anteriores del periodo siguen en su lugar',()=>{
 const period=readFileSync(new URL('../app/panel/carova/egresos/PeriodPanel.tsx',import.meta.url),'utf8');
 const groups=period.match(/const groups=\[(.*?)\];/)[1].split(',').map(g=>g.trim().replace(/'/g,''));
 assert.deepEqual(groups,['Contexto y cierre','Recepción','Automatización','Bancos / Conciliación','IVA','Contabilidad','Seguimiento','Revisión mensual','Socio y salida']);
 assert.match(period,/group==='IVA'&&<IvaPanel/);
 assert.match(period,/group==='Bancos \/ Conciliación'&&<BankPanel/);
});

test('el panel de IVA usa su propia ruta y no la de Egresos ni la de Bancos',()=>{
 const panel=readFileSync(new URL('../app/panel/carova/egresos/IvaPanel.tsx',import.meta.url),'utf8');
 assert.match(panel,/\/api\/carova\/workspace\/iva\/periods\//);
 assert.ok(!panel.includes('/api/carova/workspace/automation/'));
 assert.ok(!panel.includes('/api/carova/workspace/bank/'));
});

const PENDINGS=['VAT_BREAKDOWN_MISSING','VAT_AMOUNT_UNREADABLE','VAT_DOCUMENT_UNREADABLE','VAT_INTERNAL_DIFFERENCE','VAT_STRUCTURE_NOT_COVERED','VAT_RULE_NOT_CONFIRMED','VAT_PAYMENT_METHOD_MISSING','VAT_REP_WITHOUT_REFERENCE','VAT_EXTERNAL_VALIDATION','VAT_PERIOD_SCOPE_REVIEW','VAT_PAYMENT_LINK_MISSING','VAT_ACCOUNTING_COUNTERPART_MISSING','VAT_BANK_RESULT_MISSING','VAT_BANK_RESULT_NOT_RECONCILED'];

test('cada pendiente del motor tiene etiqueta y ninguno afirma nada fiscal',()=>{
 for(const code of PENDINGS)assert.ok(vatPendingLabels[code],code);
 for(const code of PENDINGS){
  const text=vatPendingLabels[code].toLowerCase();
  for(const word of ['acredit','deducib','impuesto a pagar','declaración','inválid'])assert.ok(!text.includes(word),`${code}: ${text}`);
 }
});

test('un resultado no vigente nunca se presenta con su estado histórico',()=>{
 assert.equal(vatResultText('STRUCTURED','CURRENT',null),vatStatusLabels.STRUCTURED);
 const stale=vatResultText('STRUCTURED','STALE','SOURCES_CHANGED');
 assert.ok(!stale.includes(vatStatusLabels.STRUCTURED));
 assert.match(stale,/No vigente/);
 assert.match(stale,/Cambió una fuente material/);
 assert.match(vatResultText('STRUCTURED','STALE','EVIDENCE_CHANGED'),/reingesta/i);
 assert.ok(vatStateLabels.CURRENT&&vatStateLabels.STALE&&vatStateReasonLabels.SOURCES_CHANGED&&vatStateReasonLabels.EVIDENCE_CHANGED);
});

test('el panel ofrece calcular, declara el IVA contable ausente y no escribe controles humanos',()=>{
 const panel=readFileSync(new URL('../app/panel/carova/egresos/IvaPanel.tsx',import.meta.url),'utf8');
 assert.match(panel,/Calcular revisión de IVA/);
 assert.match(panel,/IVA contable: no existe capturado/);
 assert.match(panel,/estado histórico/);
 for(const forbidden of ['vat_execute','provisional_ready','difference_resolve','acreditable','deducible'])assert.ok(!panel.includes(forbidden),forbidden);
});

test('el panel muestra el retiro de resultados, el borrador y lo declara como no persistido',()=>{
 const panel=readFileSync(new URL('../app/panel/carova/egresos/IvaPanel.tsx',import.meta.url),'utf8');
 assert.match(panel,/withheld_notice/);
 assert.match(panel,/Borrador de aclaración/);
 assert.match(panel,/clarification_draft\.notice/);
 assert.match(panel,/ALCANCE_DECLARADO/);
 assert.match(panel,/Observación aritmética \(no es hallazgo\)/);
});

test('con alcance limitado el panel declara la limitación y no muestra ningún número de retirados',()=>{
 const panel=readFileSync(new URL('../app/panel/carova/egresos/IvaPanel.tsx',import.meta.url),'utf8');
 assert.match(panel,/scope_limited/);
 assert.match(panel,/scope_notice/);
 // el conteo sólo se pinta cuando la vista NO está limitada: el servidor tampoco lo envía.
 assert.match(panel,/!data\.scope_limited&&\(data\.withheld_results\?\?0\)>0/);
 // y el panel no calcula por su cuenta un número de lo que no ve
 for(const forbidden of ['withheld_results.length','restricted_count','hidden_count'])assert.ok(!panel.includes(forbidden),forbidden);
});

test('el panel trata el identificador de resultados y pendientes como referencia opaca',()=>{
 const panel=readFileSync(new URL('../app/panel/carova/egresos/IvaPanel.tsx',import.meta.url),'utf8');
 // IVA-A-P1-05: con alcance parcial el servidor manda una referencia opaca, no la clave interna.
 assert.match(panel,/type PublicRef=string\|number/);
 assert.match(panel,/encodeURIComponent\(String\(p\.id\)\)/);
 assert.match(panel,/key=\{String\(r\.id\)\}/);
 assert.match(panel,/key=\{String\(p\.id\)\}/);
 // y no la interpreta como número por ninguna vía
 for(const forbidden of ['parseInt(','Number(r.id','Number(p.id','r.id+1','p.id+1','a.id-b.id'])assert.ok(!panel.includes(forbidden),forbidden);
});

test('el panel nunca presenta un resultado obsoleto con su estado histórico como vigente',()=>{
 const panel=readFileSync(new URL('../app/panel/carova/egresos/IvaPanel.tsx',import.meta.url),'utf8');
 assert.match(panel,/vatResultText\(r\.snapshot_status,r\.state,r\.state_reason\)/);
 assert.match(panel,/estado histórico/);
});

test('el panel ofrece el papel de trabajo y repite su aviso al entregarlo',()=>{
 const panel=readFileSync(new URL('../app/panel/carova/egresos/IvaPanel.tsx',import.meta.url),'utf8');
 assert.match(panel,/Papel de trabajo XLSX/);
 assert.match(panel,/export\/'/);
 assert.match(panel,/\$\{r\.notice\}/);
});
