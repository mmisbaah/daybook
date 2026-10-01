import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = join(root, 'v2');
const out = join(root, 'dist-v2');
await rm(out, { recursive: true, force: true });
await mkdir(join(out, 'book'), { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'book.js']) {
  await copyFile(join(source, file), join(out, file));
}
await copyFile(join(source, 'book', 'index.html'), join(out, 'book', 'index.html'));
await writeFile(join(out, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Content-Security-Policy: default-src \'self\'; font-src \'self\' https://fonts.gstatic.com; style-src \'self\' https://fonts.googleapis.com; script-src \'self\'; connect-src \'self\'; img-src \'self\' data:; base-uri \'none\'; form-action \'self\'\n');
console.log(`Built Daybook v2 at ${out}`);
