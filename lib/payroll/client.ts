import {apiFetch} from '../api';
import {object,publicRef,type Data,label} from './model';
const base='/api/carova/payroll/';
export class PayrollFailure extends Error {
  constructor(public status:number,public code:string,public causes:Data[], public field?:string){super(label(code));}
}
function checked(path:string) {
  if (!path.startsWith(base) || path.includes('..') || path.includes('\\') || path.includes('#')) throw new Error('Ruta de nómina inválida');
  for(const part of path.slice(base.length).split('?')[0].split('/')) if (/^[0-9]+$/.test(part))throw new Error('Referencia inválida');
  return path;
}
async function error(response:Response) {
  const data=object(await response.json().catch(()=>({})));
  throw new PayrollFailure(response.status,typeof data.code==='string'?data.code:'CONNECTION_FAILED',Array.isArray(data.causes)?data.causes.map(object):[],typeof data.field==='string'?data.field:undefined);
}
export async function request(path:string,method='GET',body?:unknown,signal?:AbortSignal):Promise<Data> {
  const response=await apiFetch(checked(path),{method,signal,headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  if(!response.ok)await error(response);
  return object(await response.json());
}
export const route=(tail:string)=>base+tail;
export const refPath=(kind:string,ref:string,tail='')=>{if(!publicRef(ref))throw new Error('Referencia inválida');return route(`${kind}/${ref}/${tail}`);};
export async function download(path:string,ref:string,labelName:'CAROVA_SUA_PREPARATION_DATA'|'CAROVA_SIDEIMSS_PREPARATION_PACKAGE',body?:unknown,signal?:AbortSignal) {
  if(!publicRef(ref))throw new Error('Referencia inválida');
  const response=await apiFetch(checked(path),{method:body===undefined?'GET':'POST',signal,headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  if(!response.ok)await error(response);
  const blob=await response.blob();if(signal?.aborted)return;
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  try{a.href=url;a.download=`${labelName}_${ref}.json`;document.body.appendChild(a);a.click();}
  finally{a.remove();URL.revokeObjectURL(url);}
}
export async function encoded(file:File) {
  if(file.size>2*1024*1024 || !file.name.toLowerCase().endsWith('.json'))throw new Error('Usa un JSON técnico de hasta 2 MiB.');
  const bytes=new Uint8Array(await file.arrayBuffer());let binary='';
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
}
