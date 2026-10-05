'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {apiFetch} from '../../lib/api';
import {usePanelUser} from '../../lib/PanelUserContext';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import {reportFailure,type OperationalHome} from '../../lib/operational-reporting';
type Client={id:number;name:string;is_active:boolean};
type PendingClient=OperationalHome['summary']['pending_by_client'][number];
export default function ClientDirectory(){
 const {user}=usePanelUser();const actor=user?`${user.id}:${user.organization_id}:${user.role}`:'';
 const [result,setResult]=useState<{key:string;clients:Client[];pending:PendingClient[];error:string}|null>(null),[refresh,setRefresh]=useState(0),[search,setSearch]=useState(''),[page,setPage]=useState(0);
 const key=actor+':'+refresh,visible=result?.key===key?result:null;
 useEffect(()=>{if(!actor||user?.role==='client')return;const c=new AbortController();
 async function load(){try{const responses=await Promise.all([apiFetch('/api/clientes/',{signal:c.signal,cache:'no-store'}),apiFetch('/api/carova/reports/pending/?limit=1',{signal:c.signal,cache:'no-store'})]);for(const r of responses)if(!r.ok)throw new Error(reportFailure(r.status));const [catalog,report]=await Promise.all(responses.map(r=>r.json()));const clients=(Array.isArray(catalog)?catalog:catalog.results).map((r:Client)=>({id:r.id,name:r.name,is_active:r.is_active}));if(report.contract!=='carova-global-reporting-1')throw new Error(reportFailure(503));if(!c.signal.aborted)setResult({key,clients,pending:report.summary.pending_by_client,error:''});}catch{if(!c.signal.aborted)setResult({key,clients:[],pending:[],error:'No pudimos consultar los clientes con tu acceso actual. Actualiza la sesión o intenta nuevamente.'});}}
 void load();return()=>c.abort();},[actor,key,user?.role]);
 useEffect(()=>{const invalidate=()=>{setResult(null);setRefresh(n=>n+1);};window.addEventListener('focus',invalidate);return()=>window.removeEventListener('focus',invalidate);},[]);
 if(user?.role==='client')return <ErrorState message="El catálogo interno no está disponible para tu rol. Consulta tus solicitudes desde Inicio."/>;
 const catalog=visible?.clients.filter(c=>c.name.toLocaleLowerCase('es-MX').includes(search.toLocaleLowerCase('es-MX')))||[];
 return <div className="uxHome"><PageHeader title="Clientes" description="Administra tu cartera de clientes y consulta su trabajo pendiente." actions={user?.role==='manager'||user?.role==='partner'?<Link className="cc-btn cc-btn--solid" href="/panel/clientes/administrar?nuevo=1">+ Nuevo cliente</Link>:undefined}/>
 <div className="uxToolbar"><label>Buscar en el catálogo<input type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></label><button onClick={()=>{setResult(null);setRefresh(n=>n+1);}} disabled={!visible}>Actualizar clientes</button></div>
 {!visible?<div className="uxLoading" role="status">Consultando clientes autorizados…</div>:visible.error?<ErrorState message={visible.error} onRetry={()=>setRefresh(n=>n+1)}/>:<>

 <section className="uxClientCatalog"><h2>Catálogo autorizado</h2><p className="uxMuted">Los periodos históricos conservan su propio alcance. La ausencia de un cliente en la tabla de pendientes no demuestra un cierre profesional.</p><DataTable rows={catalog.slice(page*30,(page+1)*30)} getRowKey={c=>c.id} emptyMessage="No hay clientes con esta búsqueda en tu catálogo autorizado." columns={[{key:'name',header:'Cliente',render:c=><strong>{c.name}</strong>},{key:'status',header:'Estado',render:c=><span className={'uxBadge '+(c.is_active?'uxBadge--success':'uxBadge--danger')}>{c.is_active?'Activo':'Inactivo'}</span>},{key:'action',header:'Acciones',render:c=><Link href={'/panel/clientes/'+c.id}>Abrir periodos →</Link>}]}/><nav className="uxPager" aria-label="Paginación del catálogo"><span>{catalog.length} clientes del catálogo · página {page+1}</span><button disabled={page===0} onClick={()=>setPage(n=>n-1)}>Anterior</button><button disabled={(page+1)*30>=catalog.length} onClick={()=>setPage(n=>n+1)}>Siguiente</button></nav></section> <section className="uxHours"><h2>Clientes con pendientes actuales</h2><p className="uxMuted">Trabajo pendiente según tu acceso actual.</p>{visible.pending.length?<DataTable rows={visible.pending} getRowKey={c=>c.client_ref} columns={[{key:'client',header:'Cliente',render:c=><Link href={'/panel/clientes/contexto/'+c.client_ref}>{c.client_display}</Link>},{key:'pending',header:'Pendientes actuales',render:c=>c.count},{key:'action',header:'Siguiente paso',render:c=><Link href={'/panel/clientes/contexto/'+c.client_ref}>Revisar trabajo →</Link>}]}/>:<EmptyState title="No hay clientes con pendientes actuales" description="Puedes revisar los documentos y periodos del catálogo autorizado."/>}</section>
 </>}
 </div>;
}
