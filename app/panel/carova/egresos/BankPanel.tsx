'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {apiFetch,apiJson} from '../../../../lib/api';
import {apiErrorMessage} from './ux';
import {bankStatusLabels as STATUS,directionLabels as DIR,importStatusLabels as IMPORT,balanceLabels as BALANCE,bankPendingLabels as PENDING,documentOnlyLabels as DOCONLY,differenceLabels as DIFF,bankLabel as label,amountText,importCountsText,resultStateText} from './bankUx';
import s from './workspace.module.css';

type Account={id:number;institution:string;masked_identifier:string;currency:string|null};
type Import={id:number;statement_id:number;statement_title:string;status:string;account_id:number;currency:string|null;reason?:string|null;counts:Record<string,number>;counts_scope?:string;counts_notice?:string|null;opening_balance?:string|null;closing_balance?:string|null};
type Result={id:number;movement_id:number;status:string;state?:string;state_reason?:string|null;snapshot_status?:string;stale_notice?:string|null;structure:string;direction:string;requires_review:boolean;adjacent:boolean;movement:{sequence:number;date:string;description:string;reference:string;counterparty_candidate:string|null;currency:string|null;debit:string|null;credit:string|null;unknown_direction_amount:string|null};amounts:{bank:string;document:string|null;accounting:string|null};differences:Record<string,string>;document_ids:number[];case_ids:number[];proposal:{match_type:string;selected_document_ids:number[]}|null;missing:string[];conflicts:string[];notes:string[]};
type Pending={id:number;code:string;what_is_missing:string;why_it_blocks:string;resolver:string;revision:number;movement_id:number|null};
type Balance={import_id:number;status:string;opening:string|null;closing:string|null;expected_closing:string|null;difference:string|null;reasons:string[]};
type Body={period:{label:string;client:string};accounts:Account[];statements:{id:number;title:string;has_file:boolean;imported:boolean}[];imports:Import[];run:{id:number;summary:Record<string,unknown>;state?:string;stale_movements?:number;movements_without_result?:number;evidence_changed_movements?:number}|null;results:Result[];withheld_results?:number;withheld_notice?:string|null;stale_notice?:string|null;evidence_changed_movements?:number[];results_count?:number;page?:number;page_size?:number;pendings:Pending[];document_only?:{document_id:number;category:string}[];accounting_only?:{case_id:number;reference:string;amount:string|null}[];balances?:Balance[];balances_notice?:string|null;scope:string;permissions:{manage:boolean}};
async function read<T>(r:Response):Promise<T>{if(!r.ok)throw new Error(apiErrorMessage(await r.json().catch(()=>null),r.status));return r.json();}

