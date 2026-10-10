'use client';
import {useEffect,useState} from 'react';
import {request,object,rows,text,type Row} from './client';
import styles from './Books.module.css';
import {bookLabel,bookDisplay} from '../../lib/books-contract';
import FiscalReturn from './FiscalReturn';
export default function FiscalHandoff({invoiceRef}:{invoiceRef:string}){
 const [data,setData]=useState<Row|null>(null),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();request(`billing-handoff/${invoiceRef}/`,undefined,c.signal).then(setData).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[invoiceRef]);
 return <section className={styles.card}><h2>Captura manual en SAT</h2><p>CAROVA prepara datos internos. El timbrado lo realiza el usuario fuera de CAROVA en el servicio SAT. No hay PAC ni certificación automática.</p>{error&&<p role="alert">{error}</p>}{data&&<><p>{bookLabel(data.state)} · {text(data.notice)}</p><div className={styles.grid}>{[['issuer','Emisor'],['receiver','Receptor']].map(([key,label])=><div key={key}><h3>{label}</h3><dl>{Object.entries(object(data[key])).filter(([name])=>name!=='identity_ref').map(([name,value])=><div key={name}><dt>{bookLabel(name)}</dt><dd>{bookDisplay(value)}</dd></div>)}</dl></div>)}</div><p>Fecha {text(data.date)} · Serie {text(data.series)} · Folio {text(data.folio)} · Total {text(data.total)} {text(data.currency)}</p><p>Método {text(data.payment_method)} · Forma {text(data.payment_form)}</p><ul>{rows(data.lines).map((line,i)=><li key={i}>{text(line.description)} · {text(line.quantity)} {text(line.unit)} · Precio {text(line.unit_price)} · Subtotal {text(line.subtotal)}</li>)}</ul><button type="button" onClick={()=>window.print()}>Imprimir datos para captura</button><FiscalReturn targetRef={invoiceRef} kind='invoice'/></>}</section>;
}
