'use client';
import {useState} from 'react';
import {apiFetch,apiJson} from '@/lib/api';
import Modal from '@/components/panel/Modal';
import FormField from '@/components/panel/FormField';
import {formErrorMessage} from '@/lib/formErrors';
export default function EmployerCreation({onComplete}:{onComplete:()=>void}){
 const [open,setOpen]=useState(false),[clients,setClients]=useState<{client_id:number;name:string}[]>([]),[client,setClient]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function show(){setOpen(true);setError('');setClient('');setBusy(true);try{const r=await apiFetch('/api/carova/payroll/employers/create/');const d=await r.json();if(!r.ok)throw new Error(formErrorMessage(d));setClients(d.clients);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await apiJson('/api/carova/payroll/employers/create/','POST',{client_id:Number(client)});const d=await r.json();if(!r.ok)throw new Error(formErrorMessage(d));setOpen(false);onComplete();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><button className="cc-btn cc-btn--solid" onClick={show}>Agregar empleador</button><Modal open={open} title="Agregar empleador" onClose={()=>!busy&&setOpen(false)}><form className="uploadForm" onSubmit={save}><p>Selecciona un cliente existente. No crea una identidad nueva ni presenta SUA/IMSS/IDSE.</p><FormField label="Cliente / empleador" required><select required value={client} onChange={e=>setClient(e.target.value)}><option value="">Selecciona un cliente</option>{clients.map(x=><option key={x.client_id} value={x.client_id}>{x.name}</option>)}</select></FormField>{!busy&&!clients.length&&<p>Todos los clientes autorizados ya están registrados, o no hay clientes disponibles.</p>}{error&&<p role="alert" className="loginError">{error}</p>}<button className="cc-btn cc-btn--solid" disabled={busy||!client}>Registrar empleador</button></form></Modal></>;
}
