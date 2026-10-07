// Isolated UI regression: every API response is synthetic; no production request.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CC_PLAYWRIGHT_MODULE_PATH || 'playwright');
const origin=process.env.CC_PERIOD_TEST_ORIGIN || 'http://127.0.0.1:3072';
assert.equal(new URL(origin).hostname,'127.0.0.1');
const evidence=resolve(process.env.CC_PERIOD_EVIDENCE_DIR || '/private/tmp/cc-period-form-browser');
await mkdir(evidence,{recursive:true});
const user={id:7,username:'gerente-ejemplo',email:'gerente@example.invalid',role:'manager',organization_id:1,organization_nombre:'Organización de ejemplo',organizaciones_asignadas:[],is_superuser:false};
const overview={packages:[],cases:[],issues:[],timeline:[],limited:false,
  contexts:[{id:12,nombre:'Encargo de ejemplo',cliente_id:3,cliente__name:'Cliente de ejemplo',periodo_inicio:'1900-01-01',periodo_fin:'2200-12-31'}],
  users:[{id:7,name:'Gerente de ejemplo',role:'manager'},{id:8,name:'Socio de ejemplo',role:'partner'},{id:9,name:'Auxiliar de ejemplo',role:'staff'}],
  historical_proposals:[],permissions:{manage:true,authorize:false},catalogs:{case:[],package:[],issue:[]}};
