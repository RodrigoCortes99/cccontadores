'use client';
import {useState} from 'react';
import Link from 'next/link';
import {usePanelUser} from '../../lib/PanelUserContext';
export default function Onboarding(){
 const {user}=usePanelUser();const [dismissed,setDismissed]=useState(false);
 const client=user?.role==='client';
 if(dismissed)return <button className="uxHelp" onClick={()=>setDismissed(false)}>Guía de primeros pasos</button>;
 return <details className="uxOnboarding"><summary>Primeros pasos · {client?'Tu portal':'Tu trabajo en CC Contadores'}</summary><ol>
  <li>Comprueba la organización y tu rol en la cabecera.</li>
  <li>{client?<Link href="/panel/pbc">Consulta tus solicitudes de información.</Link>:<Link href="/panel/clientes">Elige un cliente de tu alcance.</Link>}</li>
  <li>{client?<Link href="/panel/documentos">Entrega o consulta los documentos permitidos.</Link>:<>Abre un pendiente desde Inicio; sus fechas y responsables sólo aparecen cuando están registrados.</>}</li>
  {!client&&<li>Revisa la fuente y su vigencia antes de tomar una decisión en el módulo.</li>}
  <li>{client?'Consulta el estado de tu solicitud después de entregar.':<Link href="/panel/time-tracking/registros">Registra las horas trabajadas; las ejecuciones automáticas no cuentan como horas.</Link>}</li>
 </ol><p className="uxMuted">Los resultados son internos. No equivalen a presentación ni validación oficial.</p><button onClick={()=>setDismissed(true)}>Ocultar guía en esta visita</button></details>;
}
