'use client';
import Image from 'next/image';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {usePanelUser} from '@/lib/PanelUserContext';
import {apiFetch} from '@/lib/api';
import {presentationMetadata,presentationDownload} from '@/lib/presentation/client';
import {sourcePaths,nextPage,pageKey,rangeTotal,fullscreenChange,validSource} from '@/lib/presentation/model';
import type {PresentationSource,PresentationMetadata} from '@/lib/presentation/model';
import {readPageText} from '@/lib/presentation/text';
import type {PDFDocumentProxy,PDFDocumentLoadingTask,RenderTask} from 'pdfjs-dist';
import s from './presentation.module.css';

export default function ReportPresentation({source}:{source:PresentationSource}) {
 const {user}=usePanelUser(),router=useRouter(),client=user?.role==='client';
 const [meta,setMeta]=useState<PresentationMetadata|null>(null),[pdf,setPdf]=useState<PDFDocumentProxy|null>(null);
 const [page,setPage]=useState(1),[started,setStarted]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[text,setText]=useState(''),[fullscreen,setFullscreen]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null),frame=useRef<HTMLDivElement>(null),root=useRef<HTMLDivElement>(null),task=useRef<PDFDocumentLoadingTask|null>(null),render=useRef<RenderTask|null>(null);
 const [size,setSize]=useState({width:800,height:650});
 const kind=source.kind,reference=source.ref;
 const clear=useCallback(()=>{render.current?.cancel();void task.current?.destroy();setPdf(null);setMeta(null);setText('');setError('No pudimos abrir este informe.');},[]);
 useEffect(()=>{
  const ctl=new AbortController();let alive=true;const current={kind,ref:reference};
  setMeta(null);setPdf(null);setPage(1);setStarted(false);setError('');setNotice('');setText('');setBusy(false);
  void(async()=>{
   try {
    const metadata=await presentationMetadata(current,client,ctl.signal);if(!alive)return;setMeta(metadata);
    const lib=await import('pdfjs-dist/build/pdf.mjs');
    lib.GlobalWorkerOptions.workerSrc='/pdfjs/6.4.299/pdf.worker.min.mjs';
    const response=await apiFetch(sourcePaths(current).file,{cache:'no-store',signal:ctl.signal,headers:{Range:'bytes=0-65535'}});
    if(!response.ok)throw new Error('delivery');
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(!alive)return;
    const length=response.status===206?rangeTotal(response.headers.get('Content-Range'),bytes.length):null;
    if(response.status===206&&!length)throw new Error('range');
    const options={isEvalSupported:false,enableXfa:false,cMapUrl:'/pdfjs/6.4.299/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/6.4.299/standard_fonts/',wasmUrl:'/pdfjs/6.4.299/wasm/'};
    if(length&&length>bytes.length) {
     const transport=new lib.PDFDataRangeTransport(length,bytes,true);
     transport.requestDataRange=(begin:number,end:number)=>{void(async()=>{
      try {
       const r=await apiFetch(sourcePaths(current).file,{cache:'no-store',signal:ctl.signal,headers:{Range:`bytes=${begin}-${end-1}`}});
       if(r.status!==206||r.headers.get('Content-Range')!==`bytes ${begin}-${end-1}/${length}`)throw new Error('range');
       const chunk=new Uint8Array(await r.arrayBuffer());if(chunk.length!==end-begin)throw new Error('range');
       if(alive)transport.onDataRange(begin,chunk);
      }catch{if(alive)clear();}
     })();};
     transport.abort=()=>ctl.abort();
     task.current=lib.getDocument({...options,range:transport,disableAutoFetch:true,disableStream:true,rangeChunkSize:65536});
    }else task.current=lib.getDocument({...options,data:bytes});
    const document=await task.current.promise;if(alive)setPdf(document);
   }catch{if(alive)clear();}
  })();
  return()=>{alive=false;ctl.abort();render.current?.cancel();void task.current?.destroy();};
 },[kind,reference,client,clear]);

 useEffect(()=>{const el=frame.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(el);return()=>observer.disconnect();},[started]);
 useEffect(()=>{
  if(!pdf||!started||!canvas.current)return;
  let alive=true;const ctl=new AbortController();
  void(async()=>{
   try {
    setBusy(true);
    await presentationMetadata({kind,ref:reference},client,ctl.signal);
    const p=await pdf.getPage(page);if(!alive||!canvas.current)return;
    const previous=render.current;
    if(previous){previous.cancel();await previous.promise.catch(()=>{});}
    if(!alive||!canvas.current)return;
    const viewport=p.getViewport({scale:1});
    if(!Number.isFinite(viewport.width)||!Number.isFinite(viewport.height)||viewport.width<=0||viewport.height<=0)throw new Error('page');
    const scale=Math.min(Math.max(1,size.width-32)/viewport.width,Math.max(1,size.height-24)/viewport.height);
    const view=p.getViewport({scale}),ratio=Math.min(window.devicePixelRatio||1,2),c=canvas.current;
    c.width=Math.ceil(view.width*ratio);c.height=Math.ceil(view.height*ratio);c.style.width=`${view.width}px`;c.style.height=`${view.height}px`;
    render.current=p.render({canvas:c,viewport:view,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});
    await render.current.promise;
    const content=await readPageText(p.streamTextContent(),()=>alive);
    if(alive)setText(content);
   }catch(e){if(alive&&!(e instanceof Error&&e.name==='RenderingCancelledException'))clear();}
   finally{if(alive)setBusy(false);}
  })();
  return()=>{alive=false;ctl.abort();render.current?.cancel();};
 },[pdf,page,started,size,kind,reference,client,clear]);

 useEffect(()=>{if(started)frame.current?.focus();},[started]);
 const exit=useCallback(()=>{if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});router.push(meta?.returnPath??(client?'/panel/documentos':kind==='documentos'&&validSource({kind,ref:reference})?`/panel/documentos/${reference}`:'/panel/encargos'));},[router,meta,client,kind,reference]);
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{
   const focused=event.target instanceof Element&&!!event.target.closest('button,input,textarea,select,a,[contenteditable="true"]');
   if(event.key==='Escape'){
    if(event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    event.preventDefault();if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});else exit();return;
   }
   if(focused)return;
   const delta=pageKey(event.key,focused);if(delta&&pdf&&started){event.preventDefault();setPage(p=>nextPage(p,delta,pdf.numPages));}
  };
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[exit,pdf,started]);
 useEffect(()=>{const change=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',change);return()=>document.removeEventListener('fullscreenchange',change);},[]);
 useEffect(()=>{const check=()=>{void presentationMetadata({kind,ref:reference},client).catch(clear);};window.addEventListener('focus',check);return()=>window.removeEventListener('focus',check);},[kind,reference,client,clear]);
 async function toggleFullscreen(){if(!await fullscreenChange(document,root.current))setNotice('La pantalla completa no está disponible. Puedes continuar en esta ventana.');}
 async function download(){try{await presentationDownload({kind,ref:reference},client);}catch{clear();}}
 const back=client?'Volver a mis documentos':'Volver al expediente';
 return <div className={s.presentation} ref={root}>
  <header className={s.header}><Image src="/logo-cc-transparente.png" alt="CC Contadores" width={156} height={49} priority/><div className={s.identity}><span>CC Contadores</span><h1>{meta?.title??'Presentar informe'}</h1></div><button type="button" onClick={exit}>Salir</button></header>
  {error?<section className={s.cover} role="alert"><h2>No pudimos abrir este informe.</h2><p>Vuelve a tus documentos para comprobar que el informe siga disponible.</p><button type="button" onClick={exit}>{back}</button></section>:!pdf?<section className={s.cover} role="status"><p>Preparando informe…</p></section>:!started?<section className={s.cover}><Image src="/logo-cc-transparente.png" alt="CC Contadores" width={260} height={82}/><h2>{meta?.title}</h2>{meta?.client&&<p>{meta.client}</p>}{meta?.period&&<p>{meta.period}</p>}<p>{pdf.numPages} páginas · PDF</p><button type="button" className={s.primary} onClick={()=>setStarted(true)}>Comenzar presentación</button><button type="button" onClick={exit}>{back}</button></section>:<>
   <div className={s.page} ref={frame} tabIndex={0} aria-label="Informe; usa las flechas para cambiar de página"><canvas ref={canvas} role="img" aria-label={`${meta?.title}, página ${page} de ${pdf.numPages}`}/><p className={s.srText}>{text}</p>{busy&&<span className={s.preparing} role="status">Preparando página…</span>}</div>
   <nav className={s.controls} aria-label="Presentación"><button type="button" disabled={page===1} onClick={()=>setPage(p=>nextPage(p,-1,pdf.numPages))}>← Anterior</button><span aria-live="polite" aria-atomic="true">Página {page} de {pdf.numPages}</span><button type="button" disabled={page===pdf.numPages} onClick={()=>setPage(p=>nextPage(p,1,pdf.numPages))}>Siguiente →</button><button type="button" onClick={toggleFullscreen}>{fullscreen?'Salir de pantalla completa':'Pantalla completa'}</button>{meta?.download&&<button type="button" onClick={download}>Descargar PDF</button>}</nav>
  </>}
  {notice&&<p className={s.notice} role="status">{notice}</p>}
 </div>;
}
