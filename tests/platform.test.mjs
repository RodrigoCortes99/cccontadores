import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {primaryNavigation,navigationFor,activeDestination,rangePreset,reportQuery,engineState,reportLink,reportingViews,employeeViews} from '../lib/platform.ts';

test('cinco destinos y capacidades técnicas dentro de Trabajo',()=>{
 assert.deepEqual(primaryNavigation.map(n=>n.label),['Inicio','Clientes','Pendientes','Equipo','Reportes']);
 assert.equal(activeDestination('/panel/clientes/32'),'/panel/clientes');
 assert.equal(activeDestination('/panel/carova/egresos/7'),'/panel/trabajo');
 assert.equal(activeDestination('/panel/equipo/2'),'/panel/equipo');
 assert.equal(activeDestination('/panel/reportes'),'/panel/reportes');
});
test('cliente externo conserva sólo las entradas previas permitidas',()=>{
 assert.ok(!navigationFor(true).some(n=>['Equipo','Reportes','Configuración'].includes(n.label)));
 assert.equal(navigationFor(false).length,5);
});
test('rango semanal no UTC ni domingo como inicio',()=>{
 assert.deepEqual(rangePreset('week',new Date(2026,8,23)),{desde:'2026-09-21',hasta:'2026-09-23'});
 assert.deepEqual(rangePreset('month',new Date(2026,8,23)),{desde:'2026-09-01',hasta:'2026-09-23'});
 assert.deepEqual(rangePreset('today',new Date(2026,8,23)),{desde:'2026-09-23',hasta:'2026-09-23'});
});
test('contexto y filtros sobreviven al URL, sin campos vacíos',()=>{
 const p=new URLSearchParams(reportQuery({client_id:'4',period_id:'12',employee_id:'2',q:'A & B',empty:''}));
 assert.equal(p.get('q'),'A & B');assert.equal(p.get('period_id'),'12');assert.ok(!p.has('empty'));
});
test('no presentar fallo ni evidencia stale como resultado actualizado',()=>{
 assert.equal(engineState({state:'CURRENT',run_status:'FAILED'}),'Requiere atención');
 assert.equal(engineState({state:'STALE',run_status:'COMPLETED'}),'La evidencia cambió');
 assert.equal(engineState({state:'NOT_STARTED',run_status:null}),'Sin ejecución');
});

test('rango siete días y mes anterior respetan calendario local',()=>{
 assert.deepEqual(rangePreset('last7',new Date(2026,8,23)),{desde:'2026-09-17',hasta:'2026-09-23'});
 assert.deepEqual(rangePreset('previous',new Date(2026,0,15)),{desde:'2025-12-01',hasta:'2025-12-31'});
 assert.deepEqual(rangePreset('previous',new Date(2024,2,31)),{desde:'2024-02-01',hasta:'2024-02-29'});
});

test('dos ejes de primer nivel y profundidad del empleado',()=>{
 for(const name of ['Equipo','Empleados','Clientes','Periodos','Actividad'])assert.ok(reportingViews.includes(name));
 for(const name of ['Clientes','Actividad','Pendientes','Asignaciones'])assert.ok(employeeViews.includes(name));
});
test('navegación bidireccional conserva cross-filter y reinicia paginación',()=>{
 const href=reportLink('/panel/equipo/7','type=client&client_id=2&period_id=5&desde=2026-09-01&hasta=2026-09-15&engine=BANK&page=4&view=Clientes',{type:'employee',employee_id:'7'});
 const p=new URL(href,'http://local').searchParams;
 assert.equal(p.get('client_id'),'2');assert.equal(p.get('period_id'),'5');assert.equal(p.get('engine'),'BANK');assert.equal(p.get('employee_id'),'7');assert.equal(p.get('desde'),'2026-09-01');assert.ok(!p.has('page'));
 const reverse=new URL(reportLink('/panel/clientes/2?period_id=5',p.toString(),{type:'client',tab:'Reportes'}),'http://local');
 assert.equal(reverse.searchParams.get('employee_id'),'7');assert.equal(reverse.searchParams.get('tab'),'Reportes');
});


test('continuación sólo local y separada por usuario/organización',async()=>{
 const {safeWork,workKey}=await import('../lib/work-context.ts');
 const sample={href:'/panel/carova/egresos?accounting_period=2',workspace:'/panel/clientes/1?period_id=2',client:'Sintético',period:'2026-09',periodId:2};
 assert.equal(safeWork(sample),true);
 for(const href of ['https://example.com','//example.com','javascript:alert(1)','/panel/configuracion'])assert.equal(safeWork({...sample,href}),false);
 assert.equal(safeWork({...sample,workspace:'https://example.com'}),false);
 assert.notEqual(workKey(1,2),workKey(2,2));assert.notEqual(workKey(1,2),workKey(1,3));
});

test('el panel trata el identificador de un pendiente y la entidad de actividad como opacos',()=>{
 // IVA-A-P1-06: para alcance parcial, `pendings[].id` y `activity.entity` de un objeto de IVA
 // llevan una referencia pública, no la clave interna. El panel no puede operar con ellas.
 const platform=readFileSync(new URL('../components/panel/Platform.tsx',import.meta.url),'utf8');
 const types=readFileSync(new URL('../lib/platform.ts',import.meta.url),'utf8');
 assert.match(types,/export type Pending=\{id:number\|string;/);
 assert.match(types,/entity:string;/);
 for(const forbidden of ['parseInt(r.id','Number(r.id','r.id+1','a.id-b.id','parseInt(detail.entity','Number(r.entity','entity.split(\':\')[1]-'])
  assert.ok(!platform.includes(forbidden),forbidden);
});
