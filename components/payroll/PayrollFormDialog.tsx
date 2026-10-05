'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {rows,type Data,type Field,type FormSpec} from '../../lib/payroll/model';
import styles from './Payroll.module.css';

type Props={spec:FormSpec;busy:boolean;error:string;onClose:()=>void;onSubmit:(body:Data)=>Promise<void>};
export default function PayrollFormDialog({spec,busy,error,onClose,onSubmit}:Props){
  const dialog=useRef<HTMLDialogElement>(null);
  const [values,setValues]=useState<Data>(()=>Object.fromEntries(spec.fields.map(f=>[f.name,f.initial ?? (f.type==='records'||f.type==='refs'?[]:'')])));
  const [confirmed,setConfirmed]=useState(false);
  const update=(name:string,value:unknown)=>setValues(v=>({...v,[name]:value}));
  useEffect(()=>{const element=dialog.current;const previous=document.activeElement as HTMLElement|null;element?.showModal();return()=>{element?.close();previous?.focus();};},[]);
  function control(field:Field,value:unknown,change:(v:unknown)=>void,id:string){
    if(field.type==='records')return <fieldset><legend>{field.label}</legend>{rows(value).map((row,i)=><div className={styles.row} key={i}>{field.columns?.map(column=><label className={styles.field} key={column.name}>{column.label}{control(column,row[column.name] ?? '',v=>change(rows(value).map((r,n)=>n===i?{...r,[column.name]:v}:r)),`${id}-${i}-${column.name}`)}</label>)}<button type="button" className={styles.button} onClick={()=>change(rows(value).filter((_,n)=>n!==i))}>Retirar fila</button></div>)}<button type="button" className={styles.button} onClick={()=>change([...rows(value),{}])}>Añadir fila</button></fieldset>;
    if(field.type==='refs')return <fieldset><legend>{field.label}</legend>{field.options?.length?field.options.map(option=><label className={styles.check} key={option.value}><input type="checkbox" checked={Array.isArray(value)&&value.includes(option.value)} onChange={e=>change(e.target.checked?[...(Array.isArray(value)?value:[]),option.value]:(Array.isArray(value)?value:[]).filter(v=>v!==option.value))}/>{option.label}</label>):<p className={styles.empty}>No hay evidencia disponible.</p>}</fieldset>;
    if(field.type==='select')return <select id={id} required={field.required} value={typeof value==='string'?value:''} onChange={e=>change(e.target.value)}><option value="">Selecciona…</option>{field.options?.map(o=><option value={o.value} key={o.value}>{o.label}</option>)}</select>;
    if(field.type==='file')return <input id={id} type="file" accept=".json,application/json" required={field.required} onChange={e=>change(e.target.files?.[0])}/>;
    if(field.type==='textarea')return <textarea id={id} value={typeof value==='string'?value:''} required={field.required} maxLength={1000} onChange={e=>change(e.target.value)}/>;
    return <input id={id} type={field.type==='date'?'date':'text'} value={typeof value==='string'?value:''} required={field.required} maxLength={field.name==='name'?255:field.name==='source_reference'?500:field.name==='reason'?1000:200} onChange={e=>change(e.target.value)}/>;
  }
  async function submit(e:FormEvent){e.preventDefault();if(spec.confirmed&&!confirmed)return;const body:Data={...spec.fixed};
    for(const field of spec.fields){const value=values[field.name];if(value===''&&!field.required)continue;body[field.name]=field.type==='list'?(typeof value==='string'?value.split(',').map(v=>v.trim()).filter(Boolean):[]):value;}
    await onSubmit(body);
  }
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="payroll-dialog-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
    <h2 id="payroll-dialog-title">{spec.title}</h2><p className={styles.help}>Acción interna CAROVA. El servidor verifica permisos, material y vigencia.</p>
    <form className={styles.form} onSubmit={submit}><fieldset disabled={busy} className={styles.form} style={{border:0,padding:0}}>
      {spec.fields.map(field=><div className={styles.field} key={field.name}>{!['records','refs'].includes(field.type || '')&&<label htmlFor={`payroll-${field.name}`}>{field.label}</label>}{control(field,values[field.name],v=>update(field.name,v),`payroll-${field.name}`)}{field.help&&<span className={styles.help}>{field.help}</span>}</div>)}
      {spec.confirmed&&<label className={styles.check}><input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Confirmo el efecto de esta acción sobre el recurso seleccionado.</label>}
      {error&&<p className={styles.alert} role="alert">{error}</p>}
      <div className={styles.toolbar}><button type="submit" className={`${styles.button} ${styles.primary}`}>{busy?'Procesando…':spec.kind==='download'?'Descargar JSON interno':'Confirmar'}</button><button type="button" className={styles.button} disabled={busy} onClick={onClose}>Cancelar</button></div>
    </fieldset></form>
  </dialog>;
}
