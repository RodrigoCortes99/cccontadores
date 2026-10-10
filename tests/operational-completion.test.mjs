import test from 'node:test';
import assert from 'node:assert/strict';
import {formErrorMessage} from '../lib/formErrors.ts';
import {runLabel,matchLabels} from '../app/panel/carova/egresos/ux.ts';
test('errores presentan campo, causa y corrección sin volcar objetos o trazas',()=>{
 assert.match(formErrorMessage({duration_minutes:['A valid integer is required.']}),/Duración.*entero.*sin decimales/);
 assert.match(formErrorMessage({client_id:'Este cliente ya está registrado. Ábrelo desde la lista.'}),/Cliente.*ya está registrado/);
 const output=formErrorMessage({detail:'Traceback: SELECT password FROM users',extra:{private:'hidden'}});
 assert.doesNotMatch(output,/SELECT|password|hidden|Traceback|[{}]/);
});
test('cálculos parciales y coincidencias por fecha no aparecen como aprobaciones',()=>{
 assert.match(runLabel('PARTIAL'),/pendientes.*revisar/);assert.doesNotMatch(runLabel('PARTIAL'),/PARTIAL|aprobado/i);
 assert.match(matchLabels.AMOUNT_DATE,/requiere confirmación/);
});

import {attentionHref} from '../lib/operational-reporting.ts';
test('enlaces nativos llevan al objeto conocido sin aceptar redirecciones o IDs derivados',()=>{
 for(const path of ['/panel/pbc/12','/panel/carova/egresos/4','/panel/carova/egresos?tab=Periodos&accounting_period=4&section=IVA'])assert.equal(attentionHref({action_url:path,module_route:null}),path);
 for(const path of ['https://evil.test/panel/pbc/12','//evil.test/panel/pbc/12','/panel/pbc/12?redirect=https://evil.test','/panel/carova/egresos?tab=Periodos&accounting_period=4&section=IVA&next=/admin'])assert.equal(attentionHref({action_url:path,module_route:null}),null);
});

import {allowed as payrollAllowed,privileged as payrollPrivileged} from '../lib/payroll/model.ts';
test('autoservicio de nómina mantiene root sin organización y límites de los otros roles',()=>{
 const root={role:'staff',is_superuser:true,organization_id:null};
 assert.equal(payrollAllowed(root),true);assert.equal(payrollPrivileged(root),true);
 for(const role of ['staff','senior','manager','partner'])assert.equal(payrollAllowed({role,is_superuser:false,organization_id:null}),false);
 assert.equal(payrollAllowed({role:'client',is_superuser:false,organization_id:1}),false);
 assert.equal(payrollPrivileged({role:'staff',is_superuser:false,organization_id:1}),false);
 assert.equal(payrollPrivileged({role:'manager',is_superuser:false,organization_id:1}),true);
});
