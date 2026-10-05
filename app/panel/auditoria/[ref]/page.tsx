'use client';
import {useParams} from 'next/navigation';
import PaperScreen from '@/components/audit/PaperScreen';
export default function Page(){const {ref}=useParams<{ref:string}>();return <PaperScreen reference={ref}/>;}
