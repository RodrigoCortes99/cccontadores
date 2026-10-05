'use client';
import {useParams} from 'next/navigation';
import {Suspense} from 'react';
import BillingScreen from '../../../../../components/billing/BillingScreen';
export default function Page(){const params=useParams();return <Suspense fallback={<p>Cargando…</p>}><BillingScreen section="invoice" entityRef={String(params.invoiceRef)}/></Suspense>;}
