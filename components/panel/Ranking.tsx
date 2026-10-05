'use client';
import Link from 'next/link';
import DataTable from './DataTable';
import ChartCard from './ChartCard';
import {reportLink,type ReportData} from '../../lib/platform';
export default function Ranking({data,query,onMetric}:{data:ReportData;query:string;onMetric:(value:string)=>void}){
 const r=data.ranking;
 if(!r.available)return null;
 return <section aria-label="Ranking de productividad"><div className="platformSectionHead"><h2>Ranking de productividad</h2><label>Métrica del ranking<select value={r.metric} onChange={e=>onMetric(e.target.value)}>{r.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label></div><p>Métrica: {r.label} · {r.population} empleados en el alcance seleccionado.</p><p className="platformMuted">{r.notice}</p><DataTable rows={r.rows} getRowKey={u=>u.id} columns={[
 {key:'position',header:'Posición',render:u=>u.position??'—'},
 {key:'employee',header:'Empleado',render:u=><Link href={reportLink(`/panel/equipo/${u.id}`,query,{employee_id:String(u.id),type:'employee'})}>{u.name}</Link>},
 {key:'activity',header:'Actividad efectiva',render:u=>u.activities},
 {key:'clients',header:'Clientes',render:u=>u.clients},{key:'periods',header:'Periodos',render:u=>u.periods_worked},
 {key:'resolved',header:'Resueltos',render:u=>u.resolved_pendings},{key:'open',header:'Abiertos · carga actual',render:u=>u.open_pendings},
 {key:'last',header:'Última actividad',render:u=>u.last_activity?new Date(u.last_activity).toLocaleDateString('es-MX'):'Sin actividad'}]}/>
 <ChartCard title="Actividad por empleado · hasta 20" points={r.rows.slice(0,20).map(u=>({label:u.name,value:u.activities}))} range={`${data.range.from} — ${data.range.to}`}/></section>;
}
