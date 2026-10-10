import test from 'node:test';
import assert from 'node:assert/strict';
import {bookPath,bookQuery,bookError} from '../lib/books-contract.ts';
test('books requests retain encoded RFC and zero filter without external navigation',()=>{
 const query=bookQuery({issuer_rfc:'A&B010101AAA',amount_min:'0',state:'CURRENT',empty:''});assert.equal(new URLSearchParams(query).get('issuer_rfc'),'A&B010101AAA');assert.equal(new URLSearchParams(query).get('amount_min'),'0');assert.equal(new URLSearchParams(query).has('empty'),false);
 assert.equal(bookPath('clients/00000000-0000-4000-8000-000000000001/cfdi/?'+query),'clients/00000000-0000-4000-8000-000000000001/cfdi/?'+query);
});
test('books request boundary refuses absolute, traversing and encoded authority paths',()=>{
 for(const path of ['https://evil.test/','//evil.test/','../cfdi/','cfdi/%2e%2e/','cfdi/\\x/','cfdi/\n','cfdi/#secret'])assert.throws(()=>bookPath(path));
});
test('books errors expose correction for posting/freshness and never raw private values',()=>{
 assert.match(bookError(['UNBALANCED_ENTRY']),/no cuadra/);assert.match(bookError({detail:['SOURCE_STALE']}),/evidencia vigente/);
 assert.doesNotMatch(bookError({detail:'Traceback SELECT private_key password abc',secret:'hidden'}),/SELECT|password|private_key|hidden|Traceback/);
});