const writes=[],errors=[],blocked=[];let periods=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CC_CHROMIUM_PATH || chromium.executablePath()});
try {
  const context=await browser.newContext({viewport:{width:1440,height:900},timezoneId:'America/Mexico_City'});
  // Freeze only the isolated test browser clock, so October 2026 is reproducible.
  await context.addInitScript(()=>{
    const NativeDate=Date,now=NativeDate.parse('2026-10-07T18:00:00-06:00');
    globalThis.Date=class extends NativeDate {
      constructor(...args){if(args.length)super(...args);else super(now);}
      static now(){return now;}
    };
  });
  await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    // Intercept API paths before host handling: build-time API origins are never contacted.
    if(url.pathname.startsWith('/api/')){
      if(url.pathname==='/api/auth/token/')return send({access:'synthetic-local-session',refresh:'synthetic-local-refresh'});
      if(url.pathname==='/api/me/')return send(user);
      if(url.pathname==='/api/organizaciones/')return send([{id:1,name:'Organización de ejemplo'}]);
      if(url.pathname==='/api/carova/workspace/')return send(overview);
      if(url.pathname==='/api/carova/workspace/periods/'&&req.method()==='GET')return send({results:periods,count:periods.length,page:1});
      if(url.pathname==='/api/carova/workspace/periods/'&&req.method()==='POST'){
        const body=req.postDataJSON();
        for(const key of ['year','month','engagement_id','client_id','supervisor_id'])assert.ok(Number.isInteger(body[key]),key);
        assert.equal(body.year,2026);assert.equal(body.month,10);assert.equal(body.engagement_id,12);assert.equal(body.client_id,3);assert.equal(body.supervisor_id,7);
        assert.equal(body.reason,'Nota sintética del periodo');writes.push(body);
        const row={id:100,client_id:3,label:'2026-10',client_name:'Cliente de ejemplo',status:'OPEN',revision:0};periods=[row];return send(row,201);
      }
      return send({detail:'Ruta ajena al alcance de esta prueba sintética.'},503);
    }
    if(url.origin!==origin){blocked.push(url.origin);return route.abort();}
    return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  // Reproduce the old native number-input behavior without opening any database.
  await page.setContent('<form><input name="year" type="number" step="0.01"><input name="month" type="number" step="0.01"></form>');
  const old=await page.evaluate(()=>{
    const year=document.querySelector('[name=year]'),month=document.querySelector('[name=month]');
    for(let n=0;n<31;n++)year.stepDown();for(let n=0;n<16;n++)month.stepUp();
    return {year:year.value,month:month.value,serialized:Object.fromEntries(new FormData(document.querySelector('form')))};
  });
  assert.equal(old.year,'-0.31');assert.equal(old.month,'0.16');
  await page.goto(origin+'/login');
  await page.getByLabel('Usuario',{exact:true}).fill('gerente-ejemplo');
  await page.getByLabel('Contraseña',{exact:true}).fill('synthetic-local-password');
  await Promise.all([page.waitForURL(/\/panel(?:\?|$)/),page.getByRole('button',{name:'Entrar al sistema',exact:true}).click()]);
  await page.goto(origin+'/panel/carova/egresos?tab=Periodos');
  await page.getByRole('button',{name:'Crear periodo',exact:true}).click();
  let form=page.locator('form').filter({has:page.getByRole('heading',{name:'Crear periodo',exact:true})});
  assert.equal(await form.getByLabel('Año',{exact:true}).inputValue(),'2026');
  assert.equal(await form.getByLabel('Mes',{exact:true}).inputValue(),'10');
  assert.equal(await form.getByLabel('Mes',{exact:true}).locator('option:checked').textContent(),'Octubre');
  assert.equal(await form.locator('input[type=number]').count(),0);
  assert.equal(await form.getByRole('button',{name:'Crear periodo',exact:true}).count(),1);
  assert.equal(await form.getByText('Guardar registro humano',{exact:true}).count(),0);
  assert.equal(await form.getByLabel('Nota del periodo',{exact:true}).count(),1);
  assert.deepEqual(await form.getByLabel('Mes',{exact:true}).locator('option').evaluateAll(options=>options.map(o=>Number(o.value))),[1,2,3,4,5,6,7,8,9,10,11,12]);
  assert.ok((await form.getByLabel('Año',{exact:true}).locator('option').evaluateAll(options=>options.map(o=>o.value))).every(v=>/^[1-9][0-9]*$/.test(v)));
  const managers=await form.getByLabel('Gerente responsable',{exact:true}).locator('option').allTextContents();
  assert.ok(managers.includes('Gerente de ejemplo'));assert.ok(managers.includes('Socio de ejemplo'));assert.ok(!managers.includes('Auxiliar de ejemplo'));
  await form.getByLabel('Cliente / Encargo',{exact:true}).selectOption('12');
  await form.getByLabel('Gerente responsable',{exact:true}).selectOption('7');
  await form.getByLabel('Nota del periodo',{exact:true}).fill('Nota sintética del periodo');
  await form.scrollIntoViewIfNeeded();
  await page.screenshot({path:resolve(evidence,'01-crear-periodo-1440.png'),fullPage:true});
  await page.setViewportSize({width:800,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await form.getByRole('button',{name:'Crear periodo',exact:true}).scrollIntoViewIfNeeded();
  assert.ok(await form.getByRole('button',{name:'Crear periodo',exact:true}).isVisible());
  await page.screenshot({path:resolve(evidence,'02-crear-periodo-800.png'),fullPage:true});
  await form.getByLabel('Año',{exact:true}).selectOption('2025');
  await form.getByLabel('Mes',{exact:true}).selectOption('1');
  await form.getByRole('button',{name:'Cancelar',exact:true}).click();
  await page.getByRole('button',{name:'Crear periodo',exact:true}).click();
  form=page.locator('form').filter({has:page.getByRole('heading',{name:'Crear periodo',exact:true})});
  assert.equal(await form.getByLabel('Año',{exact:true}).inputValue(),'2026');assert.equal(await form.getByLabel('Mes',{exact:true}).inputValue(),'10');
  await form.getByLabel('Cliente / Encargo',{exact:true}).selectOption('12');await form.getByLabel('Gerente responsable',{exact:true}).selectOption('7');await form.getByLabel('Nota del periodo',{exact:true}).fill('Nota sintética del periodo');
  await form.getByRole('button',{name:'Crear periodo',exact:true}).click();
  await page.getByRole('button',{name:/Cliente de ejemplo · 2026-10/}).waitFor();
  assert.equal(writes.length,1);assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
  const result={result:'PASS',synthetic_only:true,production_business_requests:0,old_input_native_reproduction:old,
    fixed_default:{year:2026,month:10,label:'Octubre'},viewports:[1440,800],serialized_payload:writes[0],browser_errors:errors,
    checks:['controlled calendar selectors','no decimal or negative options','Spanish month','Crear periodo CTA','audit note retained in request','only manager/partner choices','integer JSON payload','current defaults restored when reopening','keyboard-native selectors','no new overflow at 800px']};
  await writeFile(resolve(evidence,'browser-review.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
} finally {await browser.close();}
