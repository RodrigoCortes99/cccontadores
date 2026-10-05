import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {vendorWebsite,environmentLabel} from '../lib/branding.ts';
import {operationalNavigation,navigationForActor} from '../lib/operational-navigation.ts';
import {navigationFor} from '../lib/platform.ts';
import {decimalDisplay} from '../lib/billing/model.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('CC Contadores is primary; genuine existing logo and secondary developer credit',()=>{
 const sidebar=read('components/panel/Sidebar.tsx');assert.match(sidebar,/aria-label="CC Contadores · Inicio"/);assert.match(sidebar,/src="\/logo-cc-transparente.png"/);assert.match(sidebar,/Hecho por <strong>CAROVA<\/strong>/);assert.doesNotMatch(sidebar,/aria-label="CAROVA/);
 assert.match(sidebar,/target="_blank" rel="noopener noreferrer"/);
});
test('vendor link only accepts an explicitly configured HTTPS public URL',()=>{
 assert.equal(vendorWebsite(undefined),null);for(const value of ['javascript:alert(1)','//example.com','http://example.com','https://user:password@example.com','not-a-url'])assert.equal(vendorWebsite(value),null);
 assert.equal(vendorWebsite('https://example.invalid/about'),'https://example.invalid/about');
});
test('operational IA and role navigation preserve legitimate portal isolation',()=>{
 assert.deepEqual(operationalNavigation.map(g=>g.label),['Tu espacio','Operación','Control','Administración','Sistema']);
 assert.deepEqual(operationalNavigation[4].items.map(i=>i.label),['Configuración','Conectividad']);
 assert.deepEqual(navigationForActor(null),[]);assert.deepEqual(navigationForActor({role:'client'}),[]);
 for(const role of ['staff','senior','manager','partner'])assert.equal(navigationForActor({role}).flatMap(g=>g.items).length,14);
 assert.deepEqual(navigationFor(true).map(i=>i.label),['Inicio','Mis encargos','Solicitudes','Documentos']);
 for(const {href} of operationalNavigation.flatMap(g=>g.items))assert.ok(existsSync(new URL('../app'+href+'/page.tsx',import.meta.url)),href);
});
test('shared tab navigation exposes current page and preserves period and clarification routes',()=>{
 const billing=read('components/billing/BillingScreen.tsx'),workspace=read('app/panel/carova/egresos/Workspace.tsx');
 assert.match(billing,/<nav className="ccTabs" aria-label="Facturación"/);assert.match(billing,/routes.filter\(\(\[path\]\)=>path!=='configuracion'\)/);assert.match(billing,/aria-current=/);
 assert.match(workspace,/tab==='Periodos'&&<PeriodPanel/);assert.match(workspace,/setTab\('Pendientes'\)/);assert.match(workspace,/rows=\{mine\}/);
 assert.doesNotMatch(read('components/panel/AppShell.tsx'),/<WorkNavigation/);
});
test('financial presentation preserves exact decimal digits without rounding or arithmetic',()=>{
 for(const [input,expected] of [['12500.00','12,500.00'],['-1234567.123456','-1,234,567.123456'],['0.000001','0.000001'],['999999999999999999999.99','999,999,999,999,999,999,999.99'],[null,'—'],['not available','not available']])assert.equal(decimalDisplay(input),expected);
});

test('environment labeling is explicit, independent from organization identity',()=>{
 assert.equal(environmentLabel(undefined),null);assert.equal(environmentLabel(''),null);assert.equal(environmentLabel('production'),null);assert.equal(environmentLabel('unknown'),null);
 assert.equal(environmentLabel('demo'),'Demostración');assert.equal(environmentLabel('test'),'Pruebas');assert.equal(environmentLabel('development'),'Desarrollo');assert.equal(environmentLabel(' DEMO '),'Demostración');
 const header=read('components/panel/Header.tsx');assert.match(header,/publicEnvironmentLabel &&/);assert.match(header,/cambiarOrganizacionActiva/);assert.match(header,/Cambiar organización activa/);
});
