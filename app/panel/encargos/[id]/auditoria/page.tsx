'use client';
import {useParams} from 'next/navigation';
import ContextScreen from '@/components/audit/ContextScreen';
export default function Page(){const {id}=useParams<{id:string}>();return <ContextScreen reference={id}/>;}
