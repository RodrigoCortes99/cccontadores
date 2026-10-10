import Link from 'next/link';
import ModulePeriods from '../../../../components/panel/ModulePeriods';
export default function Page(){return <><p><Link href="/panel/libros">Abrir libros nativos: catálogo, pólizas y balanza →</Link></p><ModulePeriods title="Contabilidad" section="Contabilidad" description="Prepara pólizas con evidencia, propuestas y revisión humana." limitation="La preparación no contabiliza ni autoriza pólizas automáticamente. Requiere reglas declaradas."/></>;}
