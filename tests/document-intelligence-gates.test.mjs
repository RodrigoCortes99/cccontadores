import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {DOCUMENT_LIBRARY_UNAVAILABLE,DocumentLibraryError,libraryUnavailable,documentErrorMessage,readDocumentResponse} from '../lib/document-intelligence.ts';

const page=readFileSync(new URL('../app/panel/carova/documentos/page.tsx',import.meta.url),'utf8');
const component=readFileSync(new URL('../components/document-intelligence/LibraryUnavailable.tsx',import.meta.url),'utf8');

function compiledFunction(source,name,bindings) {
  const tree=ts.createSourceFile('component.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const fn=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
  const expression=fn.getText(tree).replace('export default ','');
  const code=ts.transpileModule('('+expression+')',{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
  return Function(...Object.keys(bindings),'return '+code)(...Object.values(bindings));
}

test('disabled library renders the requested notice and an actual historical PBC link',()=>{
  const tree=ts.createSourceFile('LibraryUnavailable.tsx',component,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const fn=tree.statements.find(n=>ts.isFunctionDeclaration(n));
  const expression=fn.getText(tree).replace('export default ','');
  const code=ts.transpileModule('('+expression+')',{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
  const render=Function('React','Link','DOCUMENT_LIBRARY_UNAVAILABLE','return '+code)(
    {createElement},({href,children,...props})=>createElement('a',{href,...props},children),DOCUMENT_LIBRARY_UNAVAILABLE);
  const html=renderToStaticMarkup(createElement(render,{className:'panel'}));
  assert.match(html,/<h2>Biblioteca documental no disponible<\/h2>/);
  assert.ok(html.includes(DOCUMENT_LIBRARY_UNAVAILABLE.description));
  assert.match(html,/href="\/panel\/documentos"/);
  assert.match(html,/role="status"/);
  assert.doesNotMatch(html,/CAROVA_DESHABILITADA|No hay documentos|Selecciona cliente/);
});

test('new and legacy backend disabled responses become the same capability state',async()=>{
  for(const [status,body] of [[404,{code:'DOCUMENT_INTELLIGENCE_DISABLED',detail:'Readable notice'}],
    [403,{detail:'CAROVA_DESHABILITADA'}],[404,{detail:'Capacidad documental no habilitada en este entorno.'}]]) {
    await assert.rejects(readDocumentResponse(new Response(JSON.stringify(body),{status})),e=>{
      assert.ok(libraryUnavailable(e));assert.equal(e.message,DOCUMENT_LIBRARY_UNAVAILABLE.description);
      assert.doesNotMatch(documentErrorMessage(e),/CAROVA_DESHABILITADA|Error:/);return true;
    });
  }
});

test('authorization failures are never presented as disabled capability or empty library',async()=>{
  for(const status of [401,403,404]) {
    await assert.rejects(readDocumentResponse(new Response(JSON.stringify({detail:'POLICY_BLOCK'}),{status})),e=>{
      assert.ok(e instanceof DocumentLibraryError);assert.equal(libraryUnavailable(e),false);
      assert.match(e.message,status===401?/sesión/:/acceso|alcance/);assert.doesNotMatch(e.message,/POLICY_BLOCK/);return true;
    });
  }
});

test('processing disabled preserves a human read-only message without disabling library',()=>{
  const e=new DocumentLibraryError(403,{code:'DOCUMENT_PROCESSING_DISABLED'});
  assert.equal(libraryUnavailable(e),false);assert.match(e.message,/procesamiento.*no están habilitados/);
  assert.doesNotMatch(e.message,/DOCUMENT_PROCESSING_DISABLED/);
});

test('malformed and technical server errors do not render JSON, traces or internal codes',async()=>{
  await assert.rejects(readDocumentResponse(new Response('<html>Failure</html>',{status:500})),e=>{
    assert.doesNotMatch(e.message,/<html>|Failure/);return true;
  });
  for(const detail of ['EVIDENCE_CHANGED','Traceback: private material','Exception: secret',{private:'hidden'}]) {
    const e=new DocumentLibraryError(400,{detail});
    assert.doesNotMatch(e.message,/EVIDENCE_CHANGED|Traceback|private|hidden|secret|Exception|[{}]/);
  }
  assert.doesNotMatch(documentErrorMessage(new Error('CAROVA_DESHABILITADA')),/CAROVA_DESHABILITADA/);
});

test('successful responses retain their contract and optional processing flag',async()=>{
  for(const data of [{periods:[],truncated:false},{periods:[],truncated:false,processing_enabled:false,synthetic_only:true}])
    assert.deepEqual(await readDocumentResponse(new Response(JSON.stringify(data))),data);
  assert.match(page,/setProcessingEnabled\(data\.processing_enabled===true\)/);
});

test('route renders availability before empty states and requires explicit synthetic reprocessing',()=>{
  const unavailable=page.indexOf("if(availability==='disabled')return");
  assert.ok(unavailable>0&&unavailable<page.indexOf('Selecciona cliente'));
  assert.match(page,/availability!=='ready'/);
  assert.match(page,/if\(availability==='error'\)return/);
  assert.match(page,/processingEnabled\?<details/);
  assert.match(page,/processingEnabled&&detail\.synthetic_processing_allowed===true/);
  assert.match(page,/disabled=\{busy\|\|!reprocessSynthetic\}/);
  assert.match(page,/\{synthetic:reprocessSynthetic\}/);
  assert.match(page,/Confirma el origen sintético/);
  assert.doesNotMatch(page,/setError\(String\(e\)\)|JSON\.stringify\(body\)|CAROVA_AI_ENABLED/);
});

test('actual page unavailable and loading branches render no selectors or processing actions',()=>{
  const Link=({href,children,...props})=>createElement('a',{href,...props},children);
  const unavailable=compiledFunction(component,'LibraryUnavailable',{React:{createElement},Link,DOCUMENT_LIBRARY_UNAVAILABLE});
  for(const availability of ['disabled','loading','error']) {
    let state=0,requests=0;
    const Documents=compiledFunction(page,'Documents',{
      React:{createElement},Link,LibraryUnavailable:unavailable,s:new Proxy({},{get:()=>''}),
      ROOT:'/api/carova/document-intelligence/',statuses:{},
      usePanelUser:()=>({user:{id:1,organization_id:1}}),
      useState:initial=>[state++===0?availability:initial,()=>{}],
      useEffect:()=>{},useRef:value=>({current:value}),useCallback:fn=>fn,
      apiFetch:()=>{requests++;throw Error('Unexpected fetch during render');},
      libraryUnavailable,documentErrorMessage,read:readDocumentResponse,
    });
    const html=renderToStaticMarkup(createElement(Documents));
    assert.equal(requests,0);
    assert.doesNotMatch(html,/<select|type="file"|No hay documentos|Recibir y procesar/);
    if(availability==='disabled')assert.match(html,/Biblioteca documental no disponible/);
    if(availability==='loading')assert.match(html,/Comprobando disponibilidad/);
    if(availability==='error')assert.match(html,/Reintentar/);
  }
});
