'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {usePanelUser} from '../../lib/PanelUserContext';
import {apiFetch} from '../../lib/api';
import {isClientRole,isPrivileged} from '../../lib/roles';
import {attentionHref,currentness,dateLabel,homeQuery,modules,priorities,reportFailure,type OperationalHome as HomeData,type HoursRow} from '../../lib/operational-reporting';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import Onboarding from './Onboarding';
import TimeTrackingNav from '../TimeTrackingNav';
import BooksAttention from '../books/BooksAttention';

function Distribution({title,rows,kind}:{title:string;rows:HoursRow[];kind:'employee'|'client'}) {
 const max=Math.max(1,...rows.map(r=>Number(r.logged_hours)));
 return <section className="uxDistribution"><h3>{title}</h3>{rows.length?<ul>{rows.map(r=><li key={kind==='employee'?r.employee_ref:r.client_ref}><span>{kind==='employee'?r.employee_display:r.client_display}</span><span className="uxBar" aria-hidden="true"><i style={{width:`${Number(r.logged_hours)/max*100}%`}}/></span><strong>{r.logged_hours} h</strong></li>)}</ul>:<p className="uxMuted">No hay horas registradas en este rango.</p>}</section>;
}
export default function OperationalHome({pendingOnly=false,hoursOnly=false,clientContextRef}:{pendingOnly?:boolean;hoursOnly?:boolean;clientContextRef?:string}) {
 const {user}=usePanelUser();
 const [range,setRange]=useState('month'),[offset,setOffset]=useState(0),[client,setClient]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[refresh,setRefresh]=useState(0);
 const [result,setResult]=useState<{key:string;data:HomeData|null;error:string}|null>(null);
 const actor=user?`${user.id}:${user.organization_id}:${user.role}:${user.is_superuser}`:'';
 const appliedRange=range==='custom'&&(!from||!to)?'month':range;
 const validContext=!clientContextRef||/^[a-f0-9]{64}$/.test(clientContextRef);
 const query=homeQuery(appliedRange,offset,clientContextRef||client,from,to),key=actor+':'+query+':'+refresh;
 const internal=!!user&&!isClientRole(user);
 const visible=result?.key===key?result:null;
 useEffect(()=>{
  if(!internal||!actor||!validContext)return;
  const c=new AbortController();
  async function load(){try{const r=await apiFetch('/api/carova/reports/home/?'+query,{signal:c.signal,cache:'no-store'});if(!r.ok)throw new Error(reportFailure(r.status));const data=await r.json();if(data.contract!=='carova-global-reporting-1'||!Array.isArray(data.results)||!data.summary||!data.productivity)throw new Error('La respuesta no permite mostrar un resumen verificable.');if(!c.signal.aborted)setResult({key,data,error:''});}catch(e){if(!c.signal.aborted)setResult({key,data:null,error:e instanceof Error&&e.message.startsWith('La respuesta')?e.message:e instanceof Error&&e.message.startsWith('Tu acceso')||e instanceof Error&&e.message.startsWith('El cliente')||e instanceof Error&&e.message.startsWith('La información')||e instanceof Error&&e.message.startsWith('Revisa')?e.message:reportFailure(503)});}}
  void load();return()=>c.abort();
 },[actor,internal,key,query,validContext]);
 useEffect(()=>{const invalidate=()=>{setResult(null);setRefresh(n=>n+1);};const visibility=()=>{if(document.visibilityState==='visible')invalidate();};window.addEventListener('focus',invalidate);document.addEventListener('visibilitychange',visibility);return()=>{window.removeEventListener('focus',invalidate);document.removeEventListener('visibilitychange',visibility);};},[]);
 if(!internal)return <ErrorState message="Esta vista es para el equipo interno. Consulta tus solicitudes y documentos desde Inicio."/>;
 if(!validContext)return <ErrorState message="La referencia del cliente no es válida. Regresa al listado de clientes."/>;
 const data=visible?.data;
 return <div className="uxHome">
  <div className="uxEyebrow">{data?dateLabel(data.today):'Tu espacio de trabajo'}</div>
  <PageHeader title={clientContextRef?data?.summary.pending_by_client[0]?.client_display||'Cliente de tu alcance':hoursOnly?'Horas':pendingOnly?'Pendientes':'Inicio'} description={hoursOnly?'Consulta el tiempo registrado y prepara una nueva captura.':pendingOnly?'El trabajo que necesita atención, dentro de tu acceso actual.':`Buen día, ${user?.username.split(' ')[0]||''}. Aquí tienes un resumen del trabajo del despacho.`} actions={<Link className="cc-btn cc-btn--solid" href="/panel/time-tracking/registros?nuevo=1">+ Registrar horas</Link>}/>
  {!hoursOnly&&!pendingOnly&&!clientContextRef&&<BooksAttention/>}
  {hoursOnly&&<TimeTrackingNav activo="resumen" esPrivilegiado={!!user&&(user.is_superuser||['manager','partner'].includes(user.role||''))}/>}
  <div className="uxToolbar">{!pendingOnly&&<><label>Rango de horas<select value={range} onChange={e=>{setRange(e.target.value);setOffset(0);}}><option value="today">Hoy</option><option value="week">Semana</option><option value="month">Mes</option><option value="custom">Personalizado</option></select></label>{range==='custom'&&<form className="uxToolbar" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);setFrom(String(f.get('from')));setTo(String(f.get('to')));setOffset(0);}}><label>Desde<input type="date" name="from" required defaultValue={from}/></label><label>Hasta<input type="date" name="to" required defaultValue={to}/></label><button>Aplicar rango</button></form>}</>}<button onClick={()=>{setResult(null);setRefresh(n=>n+1);}} disabled={!visible}>Actualizar</button><span className="uxMuted">{user?.is_superuser?'Todas las organizaciones · horas del equipo':isPrivileged(user)?'Organización activa · horas del equipo':'Clientes asignados · sólo tus horas'}</span></div>
  {!visible?<div className="uxLoading" role="status" aria-busy="true">Consultando pendientes y horas registradas…</div>:visible.error?<ErrorState message={visible.error} onRetry={()=>setRefresh(n=>n+1)}/>:data&&<>
   {hoursOnly?<dl className="uxMetrics"><div><dt>Hoy</dt><dd>{data.hours_today} h</dd></div><div><dt>Semana</dt><dd>{data.hours_week} h</dd></div><div><dt>Mes</dt><dd>{data.hours_month} h</dd></div><div><dt>Rango seleccionado</dt><dd>{data.productivity.logged_hours} h</dd></div></dl>:<dl className="uxMetrics"><div><dt>Pendientes</dt><dd>{data.summary.pending_total}</dd></div><div><dt>Vencidos</dt><dd>{data.summary.overdue_total}</dd></div><div><dt>Por revisar</dt><dd>{data.summary.review_required_total}</dd></div><div><dt>Horas de hoy</dt><dd>{data.hours_today}<small> h registradas</small></dd></div></dl>}
   {!pendingOnly&&<div className={'uxHomeGrid '+(hoursOnly?'uxHomeGrid--hours':'')}>{!hoursOnly&&<section className="uxHomePanel"><div className="uxSectionHead"><h2>Pendientes por cliente</h2><Link href="/panel/trabajo">Ver pendientes →</Link></div>{data.summary.pending_by_client.length?<DataTable rows={data.summary.pending_by_client} getRowKey={c=>c.client_ref} columns={[{key:'client',header:'Cliente',render:c=><Link href={'/panel/clientes/contexto/'+c.client_ref}>{c.client_display}</Link>},{key:'count',header:'Pendientes',align:'right',render:c=>c.count}]}/>:<EmptyState title="Sin pendientes en este alcance" description="Consulta los módulos para revisar sus fuentes y estados."/>}</section>}
   {!pendingOnly&&<section className="uxHomePanel"><div className="uxSectionHead"><div><h2>Horas registradas</h2><p className="uxMuted">Sólo horas registradas. La actividad del sistema no equivale a tiempo trabajado.</p></div></div>

    <p><strong className="uxHoursTotal">{data.productivity.logged_hours} h</strong> <span className="uxMuted">{dateLabel(data.productivity.period.start)} — {dateLabel(data.productivity.period.end)}</span></p>
    <p className="uxMuted">Semana: {data.hours_week} h · Mes: {data.hours_month} h{data.productivity.excluded_records>0?` · ${data.productivity.excluded_records} registros excluidos por su estado o duración`:''}</p>
    <div className="uxDistributions"><Distribution title={isPrivileged(user)?'Por persona':'Tus horas'} rows={data.productivity.hours_by_employee} kind="employee"/><Distribution title="Por cliente" rows={data.productivity.hours_by_client} kind="client"/></div>
    <details><summary>Horas por fecha</summary><table><caption>Valores del reporte de horas</caption><thead><tr><th scope="col">Fecha</th><th scope="col">Horas registradas</th></tr></thead><tbody>{data.productivity.hours_by_date.map(r=><tr key={r.date}><th scope="row">{dateLabel(r.date||null)}</th><td>{r.logged_hours} h</td></tr>)}</tbody></table></details>
   </section>}
   </div>}
   {!hoursOnly&&<section className="uxAttention"><div className="uxSectionHead"><div><h2>Trabajo que requiere atención</h2><p className="uxMuted">Fechas, responsables y vigencia provienen de cada módulo.</p></div>{!clientContextRef&&<label>Cliente<select value={client} onChange={e=>{setClient(e.target.value);setOffset(0);}}><option value="">Todo mi alcance</option>{data.summary.pending_by_client.map(c=><option key={c.client_ref} value={c.client_ref}>{c.client_display} · {c.count}</option>)}</select></label>}{client&&!clientContextRef&&<button onClick={()=>{setClient('');setOffset(0);}}>Quitar filtro de cliente</button>}</div>
    {data.results.length?<DataTable rows={data.results} getRowKey={r=>r.ref} columns={[
     {key:'client',header:'Cliente / trabajo',render:r=><><strong>{r.client_display}</strong><small>{r.title} · {modules[r.module]||'Consultar módulo'}</small></>},
     {key:'status',header:'Atención / vigencia',render:r=><><span className={'uxBadge '+(['OVERDUE','BLOCKED'].includes(r.priority)?'uxBadge--attention':'')}>{priorities[r.priority]||'Consultar estado'}</span><small>{currentness[r.material_currentness]||'Vigencia no comprobada'}</small><details><summary>Estado del módulo</summary>{r.status}</details></>},
     {key:'due',header:'Fecha límite',render:r=>dateLabel(r.due_date)},
     {key:'owner',header:'Responsable',render:r=>r.responsible?.display||'Sin responsable registrado'},
     {key:'action',header:'Siguiente paso',render:r=>{const href=attentionHref(r);return href?<Link href={href} aria-label={`Abrir ${modules[r.module]||'módulo'} · ${r.client_display}`}>{r.action_url?'Abrir recurso':'Abrir módulo'} →</Link>:<span className="uxMuted">Consulta el módulo desde su contexto</span>;}}
    ]}/>:<EmptyState title="No hay pendientes en esta consulta" description="Puedes consultar documentos o continuar con otro cliente de tu alcance." action={<Link href="/panel/clientes">Consultar clientes →</Link>}/>}
    <nav className="uxPager" aria-label="Paginación de pendientes"><span>{data.count} pendientes · {data.results.length?'Mostrando '+(data.offset+1)+'–'+(data.offset+data.results.length):'Sin registros en esta página'}</span><button disabled={data.offset===0} onClick={()=>setOffset(Math.max(0,offset-30))}>Anterior</button><button disabled={data.offset+data.limit>=data.count} onClick={()=>setOffset(offset+30)}>Siguiente</button></nav>
   </section>}

  </>}
  {!pendingOnly&&!hoursOnly&&!clientContextRef&&<Onboarding/>}
 </div>;
}
