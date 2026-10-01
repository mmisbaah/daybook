import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(join(out, 'css'), { recursive: true });
await mkdir(join(out, 'js'), { recursive: true });

let html = await readFile(join(root, 'web', 'index.html'), 'utf8');
html = html
  .replace('../css/workspace.css', 'css/workspace.css')
  .replace('../js/ui.js', 'js/ui.js')
  .replace('../js/data.js', 'js/data.js')
  .replace('../js/workspace.js', 'js/workspace.js')
  .replace(/<a class="sb-link" href="\.\.\/index\.html" target="_blank">Phone prototype ↗<\/a>/, '<span class="sb-link">Daybook web workspace</span>');
await writeFile(join(out, 'index.html'), html);

for (const name of ['styles.css']) {
  await copyFile(join(root, 'web', 'css', name), join(out, 'css', name));
}
await copyFile(join(root, 'css', 'workspace.css'), join(out, 'css', 'workspace.css'));
for (const name of ['screens.js', 'app.js']) {
  await copyFile(join(root, 'web', 'js', name), join(out, 'js', name));
}
for (const name of ['ui.js', 'data.js', 'workspace.js']) {
  await copyFile(join(root, 'js', name), join(out, 'js', name));
}
console.log(`Built web app at ${out}`);
