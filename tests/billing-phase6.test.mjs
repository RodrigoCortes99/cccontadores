import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {BillingRequestError,fieldErrorAttributes} from '../lib/billing/model.ts';
const source=readFileSync(new URL('../components/billing/BillingScreen.tsx',import.meta.url),'utf8');
const tree=ts.createSourceFile('BillingScreen.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let perform,load;function walk(n){if(n.name?.text==='perform')perform=n;if(ts.isVariableDeclaration(n)&&n.name.getText(tree)==='load')load=n.initializer.arguments[0];ts.forEachChild(n,walk);}walk(tree);
function executable(n,bindings){const code=ts.transpileModule('('+n.getText(tree)+')',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;return Function(...Object.keys(bindings),'return '+code)(...Object.values(bindings));}
test('P2-01 rejected action survives real perform refetch and removes old success',async()=>{
 const state={error:'',notice:'Cobro registrado',data:null};const locked={current:false};let refetch=0;
 const bindings={locked,setBusy:()=>{},setDialogError:()=>{},setFieldErrors:()=>{},setError:v=>state.error=v,setNotice:v=>state.notice=v,setDialog:()=>{},BillingRequestError,mounted:{current:true},setLoadError:()=>{},load:async()=>{refetch++;state.data={unapplied:'100.00',applications:[]};}};
 const run=executable(perform,bindings);
 locked.current=true;let duplicates=0;await run(async()=>{duplicates++;});assert.equal(duplicates,0);locked.current=false;
 await run(async()=>{throw new BillingRequestError(409,{code:'COLLECTION_OVERAPPLIED'});});
 assert.equal(refetch,1);assert.match(state.error,/remanente/);assert.equal(state.notice,'');assert.equal(state.data.unapplied,'100.00');assert.deepEqual(state.data.applications,[]);
 await run(async()=>{});assert.equal(state.error,'');assert.equal(state.notice,'Estado actualizado desde el servidor.');
});
test('P2-01 load commits server state without touching action error, stale loads withheld',async()=>{
 let data;const actionError='Rechazo actual';const version={current:0};let pending=[];
 const bindings={user:{},client:false,section:'home',loadVersion:version,mounted:{current:true},billing:{read:()=>new Promise(resolve=>pending.push(resolve))},setData:v=>data=v,setLoadError:()=>{},queryString:'',configKind:'',reference:v=>v};
 const run=executable(load,bindings);const first=run(),second=run();assert.equal(pending.length,4);pending[2]({state:'new'});pending[3]({results:[]});await second;pending[0]({state:'old'});pending[1]({results:[]});await first;
 assert.equal(data.state,'new');assert.equal(actionError,'Rechazo actual');assert.ok(!load.getText(tree).includes('setError('));assert.match(source,/!error&&notice/);
});
test('P2-02 invalid amount carries understandable field error and exact ARIA association',()=>{
 const error=new BillingRequestError(400,{code:'NON_DECIMAL_AMOUNT',received:'not-a-number'});
 assert.equal(error.message,'Ingresa un importe válido.');assert.equal(error.code,'NON_DECIMAL_AMOUNT');assert.deepEqual(error.fieldErrors,{amount:error.message});
 assert.deepEqual(fieldErrorAttributes(error.fieldErrors.amount,'amount-alert'),{'aria-invalid':true,'aria-describedby':'amount-alert'});
 assert.deepEqual(fieldErrorAttributes(error.fieldErrors.currency,'amount-alert'),{});
 assert.deepEqual(new BillingRequestError(409,{code:'COLLECTION_OVERAPPLIED'}).fieldErrors,{});
 const dialog=readFileSync(new URL('../components/billing/FormDialog.tsx',import.meta.url),'utf8');assert.match(dialog,/fieldErrorAttributes\(fieldErrors\[f.key\]/);assert.match(dialog,/role="alert"/);assert.match(dialog,/htmlFor=/);
});
