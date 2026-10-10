"use client";

import {formErrorMessage} from '@/lib/formErrors';
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, apiForm, apiJson } from "../../../lib/api";
import { usePanelUser } from "../../../lib/PanelUserContext";
import type { CurrentUser } from "../../../lib/roles";
import { readable, stateLabel, locationLabel, findingText, findingTitle, amountDifference, errorText, activityLabels, supervisionReasons } from "./presentation";
import styles from "./page.module.css";
import Expenses, { ExpenseComparison, ExpenseAssociations, type ExpensePaper } from "./Expenses";

type Scope = { organization_id: number; client_id?: number; engagement_id?: number };
type ContextOption = { id: number; nombre: string; cliente_id: number; cliente__name: string };
type Job = { id: number; agent: string; status: string; error_code: string; duration_ms: number };
type Doc = { id: number; name: string; version: number; kind: string; case_reference: string; mime: string };
type Source = { id: number; document_id: number; document_name: string; document_version: number; locator: string; snippet: string; document_sha256: string };
type Field = { id: number; field_name: string; proposed_value: string; corrected_value: string | null; confidence: number; source: Source };
type Finding = { id: number; category: string; description: string; classification: string; evidence: Source[] };
type History = { id: number; action: string; reviewed_by_id: number; created_at: string; changes: unknown; reason: string };
type Proposal = { workpaper?: ExpensePaper; id: number; reference: string; status: string; revision: number; extractions: Field[]; findings: Finding[]; history: History[] };
type Center = { documents: number; processed_documents: number; pending_review: number; exceptions: number; approved: number; rejected: number; failures: number; policy_blocks: number; processing_ms_mean: number | null; review_seconds: number | null; corrections: number; provider: string; provider_status: string; jobs: Job[]; agents: { slug: string; name: string; enabled: boolean }[] };
type Chat = { truncated?: boolean; status: string; count: number; warning: string; scope: Scope; items: { proposal_id: number; reference: string; status: string; findings: { category: string; description: string; sources: number[] }[] }[]; sources: { id: number; document: string; version: number; locator: string; snippet: string }[] };
type Page<T> = { results: T[]; next: string | null; count: number };
type Flags = { enabled: boolean; organization_id: number | null; chat: boolean; processing: boolean; reconciliation: boolean };
type Activity = { id: number; action: string; success: boolean; created_at: string; metadata: { status?: string }; user_id: number };
type Supervision = { items: { id: number; reasons: string[] }[]; warning?: string; truncated?: boolean };
type Draft = { edits: Record<string, string>; reason: string; revision: number };
const suggestions = ['¿Qué documentos faltan?', '¿Qué casos necesitan mi revisión?', '¿Qué diferencias encontraste?', '¿Cómo va el avance?', 'Genera un resumen del encargo.'];
const dateLabel = (value: string) => new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

async function read<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(formErrorMessage(data));
  return data as T;
}

function Comparison({ proposal, showSource }: { proposal: Proposal; showSource: (source: Source) => void }) {
  const totals = proposal.extractions.filter(f => f.field_name === 'total');
  const currencies = new Set(proposal.extractions.filter(f => f.field_name === 'moneda').map(f => f.proposed_value));
  const difference = currencies.size <= 1 && proposal.findings.some(f => f.category === 'amount_difference') ? amountDifference(totals.map(f => f.proposed_value)) : null;
  if (!totals.length) return null;
  return <div className={styles.comparison}>
    {totals.map(f => <div key={f.id}><small>{f.source.document_name}</small><strong>{f.proposed_value}</strong><span>Total encontrado{(() => { const currency = proposal.extractions.find(value => value.field_name === 'moneda' && value.source.document_id === f.source.document_id)?.proposed_value; return currency ? ` · ${currency}` : ' · moneda según el documento'; })()}</span>{f.corrected_value !== null && <span>Corrección guardada: <strong>{f.corrected_value || 'Sin dato'}</strong></span>}<button onClick={() => showSource(f.source)}>Ver fuente</button></div>)}
    {difference !== null && <div className={styles.difference}><small>Diferencia entre importes</small><strong>{difference}</strong><span>{totals.length > 2 ? 'Entre el mayor y el menor total original' : 'Entre los dos totales originales'}</span></div>}
  </div>;
}

export default function CarovaPage() {
  const { user } = usePanelUser();
  return user ? <CarovaWorkspace key={`${user.id}:${user.organization_id}:${user.client_id}:${user.role}`} user={user} /> : <p role="status">Cargando tu espacio de trabajo…</p>;
}

