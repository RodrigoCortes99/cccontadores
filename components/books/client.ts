import {apiFetch} from '../../lib/api';
import {bookPath,bookError} from '../../lib/books-contract';
export type Row=Record<string,unknown>;
export const object=(x:unknown):Row=>x&&typeof x==='object'&&!Array.isArray(x)?x as Row:{};
export const rows=(x:unknown):Row[]=>Array.isArray(x)?x.map(object):[];
export const text=(x:unknown):string=>x===null||x===undefined?'':typeof x==='object'?JSON.stringify(x):String(x);
export const base='/api/carova/books/';
export async function request(path:string,body?:Row|FormData,signal?:AbortSignal):Promise<Row>{
 bookPath(path);
 const res=await apiFetch(base+path,{method:body?'POST':'GET',body:body instanceof FormData?body:body?JSON.stringify(body):undefined,headers:body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:undefined,signal});
 const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(bookError(data));return object(data);
}
export async function download(path:string,name:string){const res=await apiFetch(base+bookPath(path));if(!res.ok)throw new Error(bookError(await res.json()));const url=URL.createObjectURL(await res.blob());const a=document.createElement('a');try{a.href=url;a.download=name;a.click();}finally{URL.revokeObjectURL(url);}}
