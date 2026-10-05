'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {audit} from '@/lib/audit/client';
import {label} from '@/lib/audit/model';
import type {ExactRevision} from '@/lib/audit/model';
import './audit.css';
const titles:Record<string,string>={content:'Contenido',conclusion:'Conclusión',executions:'Procedimientos',evidence:'Evidencia',samples:'Muestra y cobertura',findings:'Hallazgos',condition:'Condición',criterion:'Criterio',reason:'Fundamento',status:'Estado',comment:'Comentario',source:'Fuente',value:'Valor',amount:'Importe',currency:'Moneda',purpose:'Propósito',evaluation:'Evaluación',fields:'Campos',items:'Elementos',coverage:'Cobertura',selected:'Seleccionado',key:'Clave',code:'Procedimiento',target:'Elemento',completion:'Ejecución',outcome:'Resultado',complete:'Completo',assertion:'Declaración profesional'};
const extra:Record<string,string>={base:'Base de cobertura',method:'Método',state:'Estado',values:'Valores',origin:'Origen',classification:'Clasificación',reference:'Referencia',title:'Concepto',date:'Fecha',reviewed_amount:'Importe revisado',reviewed_count:'Elementos revisados',reviewed_count_percentage:'Porcentaje de elementos revisados',reviewed_coverage_percentage:'Cobertura del importe revisado',selected_amount:'Importe seleccionado',selected_count:'Elementos seleccionados',selected_count_percentage:'Porcentaje de elementos seleccionados',selected_coverage_percentage:'Cobertura del importe seleccionado',universe_amount:'Importe del universo',universe_count:'Elementos del universo',DECLARED_MATERIALIZED_CASE_UNIVERSE:'Universo declarado de expedientes',MANUAL:'Manual',HUMAN_ASSERTION:'Declaración del auditor',HUMAN_ASSERTION_REQUIRED:'Requiere declaración del auditor',AUTOMATICALLY_DEMONSTRABLE:'Demostrable con las fuentes',timestamp:'Fecha de registro',fields:'Campos',value:'Valor',reason:'Fundamento'};
function display(value:string){const translated=label(value);return titles[value]||extra[value]||(translated==='Sin clasificación disponible'?value:translated);}
const technical=new Set(['ref','source_ref','execution_ref','evidence_ref','author','confirmed_by','actor_ref','material_fingerprint','decision_material_fingerprint','fingerprint','contract','seal','signature','assertion_authentic','target','selection_contract']);
function Material({value}:{value:unknown}){
 if(value===null||value===undefined)return <span>No determinado</span>;
 if(typeof value!=='object')return <span>{typeof value==='boolean'?(value?'Sí':'No'):display(String(value))}</span>;
 if(Array.isArray(value))return <ul>{value.map((v,n)=><li key={n}><Material value={v}/></li>)}</ul>;
 return <dl>{Object.entries(value).filter(([k])=>!technical.has(k)).map(([k,v])=><div key={k}><dt>{display(k)}</dt><dd><Material value={v}/></dd></div>)}</dl>;
}
export default function ExactRevisionScreen({reference,revision,from}:{reference:string;revision:string;from:string|null}){
 const [row,setRow]=useState<ExactRevision|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;audit.exactRevision(reference,revision).then(r=>{if(r.ref!==reference||r.revision_ref!==revision)throw new Error('La revisión solicitada no está disponible.');if(active)setRow(r);}).catch(e=>{if(active){setRow(null);setError(e.message);}});return()=>{active=false;};},[reference,revision]);
 const back=from&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(from)?from:null;
 return <section className="audit">{back&&<Link href={`/panel/auditoria/${back}`}>Volver a A-21</Link>}{error&&<p role="alert">No se puede entregar la revisión exacta solicitada. {error}</p>}{!row&&!error&&<p role="status">Consultando revisión exacta…</p>}{row&&<>
 <h1>{row.code} · Revisión {row.number}</h1>
 <div className="audit-banner" role="status">{row.historical?`Revisión histórica ${row.number} · Ya no vigente`:`Revisión exacta ${row.number} · Actual`}.{back&&` Estás viendo la revisión ${row.number} utilizada por A-21.`}{row.has_later_revision&&' Existe una revisión posterior.'}</div>
 <p>Estado registrado en esta revisión: {label(row.status_at_revision)}. Este estado histórico no acredita vigencia actual.</p>
 {row.events.some(e=>e.decision==='AUTHORIZE')&&<p>Autorizada en su momento.</p>}
 <Link href={`/panel/auditoria/${row.ref}`}>Ver revisión actual</Link>
 <details><summary>Identidad de la revisión consultada</summary><code>{row.revision_ref}</code></details>
 {['conclusion','content','samples','executions','evidence','findings'].map(k=><section key={k}><h2>{titles[k]}</h2><Material value={row.snapshot[k]}/></section>)}
 <section><h2>Historial de esta revisión</h2>{row.events.map((e,n)=><p key={n}>{label(e.decision)} · {e.actor} · {e.timestamp} · {e.reason}</p>)}</section>
 <p>Consulta de sólo lectura. Esta vista no habilita descargas de archivos históricos.</p>
 </>}</section>;
}
