import {apiFetch} from '../api';
import {metadataFrom,sourcePaths} from './model';
import type {PresentationSource} from './model';
export async function presentationMetadata(source:PresentationSource,clientRole:boolean,signal?:AbortSignal) {
 const response=await apiFetch(sourcePaths(source).metadata,{cache:'no-store',signal});
 if(!response.ok)throw new Error('No pudimos abrir este informe.');
 return metadataFrom(source,await response.json(),clientRole);
}
export async function presentationDownload(source:PresentationSource,clientRole:boolean) {
 await presentationMetadata(source,clientRole);
 const response=await apiFetch(sourcePaths(source).file,{cache:'no-store'});
 if(!response.ok)throw new Error('No pudimos descargar este informe.');
 const blob=await response.blob();
 const url=URL.createObjectURL(blob),anchor=document.createElement('a');
 anchor.href=url;anchor.download='informe.pdf';document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
