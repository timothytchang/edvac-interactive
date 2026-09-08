import fs from 'node:fs';
import path from 'node:path';
const source = 'dist/client';
if (!fs.existsSync(path.join(source, 'index.html')))
  throw Error('Build the static site before preparing Pages.');
// docs contains generated output only. Replace it so obsolete chunks do not accumulate.
fs.rmSync('docs', { recursive: true, force: true });
fs.cpSync(source, 'docs', { recursive: true });
fs.writeFileSync('docs/.nojekyll', '');
const html = fs.readFileSync('docs/index.html', 'utf8');
const refs = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)].map(
  (m) => m[1],
);
if (refs.length < 3)
  throw Error(
    'Expected application script, stylesheet, and favicon references.',
  );
for (const ref of refs)
  if (!fs.existsSync(path.join('docs', ref)))
    throw Error(`Missing exported asset: ${ref}`);
console.log(
  `GitHub Pages prepared; verified ${refs.length} referenced assets.`,
);
