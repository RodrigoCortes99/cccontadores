'use client';
import Link from 'next/link';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {apiFetch,apiJson} from '../../../../lib/api';
import {apiErrorMessage,runLabel} from './ux';
import s from './workspace.module.css';

// El identificador que llega puede ser una referencia pública opaca (cadena) con alcance
// parcial, o el identificador interno con alcance completo. El panel lo trata SIEMPRE como
// opaco: no lo convierte a número, no lo ordena ni lo compara por magnitud.
type PublicRef=string|number;
type Line={id:PublicRef;sequence:number;code:string|null;name:string|null;account_text:string|null;side:'DEBIT'|'CREDIT'|null;amount:string|null;currency:string|null;origin:string;basis:Record<string,unknown>;counts_for_balance:boolean};
type Result={id:PublicRef;case_reference:string|null;case_title:string;case_date:string;status:string;currency:string|null;total_debit:string|null;total_credit:string|null;balanced:boolean|null;freshness:string;snapshot_status?:string;freshness_notice?:string;lines:Line[];detail:Record<string,unknown>};
type Pending={id:PublicRef;code:string;what_is_missing:string;why_it_blocks:string;resolver:string;revision:number;status:string};
type Body={period:{label:string;client:string};run:{id:number;status:string;engine_version:string;summary?:Record<string,unknown>}|null;summary:Record<string,number>;results:Result[];results_count:number;withheld_results?:number;withheld_notice?:string|null;scope_limited?:boolean;scope_notice?:string|null;pendings:Pending[];stale_results:number;scope:string;notice:string;permissions:{manage:boolean}};

const STATUS:Record<string,string>={
 PREPARED_BALANCED:'Preparada y cuadrada',
 UNBALANCED:'No cuadra',
 COUNTERPART_NOT_DEMONSTRABLE:'Falta la contrapartida aprobada',
 ACCOUNT_NOT_DEMONSTRABLE:'Sin regla de contabilización aprobada',
 POSTING_RULE_AMBIGUOUS:'Dos reglas aprobadas explican el caso',
 AMOUNT_NOT_DEMONSTRABLE:'Importe no demostrable',
 TAX_BASIS_NOT_DEMONSTRABLE:'Desglose de impuesto no demostrable',
 CURRENCY_NOT_DEMONSTRABLE:'Moneda no demostrable',
 SUPPORT_NOT_CURRENT:'Evidencia no vigente',
 INSUFFICIENT_EVIDENCE:'Sin clasificación verificada',
 OUT_OF_SCOPE_V1:'Fuera del alcance de esta versión',
 STALE:'Dejó de ser vigente'};
const ORIGIN:Record<string,string>={RULE:'Regla aprobada',HUMAN:'Persona',HISTORICAL_SUGGESTION:'Sugerencia — no es una propuesta'};
const label=(code:string)=>STATUS[code]??code.replaceAll('_',' ');

async function read<T>(r:Response):Promise<T>{if(!r.ok)throw new Error(apiErrorMessage(await r.json().catch(()=>null),r.status));return r.json();}

