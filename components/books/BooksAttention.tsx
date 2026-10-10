'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {usePanelUser} from '../../lib/PanelUserContext';
import {request,rows,text,type Row} from './client';
const labels:Record<string,string>={unposted_proposals:'Pólizas por revisar',unmapped_accounts:'Cuentas sin clasificación',pending_imports:'Importaciones pendientes',sat_problems:'Problemas de sincronización SAT',fiscal_mismatches:'XML fiscal por revisar',failed_imports:'Previews bloqueados',new_cfdi:'CFDI recibidos en últimos siete días',cfdi_conflicts:'Conflictos de UUID',"69b_matches":'Coincidencias 69-B por revisar',"69b_source_unavailable":'Publicación 69-B no disponible'};
export default function BooksAttention(){const {user}=usePanelUser();const [items,setItems]=useState<Row[]>([]),[error,setError]=useState('');
 useEffect(()=>{if(!user||user.role==='client'&&!user.is_superuser)return;const c=new AbortController();request('home/',undefined,c.signal).then(d=>{setItems(rows(d.results));setError('');}).catch(()=>{if(!c.signal.aborted)setError('No se pudo consultar la atención de libros.');});return()=>c.abort();},[user]);
 return <section className="uxHomePanel"><div className="uxSectionHead"><h2>Libros contables</h2><Link href="/panel/libros">Abrir libros →</Link></div>{error?<p role="alert">{error}</p>:items.length?<ul>{items.map(i=><li key={text(i.client_ref)}>{text(i.client_name)}: {Object.entries(labels).filter(([key])=>Number(i[key])>0).map(([key,label])=>`${label}: ${text(i[key])}`).join(' · ')}</li>)}</ul>:<p className="uxMuted">Sin pendientes registrados en libros para tu alcance.</p>}</section>;
}
