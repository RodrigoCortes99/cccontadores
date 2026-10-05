import {Suspense} from 'react';
import OperationalHome from '../../../components/panel/OperationalHome';
export default function Page(){return <Suspense fallback={<p>Cargando pendientes…</p>}><OperationalHome pendingOnly/></Suspense>;}
