import {Suspense} from "react";
import Administration from "../Administration";
export default function Page(){return <Suspense fallback={<p role="status">Cargando clientes…</p>}><Administration/></Suspense>;}