export default function BankPanel({periodId,onFile}:{periodId:number;onFile:(url:string)=>void}){
 const root=`/api/carova/workspace/bank/periods/${periodId}/`;
 const [data,setData]=useState<Body|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[page,setPage]=useState(1);
 const load=useCallback(async(signal?:AbortSignal)=>{try{const q=new URLSearchParams({page:String(page)});if(status)q.set('status',status);const r=await read<Body>(await apiFetch(root+'?'+q,{signal}));if(!signal?.aborted)setData(r);}catch(e){if(!signal?.aborted)setError((e as Error).message);}},[root,page,status]);
 useEffect(()=>{const c=new AbortController();void load(c.signal);return()=>c.abort();},[load]);
 async function act(fn:()=>Promise<void>,ok=''){setBusy(true);setError('');setNotice('');try{await fn();if(ok)setNotice(ok);await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function importStatement(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);void act(async()=>{await read(await apiJson(root+'imports/','POST',{statement_id:Number(f.get('statement_id')),account_id:Number(f.get('account_id'))}));},'Estado de cuenta importado. Revisa los renglones fuera de periodo, ilegibles o duplicados en el reporte.');}
 function addAccount(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);void act(async()=>{await read(await apiJson(root+'accounts/','POST',{institution_name:f.get('institution_name'),masked_identifier:f.get('masked_identifier'),currency:f.get('currency')}));},'Cuenta registrada.');}
 const run=()=>act(async()=>{await read(await apiJson(root+'run/','POST',{force:true}));},'Conciliación calculada. Nada se confirmó automáticamente; la conciliación humana del periodo sigue pendiente de preparar y revisar.');
 const exportFile=(format:'xlsx'|'csv')=>act(async()=>{const r=await read<{url:string;rows:number;coverage:string}>(await apiJson(root+'export/','POST',{format}));onFile(r.url);setNotice(`Papel de trabajo ${format.toUpperCase()} con ${r.rows} filas. ${r.coverage}`);});
 function resolve(p:Pending){return (e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);void act(async()=>{await read(await apiJson(root+`pendings/${p.id}/`,'POST',{revision:p.revision,reason:f.get('reason'),note:f.get('note')}));},'Pendiente resuelto con evidencia registrada.');};}
 const summary=(data?.run?.summary??{}) as Record<string,unknown>;
 const unimported=data?.statements.filter(x=>x.has_file&&!x.imported)??[];
 return <section className={s.section}>
  <h3>Bancos / Conciliación</h3>
  <p>Estado de cuenta, movimientos y evidencia en un solo lugar. «Conciliado» exige evidencia confirmada por una persona; una propuesta de Egresos no concilia. Sin conexión bancaria; la confirmación automática está desactivada.</p>
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {data&&<>
   <h4>Cuentas y estados de cuenta</h4>
   {data.accounts.map(a=><p key={a.id}>{a.institution} · {a.masked_identifier} · {a.currency??'moneda desconocida'}</p>)}
   {data.permissions.manage&&<form onSubmit={addAccount} className={s.toolbar}><label>Institución<input name="institution_name" required maxLength={120}/></label><label>Últimos 4 dígitos<input name="masked_identifier" required maxLength={24} pattern="[^0-9]*[0-9]{0,4}[^0-9]*"/></label><label>Moneda (si se conoce)<input name="currency" maxLength={3}/></label><button disabled={busy}>Registrar cuenta</button></form>}
   {data.imports.map(i=><p key={i.id}>{i.statement_title} · {label(IMPORT,i.status)} · {importCountsText(i.counts,i.counts_scope)}{i.reason?` · ${i.reason}`:''}</p>)}
   {unimported.length>0&&data.accounts.length>0&&<form onSubmit={importStatement} className={s.toolbar}><label>Estado de cuenta<select name="statement_id">{unimported.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label><label>Cuenta<select name="account_id">{data.accounts.map(a=><option key={a.id} value={a.id}>{a.institution} {a.masked_identifier}</option>)}</select></label><button disabled={busy}>Importar</button></form>}
   <div className={s.toolbar}><button disabled={busy} onClick={()=>void run()}>Calcular conciliación</button>{data.run&&<><button disabled={busy} onClick={()=>void exportFile('xlsx')}>Papel de trabajo XLSX</button><button disabled={busy} onClick={()=>void exportFile('csv')}>CSV</button></>}</div>
   {data.run&&<>
    <p>{String(summary.TOTAL_MOVEMENTS??0)} movimientos{data.scope==='ASSIGNED_ONLY'?' en tu alcance':''} · {Object.keys(STATUS).map(k=>`${label(STATUS,k)}: ${String(summary[k]??0)}`).join(' · ')}{Number(summary.STALE??0)>0?` · Obsoletos: ${String(summary.STALE)}`:''}</p>
    {(data.run.stale_movements??0)>0&&<p role="alert">{data.stale_notice} ({data.run.stale_movements} movimiento(s){(data.run.evidence_changed_movements??0)>0?`, ${data.run.evidence_changed_movements} con archivo alterado`:''}).</p>}
    {(data.run.movements_without_result??0)>0&&<p role="alert">{data.run.movements_without_result} movimiento(s) de tu alcance no están en este lote: vuelve a calcular la conciliación.</p>}
    {(data.withheld_results??0)>0&&<p role="alert">{data.withheld_notice} ({data.withheld_results} resultado(s)).</p>}
    {data.balances_notice&&<p>{data.balances_notice}</p>}
    {data.balances?.map(b=><p key={b.import_id}>{label(BALANCE,b.status)} · inicial {amountText(b.opening)} · final esperado {amountText(b.expected_closing)} · reportado {amountText(b.closing)}{b.difference&&b.difference!=='0.00'?` · diferencia ${b.difference}`:''}{b.reasons.length?` · ${b.reasons.join(' ')}`:''}</p>)}
    <label>Estado<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">Todos</option>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
    <table className={s.table}><thead><tr><th>Fecha</th><th>Descripción</th><th className={s.money}>Cargo</th><th className={s.money}>Abono</th><th>Comprobantes</th><th>Contable</th><th>Diferencias</th><th>Estado</th></tr></thead><tbody>{data.results.map(r=><tr key={r.id}><td>{r.movement.date}</td><td>{r.movement.description||r.movement.reference}{r.movement.counterparty_candidate?` · candidato: ${r.movement.counterparty_candidate}`:''}</td><td className={s.money}>{r.movement.debit??''}</td><td className={s.money}>{r.movement.credit??''}{r.movement.unknown_direction_amount?`${r.movement.unknown_direction_amount} (${DIR.UNKNOWN})`:''}</td><td>{r.document_ids.length?`${r.document_ids.length} · ${amountText(r.amounts.document)}`:r.proposal?`Propuesta ${r.proposal.match_type}`:'—'}</td><td>{r.case_ids.length?amountText(r.amounts.accounting):'—'}</td><td>{Object.entries(r.differences).map(([k,v])=>`${label(DIFF,k)}: ${v}`).join(', ')}</td><td>{resultStateText(r.status,r.state,r.state_reason)}{r.state==='STALE'?` · estado anterior: ${label(STATUS,r.snapshot_status??'')}`:''}{r.requires_review?' · revisar':''}{r.adjacent?' · otro mes':''}{r.notes.length?` · ${r.notes.join(' ')}`:''}</td></tr>)}</tbody></table>
    {(data.results_count??0)>(data.page_size??50)&&<div className={s.toolbar}><button disabled={page===1} onClick={()=>setPage(page-1)}>Anteriores</button><span>{page}</span><button disabled={page*(data.page_size??50)>=(data.results_count??0)} onClick={()=>setPage(page+1)}>Siguientes</button></div>}
    <h4>Pendientes ({data.pendings.length})</h4>
    {data.pendings.map(p=><details key={p.id}><summary>{label(PENDING,p.code)} · {p.what_is_missing}</summary><p>{p.why_it_blocks}</p><p>Resuelve: {p.resolver}</p><form onSubmit={resolve(p)}><label>Cómo se resolvió<input name="reason" required maxLength={500}/></label><label>Evidencia (nota)<input name="note" required maxLength={500}/></label><button disabled={busy}>Resolver</button></form></details>)}
    {!!data.document_only?.length&&<><h4>Comprobantes sin movimiento</h4>{data.document_only.map(d=><p key={d.document_id}>Documento {d.document_id} · {label(DOCONLY,d.category)}</p>)}</>}
    {!!data.accounting_only?.length&&<><h4>Pólizas sin movimiento bancario</h4>{data.accounting_only.map(c=><p key={c.case_id}>{c.reference||`Póliza ${c.case_id}`} · {amountText(c.amount)}</p>)}</>}
   </>}
  </>}
 </section>;
}
