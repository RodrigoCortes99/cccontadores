import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {validSource,sourcePaths,presentationPath,metadataFrom,nextPage,pageKey,rangeTotal,fullscreenChange} from '../lib/presentation/model.ts';
import {readPageText} from '../lib/presentation/text.ts';
const source={kind:'documentos',ref:'12'};
test('accessible PDF text works without ReadableStream async iterator, including marked content',async()=>{
 const stream=new ReadableStream({start(c){c.enqueue({items:[{str:'Informe'},{type:'beginMarkedContent'},{str:'autorizado'}]});c.close();}});
 Object.defineProperty(stream,Symbol.asyncIterator,{value:undefined});
 assert.equal(await readPageText(stream,()=>true),'Informe  autorizado');
});
test('accessible PDF text is bounded and cancelled on a superseded page',async()=>{
 let cancelled=false;const stream=new ReadableStream({start(c){c.enqueue({items:[{str:'123456789'}]});},cancel(){cancelled=true;}});
 assert.equal(await readPageText(stream,()=>true,5),'12345');assert.ok(cancelled);
 const stopped=new ReadableStream({start(c){c.enqueue({items:[{str:'old page'}]});}});
 assert.equal(await readPageText(stopped,()=>false),'');
});
test('presentation URLs are allowlisted resource references, never arbitrary fetch or return URLs',()=>{
 assert.ok(validSource(source));assert.equal(sourcePaths(source).file,'/api/documento/12/archivo/');
 for(const ref of ['0','../x','https://evil.invalid','12?return=evil','%2f'])assert.throws(()=>sourcePaths({...source,ref}));
 assert.ok(presentationPath('/panel/presentar/documentos/12'));assert.ok(!presentationPath('/panel/presentar/documentos/../clientes'));
 assert.throws(()=>sourcePaths({kind:'auditoria',ref:'12'}));
});
test('client and internal return context is fixed and metadata excludes storage and internals',()=>{
 const input={title:'Informe municipal',client:'Villa Clara',download:true,storage_key:'private/key',returnUrl:'https://evil.invalid',observaciones:'internal'};
 const a=metadataFrom(source,input,true),b=metadataFrom(source,input,false);
 assert.equal(a.returnPath,'/panel/documentos');assert.equal(b.returnPath,'/panel/documentos/12');assert.ok(!('observaciones' in a));assert.ok(!('storage_key' in a));
 assert.throws(()=>metadataFrom(source,{...input,download:false},true));
});
test('audit requires existing opaque current authorized PDF and excludes client portal',()=>{
 const s={kind:'auditoria',ref:'a'.repeat(64)},data={state:'CURRENT',mime:'application/pdf',manifest:{format:'PDF',review_state:'AUTHORIZED',header:{name:'Informe',client:'Villa Clara'}}};
 assert.equal(metadataFrom(s,data,false).title,'Informe');assert.throws(()=>metadataFrom(s,data,true));
 for(const status of ['DRAFT','REVIEWED','HISTORICAL'])assert.throws(()=>metadataFrom(s,{...data,manifest:{...data.manifest,review_state:status}},false));
 assert.throws(()=>metadataFrom(s,{...data,mime:'text/html'},false));
});
test('page keyboard and first/last boundaries respect focused controls',()=>{
 for(const key of ['ArrowRight','PageDown',' '])assert.equal(pageKey(key,false),1);
 for(const key of ['ArrowLeft','PageUp'])assert.equal(pageKey(key,false),-1);
 assert.equal(pageKey('ArrowRight',true),0);assert.equal(pageKey('Enter',false),0);
 assert.equal(nextPage(1,-1,40),1);assert.equal(nextPage(40,1,40),40);assert.equal(nextPage(20,1,40),21);
});
test('fullscreen unavailable or denied falls back, entered fullscreen exits safely',async()=>{
 assert.equal(await fullscreenChange({fullscreenElement:null,exitFullscreen:async()=>{}},null),false);
 assert.equal(await fullscreenChange({fullscreenElement:null,exitFullscreen:async()=>{}},{requestFullscreen:async()=>{throw Error('denied')}}),false);
 let exited=false;assert.equal(await fullscreenChange({fullscreenElement:{},exitFullscreen:async()=>{exited=true}},null),true);assert.ok(exited);
});
test('partial PDF delivery rejects inconsistent lengths rather than inventing pages',()=>{
 assert.equal(rangeTotal('bytes 0-65535/300000',65536),300000);assert.equal(rangeTotal('bytes 0-10/3',11),null);assert.equal(rangeTotal('bytes 5-10/100',6),null);assert.equal(rangeTotal(null,10),null);
});
test('hostile authorized titles remain escaped React text',()=>{
 const title=metadataFrom(source,{title:'<img src=x onerror=alert(1)>',download:true},true).title;
 const html=renderToStaticMarkup(createElement('h1',null,title));assert.ok(!html.includes('<img'));assert.match(html,/&lt;img/);
});
test('PDF library stays dynamic in presentation, no executable PDF actions or unsafe metadata HTML',()=>{
 const screen=readFileSync(new URL('../components/presentation/ReportPresentation.tsx',import.meta.url),'utf8');
 assert.match(screen,/await import\('pdfjs-dist\/build\/pdf.mjs'\)/);assert.match(screen,/isEvalSupported:false/);assert.match(screen,/enableXfa:false/);
 assert.doesNotMatch(screen,/dangerouslySetInnerHTML|eval\(|getJavaScript|executeNamedAction|<iframe|https:\/\//);
 assert.match(screen,/cache:'no-store'/);assert.match(screen,/No pudimos abrir este informe/);
 const action=readFileSync(new URL('../components/presentation/PresentationAction.tsx',import.meta.url),'utf8');assert.match(action,/presentationMetadata/);assert.match(action,/prefetch=\{false\}/);assert.doesNotMatch(action,/pdfjs-dist/);
});
