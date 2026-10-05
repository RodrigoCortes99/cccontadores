export type RecentWork={href:string;workspace:string;client:string;period:string;periodId:number};
export function workKey(id:number,org:number){return `carova-work:${id}:${org}`;}
export function safeWork(value:unknown):value is RecentWork {
 const r=value as RecentWork;
 return !!r&&typeof r.href==='string'&&/^\/panel\/(clientes\/\d+|carova\/(egresos|documentos))(\?|$)/.test(r.href)&&typeof r.workspace==='string'&&/^\/panel\/clientes\/\d+(\?|$)/.test(r.workspace)&&Number.isInteger(r.periodId)&&typeof r.client==='string'&&typeof r.period==='string';
}
