'use client';
import Link from 'next/link';
import {usePathname,useSearchParams} from 'next/navigation';
import {operationalActive,operationalNavigation} from '../../lib/operational-navigation';
import {usePanelUser} from '../../lib/PanelUserContext';
import {navigationFor} from '../../lib/platform';
export default function RouteContext(){
 const search=useSearchParams();const path=usePathname(),{user}=usePanelUser();if(path==='/panel')return null;
 const items=user?.role==='client'?navigationFor(true):operationalNavigation.flatMap(g=>g.items);
 const destination=items.find(d=>d.href===operationalActive(path,search.get('section')))||items.filter(d=>path===d.href||d.href!=='/panel'&&path.startsWith(d.href+'/')).sort((a,b)=>b.href.length-a.href.length)[0];
 return <nav className="uxBreadcrumb" aria-label="Ubicación"><Link href="/panel">Inicio</Link>{destination&&<> <span aria-hidden="true">/</span> {path===destination.href?<span aria-current="page">{destination.label}</span>:<><Link href={destination.href}>{destination.label}</Link><span aria-hidden="true"> / </span><span>Detalle</span></>}</>}</nav>;
}
