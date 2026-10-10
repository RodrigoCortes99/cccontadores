'use client';
import {useEffect,useMemo,useSyncExternalStore} from 'react';
import {usePathname,useSearchParams,useRouter} from 'next/navigation';
import Link from 'next/link';
import {usePanelUser} from '../../lib/PanelUserContext';
import {workKey,safeWork,type RecentWork} from '../../lib/work-context';
export {workKey} from '../../lib/work-context';
function subscribeWork(change:()=>void){
 window.addEventListener('storage',change);window.addEventListener('work-context-updated',change);
 return()=>{window.removeEventListener('storage',change);window.removeEventListener('work-context-updated',change);};
}
function useRecentWork(userId?:number,organizationId?:number|null){
 const raw=useSyncExternalStore(subscribeWork,()=>{
  if(!userId||!organizationId)return null;
  try{return sessionStorage.getItem(workKey(userId,organizationId));}catch{return null;}
 },()=>null);
 return useMemo<RecentWork|null>(()=>{try{const row=JSON.parse(raw||'null');return safeWork(row)?row:null;}catch{return null;}},[raw]);
}
export default function WorkNavigation(){
 const {user}=usePanelUser(),path=usePathname(),search=useSearchParams(),router=useRouter();
 const recent=useRecentWork(user?.id,user?.organization_id);
 const operational=path.startsWith('/panel/carova/egresos')||path.startsWith('/panel/carova/documentos');
 useEffect(()=>{
  if(!user?.id||!user.organization_id||!recent)return;
  try {const key=workKey(user.id,user.organization_id),r=recent;
   const pid=search.get('accounting_period')||search.get('period_id');
   if(operational&&Number(pid)===r.periodId){const next={...r,href:path+(search.size?'?'+search:'')};const serialized=JSON.stringify(next);if(sessionStorage.getItem(key)!==serialized){sessionStorage.setItem(key,serialized);window.dispatchEvent(new Event('work-context-updated'));}}
  }catch{/* Storage unavailable: navigation remains usable. */}
 },[path,search,user?.id,user?.organization_id,operational,recent]);
 if(!operational)return null;
 return <nav className="platformContext" aria-label="Contexto de trabajo"><button onClick={()=>router.back()}>← Volver</button>{recent?<Link href={recent.workspace}>{recent.client} · {recent.period}</Link>:<Link href="/panel/clientes">Clientes y periodos</Link>}<Link href="/panel/trabajo">Pendientes</Link></nav>;
}
export function ResumeWork({periodIds}:{periodIds:number[]}){
 const {user}=usePanelUser();const recent=useRecentWork(user?.id,user?.organization_id);
 return recent&&periodIds.includes(recent.periodId)?<section className="platformResume"><h2>Continuar trabajando</h2><Link className="platformPrimary" href={recent.href}>{recent.client} · {recent.period} →</Link><p>Retomar la última vista de trabajo de esta sesión.</p></section>:null;
}
