import ReportPresentation from '@/components/presentation/ReportPresentation';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 return <ReportPresentation source={{kind:'documentos',ref:id}}/>;
}
