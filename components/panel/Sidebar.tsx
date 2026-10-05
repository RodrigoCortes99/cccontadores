"use client";
import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useRef} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import {navigationFor} from '../../lib/platform';
import {navigationForActor,operationalActive} from '../../lib/operational-navigation';
import {usePanelUser} from '../../lib/PanelUserContext';
import {roleLabel} from '../../lib/roles';
import {carovaPublicUrl} from '../../lib/branding';
import {NavigationIcon} from '../icons';
type SidebarProps={collapsed:boolean;mobileOpen:boolean;esCliente:boolean;onCloseMobile:()=>void};
export default function Sidebar({collapsed,mobileOpen,esCliente,onCloseMobile}:SidebarProps){
 const navigation=useRef<HTMLElement>(null);
 const {user}=usePanelUser();
 const compact=collapsed&&!mobileOpen;
 useEffect(()=>{if(!mobileOpen)return;const previous=document.activeElement as HTMLElement|null;navigation.current?.querySelector<HTMLAnchorElement>('a')?.focus();return()=>previous?.focus();},[mobileOpen]);
 const search=useSearchParams();const pathname=usePathname();
 const administration=pathname.startsWith('/panel/facturacion')||pathname.startsWith('/panel/nomina');
 const groups=esCliente?[{label:'Tu portal',items:navigationFor(true)}]:navigationForActor(user);
 const active=esCliente?groups[0].items.filter(i=>pathname===i.href||i.href!=='/panel'&&pathname.startsWith(i.href+'/')).sort((a,b)=>b.href.length-a.href.length)[0]?.href:operationalActive(pathname,search.get('section'));
 function keyboard(e:React.KeyboardEvent<HTMLElement>){
  if(!mobileOpen)return;
  if(e.key==='Escape'){e.preventDefault();onCloseMobile();}
  if(e.key==='Tab'){
   const links=navigation.current?.querySelectorAll<HTMLElement>('a[href],button');
   if(!links?.length)return;
   const first=links[0],last=links[links.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 }
 return <><aside ref={navigation} onKeyDown={keyboard} data-area={administration?'administracion':undefined} id="panel-navigation" className={`appSidebar ${compact?'appSidebar--collapsed':''} ${mobileOpen?'appSidebar--mobileOpen':''}`} aria-label="Menú de CC Contadores">
 <Link href="/panel" className="appSidebar__brand" aria-label="CC Contadores · Inicio">{compact?<span className="ccCompactBrand" aria-hidden="true">CC</span>:<span className="ccLogo"><Image src="/logo-cc-transparente.png" alt="CC Contadores" fill sizes="186px" priority/></span>}</Link>
 {mobileOpen&&<button className="ccMobileClose" onClick={onCloseMobile} aria-label="Cerrar menú">×</button>}
 <nav className="appSidebar__nav" aria-label="Navegación del panel">{groups.map(g=><div className="uxNavGroup" key={g.label}>{!compact&&<p className="uxNavGroupLabel">{g.label}</p>}{g.items.map(i=>{const props={onClick:onCloseMobile,className:`appSidebar__link ${active===i.href?'appSidebar__link--active':''}`,'aria-current':active===i.href?'page' as const:undefined,title:compact?i.label:undefined};const content=<><NavigationIcon name={i.label}/>{!compact&&<span>{i.label}</span>}</>;return i.href==='/panel/nomina'?<Link key={i.href} {...props} href="/panel/nomina" aria-label="Nómina">{content}</Link>:<Link key={i.href} {...props} href={i.href} aria-label={i.label}>{content}</Link>;})}</div>)}</nav>
 <footer className="ccSidebarFooter"><div className="ccSidebarUser"><span className="ccAvatar" aria-hidden="true">{(user?.username||'CC').slice(0,2).toUpperCase()}</span>{!compact&&<div><strong>{user?.username}</strong><small>{roleLabel(user?.role)}</small></div>}</div>{!compact&&(carovaPublicUrl?<a className="ccVendor" href={carovaPublicUrl} target="_blank" rel="noopener noreferrer">Hecho por <strong>CAROVA</strong> ↗</a>:<span className="ccVendor">Hecho por <strong>CAROVA</strong></span>)}</footer>
 </aside>{mobileOpen&&<button className="appSidebar__scrim" onClick={onCloseMobile} aria-label="Cerrar menú"/>}</>;
}
