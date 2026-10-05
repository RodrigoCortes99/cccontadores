"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, apiForm, apiJson } from '../../../lib/api';
import { errorText, locationLabel, stateLabel } from './presentation';
import styles from './page.module.css';

export type ExpenseRow = { decision?: string; certificate_hash?: string; human_assisted?: boolean; id: number; number: string; date: string | null; supplier: string | null; rfc: string | null; uuid: string; policy_amount: string | null; invoice_amount: string | null; paid_amount: string | null; policy_invoice_difference: string | null; invoice_payment_difference: string | null; state: string; observation: string; human_review: string; documents: string[]; missing: string[]; finding_count: number; is_policy: boolean };
export type ExpensePaper = {
  decision_certificate?: { decision: string; human_assisted: boolean; rule_pack_version: string; archetype_id: string; canonical_result_hash: string; scope_statement: string; checks_not_performed: string[] };
  row: ExpenseRow;
  calculations: Record<string, { formula: string; value: string | null; inputs: { value: string | null; source_ids: number[] }[] }>;
  records: { key: string; document_name: string; kind: string; classification: { kind: string; confidence: number; source_id: number }; association: { score: number; status: string; reasons: { reason: string; sources: number[] }[]; candidates?: { reference: string; score: number }[] }; fields: Record<string, { value: string; source_id: number; locator: string }> }[];
};
type Job = { id: number; status: string; created_at: string; error_code: string };
type ResponseData = { job: Job | null; jobs: Job[]; count: number; has_next: boolean; summary: { policies: number; clear: number; needs_review: number; missing: number; approved: number; unassigned: number }; results: ExpenseRow[] };
const kindLabels: Record<string, string> = { POLIZA:'Póliza', CFDI_XML:'CFDI XML', CFDI_PDF:'CFDI PDF', COMPROBANTE_PAGO:'Comprobante de pago', ESTADO_CUENTA:'Estado de cuenta', AUXILIAR:'Auxiliar', FACTURA:'Factura', RECIBO:'Recibo', SOPORTE:'Soporte', DESCONOCIDO:'Desconocido' };
async function read<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(data)}`);
  return data as T;
}
const amount = (value: string | null) => value === null ? 'Sin dato' : value;

export function ExpenseComparison({ paper, onSource }: { paper: ExpensePaper; onSource: (id: number) => void }) {
  return <><div className={styles.comparison}>{[['policy', 'Póliza'], ['invoice', 'CFDI XML (suma)'], ['payment', 'Pago (suma)'], ['policy_invoice', 'Diferencia póliza / CFDI'], ['invoice_payment', 'Diferencia CFDI / pago']].map(([key, label]) => <div key={key}><small>{label}</small><strong>{amount(paper.calculations[key]?.value ?? null)}</strong><details><summary>Cómo se obtuvo</summary><p>{key.includes('_') ? 'Diferencia absoluta entre los totales de los documentos indicados.' : 'Suma de los importes disponibles. No se incluyen representaciones PDF como otra factura.'}</p>{paper.calculations[key]?.inputs.map((input, index) => <p key={index}>{amount(input.value)} {input.source_ids.map(id => <button key={id} onClick={() => onSource(id)}>Ver fuente original</button>)}</p>)}</details></div>)}</div><p className={styles.muted}>Los cálculos usan los valores corregidos guardados cuando existen. No convierten monedas.</p></>;
}

export function ExpenseAssociations({ paper, onSource }: { paper: ExpensePaper; onSource: (id: number) => void }) {
  return <><h3>Por qué se relacionaron los documentos</h3>{paper.records.map(r => <details key={r.key}><summary>{r.document_name} · {kindLabels[r.kind] ?? 'Por clasificar'}</summary><p>Clasificación basada en señales del contenido; requiere comprobación con la evidencia. <button onClick={() => onSource(r.classification.source_id)}>Ver evidencia</button></p><p>{r.association.status === 'associated' || r.association.status === 'anchor' ? `Puntuación de asociación: ${r.association.score}/100. Es una puntuación de señales, no una probabilidad.` : 'Asociación pendiente de confirmación; el importe no se asignó a otra póliza.'}</p>{r.association.reasons.map((reason, index) => <p key={index}>{reason.reason} {reason.sources.map(id => <button key={id} onClick={() => onSource(id)}>Ver fuente</button>)}</p>)}{r.association.status === 'ambiguous' && r.association.candidates?.map(c => <p key={c.reference}>Candidata: {c.reference} · {c.score}/100</p>)}</details>)}<details><summary>Ubicaciones de los datos del papel de trabajo</summary>{paper.records.flatMap(r => Object.entries(r.fields).map(([name, field]) => <p key={`${r.key}:${name}`}>{r.document_name} · {name.replaceAll('_', ' ')} · {locationLabel(field.locator)} <button onClick={() => onSource(field.source_id)}>Ver fuente</button></p>))}</details></>;
}

export default function Expenses({ scope, query, canProcess, onOpen, onBusy }: { scope: { organization_id: number; client_id?: number; engagement_id?: number }; query: string; canProcess: boolean; onOpen: (id: number) => void; onBusy: (busy: boolean) => void }) {
  const [data, setData] = useState<ResponseData | null>(null);
  const [jobId, setJobId] = useState('');
  const [filters, setFilters] = useState({ state:'', supplier:'', number:'', date_from:'', date_to:'' });
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploaded, setUploaded] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const controller = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const params = `${query}&${applied}&page=${page}${jobId ? `&job_id=${jobId}` : ''}`;
  useEffect(() => { onBusy(working); return () => onBusy(false); }, [working, onBusy]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; controller.current?.abort(); }; }, []);
  const load = useCallback(async () => {
    controller.current?.abort(); const c = new AbortController(); controller.current = c; setLoading(true); setError('');
    try { const result = await read<ResponseData>(await apiFetch(`/api/carova/egresos/?${params}`, { signal:c.signal })); if (!c.signal.aborted) setData(result); }
    catch (e) { if (!c.signal.aborted) setError(String(e)); }
    finally { if (!c.signal.aborted) setLoading(false); }
  }, [params]);
  useEffect(() => { void load(); return () => controller.current?.abort(); }, [load]);
  async function work(fn: () => Promise<void>) { setWorking(true); setError(''); try { await fn(); } catch (e) { if (alive.current) setError(String(e)); } finally { if (alive.current) setWorking(false); } }
  async function process(ids: number[], retry = false) {
    const job = await read<Job & { reused:boolean }>(await apiJson('/api/carova/egresos/jobs/', 'POST', { ...scope, document_ids:ids, retry }));
    if (!alive.current) return;
    setJobId(String(job.id));setPage(1);setNotice(job.reused ? 'Este conjunto ya se había recibido. Se conservan el procesamiento y sus decisiones, sin duplicar resultados.' : 'Procesamiento solicitado. El worker revisará los documentos; pulsa Actualizar para consultar el avance.');
    await load();
  }
  async function upload() {
    if (!files.length) return;
    await work(async () => {
      const ids: number[] = [], failed: string[] = [];
      for (let offset=0; offset<files.length; offset+=20) {
        if (!alive.current) return;
        const body = new FormData();Object.entries(scope).forEach(([k,v]) => body.set(k,String(v)));files.slice(offset,offset+20).forEach(file => body.append('files',file));
        const result = await read<{ documents:{ id?:number; name:string; error?:string }[] }>(await apiForm('/api/carova/egresos/documents/','POST',body));
        for (const item of result.documents) { if (item.id) ids.push(item.id); else failed.push(item.name); }
        setUploaded([...new Set(ids)]);setNotice(`Recibidos ${Math.min(offset+20,files.length)} de ${files.length} archivos.`);
      }
      setFiles([]);
      if (failed.length) { setError(`Archivos rechazados: ${failed.join(', ')}. Puedes procesar los archivos recibidos o corregir la carga.`); return; }
      await process([...new Set(ids)]);
    });
  }
  async function download(format: 'xlsx' | 'csv') {
    await work(async () => {
      const response = await apiFetch(`/api/carova/egresos/export/?${query}&${applied}&job_id=${data?.job?.id}&export_format=${format}`);
      if (!response.ok) { await read(response); return; }
      const url = URL.createObjectURL(await response.blob());const a=document.createElement('a');a.href=url;
      a.download=response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? `Carova_Egresos_BORRADOR.${format}`;a.click();URL.revokeObjectURL(url);
      setNotice(`Papel de trabajo exportado como borrador (${format.toUpperCase()}).`);
    });
  }
  return <>
    <div className={styles.sectionHeading}><div><h2>Egresos · Papel de trabajo</h2><p>Una fila por póliza. Los documentos sin asociación se muestran aparte y requieren revisión.</p></div><button disabled={working || loading} onClick={() => void load()}>Actualizar egresos</button></div>
    {canProcess && <details className={styles.panel}><summary>Cargar carpeta de egresos</summary><p>Hasta 500 archivos, 10 MB por archivo y 100 MB en total. Se aceptan PDF, XML, Excel, CSV y texto. La clasificación se obtiene del contenido.</p><label>Seleccionar archivos<input type="file" multiple accept=".pdf,.xml,.xlsx,.csv,.txt" disabled={working} onChange={e => setFiles(Array.from(e.target.files ?? []))} /></label><label>O seleccionar una carpeta<input type="file" multiple ref={element => { if (element) element.setAttribute('webkitdirectory', ''); }} disabled={working} onChange={e => { const all=Array.from(e.target.files ?? []); const accepted=all.filter(f=>/\.(pdf|xml|xlsx|csv|txt)$/i.test(f.name));setFiles(accepted);setNotice(`${accepted.length} archivos seleccionados. ${all.length-accepted.length} archivos de otros formatos omitidos.`); }} /></label><p>{files.length} archivos seleccionados.</p><button className={styles.primary} disabled={working || !files.length || files.length>500 || files.some(f=>f.size>10*1024*1024) || files.reduce((sum,f)=>sum+f.size,0)>100*1024*1024} onClick={() => void upload()}>Cargar y procesar egresos</button>{uploaded.length>0 && <button disabled={working} onClick={() => void work(() => process(uploaded))}>Procesar nuevamente los {uploaded.length} archivos recibidos</button>}</details>}
    {error && <p role="alert" className={styles.error}>{error.startsWith('Archivos rechazados') ? error : errorText(error)}</p>}{notice && <p role="status" className={styles.notice}>{notice}</p>}
    {data?.jobs.length ? <label>Procesamiento<select value={jobId || String(data.job?.id ?? '')} disabled={working} onChange={e => { setJobId(e.target.value);setPage(1); }}>{data.jobs.map(j=><option key={j.id} value={j.id}>{new Date(j.created_at).toLocaleString('es-MX')} · {stateLabel(j.status)}</option>)}</select></label> : null}
    {data?.job && <p className={styles.notice}>Estado del procesamiento: {stateLabel(data.job.status)}.{['pending','processing'].includes(data.job.status) && ' Actualiza cuando el worker termine. No necesitas mantener esta pantalla abierta.'}{data.job.error_code && ` ${errorText(data.job.error_code)}`}</p>}
    {data && <>
      <div className={styles.metrics}><div><strong>{data.summary.policies}</strong><span>pólizas procesadas</span></div><div><strong>{data.summary.clear}</strong><span>sin observaciones de las reglas</span></div><div><strong>{data.summary.needs_review}</strong><span>necesitan revisión</span></div><div><strong>{data.summary.missing}</strong><span>con información faltante</span></div><div><strong>{data.summary.approved}</strong><span>aprobadas por una persona</span></div><div><strong>{data.summary.unassigned}</strong><span>documentos sin póliza asociada</span></div></div>
      <p className={styles.muted}>Sin observaciones no significa aprobado. Los datos extraídos y las excepciones conservan sus fuentes.</p>
      <form className={styles.expenseFilters} onSubmit={e=>{e.preventDefault();setApplied(new URLSearchParams(filters).toString());setPage(1);}}><label>Estado<select value={filters.state} onChange={e=>setFilters({...filters,state:e.target.value})}>{['','SIN OBSERVACIONES','NECESITA REVISIÓN','FALTA INFORMACIÓN','CORREGIDO','APROBADO','RECHAZADO'].map(s=><option key={s} value={s}>{s || 'Todas'}</option>)}</select></label><label>Proveedor<input value={filters.supplier} onChange={e=>setFilters({...filters,supplier:e.target.value})} /></label><label>Número de póliza<input value={filters.number} onChange={e=>setFilters({...filters,number:e.target.value})} /></label><label>Desde<input type="date" value={filters.date_from} onChange={e=>setFilters({...filters,date_from:e.target.value})} /></label><label>Hasta<input type="date" value={filters.date_to} onChange={e=>setFilters({...filters,date_to:e.target.value})} /></label><button disabled={loading || working}>Aplicar filtros</button><button type="button" disabled={loading || working} onClick={()=>{setFilters({...filters,state:'pending'});setApplied(new URLSearchParams({...filters,state:'pending'}).toString());setPage(1);}}>Ver solo pendientes</button></form>
      <div className={styles.actions}><span>{data.count} casos con los filtros seleccionados</span><button disabled={working || !data.job || !['proposed','needs_review'].includes(data.job.status)} onClick={()=>void download('xlsx')}>Exportar XLSX · Borrador</button><button disabled={working || !data.job || !['proposed','needs_review'].includes(data.job.status)} onClick={()=>void download('csv')}>Exportar CSV · Borrador</button></div>
      {!data.results.length && !loading ? <div className={styles.empty}><h3>{data.job ? 'No hay filas con estos filtros' : 'Todavía no hay un papel de trabajo de egresos'}</h3><p>{data.job ? 'Prueba otro filtro o actualiza cuando termine el procesamiento.' : 'Carga una carpeta sintética para clasificar, asociar y revisar sus documentos.'}</p></div> : <div className={styles.table}><table><thead><tr>{['Póliza / documento','Fecha','Proveedor','Póliza','CFDI','Pago','Diferencia póliza / CFDI','Diferencia CFDI / pago','Estado'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{data.results.map(row=><tr key={row.id}><td><button disabled={working} onClick={()=>onOpen(row.id)}>{row.number}</button>{!row.is_policy && <small>Sin póliza asociada</small>}</td><td>{row.date?.slice(0,10) ?? 'Sin dato'}</td><td>{row.supplier ?? 'Sin dato'}</td><td>{amount(row.policy_amount)}</td><td>{amount(row.invoice_amount)}</td><td>{amount(row.paid_amount)}</td><td>{amount(row.policy_invoice_difference)}</td><td>{amount(row.invoice_payment_difference)}</td><td>{stateLabel(row.decision ?? "ENGINE_ABSTAINED")}<small>Revisión humana: {row.human_review}</small><small>{row.finding_count} observaciones</small></td></tr>)}</tbody></table></div>}
      <div className={styles.pagination}><button disabled={page===1 || loading || working} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page}</span><button disabled={!data.has_next || loading || working} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div>
    </>}
    {(loading || working) && <p role="status">{working ? 'Recibiendo o preparando documentos…' : 'Consultando el papel de trabajo…'}</p>}
  </>;
}
