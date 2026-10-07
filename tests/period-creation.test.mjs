import test from 'node:test';
import assert from 'node:assert/strict';
import {periodDefaults,periodYearOptions,PERIOD_MONTHS,serializePeriodCreation} from '../app/panel/carova/egresos/periodCreation.ts';

const overview={contexts:[{id:12,cliente_id:3}],users:[{id:7,role:'manager'},{id:8,role:'partner'},{id:9,role:'staff'}]};
function form(patch={}) {
  const fd=new FormData();
  for(const [key,value] of Object.entries({engagement_id:'12',supervisor_id:'7',year:'2026',month:'10',reason:'Observación de prueba',...patch}))fd.set(key,value);
  return fd;
}

test('calendar defaults use the current local year and a one-based month',()=>{
  const now=new Date();
  assert.deepEqual(periodDefaults(),{year:now.getFullYear(),month:now.getMonth()+1});
  assert.deepEqual(periodDefaults(new Date(2026,9,7)),{year:2026,month:10});
  assert.deepEqual(periodDefaults(new Date(2025,11,31)),{year:2025,month:12});
  assert.deepEqual(periodDefaults(new Date(2027,0,1)),{year:2027,month:1});
});
test('month labels are Spanish and calendar year options include historical and future years',()=>{
  assert.equal(PERIOD_MONTHS.length,12);
  assert.equal(PERIOD_MONTHS[0],'Enero');assert.equal(PERIOD_MONTHS[9],'Octubre');assert.equal(PERIOD_MONTHS[11],'Diciembre');
  const years=periodYearOptions();
  for(const year of ['1900','2024','2025','2026','2027','2099','2200'])assert.ok(years.some(([value,label])=>value===year&&label===year));
  for(const [value] of years)assert.ok(/^[1-9][0-9]*$/.test(value));
});
test('creation serializes year, month and identities as integers, preserving the note',()=>{
  for(const month of ['1','10','12']){
    const payload=serializePeriodCreation(form({month}),overview);
    assert.equal(payload.year,2026);assert.equal(payload.month,Number(month));
    assert.equal(payload.client_id,3);assert.equal(payload.engagement_id,12);assert.equal(payload.supervisor_id,7);
    assert.equal(payload.reason,'Observación de prueba');
    for(const key of ['year','month','client_id','engagement_id','supervisor_id'])assert.equal(typeof payload[key],'number');
  }
});
test('decimal, negative, out-of-range and ambiguous calendar values never serialize',()=>{
  for(const month of ['0','13','0.16','-1','1.0','01','NaN','Infinity','1e1',' 1',''])assert.throws(()=>serializePeriodCreation(form({month}),overview));
  for(const year of ['-0.31','2026.0','2026.16','1899','2201','NaN','Infinity','2.026e3','02026',' 2026',''])assert.throws(()=>serializePeriodCreation(form({year}),overview));
});
test('unavailable engagements and non-manager supervisors cannot serialize',()=>{
  assert.throws(()=>serializePeriodCreation(form({engagement_id:'99'}),overview));
  for(const supervisor_id of ['9','99'])assert.throws(()=>serializePeriodCreation(form({supervisor_id}),overview));
  assert.equal(serializePeriodCreation(form({supervisor_id:'8'}),overview).supervisor_id,8);
});
