import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const parent=read('../components/audit/PaperScreen.tsx');
const exact=read('../components/audit/ExactRevisionScreen.tsx');
const client=read('../lib/audit/client.ts');
test('Audit exact parent: A21 carries paper and exact revision with return link',()=>{
 assert.ok(parent.includes('href={`/panel/auditoria/${r.paper_ref}/revision/${r.revision_ref}?from=${p.ref}`}'));
 assert.ok(!parent.includes('href={`/panel/auditoria/${r.paper_ref}`}>Abrir A-20 fuente'));
 assert.ok(client.includes('revisions/${encodeURIComponent(revision)}/'));
});
test('Audit exact parent: historical identity is checked and current is explicit navigation',()=>{
 assert.match(exact,/r.ref!==reference\|\|r.revision_ref!==revision/);
 assert.match(exact,/Revisión histórica.*Ya no vigente/);
 assert.match(exact,/Existe una revisión posterior/);
 assert.match(exact,/Ver revisión actual/);assert.match(exact,/Volver a A-21/);
 assert.doesNotMatch(exact,/audit\.paper\(|audit\.download\(|audit\.mutate\(/);
 assert.match(read('../app/panel/auditoria/[ref]/page.tsx'),/PaperScreen reference=\{ref\}/);
});