export default function AccountingPanel({periodId,onFile}:{periodId:number;onFile:(url:string)=>void}){
 const root=`/api/carova/workspace/accounting/periods/${periodId}/`;
 const [data,setData]=useState<Body|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async(signal?:AbortSignal)=>{try{const r=await read<Body>(await apiFetch(root,{signal}));if(!signal?.aborted)setData(r);}catch(e){if(!signal?.aborted)setError((e as Error).message);}},[root]);
 useEffect(()=>{const c=new AbortController();void load(c.signal);return()=>c.abort();},[load]);
 async function act(fn:()=>Promise<void>,ok=''){setBusy(true);setError('');setNotice('');try{await fn();if(ok)setNotice(ok);await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const run=()=>act(async()=>{await read(await apiJson(root+'run/','POST',{force:true}));},'Pólizas preparadas. Es un borrador para revisión: no se registró nada en ningún sistema contable.');
 const exportFile=(format:'xlsx'|'csv')=>act(async()=>{const r=await read<{url:string;rows:number;notice:string}>(await apiJson(root+'export/','POST',{format}));onFile(r.url);setNotice(`Papel de trabajo ${format.toUpperCase()} con ${r.rows} filas. ${r.notice}`);});
 function resolve(p:Pending){return (e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);void act(async()=>{await read(await apiJson(root+`pendings/${encodeURIComponent(String(p.id))}/`,'POST',{revision:p.revision,reason:f.get('reason'),note:f.get('note')}));},'Pendiente resuelto con evidencia registrada.');};}

 return <section className={s.section}>
  <h3>Contabilidad · preparación de pólizas</h3>
  <Link className="cc-btn cc-btn--ghost" href="/panel/configuracion/contabilidad">Administrar catálogo, equivalencias y reglas</Link>
  <p>{data?.notice??'Borradores de asiento construidos con evidencia autorizada y configuración aprobada. No es contabilidad registrada.'}</p>
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {data&&<>
   <p>{data.period.client} · {data.period.label} · alcance {data.scope==='FULL'?'completo':'sólo tu asignación'}</p>
   <div className={s.toolbar}><button disabled={busy} onClick={()=>void run()}>Preparar pólizas</button>{data.run&&<><button disabled={busy} onClick={()=>void exportFile('xlsx')}>Papel de trabajo XLSX</button><button disabled={busy} onClick={()=>void exportFile('csv')}>CSV</button></>}</div>
   {!data.run&&<p>Todavía no se han preparado las pólizas de este periodo.</p>}
   {data.run&&<>
    <h4>Lote {data.run.id} · {runLabel(data.run.status)}</h4>
    {/* Con alcance parcial el panel no muestra ningún número de resultados retirados: el
        servidor no lo envía, y contarlos aquí volvería a abrir el canal lateral. */}
    <p>{data.results_count} póliza{data.results_count===1?'':'s'} preparada{data.results_count===1?'':'s'}{!data.scope_limited&&(data.withheld_results??0)>0?` · ${data.withheld_results} fuera de tu alcance`:''}</p>
    {data.scope_limited?<p role="status">{data.scope_notice}</p>:data.withheld_notice&&<p role="status">{data.withheld_notice}</p>}
    {data.stale_results>0&&<p role="status">{data.stale_results} resultado(s) dejaron de ser vigentes: vuelve a preparar. El estado histórico se conserva.</p>}
    <div className={s.grid}>{Object.entries(data.summary).map(([code,n])=><article key={code} className={s.card}><strong>{label(code)}</strong><p>{n}</p></article>)}</div>
    {data.results.map(r=><article key={String(r.id)} className={r.status==='PREPARED_BALANCED'?s.card:s.provisional}>
     <strong>{r.case_reference||r.case_title} · {label(r.status)}</strong>
     <p>{r.case_date}{r.currency?` · ${r.currency}`:''}</p>
     {r.snapshot_status&&<p role="status">Estado al calcular: {label(r.snapshot_status)}. {r.freshness_notice}</p>}
     <table><thead><tr><th>#</th><th>Cuenta</th><th className={s.money}>Cargo</th><th className={s.money}>Abono</th><th>Origen</th></tr></thead><tbody>
      {r.lines.map(l=><tr key={String(l.id)}>
       <td>{l.sequence}</td>
       <td>{l.code?`${l.code} · ${l.name}`:l.account_text}</td>
       <td className={s.money}>{l.side==='DEBIT'?l.amount:''}</td>
       <td className={s.money}>{l.side==='CREDIT'?l.amount:''}</td>
       <td>{ORIGIN[l.origin]??l.origin}{l.counts_for_balance?'':' · no cuenta para el balance'}</td>
      </tr>)}
     </tbody></table>
     {r.lines.length===0&&<p>No se produjo ninguna línea demostrable para esta póliza.</p>}
     <p>Cargos {r.total_debit??'—'} · abonos {r.total_credit??'—'} · {r.balanced===true?'cuadra':r.balanced===false?'no cuadra':'no evaluable'}</p>
     {typeof r.detail.reason==='string'&&<p>{r.detail.reason}</p>}
    </article>)}
    <h4>Pendientes</h4>
    {data.pendings.length===0&&<p>No hay pendientes de contabilidad en tu alcance.</p>}
    {data.pendings.filter(p=>p.status==='OPEN').map(p=><form key={String(p.id)} className={s.form} onSubmit={resolve(p)}>
     <strong>{p.what_is_missing}</strong>
     <p>{p.why_it_blocks}</p>
     <p>Resuelve: {p.resolver}</p>
     <label>Cómo se resolvió<textarea name="reason" required maxLength={4000}/></label>
     <label>Constancia escrita<textarea name="note" maxLength={4000}/></label>
     <button disabled={busy}>Registrar resolución</button>
    </form>)}
   </>}
  </>}
 </section>;
}
