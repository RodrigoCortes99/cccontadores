'use client';
import {useParams} from 'next/navigation';
import {Suspense} from 'react';
import BillingScreen from '../../../../../components/billing/BillingScreen';
export default function Page(){const params=useParams();return <Suspense fallback={<p>Cargando…</p>}><BillingScreen section="collection" entityRef={String(params.collectionRef)}/></Suspense>;}
