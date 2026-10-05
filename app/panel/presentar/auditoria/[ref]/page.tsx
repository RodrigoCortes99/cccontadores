import ReportPresentation from '@/components/presentation/ReportPresentation';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{ref:string}>}) {
 const {ref}=await params;
 return <ReportPresentation source={{kind:'auditoria',ref}}/>;
}
