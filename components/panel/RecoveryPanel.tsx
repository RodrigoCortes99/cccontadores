"use client";
import {useState} from 'react';
import {formErrorMessage} from '@/lib/formErrors';
import {apiFetch} from '@/lib/api';
import {usePanelUser} from '@/lib/PanelUserContext';
import {isPrivileged} from '@/lib/roles';
import Modal from './Modal';
import FormField from './FormField';

type Preview={preview_token:string; allowed?:boolean; explanation:string; previous_state:string; documents?:number; name?:string; version?:number; target_client?:string};
type Engagement={id:number; nombre:string; cliente_nombre?:string; cliente?:string};
export default function RecoveryPanel({requestId,documentId,onComplete}:{requestId?:number;documentId?:number;onComplete:()=>void}){
 const {user}=usePanelUser();const [open,setOpen]=useState(false),[action,setAction]=useState('cancel'),[target,setTarget]=useState(''),[engagements,setEngagements]=useState<Engagement[]>([]),[preview,setPreview]=useState<Preview|null>(null),[reason,setReason]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!isPrivileged(user))return null;
 const url=documentId?`/api/documentos/${documentId}/withdraw/`:`/api/pbc/${requestId}/recovery/`;
 async function show(){setOpen(true);setPreview(null);setReason('');setConfirmed(false);setError('');if(!documentId){const r=await apiFetch('/api/encargos/');if(r.ok)setEngagements(await r.json());}}
 async function review(){setBusy(true);setError('');try{const q=documentId?'':`?action=${action}${action==='change_client'?`&target_encargo_id=${encodeURIComponent(target)}`:''}`;const r=await apiFetch(url+q);const d=await r.json();if(!r.ok)throw new Error(formErrorMessage(d,'Selecciona un encargo válido dentro de la misma organización y vuelve a revisar las consecuencias.'));setPreview(d);setConfirmed(false);}catch(e){setError(e instanceof Error?e.message:'No se pudo preparar la corrección.');}finally{setBusy(false);}}
 async function save(e:React.FormEvent){e.preventDefault();if(!preview)return;setBusy(true);setError('');try{const r=await apiFetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,reason,confirmed,preview_token:preview.preview_token,...(action==='change_client'?{target_encargo_id:Number(target)}:{})})});const d=await r.json();if(!r.ok)throw new Error(formErrorMessage(d,'Revisa el motivo y vuelve a solicitar la vista previa.'));setOpen(false);onComplete();}catch(e){setError(e instanceof Error?e.message:'No se pudo confirmar.');}finally{setBusy(false);}}
 return <><button className="cc-btn cc-btn--ghost" type="button" onClick={show}>{documentId?'Retirar documento':'Corregir solicitud'}</button><Modal open={open} title={documentId?'Retirar documento':'Corrección segura de solicitud'} onClose={()=>!busy&&setOpen(false)}><form className="uploadForm" onSubmit={save}>
 {!documentId&&<><FormField label="Acción"><select value={action} onChange={e=>{setAction(e.target.value);setPreview(null);}}><option value="cancel">Cancelar y revocar acceso del cliente</option><option value="archive">Archivar y revocar acceso del cliente</option><option value="change_client">Cambiar cliente de una solicitud vacía</option></select></FormField>{action==='change_client'&&<FormField label="Encargo del cliente correcto"><select value={target} onChange={e=>{setTarget(e.target.value);setPreview(null);}}><option value="">Selecciona un encargo de la misma organización</option>{engagements.map(x=><option value={x.id} key={x.id}>{x.cliente_nombre||x.cliente} · {x.nombre}</option>)}</select></FormField>}</>}
 <button className="cc-btn cc-btn--ghost" type="button" disabled={busy} onClick={review}>Ver consecuencias</button>
 {preview&&<><p role="status">{preview.explanation}</p>{preview.name&&<p>{preview.name} · Versión {preview.version}</p>}{preview.documents!==undefined&&<p>Documentos conservados: {preview.documents}</p>}{preview.target_client&&<p>Cliente de destino: {preview.target_client}</p>}<FormField label="Motivo" required hint="Describe el error y por qué debe corregirse."><textarea required minLength={5} maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)}/></FormField><label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Confirmo la consecuencia mostrada; el historial se conservará.</label><button className="cc-btn cc-btn--solid" disabled={busy||!confirmed||reason.trim().length<5||preview.allowed===false}>{busy?'Confirmando…':'Confirmar corrección'}</button></>}
 {error&&<p role="alert" className="loginError">{error}</p>}
 </form></Modal></>;
}
