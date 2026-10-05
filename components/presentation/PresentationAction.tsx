'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {usePanelUser} from '@/lib/PanelUserContext';
import {presentationMetadata} from '@/lib/presentation/client';
import {sourcePaths} from '@/lib/presentation/model';
import type {PresentationSource} from '@/lib/presentation/model';
export default function PresentationAction({source}:{source:PresentationSource}) {
 const {user}=usePanelUser();const [allowed,setAllowed]=useState<string|null>(null);
 const kind=source.kind,ref=source.ref,client=user?.role==='client';
 const key=`${kind}:${ref}:${client}`;
 useEffect(()=>{const ctl=new AbortController();void presentationMetadata({kind,ref},client,ctl.signal).then(()=>{if(!ctl.signal.aborted)setAllowed(key);}).catch(()=>{if(!ctl.signal.aborted)setAllowed(null);});return()=>ctl.abort();},[kind,ref,client,key]);
 return allowed===key?<Link className="cc-btn cc-btn--outline" href={sourcePaths(source).route} prefetch={false}>Presentar</Link>:null;
}
