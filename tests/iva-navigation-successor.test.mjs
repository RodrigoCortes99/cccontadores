// Proposed separate successor: preserve prior groups in relative order while allowing additive modules.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('el grupo IVA conserva grupos anteriores y permite extensiones aditivas',()=>{
 const period=readFileSync(new URL('../app/panel/carova/egresos/PeriodPanel.tsx',import.meta.url),'utf8');
 const groups=period.match(/const groups=\[(.*?)\];/)[1].split(',').map(g=>g.trim().replace(/'/g,''));
 const previous=['Contexto y cierre','Recepción','Automatización','Bancos / Conciliación','IVA','Seguimiento','Revisión mensual','Socio y salida'];
 assert.deepEqual(groups.filter(g=>previous.includes(g)),previous);
 assert.match(period,/group==='IVA'&&<IvaPanel/);
 assert.match(period,/group==='Bancos \/ Conciliación'&&<BankPanel/);
 const iva=readFileSync(new URL('../app/panel/carova/egresos/IvaPanel.tsx',import.meta.url),'utf8');
 const bank=readFileSync(new URL('../app/panel/carova/egresos/BankPanel.tsx',import.meta.url),'utf8');
 assert.match(iva,/\/api\/carova\/workspace\/iva\/periods\//);
 assert.match(bank,/\/api\/carova\/workspace\/bank\/periods\//);
 assert.ok(groups.includes('Contabilidad'));
 assert.match(period,/group==='Contabilidad'&&<AccountingPanel/);
});
