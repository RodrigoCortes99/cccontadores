import {Suspense} from "react";
import PayrollScreen from "../../../../../components/payroll/PayrollScreen";
export default async function Page({params}:{params:Promise<{ref:string}>}){const {ref}=await params;return <Suspense fallback={<p>Cargando Nómina…</p>}><PayrollScreen key={ref} surface="import" resourceRef={ref}/></Suspense>;}
