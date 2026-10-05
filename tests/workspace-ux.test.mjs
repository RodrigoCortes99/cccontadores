import {test} from 'node:test';
import assert from 'node:assert/strict';
import {apiErrorMessage,navigation,navigationQuery,returnPath} from '../app/panel/carova/egresos/ux.ts';

test('mensajes humanos de las formas DRF, incluidos permisos',()=>{
 const message='La verificación requiere otra persona.';
 for(const body of [message,[message],{campo:message},{campo:[message]},{non_field_errors:[message]},{detail:message}])assert.equal(apiErrorMessage(body,400),message);
 for(const message of ['Primero ejecuta la reclasificación pendiente.','Usa el flujo de reclasificación para conservar la instrucción.','Registra la respuesta primero.'])assert.equal(apiErrorMessage([message],400),message);
 assert.equal(apiErrorMessage({detail:'Solo el socio autoriza la comunicación.'},403),'Solo el socio autoriza la comunicación.');
});
test('no expone objetos, códigos ni trazas; mantiene fallback',()=>{
 for(const body of [null,{},[],123,{code:'forbidden'},'ENGINE_ABSTAINED','{"error":"x"}','Traceback (most recent call last):\n...',{stack:'Error: failed\n at x',detail:[]}])assert.equal(apiErrorMessage(body,400),'No pudimos guardar la información. Revisa los campos e intenta nuevamente.');
 assert.equal(apiErrorMessage(null,403),'Tu rol no permite esta acción en este contexto.');
});
test('vistas y filtros sobreviven al enlace de caso y retorno',()=>{
 for(const query of ['?tab=Supervisión&responsible=123&client=4&period=2099-01','?tab=Pendientes&quick=response','?tab=Periodos&accounting_period=5']){
  const value=navigation(query);const caseQuery=navigationQuery(value);const back=returnPath(caseQuery);
  assert.deepEqual(navigation(back.split('?')[1]),value);
 }
});
test('ignora parámetros inválidos y jamás retorna a una URL externa',()=>{
 const value=navigation('?tab=invalid&quick=wrong&client=-1&responsible=https://evil.test&period=2099-99');
 assert.equal(value.tab,'Mi trabajo');for(const key of ['quick','client','responsible','period'])assert.equal(value.filters[key],'');
 assert.ok(returnPath('?return=https://evil.test&tab=Pendientes').startsWith('/panel/carova/egresos?'));
});
