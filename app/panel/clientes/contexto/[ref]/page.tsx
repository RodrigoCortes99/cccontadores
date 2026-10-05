import OperationalHome from '../../../../../components/panel/OperationalHome';
export default async function Page({params}:{params:Promise<{ref:string}>}){const {ref}=await params;return <OperationalHome clientContextRef={ref}/>;}
