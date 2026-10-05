'use client';
import {useParams,useSearchParams} from 'next/navigation';
import ExactRevisionScreen from '@/components/audit/ExactRevisionScreen';
export default function Page(){const {ref,revision}=useParams<{ref:string;revision:string}>();const search=useSearchParams();return <ExactRevisionScreen key={ref+revision} reference={ref} revision={revision} from={search.get('from')}/>;}
