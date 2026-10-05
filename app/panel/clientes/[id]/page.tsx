import {Suspense} from 'react';
import Platform from '../../../../components/panel/Platform';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Suspense fallback={<p>Cargando…</p>}><Platform mode="workspace" clientId={id}/></Suspense>;}
