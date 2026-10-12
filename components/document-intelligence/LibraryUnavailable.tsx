import Link from 'next/link';
import {DOCUMENT_LIBRARY_UNAVAILABLE} from '../../lib/document-intelligence';

export default function LibraryUnavailable({className}: {className?: string}) {
  return <section className={className} role="status">
    <h2>{DOCUMENT_LIBRARY_UNAVAILABLE.title}</h2>
    <p>{DOCUMENT_LIBRARY_UNAVAILABLE.description}</p>
    <Link className="cc-btn cc-btn--outline" href={DOCUMENT_LIBRARY_UNAVAILABLE.href}>Ir a Documentos PBC</Link>
  </section>;
}
