'use client';
import {useState} from 'react';
import {apiFetch,apiJson} from '@/lib/api';
import {usePanelUser} from '@/lib/PanelUserContext';
import {isPrivileged} from '@/lib/roles';
import {formErrorMessage} from '@/lib/formErrors';
import Modal from '@/components/panel/Modal';
import FormField from '@/components/panel/FormField';
type Catalog={organization_id:number;preview_token:string;notice:string;scope:string[];catalog:{code:string;name:string;version:number;source:string;installed:boolean}[]};
export default function CatalogActivation({onComplete}:{onComplete:()=>void}){
 const {user}=usePanelUser();const [open,setOpen]=useState(false),[data,setData]=useState<Catalog|null>(null),[org,setOrg]=useState(String(user?.organization_id||'')),[orgs,setOrgs]=useState<{id:number;name:string}[]>([]),[reason,setReason]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!isPrivileged(user))return null;const url='/api/carova/audit/catalog/';
 async function show(){setOpen(true);setData(null);setError('');setConfirmed(false);setReason('');const r=await apiFetch('/api/organizaciones/');if(r.ok)setOrgs(await r.json());}
 async function preview(){setBusy(true);setError('');try{const r=await apiFetch(url+`?organization_id=${encodeURIComponent(org)}`);const d=await r.json();if(!r.ok)throw new Error(formErrorMessage(d));setData(d);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function save(e:React.FormEvent){e.preventDefault();if(!data)return;setBusy(true);try{const r=await apiJson(url,'POST',{organization_id:Number(org),reason,confirmed,preview_token:data.preview_token});const d=await r.json();if(!r.ok)throw new Error(formErrorMessage(d));setOpen(false);onComplete();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><button className="cc-btn cc-btn--ghost" onClick={show}>Catálogo A-20 / A-21</button><Modal open={open} title="Activar catálogo aprobado" onClose={()=>!busy&&setOpen(false)}><form className="uploadForm" onSubmit={save}><FormField label="Organización"><select required value={org} onChange={e=>{setOrg(e.target.value);setData(null);}}><option value="">Selecciona organización</option>{orgs.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></FormField><button className="cc-btn cc-btn--ghost" type="button" disabled={!org||busy} onClick={preview}>Revisar catálogo y alcance</button>{data&&<><p>{data.notice}</p><p>{data.scope.join(' · ')}</p>{data.catalog.map(x=><p key={x.code}><strong>{x.code} · versión {x.version}</strong> · {x.installed?'Ya instalado':'Disponible para activar'}<br/>{x.name}<br/>Fuente: {x.source}</p>)}<FormField label="Motivo" required><textarea required minLength={5} value={reason} onChange={e=>setReason(e.target.value)}/></FormField><label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Confirmo la activación únicamente en la organización seleccionada.</label><button className="cc-btn cc-btn--solid" disabled={busy||!confirmed||reason.trim().length<5}>Activar catálogo aprobado</button></>}{error&&<p role="alert">{error}</p>}</form></Modal></>;
}
