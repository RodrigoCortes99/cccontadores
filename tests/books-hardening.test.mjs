import test from 'node:test';
import assert from 'node:assert/strict';
import {bookLabel,bookDisplay,bookError} from '../lib/books-contract.ts';

test('book states distinguish missing setup, retired source and uncertain remote acceptance',()=>{
 assert.match(bookLabel('NOT_CONFIGURED'),/Sin configurar/);
 assert.match(bookLabel('STALE'),/No vigente/);
 assert.match(bookLabel('REMOTE_UNCERTAIN'),/revisar antes/);
 assert.notEqual(bookLabel('RETRY_WAIT'),bookLabel('FAILED'));
 assert.match(bookLabel('MATCH_HISTORICAL_LIST'),/histórica/);
 assert.equal(bookLabel('ASSET / Activo circulante'),'Activo / Activo circulante');
 assert.equal(bookLabel('EQUITY / Capital'),'Capital / Capital');
 assert.doesNotMatch(bookLabel('NO_MATCH_FOUND'),/segur|legal|fraude/i);
});
test('row errors and exact decimal facts remain readable without object JSON',()=>{
 const value=bookDisplay([{row:2,field:'opening',errors:['MISSING_REQUIRED_FIELD']},{gross:'1234.560000',net:'1200.560000'}]);
 assert.match(value,/Fila: 2/);assert.match(value,/Falta un valor obligatorio/);
 assert.match(value,/1234\.560000/);assert.doesNotMatch(value,/[{}\[\]]/);
 assert.equal(bookDisplay(0),'0');assert.equal(bookDisplay(false),'No');
});
test('retry and import failures give specific correction without private remote messages',()=>{
 assert.match(bookError(['SAT_EXPIRED_REQUEST_REQUIRES_NEW_SYNC']),/solicita de nuevo/);
 assert.match(bookError(['EXPORT_ONE_EXPLICIT_SHEET']),/únicamente la hoja/);
 assert.match(bookError(['SAT_SYNC_RATE_LIMIT']),/historial/);
 assert.match(bookError(['PERIOD_REQUIRED']),/Selecciona el período/);
 assert.doesNotMatch(bookError({error:'private-key SECRET remote stacktrace'}),/SECRET|stacktrace|private-key/);
});
