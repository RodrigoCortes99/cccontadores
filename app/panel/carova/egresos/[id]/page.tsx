import Workspace from '../Workspace';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Workspace initialCase={Number(id)} />;}
