export type PresentationSource = {kind:'documentos'|'auditoria'; ref:string};
export type PresentationMetadata = {title:string; client:string; period?:string; download:boolean; returnPath:string};
export function validSource(s:PresentationSource):boolean {
 return s.kind==='documentos'?/^[1-9][0-9]{0,17}$/.test(s.ref):s.kind==='auditoria'&&/^[a-f0-9]{64}$/.test(s.ref);
}
export function sourcePaths(s:PresentationSource) {
 if(!validSource(s))throw new Error('Informe no disponible.');
 return s.kind==='documentos'
  ?{metadata:`/api/documento/${s.ref}/presentacion/`,file:`/api/documento/${s.ref}/archivo/`,route:`/panel/presentar/documentos/${s.ref}`}
  :{metadata:`/api/carova/audit/artifacts/${s.ref}/`,file:`/api/carova/audit/artifacts/${s.ref}/file/`,route:`/panel/presentar/auditoria/${s.ref}`};
}
export function presentationPath(path:string):boolean {
 return /^\/panel\/presentar\/(documentos\/[1-9][0-9]{0,17}|auditoria\/[a-f0-9]{64})\/?$/.test(path);
}
const record=(value:unknown):Record<string,unknown>=>value!==null&&typeof value==='object'?value as Record<string,unknown>:{};
export function displayText(value:unknown,fallback='Informe'):string {
 if(typeof value!=='string')return fallback;
 const text=value.replace(/[\u0000-\u001f\u007f]/g,'').trim();
 return !text||text.includes('/')||text.includes('\\')?fallback:text.slice(0,240);
}
export function metadataFrom(s:PresentationSource,data:unknown,clientRole:boolean):PresentationMetadata {
 const row=record(data);
 if(s.kind==='documentos') {
  if(!validSource(s)||row.download!==true)throw new Error('Informe no disponible.');
  return {title:displayText(row.title),client:displayText(row.client,''),download:true,
   returnPath:clientRole?'/panel/documentos':`/panel/documentos/${s.ref}`};
 }
 const manifest=record(row.manifest),header=record(manifest.header);
 if(clientRole||!validSource(s)||row.state!=='CURRENT'||row.mime!=='application/pdf'||manifest.format!=='PDF'||manifest.review_state!=='AUTHORIZED')throw new Error('Informe no disponible.');
 const paper=typeof manifest.workpaper_ref==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(manifest.workpaper_ref)?manifest.workpaper_ref:null;
 const date=(value:unknown)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:null;
 const from=date(header.period_start),to=date(header.period_end);
 return {title:displayText(header.name),client:displayText(header.client,''),period:from&&to?`${from} · ${to}`:undefined,download:true,returnPath:paper?`/panel/auditoria/${paper}`:'/panel/encargos'};
}
export function nextPage(page:number,delta:number,total:number):number {return Math.min(total,Math.max(1,page+delta));}
export function pageKey(key:string,controlFocused:boolean):number {
 if(controlFocused)return 0;
 return ['ArrowRight','PageDown',' '].includes(key)?1:['ArrowLeft','PageUp'].includes(key)?-1:0;
}
export async function fullscreenChange(doc:{fullscreenElement:unknown;exitFullscreen:()=>Promise<void>},element:{requestFullscreen?:()=>Promise<void>}|null):Promise<boolean> {
 try {if(doc.fullscreenElement)await doc.exitFullscreen();else if(element?.requestFullscreen)await element.requestFullscreen();else return false;return true;}catch{return false;}
}
export function rangeTotal(header:string|null,received:number):number|null {
 const m=/^bytes 0-(\d+)\/(\d+)$/.exec(header??'');
 if(!m)return null;
 const end=Number(m[1]),total=Number(m[2]);
 return Number.isSafeInteger(total)&&total>0&&end+1===received&&received<=total?total:null;
}
