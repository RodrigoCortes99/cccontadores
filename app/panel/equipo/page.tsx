import {Suspense} from 'react';
import Platform from '../../../components/panel/Platform';
export default function Page(){return <Suspense fallback={<p>Cargando…</p>}><Platform mode="team"/></Suspense>;}
