'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {apiFetch} from '../../lib/api';
import {usePanelUser} from '../../lib/PanelUserContext';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import ErrorState from './ErrorState';
import Alert from './Alert';
type Period={id:number;client_name:string;label:string;status:string};
const states:Record<string,string>={OPEN:'Abierto',DRAFT:'Borrador',CLOSED:'Cerrado',IN_REVIEW:'En revisión',REVIEWED:'Revisado'};
export default function ModulePeriods({title,section,description,limitation}:{title:string;section:string;description:string;limitation:string}){
 const {user}=usePanelUser();const actor=user?`${user.id}:${user.organization_id}:${user.role}`:'';
 const [result,setResult]=useState<{key:string;rows:Period[];error:string;count:number}|null>(null),[page,setPage]=useState(1),[refresh,setRefresh]=useState(0);
 const key=`${actor}:${page}:${refresh}`,visible=result?.key===key?result:null;
 useEffect(()=>{if(!actor||user?.role==='client')return;const c=new AbortController();
  void apiFetch('/api/carova/workspace/periods/?page='+page,{signal:c.signal,cache:'no-store'}).then(async r=>{if(!r.ok)throw new Error('No pudimos consultar los periodos con tu acceso actual.');return r.json();}).then(d=>{if(!c.signal.aborted)setResult({key,rows:d.results,count:d.count,error:''});}).catch(()=>{if(!c.signal.aborted)setResult({key,rows:[],count:0,error:'No pudimos consultar los periodos. Vuelve a intentarlo.'});});return()=>c.abort();
 },[actor,key,page,user?.role]);
 return <div className="uxHome"><PageHeader title={title} description={description} actions={<Link className="cc-btn cc-btn--solid" href={'/panel/carova/egresos?tab=Periodos&section='+encodeURIComponent(section)}>Abrir periodos</Link>}/><Alert title="Alcance de este módulo"><p>{limitation}</p></Alert>{user?.role==='client'?<ErrorState message="Este módulo está disponible para el equipo interno."/>:!visible?<p className="uxLoading" role="status">Consultando periodos autorizados…</p>:visible.error?<ErrorState message={visible.error} onRetry={()=>setRefresh(n=>n+1)}/>:<section className="uxHomePanel"><div className="uxSectionHead"><h2>Periodos de trabajo</h2><span className="uxMuted">Selecciona el contexto que necesitas revisar.</span></div><DataTable rows={visible.rows} getRowKey={p=>p.id} emptyMessage="No hay periodos autorizados en esta consulta." columns={[{key:'client',header:'Cliente',render:p=><strong>{p.client_name}</strong>},{key:'period',header:'Periodo',render:p=>p.label},{key:'state',header:'Estado',render:p=><span className="uxBadge">{states[p.status]||'Consultar periodo'}</span>},{key:'action',header:'Acción',render:p=><Link href={'/panel/carova/egresos?tab=Periodos&accounting_period='+p.id+'&section='+encodeURIComponent(section)}>Revisar →</Link>}]}/><nav className="uxPager" aria-label="Paginación de periodos"><span>{visible.count} periodos autorizados · página {page}</span><button disabled={page===1} onClick={()=>setPage(n=>n-1)}>Anterior</button><button disabled={page*30>=visible.count} onClick={()=>setPage(n=>n+1)}>Siguiente</button></nav></section>}</div>;
}
