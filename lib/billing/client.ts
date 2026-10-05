import {apiFetch,apiJson} from '../api';
import {BillingRequestError,object,downloadPath,type Row} from './model';
const base='/api/carova/workspace/billing/';
async function response(res:Response):Promise<Row>{const data=await res.json().catch(()=>({}));if(!res.ok)throw new BillingRequestError(res.status,data);return object(data);}
export const billing={
 read:async(path:string)=>response(await apiFetch(base+path)),
 write:async(path:string,data:Row={},method='POST')=>response(await apiJson(base+path,method,data)),
 download:async(artifact:Row)=>{const res=await apiFetch(downloadPath(artifact));if(!res.ok)throw new BillingRequestError(res.status,await res.json().catch(()=>({})));const url=URL.createObjectURL(await res.blob());try{const a=document.createElement('a');a.href=url;a.download=String(artifact.name||'Documento');a.click();}finally{URL.revokeObjectURL(url);}},
};