function CarovaWorkspace({ user }: { user: CurrentUser }) {
  const [flags, setFlags] = useState<Flags | null>(null);
  const [contexts, setContexts] = useState<ContextOption[]>([]);
  const [contextReady, setContextReady] = useState(false);
  const [client, setClient] = useState('');
  const [selection, setSelection] = useState('');
  const [tab, setTab] = useState('center');
  const [center, setCenter] = useState<Center | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [messages, setMessages] = useState<{ question: string; answer: Chat }[]>([]);
  const [question, setQuestion] = useState('');
  const [audit, setAudit] = useState<Activity[]>([]);
  const [policies, setPolicies] = useState<unknown>(null);
  const [supervision, setSupervision] = useState<Supervision | null>(null);
  const [clientSupervision, setClientSupervision] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [filter, setFilter] = useState('needs_review');
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [agent, setAgent] = useState('egresos');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [retry, setRetry] = useState(0);
  const epoch = useRef(0);
  const openedAt = useRef(0);
  const drafts = useRef(new Map<string, Draft>());
  const activeRequest = useRef<AbortController | null>(null);
  const sourceDialog = useRef<HTMLDialogElement>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const org = user.organization_id ?? (user.role === 'client' ? flags?.organization_id : null);
  const canReview = user.is_superuser || ['manager', 'partner'].includes(user.role ?? '');
  const internal = user.role !== 'client' || user.is_superuser;
  const clients = Array.from(new Map(contexts.map(c => [c.cliente_id, c.cliente__name])).entries());
  const option = contexts.find(c => String(c.id) === selection && String(c.cliente_id) === client);
  const scope: Scope | null = org && option ? { organization_id: org, client_id: option.cliente_id, engagement_id: option.id } : null;
  const query = scope ? new URLSearchParams(Object.entries(scope).map(([k, v]) => [k, String(v)])).toString() : '';
  const clientName = clients.find(([id]) => String(id) === client)?.[1] ?? 'Selecciona un cliente';
  const draftKey = (id: number) => `${query}:${id}`;
  const terminal = proposal && ['approved', 'rejected'].includes(proposal.status);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch('/api/carova/status/', { signal: controller.signal }).then(r => read<Flags>(r)).then(setFlags).catch(e => { if (!controller.signal.aborted) setError(String(e)); });
    try { setOnboarding(localStorage.getItem(`carova-welcome:${user.id}`) !== 'done'); } catch { setOnboarding(true); }
    return () => controller.abort();
  }, [user.id, retry]);

  useEffect(() => {
    if (!flags?.enabled || !org) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ organization_id: String(org) });
    if (user.client_id) params.set('client_id', String(user.client_id));
    apiFetch(`/api/carova/contexts/?${params}`, { signal: controller.signal }).then(r => read<ContextOption[]>(r)).then(data => {
      if (controller.signal.aborted) return;
      setContexts(data);
      const initial = new URLSearchParams(window.location.search).get('encargo');
      const selected = data.find(c => String(c.id) === initial);
      if (initial && !selected) setError('El encargo solicitado no está disponible. Selecciona uno de los encargos autorizados para tu cuenta.');
      if (selected) { setClient(String(selected.cliente_id)); setSelection(String(selected.id)); setTab('chat'); }
      else if (new Set(data.map(c => c.cliente_id)).size === 1) setClient(String(data[0].cliente_id));
      setContextReady(true);
    }).catch(e => { if (!controller.signal.aborted) setError(String(e)); });
    return () => controller.abort();
  }, [org, user.client_id, flags?.enabled, retry]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (drafts.current.size) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); activeRequest.current?.abort(); };
  }, []);

  useEffect(() => {
    if (source && !sourceDialog.current?.open) sourceDialog.current?.showModal();
    else if (!source) sourceDialog.current?.close();
  }, [source]);

  const load = useCallback(async () => {
    activeRequest.current?.abort();
    if (!flags?.enabled || !query || !contextReady) return;
    const controller = new AbortController(); activeRequest.current = controller;
    const signal = controller.signal, current = epoch.current;
    setLoading(true); setError('');
    const get = <T,>(endpoint: string) => apiFetch(`/api/carova/${endpoint}`, { signal }).then(r => read<T>(r));
    try {
      if (tab === 'center' || tab === 'progress') {
        const [summary, pending] = await Promise.all([get<Center>(`center/?${query}`), tab === 'center' ? get<Page<Proposal>>(`proposals/?${query}&status=needs_review`) : Promise.resolve(null)]);
        if (signal.aborted || current !== epoch.current) return;
        setCenter(summary);
        if (pending) {
          const details = await Promise.all(pending.results.slice(0, 3).map(p => get<Proposal>(`proposals/${p.id}/?${query}`)));
          if (!signal.aborted && current === epoch.current) setProposals(details);
        }
      } else if (tab === 'review') {
        // The API pages by 30. Display and enrich only six cases at a time (no polling).
        const apiPage = Math.ceil(page / 5), offset = ((page - 1) % 5) * 6;
        const result = await get<Page<Proposal>>(`proposals/?${query}&page=${apiPage}${filter ? `&status=${filter}` : ''}`);
        const details = await Promise.all(result.results.slice(offset, offset + 6).map(p => get<Proposal>(`proposals/${p.id}/?${query}`)));
        if (signal.aborted || current !== epoch.current) return;
        setProposals(details); setHasNext(result.results.length > offset + 6 || !!result.next);
      } else if (tab === 'documents') {
        const result = await get<Page<Doc>>(`documents/?${query}&page=${page}`);
        if (signal.aborted || current !== epoch.current) return;
        setDocs(result.results); setHasNext(!!result.next);
      } else if (canReview && tab === 'audit') {
        const result = await get<Page<Activity>>(`audit/?${query}&page=${page}`);
        if (signal.aborted || current !== epoch.current) return;
        setAudit(result.results); setHasNext(!!result.next);
      } else if (canReview && tab === 'policies') {
        const [result, summary] = await Promise.all([get<unknown>(`policies/?${query}`), get<Center>(`center/?${query}`)]);
        if (signal.aborted || current !== epoch.current) return;
        setPolicies(result); setCenter(summary);
        const events = await get<Page<Activity>>(`audit/?${query}&page=${page}`);
        if (!signal.aborted && current === epoch.current) { setAudit(events.results); setHasNext(!!events.next); }
      } else if (canReview && tab === 'supervisor' && clientSupervision) {
        const params = new URLSearchParams(query); params.delete('engagement_id');
        const result = await get<Supervision>(`supervisor/?${params}`);
        if (signal.aborted || current !== epoch.current) return;
        setSupervision(result);
      }
    } catch (e) { if (!signal.aborted && current === epoch.current) setError(String(e)); }
    finally { if (!signal.aborted && current === epoch.current) setLoading(false); }
  }, [flags?.enabled, query, contextReady, tab, page, filter, canReview, clientSupervision]);

  useEffect(() => { void load(); return () => activeRequest.current?.abort(); }, [load]);

  function keepDraft(nextEdits = edits, nextReason = reason) {
    if (!proposal) return;
    if (Object.keys(nextEdits).length || nextReason) drafts.current.set(draftKey(proposal.id), { edits: nextEdits, reason: nextReason, revision: proposal.revision });
    else drafts.current.delete(draftKey(proposal.id));
  }
  function resetView() {
    keepDraft(); epoch.current += 1; activeRequest.current?.abort();
    setProposal(null); setSource(null); setPage(1); setError(''); setNotice(''); setLoading(false);
  }
  function navigate(next: string) { if (next === tab) { keepDraft(); setProposal(null); setSource(null); return; } resetView(); setTab(next); setProposals([]); setDocs([]); setAudit([]); setPolicies(null); }
  function changeScope(nextClient: string, nextSelection: string) {
    resetView(); setClient(nextClient); setSelection(nextSelection); setMessages([]); setQuestion('');
    setCenter(null); setDocs([]); setProposals([]); setSelectedDocs([]); setSupervision(null); setClientSupervision(false); setAudit([]); setPolicies(null);
    const url = new URL(window.location.href); url.searchParams.delete('encargo'); window.history.replaceState(null, '', url);
  }
  async function action(work: () => Promise<void>) {
    const current = epoch.current; setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (e) { if (current === epoch.current) setError(String(e)); }
    finally { setBusy(false); }
  }
  async function openProposal(id: number) {
    keepDraft();
    await action(async () => {
      const current = epoch.current;
      const data = await read<Proposal>(await apiFetch(`/api/carova/proposals/${id}/?${query}`));
      if (current !== epoch.current) return;
      const draft = drafts.current.get(draftKey(id));
      setProposal(data); setEdits(draft?.edits ?? {}); setReason(draft?.reason ?? ''); setCorrecting(!!draft); setSource(null);
      if (draft) setNotice(draft.revision !== data.revision ? 'El caso cambió desde tu última visita. Conservamos tus cambios sin guardar; compáralos con los datos actuales antes de guardarlos.' : 'Recuperamos tus cambios sin guardar en esta sesión.');
      openedAt.current = Date.now();
      requestAnimationFrame(() => { reviewHeading.current?.focus(); reviewHeading.current?.scrollIntoView({ block: 'start' }); });
    });
  }
  async function decide(decision: 'correct' | 'approve' | 'reject') {
    if (!proposal || !scope) return;
    await action(async () => {
      const current = epoch.current;
      const data = await read<Proposal>(await apiJson(`/api/carova/proposals/${proposal.id}/`, 'POST', { ...scope, action: decision, revision: proposal.revision, ...(decision === 'correct' ? { changes: edits } : {}), reason, review_seconds: Math.min(86400, Math.round((Date.now() - openedAt.current) / 1000)) }));
      if (current !== epoch.current) return;
      drafts.current.delete(draftKey(proposal.id)); setProposal(data); setEdits({}); setReason(''); setCorrecting(false);
      openedAt.current = Date.now(); setNotice(decision === 'correct' ? 'Correcciones guardadas. Revisa los datos y marca Correcto cuando termines.' : decision === 'approve' ? 'Caso marcado como correcto. La decisión quedó en el historial.' : 'Caso rechazado. La decisión quedó en el historial.');
      await load();
    });
  }
  async function openEvidence(id: number) {
    await action(async () => { const current = epoch.current; const data = await read<Source>(await apiFetch(`/api/carova/sources/${id}/?${query}`)); if (current === epoch.current) setSource(data); });
  }
  async function downloadSource(s: Source) {
    await action(async () => {
      const response = await apiFetch(`/api/carova/documents/${s.document_id}/file/?${query}`);
      if (!response.ok) { await read(response); return; }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = s.document_name; link.click(); URL.revokeObjectURL(url);
    });
  }
  async function ask() {
    if (!question.trim() || !scope) return;
    await action(async () => {
      const current = epoch.current, asked = question.trim();
      const answer = await read<Chat>(await apiJson('/api/carova/chat/', 'POST', { ...scope, question: asked }));
      if (current !== epoch.current) return;
      setMessages(previous => [...previous.slice(-9), { question: asked, answer }]); setQuestion('');
    });
  }
  const showSource = (s: Source) => setSource(s);
  const cards = (items: Proposal[]) => <div className={styles.caseList}>{items.map(p => <article key={p.id} className={styles.caseCard}>
    <div className={styles.row}><h3>{p.reference}</h3><span className={styles.badge}>{stateLabel(p.status)}</span></div>
    <p>{p.findings[0] ? findingText(p.findings[0]) : 'Revisa los datos extraídos y confirma que corresponden al documento.'}</p>
    {p.findings.some(f => f.category === 'amount_difference') && <Comparison proposal={p} showSource={showSource} />}
    {p.findings.length > 1 && <small>{p.findings.length - 1} observaciones adicionales dentro del caso.</small>}
    {p.history.some(h => h.action === 'correct') && <small>Corregido · {stateLabel(p.status)}</small>}
    <button disabled={busy} className={styles.primary} onClick={() => void openProposal(p.id)}>Revisar caso <span aria-hidden="true">→</span></button>
  </article>)}</div>;

  if (flags?.enabled === false) return <section className={styles.page}><h1>Operación documental</h1><p>La operación documental no está habilitada para este entorno. Consulta al administrador para activarla.</p><a href="/panel">Volver al panel del despacho</a></section>;
  return <section className={styles.page}>
    <header className={styles.header}><div><h1>Operación documental</h1><p className={styles.subtitle}>Revisa documentos y consulta sus fuentes.</p><a href="/panel/carova/assistant">Consultar al asistente →</a></div><span className={styles.badge}>Tú tienes la última palabra</span></header>
    {onboarding && <aside className={styles.welcome}><div><h2>Revisar documentos, con claridad.</h2><p>La revisión documental ayuda a detectar diferencias; tú decides qué es correcto.</p><ol><li>Selecciona un cliente y encargo.</li><li>Sube los documentos y solicita su revisión.</li><li>Comprueba los casos y sus fuentes.</li></ol></div><button onClick={() => { try { localStorage.setItem(`carova-welcome:${user.id}`, 'done'); } catch { /* No private data is persisted. */ } setOnboarding(false); }}>Entendido</button></aside>}
    <div className={styles.context} aria-label="Cliente y encargo de trabajo">
      <label>Cliente<select value={client} disabled={busy || !contextReady} onChange={e => changeScope(e.target.value, '')}><option value="">Selecciona un cliente</option>{clients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>Encargo<select value={selection} disabled={busy || !client || !contextReady} onChange={e => changeScope(client, e.target.value)}><option value="">Selecciona un encargo</option>{contexts.filter(c => String(c.cliente_id) === client).map(c => <option key={c.id} value={c.id}>{c.nombre || 'Encargo sin nombre'}</option>)}</select></label>
      <p>{option ? (tab === 'supervisor' && clientSupervision ? 'Supervisión del cliente. Los registros de tiempo no están asociados a un encargo.' : 'Todo lo que ves corresponde a este cliente y encargo.') : 'Elige dónde trabajar para ver documentos y pendientes.'}</p>
    </div>
    <nav className={styles.tabs} aria-label="Secciones de operación documental">{process.env.NEXT_PUBLIC_CAROVA_DOCUMENT_INTELLIGENCE === "true" && <a href="/panel/carova/documentos">Biblioteca documental</a>}{[['center', 'Inicio'], ['review', 'Pendientes'], ['documents', 'Documentos'], ['expenses', 'Egresos'], ['chat', 'Consultar al asistente']].map(([id, label]) => <button key={id} disabled={busy} aria-current={tab === id ? 'page' : undefined} onClick={() => navigate(id)}>{label}</button>)}
      {canReview && <details className={styles.more}><summary>Más opciones</summary><div>{[['supervisor', 'Supervisión'], ['audit', 'Historial'], ['policies', 'Configuración avanzada']].map(([id, label]) => <button key={id} disabled={busy} aria-current={tab === id ? 'page' : undefined} onClick={e => { navigate(id); e.currentTarget.closest('details')?.removeAttribute('open'); }}>{label}</button>)}</div></details>}
    </nav>
    {scope && <p className={styles.contextReadout}>{clientName} <span aria-hidden="true"> / </span> {tab === 'supervisor' && clientSupervision ? 'Supervisión de todos los registros del cliente' : option?.nombre}</p>}
    {error && <div role="alert" className={styles.error}><p>{error.startsWith('El encargo solicitado') ? error : errorText(error)}</p><button disabled={busy || loading} onClick={() => { if (!contextReady) { setError(''); setRetry(n => n + 1); } else void load(); }}>Volver a intentar</button>{canReview && <details><summary>Detalles técnicos</summary><pre>{error}</pre></details>}</div>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {flags && !org ? <div className={styles.empty}><h2>Selecciona una organización activa</h2><p>Elige la organización en el panel o consulta con el administrador.</p></div> : !flags || (!contextReady && !error) ? <p role="status">Preparando tu espacio de trabajo…</p> : !scope && <div className={styles.empty}><h2>{contexts.length ? 'Empecemos por el encargo' : 'No hay encargos disponibles'}</h2><p>{contexts.length ? 'Selecciona el cliente y luego el encargo en los campos de arriba.' : 'Pide al responsable del despacho que te asigne un encargo para comenzar.'}</p>{!org && <p>Selecciona una organización activa en el panel.</p>}</div>}
    {scope && <>
      {!proposal && <>
        {tab === 'center' && <>
          <div className={styles.sectionHeading}><div><h2>Hola, {user.username}. ¿Qué quieres hacer?</h2><p>Trabajemos en {option?.nombre}.</p></div></div>
          <div className={styles.actionGrid}>{[
            ['documents', '01', 'Revisar documentos', 'Sube y selecciona los documentos que se deben revisar.'],
            ['chat', '02', 'Consultar al asistente', 'Consulta la información de este cliente y encargo.'],
            ['review', '03', 'Ver pendientes', 'Comprueba diferencias, faltantes y datos por confirmar.'],
            ['progress', '04', 'Ver avance', 'Consulta lo procesado y lo que falta por revisar.'],
          ].map(([id, number, title, description]) => <button key={id} disabled={busy} onClick={() => navigate(id)}><span className={styles.actionNumber}>{number}</span><strong>{title}</strong><span>{description}</span><b aria-hidden="true">↗</b></button>)}</div>
        </>}
        {['center', 'progress'].includes(tab) && center && <>
          <article className={styles.panel}><div className={styles.sectionHeading}><h2>Estado del encargo</h2><button disabled={busy || loading} onClick={() => void load()}>Actualizar avance</button></div>
            <p className={styles.progressTitle}><strong>{center.processed_documents} de {center.documents}</strong> documentos procesados</p>
            <progress value={center.processed_documents} max={Math.max(1, center.documents)} aria-label="Documentos procesados" />
            <div className={styles.metrics}><div><strong>{Math.max(0, center.documents - center.processed_documents)}</strong><span>documentos por procesar</span></div><div><strong>{center.pending_review}</strong><span>casos por revisar</span></div><div><strong>{center.approved}</strong><span>casos marcados como correctos</span></div></div>
            <p className={styles.muted}>Un caso puede reunir varios documentos. Los casos y los documentos se cuentan por separado.</p>
            <button disabled={busy} onClick={() => navigate('review')}>Ver casos por revisar →</button>
          </article>
          {tab === 'center' && <><div className={styles.sectionHeading}><h2>Pendientes que necesitan atención</h2><button onClick={() => navigate('review')}>Ver todos</button></div>{cards(proposals)}{!loading && !proposals.length && <div className={styles.empty}><h3>{center.pending_review ? 'Hay datos listos para tu confirmación' : 'No hay casos pendientes de revisión'}</h3><p>{center.pending_review ? 'Abre Pendientes para revisar las coincidencias y confirmar los datos.' : center.documents ? 'Puedes consultar las decisiones anteriores en Pendientes o subir más documentos.' : 'Sube los documentos del encargo para comenzar.'}</p><button onClick={() => { if (center.pending_review) setFilter('proposed'); navigate(center.pending_review ? 'review' : 'documents'); }}>{center.pending_review ? 'Ver pendientes' : 'Ver documentos'}</button></div>}</>}
          {tab === 'progress' && <article className={styles.panel}><h2>Procesamientos recientes</h2>{center.jobs.length ? center.jobs.map(j => <div className={styles.historyItem} key={j.id}><strong>{readable(j.agent)}</strong><span>{stateLabel(j.status)}</span>{j.error_code && <p className={styles.error}>{errorText(j.error_code)}</p>}</div>) : <p>Todavía no se ha solicitado una revisión. Selecciona documentos para comenzar.</p>}<p>{center.corrections} correcciones guardadas · {center.rejected} casos rechazados</p><button onClick={() => navigate('documents')}>Ir a documentos</button></article>}
        </>}
        {tab === 'expenses' && <Expenses key={query} query={query} scope={scope} canProcess={internal && !!flags?.processing} onOpen={id => void openProposal(id)} onBusy={setBusy} />}
        {tab === 'documents' && <>
          <div className={styles.sectionHeading}><div><h2>Documentos del encargo</h2><p>Relaciona los archivos de un mismo caso con la misma referencia.</p></div><button disabled={loading || busy} onClick={() => void load()}>Actualizar</button></div>
          {internal && !flags?.processing && <p className={styles.notice}>El procesamiento de documentos está deshabilitado. Consulta al administrador para habilitarlo.</p>}
          {internal && flags?.processing && <details className={styles.panel} open={docs.length === 0 || undefined}><summary>Subir documentos</summary><form className={styles.upload} onSubmit={e => { e.preventDefault(); const form = e.currentTarget; void action(async () => { const body = new FormData(form); Object.entries(scope).forEach(([k, v]) => body.set(k, String(v))); const result = await read<{ duplicate: boolean }>(await apiForm('/api/carova/documents/', 'POST', body)); setNotice(result.duplicate ? 'Este documento ya estaba disponible; conservamos el archivo existente.' : 'Documento recibido. Selecciónalo abajo y pulsa Revisar documentos para procesarlo.'); form.reset(); await load(); }); }}>
            <label>Referencia del caso<input name="reference" required maxLength={100} placeholder="Por ejemplo: Póliza 034" /></label><label>Tipo de documento<select name="kind">{['poliza', 'cfdi', 'comprobante', 'plantilla', 'estado_cuenta', 'auxiliar', 'nomina'].map(k => <option key={k} value={k}>{readable(k)}</option>)}</select></label><label>Archivo · máximo 10 MB<input name="file" type="file" accept=".pdf,.xml,.xlsx,.csv,.txt" required /></label><button disabled={busy} className={styles.primary}>Subir documento</button>
          </form></details>}
          {!loading && !docs.length && <div className={styles.empty}><h3>Todavía no hay documentos</h3><p>{internal ? 'Abre Subir documentos para agregar los archivos del encargo.' : 'Pide al responsable del encargo que agregue los documentos para comenzar.'}</p></div>}
          {docs.length > 0 && <div className={styles.table}><table><thead><tr>{internal && <th>Revisar</th>}<th>Documento</th><th>Caso</th><th>Estado</th></tr></thead><tbody>{docs.map(d => <tr key={d.id}>{internal && <td><input disabled={busy} aria-label={`Seleccionar ${d.name}`} type="checkbox" checked={selectedDocs.includes(d.id)} onChange={e => setSelectedDocs(previous => e.target.checked ? [...previous, d.id] : previous.filter(id => id !== d.id))} /></td>}<td><strong>{d.name}</strong><small>{readable(d.kind)} · Versión {d.version}</small></td><td>{d.case_reference}</td><td>{d.mime === 'application/octet-stream' ? 'Pendiente de procesar' : 'Procesado'}</td></tr>)}</tbody></table></div>}
          {internal && flags?.processing && <div className={styles.actions}><label>Tipo de revisión<select value={agent} disabled={busy} onChange={e => setAgent(e.target.value)}>{['egresos', 'conciliacion', 'nomina', 'fiscal', 'auditor'].map(a => <option key={a} value={a} disabled={a === 'conciliacion' && !flags.reconciliation}>{readable(a)}</option>)}</select></label><button className={styles.primary} disabled={busy || !selectedDocs.length || (agent === 'conciliacion' && !flags.reconciliation)} onClick={() => void action(async () => { await read(await apiJson('/api/carova/jobs/', 'POST', { ...scope, document_ids: selectedDocs, agent })); setNotice('Revisión solicitada. Consulta Ver avance para comprobar cuándo termina el procesamiento.'); setSelectedDocs([]); })}>Revisar documentos ({selectedDocs.length})</button><button onClick={() => navigate('progress')}>Ver avance</button></div>}
        </>}
        {tab === 'review' && <><div className={styles.sectionHeading}><div><h2>Pendientes de revisión</h2><p>Comprueba las fuentes antes de decidir. También puedes consultar casos ya revisados.</p></div><button disabled={busy || loading} onClick={() => void load()}>Actualizar</button></div><label className={styles.filter}>Mostrar<select value={filter} disabled={busy || loading} onChange={e => { setFilter(e.target.value); setPage(1); setProposals([]); }}>{[['', 'Todos los casos'], ['needs_review', 'Diferencias y correcciones por revisar'], ['proposed', 'Datos por confirmar'], ['approved', 'Correctos'], ['rejected', 'Rechazados']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{cards(proposals)}{!loading && !proposals.length && <div className={styles.empty}><h3>No hay casos con este filtro</h3><p>Prueba otro estado o revisa si hay documentos pendientes de procesar.</p><button onClick={() => navigate('documents')}>Ver documentos</button></div>}</>}
        {tab === 'chat' && <article className={styles.panel}><h2>Consultar al asistente</h2><p className={styles.chatContext}>{clientName} · {option?.nombre}</p><p>El asistente responderá únicamente con la información de este cliente y encargo.</p>
          {!flags?.chat ? <p>Las consultas están deshabilitadas. Contacta al administrador.</p> : <>
            <div className={styles.suggestions}>{suggestions.map(s => <button disabled={busy} key={s} onClick={() => setQuestion(s)}>{s}</button>)}</div>
            <div className={styles.conversation} aria-live="polite">{messages.map((message, index) => <div key={index}><p className={styles.question}><strong>Tú</strong><br />{message.question}</p><div className={styles.answer}><span className={styles.badge}>BORRADOR</span><p>{message.answer.count} casos encontrados. Revisa las fuentes antes de utilizar esta respuesta.</p><p className={styles.muted}>La respuesta se limita a los casos registrados en Carova; no confirma que el expediente esté completo.</p>{message.answer.items.map(item => <div className={styles.historyItem} key={item.proposal_id}><button disabled={busy} onClick={() => void openProposal(item.proposal_id)}>{item.reference} →</button><span>{stateLabel(item.status)}</span>{item.findings.map((f, i) => <div key={i}><p>{findingText(f)}</p>{f.sources.map(id => { const s = message.answer.sources.find(s => s.id === id); return s ? <details key={id}><summary>{s.document} · {locationLabel(s.locator)}</summary><blockquote>{s.snippet}</blockquote></details> : null; })}</div>)}</div>)}{!message.answer.items.length && <p>No hay casos registrados que respondan a esta consulta. Revisa los documentos o prueba otra pregunta.</p>}<details><summary>Fuentes consultadas ({message.answer.sources.length})</summary>{message.answer.sources.map(s => <div className={styles.historyItem} key={s.id}><strong>{s.document}</strong><p>{locationLabel(s.locator)}</p><blockquote>{s.snippet}</blockquote></div>)}</details><p className={styles.muted}>{message.answer.warning.replaceAll('propuestas', 'casos').replaceAll('este alcance', 'este cliente y encargo')}</p>{message.answer.truncated && <p>Se muestran hasta 30 casos. Consulta Pendientes para revisar el resto.</p>}<p className={styles.muted}>Este borrador no envía ni ejecuta acciones.</p></div></div>)}</div>
            <form onSubmit={e => { e.preventDefault(); void ask(); }}><label>Tu pregunta<textarea placeholder="¿Qué necesitas saber del encargo?" value={question} maxLength={2000} onChange={e => setQuestion(e.target.value)} disabled={busy} /></label><button className={styles.primary} disabled={busy || !question.trim()}>Preguntar</button></form>
          </>}
        </article>}
        {canReview && tab === 'supervisor' && <article className={styles.panel}><h2>Supervisión del despacho</h2><p>Los registros de tiempo corresponden al cliente, sin vínculo a un encargo.</p>{!clientSupervision ? <><p>Para consultarlos, cambia explícitamente a la supervisión de <strong>{clientName}</strong>.</p><button onClick={() => setClientSupervision(true)}>Ver registros de este cliente</button></> : <><p className={styles.notice}>Mostrando registros de {clientName} · Todos sus encargos. Las demás secciones conservan el encargo seleccionado.</p>{supervision?.items.map(item => <div className={styles.historyItem} key={item.id}><h3>Registro de tiempo para revisar</h3>{item.reasons.map(r => <p key={r}>{supervisionReasons[r] ?? 'Este registro necesita revisión.'}</p>)}<small>Requiere revisión humana.</small></div>)}{supervision && !supervision.items.length && <p>No hay observaciones en los registros consultados.</p>}{supervision?.truncated && <p>Se muestran los registros dentro del límite de consulta. Consulta Control de horas para revisar el resto.</p>}<a href="/panel/time-tracking">Abrir Control de horas</a></>}</article>}
        {canReview && tab === 'audit' && <article className={styles.panel}><h2>Historial de actividad</h2><p>Consultas, revisiones y decisiones registradas para este encargo.</p>{audit.map(a => <div className={styles.historyItem} key={a.id}><div className={styles.row}><strong>{activityLabels[a.action] ?? 'Actividad de Carova'}</strong><time dateTime={a.created_at}>{dateLabel(a.created_at)}</time></div><p>{a.success ? 'Registrada' : 'No completada'}{a.metadata?.status ? ` · ${stateLabel(a.metadata.status)}` : ''}</p></div>)}{!loading && !audit.length && <p>Todavía no hay actividad registrada para este encargo.</p>}</article>}
        {canReview && tab === 'policies' && <article className={styles.panel}><h2>Configuración avanzada</h2><p>Información para la administración de Carova. Los permisos se validan en el servidor.</p>{center && <><h3>Modelo local</h3><p>{center.provider} · {center.provider_status}</p><h3>Procesamientos y mediciones</h3><p>Duración media: {center.processing_ms_mean ?? 'Sin medición'} ms · Tiempo de revisión: {center.review_seconds ?? 'Sin medición'} s</p><details><summary>Estado técnico del servicio y agentes</summary><pre>{JSON.stringify(center, null, 2)}</pre></details></>}<details><summary>Políticas y permisos efectivos</summary><pre>{JSON.stringify(policies, null, 2)}</pre></details><details><summary>Registro técnico de actividad · Página {page}</summary><pre>{JSON.stringify(audit, null, 2)}</pre></details><button disabled={loading || busy} onClick={() => void load()}>Actualizar configuración</button><button disabled={busy} onClick={() => navigate('audit')}>Consultar historial</button></article>}
        {['documents', 'review', 'audit', 'policies'].includes(tab) && <div className={styles.pagination}><button disabled={page === 1 || busy || loading} onClick={() => { setPage(p => p - 1); setSelectedDocs([]); }}>Anterior</button><span>Página {page}</span><button disabled={!hasNext || busy || loading} onClick={() => { setPage(p => p + 1); setSelectedDocs([]); }}>Siguiente</button></div>}
      </>}
      {proposal && <article className={styles.panel}>
        <button disabled={busy} onClick={() => { keepDraft(); setProposal(null); setSource(null); }}>← Volver</button>
        <div className={styles.sectionHeading}><h2 ref={reviewHeading} tabIndex={-1}>{proposal.reference}</h2><span className={styles.badge}>{proposal.workpaper?.decision_certificate ? stateLabel(proposal.workpaper.decision_certificate.decision) : stateLabel(proposal.status)}</span></div>
        {proposal.workpaper?.decision_certificate ? <p className={styles.notice}>{proposal.workpaper.decision_certificate.decision === 'ENGINE_ABSTAINED' ? 'Carova no pudo determinar este caso con suficiente evidencia.' : stateLabel(proposal.workpaper.decision_certificate.decision)}. {proposal.workpaper.decision_certificate.human_assisted && 'Contiene intervención humana; no es AUTO_CLEAR automático.'} Una excepción técnica del lote no demuestra un error contable de esta póliza. Solo se evalúan las comprobaciones offline del arquetipo indicado; no se afirma corrección fiscal general.</p> : <p className={styles.notice}>Resultado histórico sin certificado positivo. No equivale a AUTO_CLEAR.</p>}
        <h3>Qué encontró Carova</h3>{proposal.findings.length ? proposal.findings.map(f => <div className={styles.finding} key={f.id}><strong>{findingTitle[f.category] ?? 'Dato por revisar'}</strong><p>{findingText(f)}</p>{f.evidence.length > 0 && <details><summary>Ver fuentes de esta observación ({f.evidence.length})</summary>{f.evidence.map(s => <button key={s.id} onClick={() => showSource(s)}>Ver fuente: {s.document_name} · {locationLabel(s.locator)}</button>)}</details>}</div>) : <p>Hay datos extraídos para comprobar. No se registraron observaciones en esta revisión.</p>}
        <p>Comprueba los datos con el archivo original. Las observaciones corresponden al procesamiento original; las correcciones quedan registradas por separado.</p>
        <h3>Datos comparados</h3>{proposal.workpaper?.row ? <><ExpenseComparison paper={proposal.workpaper} onSource={id => void openEvidence(id)} /><ExpenseAssociations paper={proposal.workpaper} onSource={id => void openEvidence(id)} /></> : <Comparison proposal={proposal} showSource={showSource} />}
        <h3>Documentos utilizados</h3><div className={styles.actions}>{Array.from(new Map([...proposal.extractions.map(f => f.source), ...proposal.findings.flatMap(f => f.evidence)].map(s => [s.document_id, s])).values()).map(s => <button key={s.document_id} onClick={() => showSource(s)}>{s.document_name} · Ver fuente</button>)}</div>
        <details open={correcting || undefined}><summary>{correcting ? 'Corregir datos encontrados' : 'Ver todos los datos encontrados'}</summary><div className={styles.table}><table><thead><tr><th>Dato</th><th>Encontrado</th><th>Corrección guardada</th>{correcting && <th>Nuevo valor</th>}<th>Documento</th></tr></thead><tbody>{proposal.extractions.map(f => <tr key={f.id}><td>{readable(f.field_name)}</td><td>{f.proposed_value || 'Sin dato'}</td><td>{f.corrected_value ?? 'Sin corrección'}</td>{correcting && <td><input maxLength={1000} aria-label={`Corregir ${readable(f.field_name)} en ${f.source.document_name}`} value={edits[f.id] ?? f.corrected_value ?? f.proposed_value} disabled={busy || !canReview || !!terminal} onChange={e => { const next = { ...edits }; if (e.target.value === (f.corrected_value ?? f.proposed_value)) delete next[f.id]; else next[f.id] = e.target.value; setEdits(next); keepDraft(next, reason); }} /></td>}<td><button onClick={() => showSource(f.source)}>{f.source.document_name} · Ver fuente</button></td></tr>)}</tbody></table></div></details>
        <h3>Tu decisión</h3>{canReview && !terminal ? <><p>Marca Correcto cuando hayas comprobado los datos. Esto registra tu revisión; no modifica la contabilidad.</p><label>Nota de revisión (opcional)<textarea value={reason} maxLength={500} disabled={busy} onChange={e => { setReason(e.target.value); keepDraft(edits, e.target.value); }} /></label><div className={styles.actions}><button className={styles.primary} disabled={busy || !!Object.keys(edits).length} onClick={() => void decide('approve')}>Correcto</button><button disabled={busy} onClick={() => setCorrecting(true)}>Corregir</button>{correcting && <button disabled={busy || !Object.keys(edits).length} onClick={() => void decide('correct')}>Guardar correcciones</button>}<button disabled={busy} onClick={() => { keepDraft(); setProposal(null); setNotice('Puedes volver a este caso desde Pendientes. Tus cambios sin guardar se conservan mientras permanezcas en Carova.'); }}>Revisar después</button></div>{Object.keys(edits).length > 0 && <p className={styles.notice}>Hay cambios sin guardar. Guarda las correcciones antes de marcar Correcto.</p>}<details><summary>Otras decisiones</summary><p>Rechazar cierra este caso como rechazado. Para dejarlo pendiente, usa Revisar después.</p><button disabled={busy || !!Object.keys(edits).length} onClick={() => void decide('reject')}>Rechazar caso</button></details></> : <p>{terminal ? 'Este caso ya tiene una decisión final. Puedes consultar sus fuentes y su historial.' : 'Puedes consultar los datos y las fuentes. La persona responsable del encargo registra la decisión.'}</p>}
        <h3>Historial de este caso</h3>{proposal.history.length ? proposal.history.map(h => <div className={styles.historyItem} key={h.id}><strong>{activityLabels[h.action] ?? 'Revisión registrada'}</strong><time dateTime={h.created_at}>{dateLabel(h.created_at)}</time>{h.reason && <p>{h.reason}</p>}</div>) : <p>Aún no se han registrado decisiones.</p>}
        {canReview && <details><summary>Detalles técnicos de la revisión</summary><pre>{JSON.stringify(proposal, null, 2)}</pre></details>}
      </article>}
      {(loading || busy) && <p role="status" className={styles.loading}>{busy ? 'Guardando o consultando información…' : 'Cargando información del encargo…'}</p>}
    </>}
    <dialog ref={sourceDialog} className={styles.sourceDialog} onCancel={() => setSource(null)} onClose={() => setSource(null)} aria-labelledby="source-title">
      {source && <><div className={styles.sectionHeading}><h2 id="source-title">Fuente del dato</h2><button onClick={() => setSource(null)}>Cerrar fuente</button></div><p className={styles.muted}>{clientName} · {option?.nombre}</p><h3>Documento</h3><p>{source.document_name} · Versión {source.document_version}</p><h3>Ubicación</h3><p>{locationLabel(source.locator)}</p><h3>Dato encontrado</h3><blockquote>{source.snippet}</blockquote>{error && <p role="alert" className={styles.error}>{errorText(error)}</p>}<button className={styles.primary} disabled={busy} onClick={() => void downloadSource(source)}>Descargar archivo original</button>{canReview && <details><summary>Detalles técnicos de la fuente</summary><pre>{JSON.stringify(source, null, 2)}</pre></details>}</>}
    </dialog>
  </section>;
}
