import {apiFetch,apiJson} from '../api';
import {errorMessage,safeDownload} from './model';
import type {Artifact,Engagement,Paper,Source,ExactRevision} from './model';
const base='/api/carova/audit/';
export class AuditError extends Error {status:number; constructor(status:number){super(errorMessage(status));this.status=status;}}
async function read<T>(path:string):Promise<T>{const r=await apiFetch(base+path);if(!r.ok)throw new AuditError(r.status);return r.json();}
async function write(path:string,data:Record<string,unknown>,method='POST'){const r=await apiJson(base+path,method,data);if(!r.ok)throw new AuditError(r.status);return r.json();}
export const audit={
 exactRevision:(ref:string,revision:string)=>read<ExactRevision>(`ui/papers/${encodeURIComponent(ref)}/revisions/${encodeURIComponent(revision)}/`),
 sourceDownload:async(s:Source)=>{if(!s.download_url||!/^\/api\/carova\/audit\/ui\/contexts\/[a-f0-9-]{36}\/documents\/[a-f0-9]{64}\/file\/$/.test(s.download_url))throw new AuditError(404);const r=await apiFetch(s.download_url);if(!r.ok)throw new AuditError(r.status);const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=s.metadata.pbc_name||'evidencia';a.click();URL.revokeObjectURL(url);},
 engagement:(ref:string)=>read<Engagement>(`ui/engagements/${encodeURIComponent(ref)}/`),
 paper:(ref:string)=>read<Paper>(`ui/papers/${encodeURIComponent(ref)}/`),
 sources:(ref:string)=>read<{sources:Source[]}>(`ui/contexts/${encodeURIComponent(ref)}/sources/`),
 exports:(ref:string)=>read<{artifacts:Artifact[]}>(`ui/papers/${encodeURIComponent(ref)}/exports/`),
 mutate:(p:Paper,data:Record<string,unknown>)=>write(`papers/${p.ref}/`,{...data,revision:p.revision},'PATCH'),
 action:(p:Paper,action:string,data:Record<string,unknown>)=>write(`papers/${p.ref}/${action}/`,{...data,revision:p.revision}),
 transition:(p:Paper,decision:string,reason:string)=>write(`papers/${p.ref}/transitions/`,{decision,reason,revision:p.revision,revision_ref:p.revision_ref}),
 a21:(p:Paper,instance_key:string)=>write(`papers/${p.ref}/a21/`,{revision_ref:p.revision_ref,instance_key}),
 create:(context:string,data:Record<string,unknown>)=>write(`contexts/${context}/papers/`,data),
 definitions:()=>read<{definitions:{ref:string; code:string; name:string; version:number}[]}>('definitions/'),
 bootstrap:()=>read<{actors:{ref:string; name:string}[]}>('bootstrap/'),
 context:(data:Record<string,unknown>)=>write('contexts/',data),
 assign:(context:string,data:Record<string,unknown>)=>write(`contexts/${context}/assignments/`,data),
 download:async(a:Artifact)=>{const path=safeDownload(a);if(!path)throw new AuditError(409);const r=await apiFetch(path);if(!r.ok)throw new AuditError(r.status);const blob=await r.blob();const url=URL.createObjectURL(blob);const el=document.createElement('a');el.href=url;el.download=a.name;el.click();URL.revokeObjectURL(url);},
};
