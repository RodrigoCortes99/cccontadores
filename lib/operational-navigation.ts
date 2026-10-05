export type Destination={label:string;href:string;hint?:string};
export const operationalNavigation:{label:string;items:Destination[]}[]=[
  {label:'Tu espacio',items:[{label:'Inicio',href:'/panel'},{label:'Clientes',href:'/panel/clientes'}]},
  {label:'Operación',items:[{label:'Documentos',href:'/panel/documentos'},{label:'Egresos',href:'/panel/carova/egresos'},{label:'Bancos',href:'/panel/operacion/bancos',hint:'Selecciona un periodo para conciliar'},{label:'IVA',href:'/panel/operacion/iva',hint:'Selecciona un periodo para revisar IVA'},{label:'Contabilidad',href:'/panel/operacion/contabilidad',hint:'Selecciona un periodo para preparar pólizas'}]},
  {label:'Control',items:[{label:'Auditoría',href:'/panel/encargos'},{label:'Pendientes',href:'/panel/trabajo'}]},
  {label:'Administración',items:[{label:'Facturación',href:'/panel/facturacion'},{label:'Nómina',href:'/panel/nomina'},{label:'Horas',href:'/panel/time-tracking'}]},
  {label:'Sistema',items:[{label:'Configuración',href:'/panel/configuracion'},{label:'Conectividad',href:'/panel/configuracion/conectividad'}]},
];
// Presentation only: every destination retains its server-side permission checks.
export function navigationForActor(user:CurrentUser|null){
  if(!user||user.role==='client')return [];
  return operationalNavigation.map(group=>({...group,items:[...group.items]}));
}
export function operationalActive(path:string,section:string|null=null):string {
  if(path.startsWith('/panel/carova/egresos')){const contextual:Record<string,string>={'Bancos / Conciliación':'/panel/operacion/bancos',IVA:'/panel/operacion/iva',Contabilidad:'/panel/operacion/contabilidad'};if(section&&contextual[section])return contextual[section];}
  if(path.startsWith('/panel/auditoria'))return '/panel/encargos';
  const all=operationalNavigation.flatMap(g=>g.items).sort((a,b)=>b.href.length-a.href.length);
  return all.find(d=>path===d.href||d.href!=='/panel'&&path.startsWith(d.href+'/'))?.href||'';
}
import type {CurrentUser} from './roles';
