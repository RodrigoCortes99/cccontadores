import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
import {reference,downloadPath,errorMessage,moneyCards,routes,fiscalNotice,bankConfirmedNotice,sourceReviewNotice} from '../lib/billing/model.ts';
const source=readFileSync(new URL('../components/billing/BillingScreen.tsx',import.meta.url),'utf8');
const dialog=readFileSync(new URL('../components/billing/FormDialog.tsx',import.meta.url),'utf8');
const ref='bb20852d-72a1-4d22-9906-cae81c72e222';
const path=`/api/carova/workspace/billing/artifacts/${ref}/download/`;
test('Billing routes exist, opaque invoice/collection identity, client excluded',()=>{
 for(const [route] of routes)assert.ok(existsSync(new URL(`../app/panel/facturacion/${route?route+'/':''}page.tsx`,import.meta.url)));
 for(const route of ['facturas/[invoiceRef]','cobros/[collectionRef]'])assert.ok(existsSync(new URL(`../app/panel/facturacion/${route}/page.tsx`,import.meta.url)));
 assert.equal(reference(ref),ref);for(const value of ['1',1,'../path',null])assert.throws(()=>reference(value));
 assert.match(source,/if\(client\)return <ErrorState/);assert.match(source,/object\(data.permissions\).privileged===true/);
});
test('dashboard uses five server canon fields and separates currencies',()=>{
 assert.deepEqual(moneyCards.map(([k])=>k),['invoiced','applied','receivable_balance','overdue_balance','overpaid_amount']);
 assert.match(source,/Object.entries\(object\(data\)\)/);assert.ok(!moneyCards.some(([k])=>k==='net_position'));
});
test('no authoritative frontend money arithmetic; page limits remain bounded',()=>{
 const tree=ts.createSourceFile('BillingScreen.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const suspect=[];function scan(node){if(ts.isBinaryExpression(node)&&[ts.SyntaxKind.PlusToken,ts.SyntaxKind.MinusToken,ts.SyntaxKind.AsteriskToken,ts.SyntaxKind.SlashToken].includes(node.operatorToken.kind)){const text=node.getText(tree);if(/balance|applied|unapplied|amount|subtotal|total|overpaid|days_overdue/.test(text))suspect.push(text);}ts.forEachChild(node,scan);}scan(tree);
 assert.deepEqual(suspect,[]);assert.ok(!/parseFloat|toFixed/.test(source));assert.match(source,/query.set\('limit','20'\)/);
});
test('download rejects stale, numeric and arbitrary paths before network',()=>{
 assert.equal(downloadPath({ref,state:'CURRENT',download_url:path}),path);
 for(const a of [{ref:'1',state:'CURRENT',download_url:path},{ref,state:'STALE',download_url:path},{ref,state:'CURRENT',download_url:'https://evil.invalid/'+ref}])assert.throws(()=>downloadPath(a));
});
test('typed errors have human messages for financial and freshness failures',()=>{
 for(const code of ['SOURCE_PRICE_CHANGED','REVISION_CONFLICT','INVOICE_NOT_APPROVED','CURRENCY_NOT_COMPARABLE','COLLECTION_OVERAPPLIED','INVOICE_OVERAPPLIED','OVERPAYMENT_PRIVILEGED_ONLY','COLLECTION_HAS_ACTIVE_APPLICATIONS','BANK_MOVEMENT_NOT_CURRENT','SOURCE_NOT_AUTHORIZED','COUNTERPARTY_AMBIGUOUS']){
 const message=errorMessage(400,{code});assert.ok(message.length>20);assert.ok(!message.includes(code));}
 assert.match(errorMessage(409,{code:'ARTIFACT_STALE'}),/vigente/);
});
test('draft requests declare inputs, CAS revision and explicit rebind; approved read-only',()=>{
 assert.match(source,/const editable=data.status==='DRAFT'/);assert.match(source,/expected_revision:data.revision/);
 assert.match(source,/rebind_price:true/);assert.match(source,/Material aprobado de sólo lectura/);
 assert.match(source,/readiness\).ready/);assert.match(source,/approval-preview/);
 assert.ok(!/billing.write\([^;]*\{[^}]*calculated_total/.test(source));
});
test('applications are chosen, previewed on server and confirmed separately',()=>{
 assert.match(source,/application-preview/);assert.match(source,/setPreview\(\{\.\.\.p,request:/);
 assert.match(source,/Confirmar aplicación explícita/);assert.match(source,/initial:'STANDARD'/);
 assert.match(source,/privileged\?\[/);assert.match(source,/overpayment_reason/);assert.match(source,/applications\/\$\{reference\(app.ref\)\}\/reverse/);
});
test('BANK candidates do not claim confirmation, stale source visible, no manual detach',()=>{
 assert.equal(bankConfirmedNotice,'Cobro registrado. Falta aplicarlo a factura.');assert.match(source,/Movimiento sugerido ≠ cobro confirmado/);
 assert.match(source,/Consultar candidatos/);assert.match(source,/Actualizar movimientos disponibles/);assert.match(source,/sourceReviewNotice/);
 assert.match(source,/disabled=\{busy\|\|stale\}/);assert.match(source,/data.source==='MANUAL_DECLARATION'/);
 assert.match(sourceReviewNotice,/Cambió la evidencia bancaria/);
});
test('sensitive requests use a synchronous lock, refetch after success and failure',()=>{
 assert.match(source,/if\(locked.current\)return;locked.current=true/);
 assert.match(source,/await task\(\);await load\(\)/);assert.match(source,/await load\(\).catch/);
 assert.match(source,/locked.current=false;setBusy\(false\)/);
});
test('exports use explicit server artifact generation and same filters',()=>{
 for(const kind of ['INVOICE_PDF','STATEMENT_PDF','INVOICES_CSV','RECEIVABLES_XLSX'])assert.ok(source.includes(kind));
 assert.match(source,/kind,\.\.\.clean\(filters\),\.\.\.extra/);assert.equal(fiscalNotice,'Documento aún no integrado con emisión fiscal');
 assert.ok(!source.includes('SAT autorizado'));assert.ok(!source.includes('CFDI emitido'));
});
test('configuration versions are explicit and taxes are declarations, no JSON tutorial',()=>{
 for(const key of ['identities','items','prices','series'])assert.ok(source.includes(key));
 assert.match(source,/snapshot/);assert.match(source,/Próximo folio conceptual/);assert.match(source,/iva_factor/);
 assert.ok(!source.includes('JSON.parse'));assert.ok(!source.includes('next_folio:'));
});
test('dialog has real labels, focus trap/restore and associated error',()=>{
 assert.match(dialog,/role="dialog"/);assert.match(dialog,/aria-modal="true"/);assert.match(dialog,/htmlFor=/);
 assert.match(dialog,/previous\?\.focus/);assert.match(dialog,/e.key==='Tab'/);assert.match(dialog,/e.key==='Escape'/);
 assert.match(dialog,/aria-describedby=/);assert.match(dialog,/disabled=\{busy\}/);
});
