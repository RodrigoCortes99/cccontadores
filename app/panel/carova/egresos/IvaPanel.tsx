'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {apiFetch,apiJson} from '../../../../lib/api';
import {apiErrorMessage} from './ux';
import {vatStatusLabels as STATUS,vatPendingLabels as PENDING,vatLabel as label,vatResultText} from './ivaUx';
import s from './workspace.module.css';

type Difference={code:string;difference?:string;[k:string]:unknown};
// IVA-A-P1-05: `id` es una referencia pública opaca (cadena) cuando el alcance es parcial,
// y el identificador interno cuando es completo. El panel lo trata siempre como opaco:
// no lo convierte a número, no lo ordena ni lo compara por magnitud.
type PublicRef=string|number;
type Result={id:PublicRef;document_id:number;status:string;snapshot_status:string;state?:string|null;state_reason?:string|null;state_notice?:string|null;projection_version:string;material_version:string;claimed_by:string[];differences:Difference[];arithmetic:Difference[];signals:string[];sources:Record<string,unknown>};
type Draft={title:string;body:string;audience:string;persisted:boolean;notice:string};
type Pending={id:PublicRef;code:string;label:string;what_is_missing:string;why_it_blocks:string;resolver:string;revision:number;document_id:number|null;clarification_draft:Draft};
type Body={period:{label:string;client:string};run:{id:number;status:string;engine:string}|null;summary:Record<string,unknown>;results:Result[];results_count:number;withheld_results?:number;withheld_notice?:string|null;scope_limited?:boolean;scope_notice?:string|null;pendings:Pending[];stale_results:PublicRef[];evidence_changed_documents:number[];scope:string;notice:string;permissions:{manage:boolean}};
async function read<T>(r:Response):Promise<T>{if(!r.ok)throw new Error(apiErrorMessage(await r.json().catch(()=>null),r.status));return r.json();}

export default function IvaPanel({periodId,onFile}:{periodId:number;onFile:(url:string)=>void}){
 const root=`/api/carova/workspace/iva/periods/${periodId}/`;
 const [data,setData]=useState<Body|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async(signal?:AbortSignal)=>{try{const r=await read<Body>(await apiFetch(root,{signal}));if(!signal?.aborted)setData(r);}catch(e){if(!signal?.aborted)setError((e as Error).message);}},[root]);
 useEffect(()=>{const c=new AbortController();void load(c.signal);return()=>c.abort();},[load]);
 async function act(fn:()=>Promise<void>,ok=''){setBusy(true);setError('');setNotice('');try{await fn();if(ok)setNotice(ok);await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const run=()=>act(async()=>{await read(await apiJson(root+'run/','POST',{force:true}));},'Revisión estructural calculada. No es una declaración ni el IVA definitivo: la constancia previa al provisional y las diferencias del cierre siguen siendo humanas.');
 const exportFile=(format:'xlsx'|'csv')=>act(async()=>{const r=await read<{url:string;rows:number;coverage:string;notice:string}>(await apiJson(root+'export/','POST',{format}));onFile(r.url);setNotice(`Papel de trabajo ${format.toUpperCase()} con ${r.rows} filas. ${r.coverage} ${r.notice}`);});
 function resolve(p:Pending){return (e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);void act(async()=>{await read(await apiJson(root+`pendings/${encodeURIComponent(String(p.id))}/`,'POST',{revision:p.revision,reason:f.get('reason'),note:f.get('note')}));},'Pendiente de IVA resuelto con evidencia registrada.');};}
 return <section className={s.section}>
  <h3>IVA</h3>
  <p>{data?.notice??'Revisión estructural del IVA sobre los comprobantes y su evidencia. No es una declaración ni el impuesto a pagar.'}</p>
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {data&&<>
   <p>{data.period.client} · {data.period.label} · alcance {data.scope==='FULL'?'completo':'sólo tu asignación'}</p>
   <div className={s.toolbar}><button disabled={busy} onClick={()=>void run()}>Calcular revisión de IVA</button>{data.run&&<><button disabled={busy} onClick={()=>void exportFile('xlsx')}>Papel de trabajo XLSX</button><button disabled={busy} onClick={()=>void exportFile('csv')}>CSV</button></>}</div>
   {!data.run&&<p>Todavía no hay una revisión estructural de IVA para este periodo.</p>}
   {data.run&&<>
    <h4>Lote {data.run.id} · {data.run.status}</h4>
    {/* Con alcance parcial el panel no muestra ningún número de resultados retirados: el
        servidor no lo envía, y contarlos aquí volvería a abrir el canal lateral. */}
    <p>{data.results_count} comprobante{data.results_count===1?'':'s'} revisado{data.results_count===1?'':'s'}{!data.scope_limited&&(data.withheld_results??0)>0?` · ${data.withheld_results} fuera de tu alcance`:''}</p>
    {data.scope_limited?<p role="status">{data.scope_notice}</p>:data.withheld_notice&&<p role="status">{data.withheld_notice}</p>}
    <p>{String(data.summary.ALCANCE_DECLARADO??'')}</p>
    {data.stale_results.length>0&&<p role="status">{data.stale_results.length} resultado(s) dejaron de ser vigentes: vuelve a calcular. El estado histórico se conserva.</p>}
    {data.evidence_changed_documents.length>0&&<p role="alert">Archivo de la evidencia alterado o ausente en {data.evidence_changed_documents.length} comprobante(s): reingesta por el flujo existente y vuelve a calcular.</p>}
    {data.results.map(r=><article key={String(r.id)} className={s.card}>
     <strong>Documento {r.document_id} · {vatResultText(r.snapshot_status,r.state,r.state_reason)}</strong>
     <p>Proyección {r.projection_version}{r.state==='STALE'?` · estado histórico: ${label(STATUS,r.snapshot_status)}`:''} · en el periodo por: {r.claimed_by.join(', ')||'sin declarar'}</p>
     {r.differences.map((x,i)=><p key={i}>Diferencia observada · {String(x.code)} · {String(x.difference??'')}</p>)}
     {r.arithmetic.map((x,i)=><p key={'a'+i}>Observación aritmética (no es hallazgo) · base por tasa {String(x.base_por_tasa??'')} vs importe declarado {String(x.importe_declarado??'')}</p>)}
    </article>)}
    <p>IVA contable: no existe capturado en esta versión, así que no se compara ni se estima.</p>
   </>}
   <h4>Pendientes de IVA</h4>
   {data.pendings.length===0&&<p>Sin pendientes de IVA abiertos. Esto no significa que el IVA sea correcto.</p>}
   {data.pendings.map(p=><article key={String(p.id)} className={s.card}>
    <strong>{p.label??label(PENDING,p.code)}</strong><p>{p.what_is_missing}</p><p>{p.why_it_blocks}</p><p>Resuelve: {p.resolver}</p>
    <details><summary>Borrador de aclaración ({p.clarification_draft.audience==='CLIENTE'?'para el cliente':'interno'})</summary><p>{p.clarification_draft.body}</p><p>{p.clarification_draft.notice}</p></details>
    <form onSubmit={resolve(p)} className={s.toolbar}><label>Cómo se resolvió<input name="reason" required maxLength={500}/></label><label>Constancia<input name="note" maxLength={500}/></label><button disabled={busy}>Registrar</button></form>
   </article>)}
   <p>La constancia previa al provisional y las diferencias del cierre se registran en «Revisión mensual» y «Seguimiento»: este motor no las escribe.</p>
  </>}
 </section>;
}
