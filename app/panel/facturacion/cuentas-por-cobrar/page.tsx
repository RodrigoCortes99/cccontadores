import {Suspense} from 'react';
import BillingScreen from '../../../../components/billing/BillingScreen';
export default function Page(){return <Suspense fallback={<p>Cargando Facturación…</p>}><BillingScreen section="receivables"/></Suspense>;}
