import {Suspense} from "react";
import PayrollScreen from "../../../components/payroll/PayrollScreen";
export default function Page(){return <Suspense fallback={<p>Cargando Nómina…</p>}><PayrollScreen surface="home"/></Suspense>;}
