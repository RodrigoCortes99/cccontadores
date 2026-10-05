'use client';
import {useEffect,useState} from 'react';
import {usePathname,useSearchParams,useRouter} from 'next/navigation';
import Link from 'next/link';
import {usePanelUser} from '../../lib/PanelUserContext';
import {workKey,safeWork,type RecentWork} from '../../lib/work-context';
export {workKey} from '../../lib/work-context';
export default function WorkNavigation(){
 const {user}=usePanelUser(),path=usePathname(),search=useSearchParams(),router=useRouter();
 const [recent,setRecent]=useState<RecentWork|null>(null);
 const operational=path.startsWith('/panel/carova/egresos')||path.startsWith('/panel/carova/documentos');
 useEffect(()=>{
  setRecent(null);if(!user?.id||!user.organization_id)return;
  try {const key=workKey(user.id,user.organization_id),r=JSON.parse(sessionStorage.getItem(key)||'null');if(!safeWork(r))return;
   const pid=search.get('accounting_period')||search.get('period_id');
   if(operational&&Number(pid)===r.periodId){const next={...r,href:path+(search.size?'?'+search:'')};sessionStorage.setItem(key,JSON.stringify(next));setRecent(next);}
  }catch{/* Storage unavailable: navigation remains usable. */}
 },[path,search,user?.id,user?.organization_id,operational]);
 if(!operational)return null;
 return <nav className="platformContext" aria-label="Contexto de trabajo"><button onClick={()=>router.back()}>← Volver</button>{recent?<Link href={recent.workspace}>{recent.client} · {recent.period}</Link>:<Link href="/panel/clientes">Clientes y periodos</Link>}<Link href="/panel/trabajo">Pendientes</Link></nav>;
}
export function ResumeWork({periodIds}:{periodIds:number[]}){
 const {user}=usePanelUser();const [recent,setRecent]=useState<RecentWork|null>(null);
 useEffect(()=>{setRecent(null);if(!user?.id||!user.organization_id)return;try{const r=JSON.parse(sessionStorage.getItem(workKey(user.id,user.organization_id))||'null');if(safeWork(r))setRecent(r);}catch{}},[user?.id,user?.organization_id]);
 return recent&&periodIds.includes(recent.periodId)?<section className="platformResume"><h2>Continuar trabajando</h2><Link className="platformPrimary" href={recent.href}>{recent.client} · {recent.period} →</Link><p>Retomar la última vista de trabajo de esta sesión.</p></section>:null;
}
