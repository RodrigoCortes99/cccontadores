'use client';
import {usePanelUser} from '@/lib/PanelUserContext';
import {isPrivileged} from '@/lib/roles';
import {useState} from 'react';
import {apiFetch} from '@/lib/api';
import {formErrorMessage} from '@/lib/formErrors';
type Event={id:number;action:string;reason:string;actor:string;created_at:string;before:{lifecycle?:string;estatus?:string};after:{lifecycle?:string;estatus?:string}};
const actions:Record<string,string>={cancel:'Cancelación de solicitud',archive:'Archivo de solicitud',change_client:'Cambio de cliente de solicitud vacía',withdraw_document:'Retiro de documento'};
export default function PbcHistory({requestId}:{requestId:number}){
 const {user}=usePanelUser();
 const [rows,setRows]=useState<Event[]>([]),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
 async function load(){try{const r=await apiFetch(`/api/pbc/${requestId}/history/`);const d=await r.json();if(!r.ok)throw new Error(formErrorMessage(d));setRows(d);setLoaded(true);}catch(e){setError((e as Error).message);}}
 if(!isPrivileged(user))return null;
 return <details onToggle={e=>{if(e.currentTarget.open&&!loaded)void load();}}><summary>Historial de correcciones y retiros</summary>{error&&<p role="alert">{error}</p>}{rows.map(e=><p key={e.id}><strong>{actions[e.action]||'Corrección registrada'}</strong> · {e.actor} · {new Date(e.created_at).toLocaleString('es-MX')}<br/>{e.reason}</p>)}{loaded&&!rows.length&&<p>Sin correcciones registradas.</p>}</details>;
}
