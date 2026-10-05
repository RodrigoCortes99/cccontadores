// Browser regression against an isolated local build. All APIs are synthetic
// and every non-local network request is aborted. No production login/storage.
// Provide CC_PLAYWRIGHT_MODULE_PATH when Playwright is supplied by the runtime.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CC_PLAYWRIGHT_MODULE_PATH || 'playwright');
const origin=process.env.CC_PORTAL_TEST_ORIGIN || 'http://127.0.0.1:3071';
assert.equal(new URL(origin).hostname,'127.0.0.1');
const evidence=resolve(process.env.CC_PORTAL_EVIDENCE_DIR || '/private/tmp/cc-multi-client-access/browser');
await mkdir(evidence,{recursive:true});
const customers=[
 {id:1,name:'Comercial ejemplo A',organization:1},
 {id:2,name:'Comercial ejemplo B',organization:1},
 {id:3,name:'Comercial ejemplo C',organization:1},
 {id:4,name:'Cliente de otra organización',organization:2},
];
const root={id:90,username:'administrador-ejemplo',email:'admin@example.invalid',role:'staff',
 organization_id:1,organization_nombre:'Organización de ejemplo',organizaciones_asignadas:[],
 client_id:null,client_name:null,clientes_asignados:[],is_superuser:true};
let portal={id:2,username:'cliente-ejemplo',email:'portal@example.invalid',first_name:'Cliente',
 last_name:'de ejemplo',full_name:'Cliente de ejemplo',role:'client',role_display:'Cliente',
 organization:1,organization_nombre:'Organización de ejemplo',organizaciones_asignadas:[],
 client_id:1,client_nombre:customers[0].name,clientes_asignados:[{id:1,name:customers[0].name,organization_id:1}],
 is_active:true,is_superuser:false,date_joined:'2026-10-05T00:00:00Z'};
const writes=[],blocked=[],pageErrors=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CC_CHROMIUM_PATH || chromium.executablePath()});
try {
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin!==origin){blocked.push(url.origin);return route.abort();}
  if(!url.pathname.startsWith('/api/'))return route.continue();
  const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(url.pathname==='/api/auth/token/'&&request.method()==='POST')return send({access:'synthetic-local-session',refresh:'synthetic-local-refresh'});
  if(url.pathname==='/api/me/')return send(root);
  if(url.pathname==='/api/usuarios/'&&request.method()==='GET')return send([portal]);
  if(url.pathname==='/api/organizaciones/')return send([{id:1,name:'Organización de ejemplo'},{id:2,name:'Otra organización'}]);
  if(url.pathname==='/api/clientes/')return send(customers);
  if(url.pathname==='/api/usuarios/2/'&&request.method()==='PATCH'){
   const body=request.postDataJSON();
   assert.equal(body.role,'client');assert.equal(body.organization,1);
   assert.ok(!('password' in body));assert.ok(!('cliente' in body));
   assert.ok(body.clientes.every(id=>[1,2,3].includes(id)));
   writes.push(body.clientes);
   const selected=customers.filter(c=>body.clientes.includes(c.id)).map(c=>({id:c.id,name:c.name,organization_id:c.organization}));
   portal={...portal,...body,clientes_asignados:selected,
    client_id:selected.length===1?selected[0].id:null,client_nombre:selected.length===1?selected[0].name:null};
   return send(portal);
  }
  return send({detail:'Synthetic fixture has no other API.'},503);
 });
 const page=await context.newPage();
 page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto(origin+'/login');
 await page.getByLabel('Usuario',{exact:true}).fill('administrador-ejemplo');
 await page.getByLabel('Contraseña',{exact:true}).fill('synthetic-local-password');
 await Promise.all([page.waitForURL(/\/panel(?:\?|$)/),page.getByRole('button',{name:'Entrar al sistema',exact:true}).click()]);
 await page.goto(origin+'/panel/configuracion/usuarios');
 await page.getByRole('button',{name:'Editar',exact:true}).click();
 let dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:'Clientes asociados',exact:true}).click();
 let second=dialog.getByRole('checkbox',{name:customers[1].name,exact:true});
 await second.focus();await second.press('Space');
 assert.equal(await second.isChecked(),true);
 assert.equal(await dialog.getByRole('checkbox',{name:customers[0].name,exact:true}).isChecked(),true);
 assert.equal(await dialog.getByRole('checkbox',{name:customers[2].name,exact:true}).isChecked(),false);
 assert.equal(await dialog.getByRole('checkbox',{name:customers[3].name,exact:true}).count(),0);
 await second.press('Escape');
 assert.equal(await dialog.isVisible(),true,'Escape must keep the edit form open');
 assert.equal(await dialog.getByRole('button',{name:'Clientes asociados',exact:true}).evaluate(el=>el===document.activeElement),true);
 await dialog.getByRole('button',{name:'Guardar cambios',exact:true}).click();
 await page.getByRole('button',{name:'Editar',exact:true}).waitFor();
 assert.deepEqual(writes[0],[1,2]);
 await page.getByText('Comercial ejemplo A, Comercial ejemplo B',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Editar',exact:true}).click();
 dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:'Clientes asociados',exact:true}).click();
 await dialog.getByRole('checkbox',{name:customers[1].name,exact:true}).waitFor();
 assert.equal(await dialog.getByRole('checkbox',{name:customers[1].name,exact:true}).isChecked(),true);
 assert.equal(await dialog.getByRole('checkbox',{name:customers[0].name,exact:true}).isChecked(),true);
 await dialog.getByRole('button',{name:'Clientes asociados',exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:resolve(evidence,'01-two-clients-selected.png')});
 await page.setViewportSize({width:800,height:900});
 await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await dialog.getByRole('button',{name:'Guardar cambios',exact:true}).scrollIntoViewIfNeeded();
 assert.ok(await dialog.getByRole('button',{name:'Guardar cambios',exact:true}).isVisible());
 await page.screenshot({path:resolve(evidence,'02-two-clients-800.png')});
 await page.setViewportSize({width:1440,height:900});
 await dialog.getByRole('checkbox',{name:customers[0].name,exact:true}).uncheck();
 await dialog.getByRole('checkbox',{name:customers[1].name,exact:true}).press('Escape');
 await dialog.getByRole('button',{name:'Guardar cambios',exact:true}).click();
 await page.getByText(customers[1].name,{exact:true}).waitFor();
 assert.deepEqual(writes[1],[2]);
 await page.getByRole('button',{name:'Editar',exact:true}).click();
 dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:'Clientes asociados',exact:true}).click();
 await dialog.getByRole('checkbox',{name:customers[1].name,exact:true}).uncheck();
 await dialog.getByRole('button',{name:'Clientes asociados',exact:true}).click();
 await dialog.getByRole('button',{name:'Guardar cambios',exact:true}).click();
 await page.getByRole('button',{name:'Editar',exact:true}).waitFor();
 assert.deepEqual(writes[2],[]);
 assert.equal(pageErrors.length,0,pageErrors.join('\n'));
 assert.equal(blocked.length,0,'Unexpected external network request was blocked');
 const result={result:'PASS',synthetic_only:true,production_calls:0,viewports:[1440,800],
  checks:['normal synthetic UI login','two clients saved and reopened','keyboard Space/Escape',
   'same-organization options only','one client removed','all clients removed','password omitted',
   'no horizontal page overflow at 800px','no browser exceptions'],synthetic_writes:writes.length};
 await writeFile(resolve(evidence,'browser-review.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
} finally {await browser.close();}
